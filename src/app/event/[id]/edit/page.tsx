"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import EventForm, { EventFormData } from "@/components/forms/EventForm";
import { useAuth } from "@/lib/useAuth";
import { getEventsWithActivities, updateEvent, EventWithActivities } from "@/lib/firestore";
import { getContacts, updateContact, ContactData } from "@/lib/firebase-contacts";
import { getUserProfile } from "@/lib/firebase-auth";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { user, userId, loading: authLoading } = useAuth();

  const [eventData, setEventData] = useState<EventWithActivities | null>(null);
  const [firebaseContacts, setFirebaseContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Get Event ID
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  // 2. Fetch Event from Firebase
  useEffect(() => {
    const fetchEvent = async () => {
      if (authLoading) return;
      if (!userId || !eventId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allEvents = await getEventsWithActivities(userId);
        const event = allEvents.find((e) => e.id === eventId);
        setEventData(event || null);
      } catch {
        setEventData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [userId, eventId, authLoading]);

  // 3. Fetch contacts
  useEffect(() => {
    if (userId) {
      getContacts(userId)
        .then((data) => setFirebaseContacts(data))
        .catch(() => {});
    }
  }, [userId]);

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-ui-accent-yellow border-t-transparent rounded-full animate-spin"></div>
        <p className="text-ui-dark-grey">Loading event...</p>
      </div>
    );
  }

  // Handle Invalid ID
  if (!eventData) {
    return (
        <div className="h-full flex flex-col items-center justify-center gap-4">
            <p>Event not found</p>
            <button onClick={() => router.back()} className="text-ui-accent-yellow font-bold">Go Back</button>
        </div>
    );
  }

  const handleUpdate = async (data: EventFormData) => {
    if (!userId || !eventId || !user?.uid) return;
    try {
      // Map participant IDs to participant objects using firebaseContacts
      const participants = data.participantIds
        .map((id) => {
          const contact = firebaseContacts.find((c) => c.id === id);
          return contact
            ? {
                name: contact.name,
                avatarName: contact.avatarName || contact.name,
              }
            : null;
        })
        .filter((p) => p !== null) as Array<{ name: string; avatarName: string }>;

      // Fetch current user's profile to get their correct avatar info
      const userProfile = await getUserProfile(user.uid);
      const currentUserParticipant = userProfile
        ? {
            name: userProfile.username || user.displayName || "You",
            avatarName: userProfile.avatarName || userProfile.username || user.displayName || "You",
          }
        : {
            name: user.displayName || "You",
            avatarName: user.displayName || "You",
          };

      // Add the current user as a participant
      participants.unshift(currentUserParticipant);

      // Get old participants from existing event data
      const oldParticipantNames = (eventData?.participants ?? []).map(p => p.name);
      const newParticipantNames = participants.map(p => p.name);

      // Find removed and added participants
      const removedParticipants = oldParticipantNames.filter(name => !newParticipantNames.includes(name));
      const addedParticipants = newParticipantNames.filter(name => !oldParticipantNames.includes(name));

      // Update contacts' isEvent array
      if (removedParticipants.length > 0 || addedParticipants.length > 0) {
        let eventCreatedAt: number = 0;
        const createdAtData = eventData?.createdAt ?? 0;
        
        // Convert Firestore Timestamp to number if needed
        if (typeof createdAtData === 'object' && createdAtData !== null && 'toMillis' in createdAtData) {
          eventCreatedAt = (createdAtData as { toMillis(): number }).toMillis();
        } else if (typeof createdAtData === 'object' && createdAtData !== null && 'seconds' in createdAtData) {
          eventCreatedAt = (createdAtData as { seconds: number }).seconds * 1000;
        } else if (typeof createdAtData === 'number') {
          eventCreatedAt = createdAtData;
        }

        try {
          // Fetch fresh contact data to ensure we have the latest isEvent array
          const latestContacts = await getContacts(user.uid);
          const updatePromises: Promise<void>[] = [];

          // For removed participants: remove from isEvent array
          removedParticipants.forEach(name => {
            const contact = latestContacts.find(c => c.name === name);
            if (contact) {
              const updatedIsEvent = contact.isEvent.filter(event => event.eventCreatedAt !== eventCreatedAt);
              updatePromises.push(updateContact(user.uid, contact.id, { isEvent: updatedIsEvent }));
            }
          });

          // For added participants: add new entry to isEvent
          addedParticipants.forEach(name => {
            const contact = latestContacts.find(c => c.name === name);
            if (contact) {
              const updatedIsEvent = [
                ...contact.isEvent,
                { eventCreatedAt, stillEvent: 1 as const },
              ];
              updatePromises.push(updateContact(user.uid, contact.id, { isEvent: updatedIsEvent }));
            }
          });

          await Promise.all(updatePromises);
        } catch {
          // Don't alert - event was updated successfully
        }
      }

      await updateEvent(userId, eventId, {
        title: data.title,
        location: data.location,
        date: new Date(data.date),
        participants,
        imageUrl: data.imageUrl || eventData?.imageUrl || "",
      });
      router.back();
    } catch {
      alert("Failed to update event.");
    }
  };

  return (
    <EventForm 
        initialData={eventData as unknown as Parameters<typeof EventForm>[0]['initialData']}
        isEditing={true} 
        onSubmit={handleUpdate} 
    />
  );
}
