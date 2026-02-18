"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation"; 
import { useAuth } from "@/lib/useAuth";
import { getEventsWithActivities, deleteActivity, deleteEvent, EventWithActivities } from "@/lib/firestore";
import EventHeaderCard from "@/components/ui/EventHeaderCard";
import { ShoppingCart, Utensils, Car, Zap, Ticket, Trash2 } from "lucide-react"; 
import FabAdd from "@/components/ui/FABAdd";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

// --- HELPER: FORMAT DATE ---
const formatDate = (dateInput: string | Date | { toDate(): Date } | { seconds: number; nanoseconds?: number } | number | null | undefined): string => {
  if (!dateInput) return "";
  let date: Date;
  
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === "object" && "toDate" in dateInput && typeof (dateInput as { toDate(): Date }).toDate === "function") {
    date = (dateInput as { toDate(): Date }).toDate();
  } else if (typeof dateInput === "object" && "seconds" in dateInput) {
    date = new Date(dateInput.seconds * 1000 + (dateInput.nanoseconds || 0) / 1000000);
  } else if (typeof dateInput === "string") {
    // Handle DD/MM/YYYY format
    const ddmmyyyy = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      date = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
    } else {
      date = new Date(dateInput);
    }
  } else if (typeof dateInput === "number") {
    date = new Date(dateInput);
  } else {
    return "";
  }
  
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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
const getActivityTotal = (activity: { items?: { price: number; quantity: number; discountAmount?: number; taxPercentage?: number }[] }) => {
  if (!activity.items || activity.items.length === 0) return 0;

  // 1. Hitung Subtotal (Harga * Qty - Diskon per Item)
  const subTotal = activity.items.reduce((acc: number, item) => {
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
  const { userId, loading: authLoading } = useAuth();
  
  // State
  const [eventData, setEventData] = useState<EventWithActivities | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [showDeleteEvent, setShowDeleteEvent] = useState(false);
  
  // Unwrap ID
  const rawId = params?.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;

  // Fetch event dari Firebase
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

  useEffect(() => {
    fetchEvent();
    // fetchEvent is defined outside useEffect intentionally; deps are sufficient
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, eventId, authLoading]);

  // Delete activity handler
  const confirmDeleteActivity = async () => {
    if (!userId || !eventId || !activityToDelete) return;
    try {
      await deleteActivity(userId, eventId, activityToDelete);
      await fetchEvent(); // Refresh data
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Failed to delete activity.");
    } finally {
      setActivityToDelete(null);
    }
  };

  // Delete event handler
  const confirmDeleteEvent = async () => {
    if (!userId || !eventId) return;
    try {
      await deleteEvent(userId, eventId);
      router.replace("/home");
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event.");
    } finally {
      setShowDeleteEvent(false);
    }
  };

  // HANDLING LOADING
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-ui-background gap-4 p-5">
        <div className="w-12 h-12 border-4 border-ui-accent-yellow border-t-transparent rounded-full animate-spin"></div>
        <p className="text-ui-dark-grey">Loading event...</p>
      </div>
    );
  }

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
           event={{
             ...eventData,
             date: formatDate(eventData.date),
           } as unknown as Parameters<typeof EventHeaderCard>[0]['event']}
           onBackClick={() => router.back()}
           onEditClick={() => router.push(`/event/${eventId}/edit`)}
           onDeleteClick={() => setShowDeleteEvent(true)}
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

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivityToDelete(activity.id);
                      }}
                      className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 active:scale-90 transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                 );
               })}
            </div>
         )}
      </div>

      {/* --- FOOTER: SUMMARIZE BUTTON --- */}
      <div className="fixed bottom-8 left-5 right-5 z-30">
        <button 
            onClick={() => router.push(`/event/${eventId}/summary`)}
            className="w-full h-14 bg-ui-accent-yellow text-white rounded-full shadow-xl shadow-black/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all font-bold text-lg border border-white/10">
            <span className="mt-0.5 text-ui-black">Summarize</span>
        </button>
      </div>

      {/* DELETE ACTIVITY CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={!!activityToDelete}
        onClose={() => setActivityToDelete(null)}
        onConfirm={confirmDeleteActivity}
        title="Delete Activity?"
        name="this activity"
      />

      {/* DELETE EVENT CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={showDeleteEvent}
        onClose={() => setShowDeleteEvent(false)}
        onConfirm={confirmDeleteEvent}
        title="Delete Event?"
        name={eventData?.title || "this event"}
      />

    </div>
  );
}