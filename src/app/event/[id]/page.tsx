"use client";

import React, { useMemo } from "react";
import { useRouter, useParams } from "next/navigation"; 
import { MOCK_DATABASE } from "@/lib/dummy-data";
import EventHeaderCard from "@/components/ui/EventHeaderCard";
import { ShoppingCart, Utensils, Car, Zap, Ticket } from "lucide-react"; 
import FabAdd from "@/components/ui/FABAdd";

// --- HELPER: LOGIC ICON BERDASARKAN KATEGORI ---
const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("food") || cat.includes("makan")) return <Utensils className="w-5 h-5" />;
  if (cat.includes("transport") || cat.includes("jalan")) return <Car className="w-5 h-5" />;
  if (cat.includes("entertainment") || cat.includes("nonton")) return <Ticket className="w-5 h-5" />;
  if (cat.includes("bill") || cat.includes("listrik")) return <Zap className="w-5 h-5" />;
  return <ShoppingCart className="w-5 h-5" />; // Default
};

// --- HELPER: HITUNG TOTAL BILL DARI ITEMS ---
const getActivityTotal = (activity: any) => {
  if (!activity.items || activity.items.length === 0) return 0;

  // 1. Hitung Subtotal (Harga * Qty - Diskon per Item)
  const subTotal = activity.items.reduce((acc: number, item: any) => {
    const itemTotal = (item.price * item.quantity) - (item.discountAmount || 0);
    return acc + itemTotal;
  }, 0);

  // 2. Hitung Tax (Ambil rate dari item pertama)
  const taxRate = activity.items[0]?.taxPercentage || 0;
  const taxAmount = subTotal * (taxRate / 100);

  // 3. Grand Total (Belum termasuk global discount activity kalau ada, tapi cukup akurat utk list view)
  return subTotal + taxAmount;
};

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams(); 
  
  // Unwrap ID
  const rawId = params?.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;

  // CARI DATA
  const eventData = eventId 
    ? MOCK_DATABASE.events.find((e) => e.id === eventId) 
    : null;

  // HANDLING NOT FOUND
  if (!eventData) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-ui-background gap-4 p-5 text-center">
        <p className="text-ui-dark-grey font-bold text-lg">Event Not Found 😔</p>
        <button onClick={() => router.back()} className="text-ui-accent-yellow font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  // RENDER UI
  return (
    <div className="flex flex-col h-full w-full bg-ui-background">
      
      {/* FAB ADD ACTIVITY */}
      <FabAdd
         onClick={() => {
            router.push(`/event/${eventId}/add-activity`); 
         }}
      />
      
      {/* HEADER CARD */}
      <div className="px-5 pt-4 pb-2 shrink-0">
        <EventHeaderCard 
           event={eventData}
           onBackClick={() => router.push("/home")} // Balik ke Home
           onEditClick={() => router.push(`/event/${eventId}/edit`)} // Edit Event Info
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
               <p className="text-xs text-ui-dark-grey mt-1">Tap + to add one!</p>
            </div>
         ) : (
            <div className="flex flex-col gap-3">
               {eventData.activities.map((activity, index) => {
                 
                 // Kalkulasi Total Real-time
                 const totalBill = getActivityTotal(activity);

                 return (
                  <div 
                    key={activity.id || index}
                    onClick={() => router.push(`/event/${eventId}/activity/${activity.id}`)}
                    className="bg-ui-white p-4 rounded-xl flex items-center gap-4 shadow-sm border border-ui-grey/10 cursor-pointer active:scale-[0.98] active:bg-gray-50 transition-all"
                  >
                    {/* Icon Category */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${activity.categoryColorHex || '#E5E7EB'}20` }} 
                    >
                        <div style={{ color: activity.categoryColorHex || '#6B7280' }}>
                            {getCategoryIcon(activity.category)}
                        </div>
                    </div>

                    {/* Text Info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-ui-black text-sm truncate">{activity.title}</h4>
                        <p className="text-xs text-ui-dark-grey truncate">
                           Paid by <span className="font-semibold text-ui-black">{activity.payerName}</span>
                        </p>
                    </div>

                    {/* Total Amount (Calculated) */}
                    <span className="font-bold text-ui-accent-red text-sm whitespace-nowrap">
                        {new Intl.NumberFormat("id-ID", { 
                            style: "currency", 
                            currency: "IDR", 
                            minimumFractionDigits: 0 
                        }).format(totalBill)}
                    </span>
                  </div>
                 );
               })}
            </div>
         )}
      </div>
    </div>
  );
}