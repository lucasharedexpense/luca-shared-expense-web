"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { getEventsWithActivities, createItem } from "@/lib/firestore";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AddItemPage() {
  const router = useRouter();
  const params = useParams();
  const { userId, loading: authLoading } = useAuth();

  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const activityId = Array.isArray(params?.activityid) ? params.activityid[0] : params?.activityid;

  // States
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [taxPercentage, setTaxPercentage] = useState("0");

  // Data loading
  const [activity, setActivity] = useState<{ title: string; payerName: string; participants?: { name: string; avatarName?: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch activity data
  useEffect(() => {
    const fetchActivity = async () => {
      if (authLoading) return;
      if (!userId || !eventId || !activityId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allEvents = await getEventsWithActivities(userId);
        const event = allEvents.find((e) => e.id === eventId);
        const activityData = event?.activities.find((a) => a.id === activityId);
        
        if (activityData) {
          setActivity(activityData);
          // Set default members to all activity participants
          const participantNames = activityData.participants?.map((p) => p.name) || [];
          setSelectedMembers(participantNames);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [userId, eventId, activityId, authLoading]);

  // Real-time listener for items (kept for potential future display)
  useEffect(() => {
    if (!userId || !eventId || !activityId) return;

    const itemsRef = collection(
      db,
      "users",
      userId,
      "events",
      eventId,
      "activities",
      activityId,
      "items"
    );

    const unsubscribe = onSnapshot(itemsRef, () => {
      // Items loaded but not displayed in this page
    });

    return () => unsubscribe();
  }, [userId, eventId, activityId]);

  const getAvatarByName = (name: string) => {
    const participant = activity?.participants?.find((p) => p.name === name);
    if (participant?.avatarName?.startsWith("http")) {
      return participant.avatarName;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
  };

  const toggleMember = (name: string) => {
    setSelectedMembers((prev) => {
      if (prev.includes(name)) {
        // Don't allow removing all members
        if (prev.length > 1) {
          return prev.filter((m) => m !== name);
        }
        return prev;
      } else {
        return [...prev, name];
      }
    });
  };

  const handleSave = async () => {
    if (!itemName || !price || !userId || !eventId || !activityId) {
      alert("Please fill in Item Name and Price");
      return;
    }

    if (selectedMembers.length === 0) {
      alert("Please select at least one member");
      return;
    }

    try {
      setSaving(true);

      await createItem(userId, eventId, activityId, {
        itemName: itemName,
        price: parseInt(price.replace(/\D/g, "")) || 0,
        quantity: parseFloat(quantity) || 1,
        memberNames: selectedMembers,
        discountAmount: parseInt(discountAmount.replace(/\D/g, "")) || 0,
        taxPercentage: parseFloat(taxPercentage) || 0,
      });

      // Redirect to activity detail page
      router.push(`/event/${eventId}/activity/${activityId}`);
    } catch {
      alert("Failed to create item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-ui-accent-yellow border-t-transparent rounded-full animate-spin"></div>
        <p className="text-ui-dark-grey">Loading activity...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-ui-dark-grey">Activity not found</p>
        <button onClick={() => router.back()} className="text-ui-accent-yellow font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-ui-white">
      {/* --- HEADER --- */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-4 border-b border-ui-grey/20">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-ui-grey/10 flex items-center justify-center hover:bg-ui-grey/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ui-black" />
        </button>
        <h1 className="text-xl font-bold font-display text-ui-black">Add Menu Item</h1>
      </div>

      {/* --- FORM CONTENT --- */}
      <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar">
        <div className="max-w-md mx-auto flex flex-col gap-8">
          {/* 1. ITEM NAME */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest">
              Item Name
            </label>
            <input
              type="text"
              placeholder="e.g. Nasi Goreng"
              className="w-full text-2xl font-bold text-ui-black placeholder:text-ui-dark-grey/50 outline-none bg-transparent border-b-2 border-ui-accent-yellow py-2 transition-colors"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              autoFocus
            />
          </div>

          {/* 2. PRICE & QUANTITY */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest">
                Price
              </label>
              <div className="relative">
                <span className="absolute left-0 top-2 text-2xl font-bold text-ui-dark-grey/50">Rp</span>
                <input
                  type="text"
                  placeholder="0"
                  className="w-full text-2xl font-bold text-ui-black placeholder:text-ui-dark-grey/50 outline-none bg-transparent border-b-2 border-ui-accent-yellow py-2 transition-colors pl-12"
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPrice(val);
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest">
                Qty
              </label>
              <input
                type="number"
                placeholder="1"
                className="w-full text-2xl font-bold text-ui-black placeholder:text-ui-dark-grey/50 outline-none bg-transparent border-b-2 border-ui-accent-yellow py-2 transition-colors"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.5"
                min="0.5"
              />
            </div>
          </div>

          {/* 3. TAX & DISCOUNT (Optional) */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest">
                Tax %
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full text-lg font-bold text-ui-black placeholder:text-ui-dark-grey/50 outline-none bg-transparent border-b-2 border-ui-grey/30 py-2 transition-colors"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(e.target.value)}
                step="0.5"
                min="0"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest">
                Discount
              </label>
              <div className="relative">
                <span className="absolute left-0 top-2 text-lg font-bold text-ui-dark-grey/50">$</span>
                <input
                  type="text"
                  placeholder="0"
                  className="w-full text-lg font-bold text-ui-black placeholder:text-ui-dark-grey/50 outline-none bg-transparent border-b-2 border-ui-grey/30 py-2 transition-colors pl-6"
                  value={discountAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setDiscountAmount(val);
                  }}
                />
              </div>
            </div>
          </div>

          {/* 4. SHARED BY (Members) */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest">
                Shared By
              </label>
              <span className="text-xs bg-ui-accent-yellow/20 text-ui-dark-grey px-2 py-1 rounded-full font-bold">
                {selectedMembers.length} people
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {activity.participants?.map((participant) => {
                const isSelected = selectedMembers.includes(participant.name);
                return (
                  <div
                    key={participant.name}
                    onClick={() => toggleMember(participant.name)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-ui-white border-ui-accent-yellow shadow-sm"
                        : "bg-ui-grey/5 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getAvatarByName(participant.name)}
                          className="w-full h-full object-cover"
                          alt={participant.name}
                        />
                      </div>
                      <span className="font-bold text-sm text-ui-black">
                        {participant.name}
                      </span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-ui-accent-yellow border-ui-accent-yellow"
                          : "border-ui-grey/30"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-4 h-4 text-ui-black" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


      </div>

      {/* --- FOOTER --- */}
      <div className="p-5 bg-ui-white border-t border-ui-grey/10">
        <button
          onClick={handleSave}
          disabled={saving || !itemName || !price}
          className="w-full py-4 rounded-2xl bg-ui-black text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Add Item"}
        </button>
      </div>
    </div>
  );
}
