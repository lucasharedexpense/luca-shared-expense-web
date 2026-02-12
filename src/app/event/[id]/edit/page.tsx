"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import EventForm, { EventFormData } from "@/components/forms/EventForm";
import { useAuth } from "@/lib/useAuth";
import { getEventsWithActivities, updateEvent } from "@/lib/firestore";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { userId, loading: authLoading } = useAuth();

  const [eventData, setEventData] = useState<any>(null);
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
      } catch (error) {
        console.error("Error fetching event:", error);
        setEventData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [userId, eventId, authLoading]);

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
    if (!userId || !eventId) return;
    
    try {
      await updateEvent(userId, eventId, {
        title: data.title,
        location: data.location,
        date: new Date(data.date),
        participants: data.participants,
      });
      router.back(); // Return to Detail Page
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event.");
    }
  };

  return (
    <EventForm 
        initialData={eventData} 
        isEditing={true} 
        onSubmit={handleUpdate} 
    />
  );
}