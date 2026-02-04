"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import EventForm, { EventFormData } from "@/components/forms/EventForm";
import { MOCK_DATABASE } from "@/lib/dummy-data";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();

  // 1. Get Event ID
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  // 2. Find Data (Simulation)
  const existingEvent = MOCK_DATABASE.events.find(e => e.id === eventId);

  // Handle Invalid ID
  if (!existingEvent) {
    return (
        <div className="h-full flex flex-col items-center justify-center gap-4">
            <p>Event not found</p>
            <button onClick={() => router.back()}>Go Back</button>
        </div>
    );
  }

  const handleUpdate = (data: EventFormData) => {
    console.log("Updating Event:", eventId, data);
    
    // In real app: await api.updateEvent(eventId, data);
    
    // For Mock: Update the object reference directly (works in memory until refresh)
    existingEvent.title = data.title;
    existingEvent.location = data.location;
    existingEvent.date = data.date;
    existingEvent.participants = data.participants;

    router.back(); // Return to Detail Page
  };

  return (
    <EventForm 
        initialData={existingEvent} 
        isEditing={true} 
        onSubmit={handleUpdate} 
    />
  );
}