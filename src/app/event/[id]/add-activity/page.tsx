"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ActivityForm, { ActivityFormData } from "@/components/forms/ActivityForm";
import { useAuth } from "@/lib/useAuth";
import { getEventsWithActivities, createActivity, EventWithActivities } from "@/lib/firestore";
import { getContacts, ContactData } from "@/lib/firebase-contacts";

export default function AddActivityPage() {
  const router = useRouter();
  const params = useParams();
  const { userId, loading: authLoading } = useAuth();
  
  const [eventData, setEventData] = useState<EventWithActivities | null>(null);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Get Event ID
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  // 2. Fetch Event Data
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

  // 3. Fetch Contacts
  useEffect(() => {
    if (userId) {
      getContacts(userId)
        .then((data) => setContacts(data))
        .catch(() => {});
    }
  }, [userId]);

  if (loading || authLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-ui-accent-yellow border-t-transparent rounded-full animate-spin"></div>
        <p className="text-ui-dark-grey">Loading event...</p>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-ui-dark-grey">Event not found</p>
        <button onClick={() => router.back()} className="text-ui-accent-yellow font-bold">
          Go Back
        </button>
      </div>
    );
  }

  // Map event participants to Contact format for the form
  const eventParticipants: Array<{ id: string; name: string; avatarName: string }> = eventData.participants?.map((p: { name: string; avatarName?: string }) => {
    const contact = contacts.find((c) => c.name === p.name);    return {
      id: contact?.id || p.name,
      name: p.name,
      avatarName: p.avatarName || p.name,
    };
  }) || [];

  const handleCreate = async (data: ActivityFormData) => {
    if (!userId || !eventId || saving) return;

    try {
      setSaving(true);

      // Find payer participant info
      const payerParticipant = eventParticipants.find((p) => p.id === data.payerId);
      
      // Map split among IDs to participant objects
      const participants = data.splitAmongIds
        .map((id) => {
          const participant = eventParticipants.find((p) => p.id === id);
          return participant
            ? {
                name: participant.name,
                avatarName: participant.avatarName,
              }
            : null;
        })
        .filter((p) => p !== null) as Array<{ name: string; avatarName: string }>;

      // Create activity using firestore function
      await createActivity(userId, eventId, {
        title: data.title,
        amount: 0, // Will be calculated from items
        category: data.category,
        paidBy: payerParticipant
          ? {
              name: payerParticipant.name,
              avatarName: payerParticipant.avatarName,
            }
          : { name: "", avatarName: "" },
        participants: participants,
        payerName: payerParticipant?.name || "",
      });

      router.back();
    } catch {
      alert("Failed to create activity. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ActivityForm
      eventParticipants={eventParticipants}
      onSubmit={handleCreate}
    />
  );
}
