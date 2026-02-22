"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EventForm, { EventFormData } from "@/components/forms/EventForm";
import { useAuth } from "@/lib/auth-context";
import { createEvent } from "@/lib/firestore";
import { getContacts, updateContact, ContactData } from "@/lib/firebase-contacts";
import { getUserProfile } from "@/lib/firebase-auth";

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [firebaseContacts, setFirebaseContacts] = useState<ContactData[]>([]);

  // Fetch contacts from Firebase
  useEffect(() => {
    if (user?.uid) {
      getContacts(user.uid)
        .then((data) => setFirebaseContacts(data))
        .catch(() => {});
    }
  }, [user?.uid]);

  const handleCreate = async (data: EventFormData) => {
    if (!user?.uid || saving) return;

    try {
      setSaving(true);
      console.log("[Event Creation] Starting event creation process for user:", user.uid);

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
      console.log("[Event Creation] Participants prepared:", participants);

      // Capture timestamp before creating event
      const eventCreatedAt = Date.now();
      const eventData = {
        title: data.title,
        location: data.location,
        date: data.date ? new Date(data.date) : new Date(),
        participants,
        imageUrl: data.imageUrl || "",
      };

      console.log("[Event Creation] Creating event with data:", eventData);
      const eventId = await createEvent(user.uid, eventData);
      console.log("[Event Creation] Event created successfully with ID:", eventId);

      // Update all selected participants' isEvent array
      if (data.participantIds.length > 0) {
        try {
          console.log("[Event Creation] Updating contacts for", data.participantIds.length, "participants");
          // Fetch fresh contact data to ensure we have the latest isEvent array
          const latestContacts = await getContacts(user.uid);
          
          const updatePromises = data.participantIds.map((id) => {
            const contact = latestContacts.find((c) => c.id === id);
            if (!contact) return Promise.resolve();

            const updatedIsEvent = [
              ...contact.isEvent,
              { eventCreatedAt, stillEvent: 1 as const },
            ];
            return updateContact(user.uid, id, { isEvent: updatedIsEvent });
          });
          await Promise.all(updatePromises);
          console.log("[Event Creation] Participant contacts updated successfully");
        } catch (contactError) {
          console.error("[Event Creation] Error updating contacts:", contactError);
          // Don't fail event creation if contact update fails
        }
      }

      console.log("[Event Creation] Event created successfully! Redirecting to home");
      router.push("/home");
    } catch (error) {
      console.error("[Event Creation] Error creating event:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to create event: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return <EventForm onSubmit={handleCreate} />;
}
