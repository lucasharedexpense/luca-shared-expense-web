"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation"; // 1. Import useParams
import { MOCK_DATABASE } from "@/lib/dummy-data";
import EventHeaderCard from "@/components/ui/EventHeaderCard";
import { ShoppingCart } from "lucide-react"; 
import FabAdd from "@/components/ui/FABAdd";

// 2. HAPUS 'params' DARI DALAM KURUNG SINI!
// Jangan tulis: function EventDetailPage({ params }) ... ERROR NANTI!
export default function EventDetailPage() {
  const router = useRouter();
  
  // 3. AMBIL ID PAKAI HOOK INI
  const params = useParams(); 
  
  // Unwrap ID-nya (karena bisa string atau array)
  // Kita paksa jadi string
  const rawId = params?.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;

  // Debugging (Cek console browser)
  console.log("URL ID:", eventId);

  // 4. CARI DATA
  // Pastikan eventId ada isinya sebelum nyari
  const eventData = eventId 
    ? MOCK_DATABASE.events.find((e) => e.id === eventId) 
    : null;

  // 5. HANDLING NOT FOUND
  if (!eventData) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-ui-background gap-4 p-5 text-center">
        <p className="text-ui-dark-grey font-bold text-lg">
          Event Not Found 😔
        </p>
        <p className="text-xs text-ui-dark-grey font-mono bg-gray-100 p-2 rounded">
          ID: {eventId || "null"}
        </p>
        <button 
          onClick={() => router.back()} 
          className="text-ui-accent-yellow font-bold hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  // 6. RENDER UI
  return (
    <div className="flex flex-col h-full w-full bg-ui-background">
      <FabAdd
         onClick={() => {
            // Nanti di sini arahin ke page Add Activity
            router.push(`/event/${eventId}/add-activity`); 
         }}
      />
      
      {/* HEADER CARD */}
      <div className="px-5 pt-4 pb-2 shrink-0">
        <EventHeaderCard 
           event={eventData}
           onBackClick={() => router.back()}
           onEditClick={() => router.push(`/event/${eventId}/edit`)}
           onDeleteClick={() => console.log("Delete clicked")}
        />
      </div>

      {/* CONTENT ACTIVITY */}
      <div className="w-full px-5 mt-2">
        <h3 className="font-bold text-lg text-ui-black mb-4">Activities</h3>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 mt-0 pb-32">

         {eventData.activities.length === 0 ? (
            <div className="text-center py-10 opacity-50">
               <p className="text-sm text-ui-dark-grey">No activities yet.</p>
               <p className="text-xs text-ui-dark-grey mt-1">Start by adding one!</p>
            </div>
         ) : (
            <div className="flex flex-col gap-3">
               {eventData.activities.map((activity, index) => (
                 <div 
                    key={index}
                    onClick={() => router.push(`/event/${eventId}/activity/${activity.id}`)}
                    className="bg-ui-white p-4 rounded-xl flex items-center gap-4 shadow-sm border border-ui-grey/10 cursor-pointer active:scale-[0.98] active:bg-gray-50 transition-all"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${activity.categoryColorHex}20` }} // Opacity 20%
                    >
                       {/* Icon Hardcoded dulu atau mapping berdasarkan category */}
                       <ShoppingCart 
                          className="w-5 h-5" 
                          style={{ color: activity.categoryColorHex }} 
                       />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-ui-black text-sm truncate">{activity.title}</h4>
                       <p className="text-xs text-ui-dark-grey truncate">
                          Paid by <span className="font-semibold">{activity.payerName}</span>
                       </p>
                    </div>
                    <span className="font-bold text-ui-accent-red text-sm whitespace-nowrap">
                       {/* Cek kalau amount kosong, tampilin 0 */}
                       {activity.amount ? `Rp ${Number(activity.amount).toLocaleString('id-ID')}` : "Rp 0"}
                    </span>
                 </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}