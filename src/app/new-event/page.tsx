"use client";

import React from "react";
import { useRouter } from "next/navigation";
import EventForm, { EventFormData } from "@/components/forms/EventForm";

export default function NewEventPage() {
  const router = useRouter();

  const handleCreate = (data: EventFormData) => {
    // 1. Create the full event object
    const newEvent = {
        id: `event_${Date.now()}`,
        ...data,
        activities: []
    };

    console.log("Saving New Event:", newEvent);
    router.push("/");
  };

  return <EventForm onSubmit={handleCreate} />;
}