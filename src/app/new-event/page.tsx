"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import EventForm, { EventFormData } from "@/components/forms/EventForm";
import { useAuth } from "@/lib/auth-context";
import { createEvent } from "@/lib/firestore";

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleCreate = async (data: EventFormData) => {
    if (!user?.uid || saving) return;

    try {
      setSaving(true);

      // Build participants with avatar info
      const participants = data.participants.map((p) => ({
        name: p.name,
        avatarName: p.avatarName || p.name,
      }));

      // Add the current user as a participant
      participants.unshift({
        name: user.displayName || "You",
        avatarName: user.displayName || "You",
      });

      await createEvent(user.uid, {
        title: data.title,
        location: data.location,
        date: data.date ? new Date(data.date) : new Date(),
        participants,
      });

      router.push("/home");
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return <EventForm onSubmit={handleCreate} />;
}