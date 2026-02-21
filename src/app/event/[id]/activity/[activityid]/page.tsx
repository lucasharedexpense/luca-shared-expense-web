"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Edit2, Plus, ScanLine } from "lucide-react";
import type { ActivityItem } from "@/lib/firestore";

// Item as stored in Firestore includes an `id` field from doc.id
type Item = ActivityItem;
type ItemWithId = Item & { id: string };
import { useAuth } from "@/lib/useAuth";
import { getEventsWithActivities } from "@/lib/firestore";
import { Wave } from "@/components/ui/Icons"; // Pastikan path import Wave benar
import Toggle from "@/components/ui/Toggle";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- 1. COMPONENT TERPISAH: RECEIPT ITEM ---
// Kita buat komponen ini menerima props yang dibutuhkan saja
interface ReceiptItemProps {
    item: ItemWithId;
    getAvatarByName: (name: string) => string;
}

function ReceiptItem({ item, getAvatarByName }: ReceiptItemProps) {
    const itemTotal = (item.price * item.quantity) || 0;
    const taxAmount = (itemTotal * (item.taxPercentage || 0)) / 100;

    return (
        <div className="flex flex-col gap-2">
            {/* Baris 1: Qty - Nama - Harga */}
            <div className="flex justify-between items-start">
                <div className="flex gap-3">
                    <span className="text-sm font-mono text-ui-dark-grey pt-0.5 opacity-60">
                        {item.quantity}x
                    </span>
                    <span className="text-sm font-bold text-ui-black leading-snug">
                        {item.itemName}
                    </span>
                </div>
                <span className="text-sm font-bold text-ui-black">
                    {new Intl.NumberFormat("id-ID", { 
                        style: "currency", 
                        currency: "IDR", 
                        minimumFractionDigits: 0 
                    }).format(itemTotal)}
                </span>
            </div>

            {/* Baris 2: Tax dan Discount */}
            {((item.taxPercentage || 0) > 0 || (item.discountAmount || 0) > 0) && (
                <div className="pl-8 flex flex-col gap-0.5 text-xs text-ui-dark-grey">
                    {(item.taxPercentage || 0) > 0 && (
                        <span>
                            Tax ({item.taxPercentage}%): {new Intl.NumberFormat("id-ID", { 
                                style: "currency", 
                                currency: "IDR", 
                                minimumFractionDigits: 0 
                            }).format(taxAmount)}
                        </span>
                    )}
                    {(item.discountAmount || 0) > 0 && (
                        <span>
                            Discount: -{new Intl.NumberFormat("id-ID", { 
                                style: "currency", 
                                currency: "IDR", 
                                minimumFractionDigits: 0 
                            }).format(item.discountAmount ?? 0)}
                        </span>
                    )}
                </div>
            )}

            {/* Baris 3: Avatar Pemakan */}
            <div className="flex items-center gap-1 pl-8">
                {item.memberNames.map((name, i) => (
                    <div key={i} className="w-5 h-5 rounded-full bg-gray-100 border border-white overflow-hidden shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={getAvatarByName(name)} 
                            className="w-full h-full object-cover" 
                            alt={name}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { userId, loading: authLoading } = useAuth();
  
  // State
  const [eventData, setEventData] = useState<{ id: string; participants?: { name: string; avatarName?: string }[] } | null>(null);
  const [activityData, setActivityData] = useState<{ id: string; title: string; payerName: string; category?: string; participants?: { name: string; avatarName?: string }[] } | null>(null);
  const [items, setItems] = useState<ItemWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEqualSplit, setIsEqualSplit] = useState(false);
  
  // Unwrap params
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const activityId = Array.isArray(params?.activityid) ? params.activityid[0] : params?.activityid;

  // Fetch data dari Firebase
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      if (!userId || !eventId || !activityId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allEvents = await getEventsWithActivities(userId);
        const event = allEvents.find((e) => e.id === eventId);
        const activity = event?.activities.find((a) => a.id === activityId);
        
        setEventData(event || null);
        setActivityData(activity || null);
      } catch {
        setEventData(null);
        setActivityData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, eventId, activityId, authLoading]);

  // Real-time listener for items
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

    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      const itemsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as unknown as ItemWithId[];
      setItems(itemsList);
    });

    return () => unsubscribe();
  }, [userId, eventId, activityId]);

  // Helper untuk cari avatar user berdasarkan nama
  const getAvatarByName = (name: string) => {
    // Cari di partisipan activity dulu
    const participant = activityData?.participants?.find((p) => p.name === name);
    if (participant) {
      return participant.avatarName?.startsWith("http") 
        ? participant.avatarName 
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
    }
    
    // Kalau ga ada, cari di event level
    const eventParticipant = eventData?.participants?.find((p) => p.name === name);
    if (eventParticipant) {
      return eventParticipant.avatarName?.startsWith("http")
        ? eventParticipant.avatarName
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
    }

    // Fallback ke dicebear
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
  };

  // 3. HITUNG TOTAL OTOMATIS DARI ITEMS
  const { subTotal, taxAmount, discountAmount, grandTotal } = useMemo(() => {
    if (!items || items.length === 0) {
        return { subTotal: 0, taxAmount: 0, discountAmount: 0, grandTotal: 0 };
    }

    // 2. Hitung Subtotal
    const sub = items.reduce((acc: number, item) => acc + (item.price * item.quantity), 0);
    
    // 3. Hitung Total Tax (sum of each item's tax)
    const totalTax = items.reduce((acc: number, item) => {
      const itemTotal = item.price * item.quantity;
      const itemTax = (itemTotal * (item.taxPercentage || 0)) / 100;
      return acc + itemTax;
    }, 0);

    // 4. Hitung Total Discount (sum of each item's discount)
    const totalDiscount = items.reduce((acc: number, item) => acc + (item.discountAmount || 0), 0);
    
    // 5. Hitung Grand Total
    const total = sub + totalTax - totalDiscount;

    return {
      subTotal: sub,
      taxAmount: totalTax,
      discountAmount: totalDiscount,
      grandTotal: total
    };
  }, [items]);

  // --- HANDLING LOADING ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-ui-background gap-4 p-5">
        <div className="w-12 h-12 border-4 border-ui-accent-yellow border-t-transparent rounded-full animate-spin"></div>
        <p className="text-ui-dark-grey">Loading activity...</p>
      </div>
    );
  }

  // --- HANDLING NOT FOUND ---
  if (!activityData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-ui-dark-grey">
        <p>Activity not found.</p>
        <button onClick={() => router.back()} className="text-ui-accent-yellow font-bold mt-2">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-ui-background">

      {/* --- CONTENT SCROLLABLE --- */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 no-scrollbar">
        
        {/* SECTION 1: PARTICIPANTS HEADER (Sesuai Screenshot) */}
        <div className="rounded-2xl mb-6 flex items-center justify-between gap-3">
            <div className="bg-ui-white p-4 rounded-2xl shadow-sm flex-1 min-w-0 flex items-center justify-between">
                {/* 1. BAGIAN AVATAR */}
                {/* Tambahkan: flex-1, min-w-0, overflow-x-auto */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {activityData?.participants?.map((p, idx) => (
                        <div key={idx} className="flex flex-col items-center shrink-0">
                            <div className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-gray-100 overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                    src={getAvatarByName(p.name)} 
                                    className="w-full h-full object-cover"
                                    alt={p.name}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-ui-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                {/* 2. BAGIAN TOGGLE */}
                {/* Tambahkan: shrink-0, pl-4 */}
                <div className="">
                    <Toggle 
                        label="Equal Split"
                        checked={isEqualSplit}
                        onChange={(val) => {
                            setIsEqualSplit(val);
                        }}
                    />
                </div>
            </div>
        </div>


        {/* SECTION 2: RECEIPT CARD */}
        {/* Kita kasih overflow-hidden biar Wave-nya kepotong rapi kalau ditaruh di dalam,
            TAPI untuk efek kertas sobek di bawah, kita taruh Wave di LUAR div putih ini */}
        <div className="relative drop-shadow-xl filter">
            
            <div className="text-ui-white -mt-2"> {/* margin minus biar nempel rapi */}
                <Wave className="w-full fill-current" />
            </div>
            {/* KERTAS STRUK (BAGIAN ATAS & TENGAH) */}
            <div className="bg-ui-white p-6 pb-2">
                
                {/* Judul & Payer */}
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-ui-black font-display">{activityData.title}</h2>
                    <p className="text-xs text-ui-dark-grey">
                        Paid by <span className="font-bold text-ui-black">{activityData.payerName}</span>
                    </p>
                </div>

                {/* List Items dari Firebase */}
                <div className="flex flex-col gap-6 mb-8">
                    {items && items.length > 0 ? (
                        items.map((item) => (
                            <ReceiptItem 
                                key={item.id} 
                                item={item} 
                                getAvatarByName={getAvatarByName} 
                            />
                        ))
                    ) : (
                        <p className="text-center text-xs text-gray-400 py-4">No items yet</p>
                    )}
                </div>

                {/* ADD ITEM BUTTON */}
                <div className="flex justify-center mb-8">
                    <button 
                        onClick={() => router.push(`/event/${eventId}/activity/${activityId}/add-item`)}
                        className="flex items-center gap-2 px-4 py-2 bg-ui-grey rounded-full text-xs font-bold text-ui-dark-grey hover:bg-ui-accent-yellow/20 hover:text-ui-black transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Menu Item
                    </button>
                </div>

                {/* Garis Putus-putus Divider */}
                <div className="w-full border-b-2 border-dashed border-ui-dark-grey mb-6 relative">
                     {/* Efek Coak Kiri Kanan */}
                     <div className="absolute -left-8 -top-3 w-6 h-6 rounded-full"></div>
                     <div className="absolute -right-8 -top-3 w-6 h-6 rounded-full"></div>
                </div>

                {/* Totals Section */}
                <div className="flex flex-col gap-2 pb-6">
                    <div className="flex justify-between items-center text-xs text-ui-dark-grey font-medium">
                        <span>Subtotal</span>
                        <span className="">{formatCurrency(subTotal)}</span>
                    </div>
                    {taxAmount > 0 && (
                      <div className="flex justify-between items-center text-xs text-ui-dark-grey font-medium">
                          <span>Total Tax</span>
                          <span className="">{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-xs text-ui-dark-grey font-medium">
                          <span>Total Discount</span>
                          <span className="">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold text-ui-black mt-2">
                        <span>Total Bill</span>
                        <span className="">{formatCurrency(grandTotal)}</span>
                    </div>
                </div>
            </div>

            {/* BAGIAN BAWAH (WAVE / GERIGI KERTAS) */}
            {/* Wave kita putar 180 derajat dan warnanya disamakan dengan bg kertas (putih) */}
            <div className="text-ui-white -mt-px"> {/* margin minus biar nempel rapi */}
                <Wave className="w-full rotate-180 fill-current" />
            </div>
        </div>

      </div>

      {/* --- FOOTER ACTION (EDIT BUTTON) --- */}
      <div className="fixed bottom-12 right-5 z-20">
          <button 
             onClick={() => router.push(`/event/${eventId}/activity/${activityId}/edit`)}
             className="w-14 h-14 bg-ui-accent-yellow text-ui-black rounded-full shadow-lg shadow-black/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-ui-grey/10"
          >
             <Edit2 className="w-6 h-6" />
          </button>
      </div>

      <div className="fixed bottom-30 right-5 z-20">
          <button 
             onClick={() => router.push(`/scan/camera?eventId=${eventId}&activityId=${activityId}`)}
             className="w-14 h-14 bg-ui-white text-ui-black rounded-full shadow-lg shadow-black/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-ui-grey/20"
          >
             <ScanLine className="w-6 h-6" />
          </button>
      </div>

    </div>
  );
}

// Helper Format Rupiah
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
