"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import ActivityForm, { ActivityFormData } from "@/components/forms/ActivityForm";
import { MOCK_DATABASE } from "@/lib/dummy-data";
import { getContacts } from "@/lib/firebase-contacts";
import { useAuth } from "@/lib/useAuth";

export default function AddActivityPage() {
  const router = useRouter();
  const params = useParams();
  const { userId } = useAuth();
  const [contacts, setContacts] = React.useState([]);
  // 1. Ambil Event ID
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  // 2. Ambil Data Event (Untuk dapetin list Participants)
  const eventData = MOCK_DATABASE.events.find(e => e.id === eventId);
  React.useEffect(() => {
    if (userId) {
      getContacts(userId).then(setContacts);
    }
  }, [userId]);
  if (!eventData) return <div>Event not found</div>;
  // 3. Use latest contacts for participants
  const participants = contacts.filter(c => eventData.participants.some(p => p.name === c.name));
  const handleCreate = (data: ActivityFormData) => {
    console.log("Creating Activity for Event:", eventId, data);
    // Logic Push ke MOCK DB / API
    const newActivity = {
        id: `act_${Date.now()}`,
        title: data.title,
        amount: data.amount,
        payerName: data.payerId, // Harusnya cari nama berdasarkan ID
        date: "Just now"
        // ... field lain
    };
    // eventData.activities.push(newActivity); (Kalau mau simulasi real time)
    router.back();
  };
  return (
    <ActivityForm 
        eventParticipants={participants}
        onSubmit={handleCreate} 
    />
  );
}