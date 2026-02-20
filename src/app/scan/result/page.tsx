"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, X, Loader2, ArrowLeft } from "lucide-react";
import Header from "@/components/ui/Header";
import { useScan } from "../scan-context";
import { useAuth } from "@/lib/useAuth";
import { getEventsWithActivities, createItem } from "@/lib/firestore";
import type { EventWithActivities, Activity } from "@/lib/firestore";

// ---- ADD TO ACTIVITY BOTTOM SHEET ----
interface AddToActivitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (eventId: string, activityId: string) => void;
  userId: string;
}

function AddToActivitySheet({ isOpen, onClose, onSuccess, userId }: AddToActivitySheetProps) {
  const [events, setEvents] = useState<EventWithActivities[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithActivities | null>(null);
  const [step, setStep] = useState<"event" | "activity">("event");

  useEffect(() => {
    if (!isOpen) return;
    setStep("event");
    setSelectedEvent(null);
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const data = await getEventsWithActivities(userId);
        setEvents(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleSelectEvent = (event: EventWithActivities) => {
    setSelectedEvent(event);
    setStep("activity");
  };

  const handleSelectActivity = (activity: Activity) => {
    if (!selectedEvent) return;
    onSuccess(selectedEvent.id, activity.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
          {step === "activity" && (
            <button
              onClick={() => setStep("event")}
              aria-label="Back to events"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-ui-black" />
            </button>
          )}
          <div className="flex-1">
            <h3 className="font-bold text-ui-black text-base">
              {step === "event" ? "Select Event" : `Select Activity`}
            </h3>
            {step === "activity" && selectedEvent && (
              <p className="text-xs text-ui-dark-grey mt-0.5 truncate">{selectedEvent.name || selectedEvent.title}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3">
          {loadingEvents ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-ui-accent-yellow" />
            </div>
          ) : step === "event" ? (
            events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm font-medium text-ui-dark-grey">No events found.</p>
                <p className="text-xs text-gray-400 mt-1">Create an event first before adding items.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-yellow-50 hover:border-ui-accent-yellow border border-transparent rounded-2xl transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-ui-black truncate">{event.name || event.title}</p>
                      <p className="text-xs text-ui-dark-grey mt-0.5">
                        {event.activities.length} {event.activities.length === 1 ? "activity" : "activities"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )
          ) : selectedEvent ? (
            selectedEvent.activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm font-medium text-ui-dark-grey">No activities in this event.</p>
                <p className="text-xs text-gray-400 mt-1">Add an activity to this event first.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedEvent.activities.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => handleSelectActivity(activity)}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-yellow-50 hover:border-ui-accent-yellow border border-transparent rounded-2xl transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-ui-black truncate">{activity.title}</p>
                      {activity.category && (
                        <p className="text-xs text-ui-dark-grey mt-0.5">{activity.category}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const { receiptData, reset } = useScan();
  const { userId } = useAuth();

  const [showSheet, setShowSheet] = useState(false);
  const [addingItems, setAddingItems] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Handle redirect when no receipt data is available
  useEffect(() => {
    if (!receiptData) {
      router.push("/scan/camera");
    }
  }, [receiptData, router]);

  const formatCurrency = (value: string | null): string => {
    if (!value) return "-";
    return `Rp ${value}`;
  };

  // Show loading state while redirecting
  if (!receiptData) {
    return null;
  }

  const handleScanAnother = () => {
    reset();
    router.push("/scan/camera");
  };

  const handleAddToActivitySuccess = async (eventId: string, activityId: string) => {
    if (!userId || !receiptData?.items?.length) return;
    setShowSheet(false);
    setAddingItems(true);
    try {
      await Promise.all(
        receiptData.items.map((item) =>
          createItem(userId, eventId, activityId, {
            itemName: item.name || "Item",
            price: parseInt(item.price?.replace(/\D/g, "") || "0") || 0,
            quantity: parseFloat(item.qty || "1") || 1,
            memberNames: [],
            discountAmount: 0,
            taxPercentage: 0,
          })
        )
      );
      setAddSuccess(true);
      setTimeout(() => {
        reset();
        router.push(`/event/${eventId}/activity/${activityId}`);
      }, 1200);
    } catch (err) {
      console.error("Error adding items:", err);
      setAddingItems(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-ui-background">
      <Header variant="SCAN" onLeftIconClick={() => router.push("/home")} />

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6">
        <div className="max-w-2xl mx-auto">
          {/* SUCCESS MESSAGE */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-green-700">Receipt scanned successfully!</p>
          </div>

          {/* TOTAL AMOUNT - PROMINENT */}
          <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100 text-center">
            <p className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest mb-2">Total Amount</p>
            <p className="text-5xl font-bold text-ui-black font-mono">
              {formatCurrency(receiptData.total)}
            </p>
          </div>

          {/* ITEMS TABLE */}
          {receiptData.items && receiptData.items.length > 0 && (
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-ui-black mb-4 text-sm uppercase tracking-widest text-ui-dark-grey">
                Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-ui-dark-grey">Item</th>
                      <th className="text-center py-3 px-2 font-semibold text-ui-dark-grey">Qty</th>
                      <th className="text-right py-3 px-2 font-semibold text-ui-dark-grey">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 text-ui-black font-medium">{item.name || "-"}</td>
                        <td className="py-3 px-2 text-center text-ui-dark-grey">{item.qty || "-"}</td>
                        <td className="py-3 px-2 text-right text-ui-black font-semibold">
                          {item.price ? `Rp ${item.price}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUMMARY SECTION */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-ui-black mb-4 text-sm uppercase tracking-widest text-ui-dark-grey">
              Summary
            </h2>
            <div className="space-y-3">
              {/* Subtotal */}
              {receiptData.subtotal && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-ui-dark-grey">Subtotal</span>
                  <span className="text-sm font-semibold text-ui-black">{formatCurrency(receiptData.subtotal)}</span>
                </div>
              )}

              {/* Tax */}
              {receiptData.tax && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-ui-dark-grey">Tax (PB1)</span>
                  <span className="text-sm font-semibold text-ui-black">{formatCurrency(receiptData.tax)}</span>
                </div>
              )}

              {/* Service Charge */}
              {receiptData.service_charge && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-ui-dark-grey">Service Charge</span>
                  <span className="text-sm font-semibold text-ui-black">
                    {formatCurrency(receiptData.service_charge)}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center py-3 mt-4">
                <span className="font-bold text-ui-black">Total</span>
                <span className="text-lg font-bold text-ui-accent-yellow">{formatCurrency(receiptData.total)}</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={handleScanAnother}
              className="flex-1 py-3 bg-gray-100 text-ui-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Scan Another
            </button>
            <button
              onClick={() => setShowSheet(true)}
              disabled={addingItems || addSuccess || !userId}
              className="flex-1 py-3 bg-ui-accent-yellow text-ui-black font-bold rounded-xl hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {addingItems ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : addSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Added!
                </>
              ) : (
                "Add to Activity"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ADD TO ACTIVITY SHEET */}
      {userId && (
        <AddToActivitySheet
          isOpen={showSheet}
          onClose={() => setShowSheet(false)}
          onSuccess={handleAddToActivitySuccess}
          userId={userId}
        />
      )}
    </div>
  );
}
