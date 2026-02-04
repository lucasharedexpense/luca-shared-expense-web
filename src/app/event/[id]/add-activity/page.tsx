"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import ActivityForm, { ActivityFormData } from "@/components/forms/ActivityForm";
import { MOCK_DATABASE } from "@/lib/dummy-data";

export default function AddActivityPage() {
  const router = useRouter();
  const params = useParams();
  
  // 1. Ambil Event ID
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  // 2. Ambil Data Event (Untuk dapetin list Participants)
  const eventData = MOCK_DATABASE.events.find(e => e.id === eventId);

  if (!eventData) return <div>Event not found</div>;

  // 3. Convert Participants Event -> Contact structure (kalau perlu)
  // Asumsi di MOCK_DATABASE, structure participants nya sudah ada ID & Avatar
  // Kita perlu passing list ini ke form supaya bisa pilih Payer
  const participants = eventData.participants.map(p => ({
      id: p.name, // Fallback ID pake nama kalo ga ada
      name: p.name,
      avatarName: p.avatarName,
      phoneNumber: "",
      userId: "",
      bankAccounts: []
  }));

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