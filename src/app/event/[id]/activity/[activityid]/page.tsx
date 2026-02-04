"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Edit2, Receipt, User } from "lucide-react";
import { MOCK_DATABASE } from "@/lib/dummy-data";
import { Wave } from "@/components/ui/Icons"; // Pastikan path import Wave benar
import Toggle from "@/components/ui/Toggle";

export default function ActivityDetailPage() {
  const router = useRouter();
  
  // 1. SOLUSI ERROR "params is a Promise":
  // Kita pakai hook useParams() yang aman untuk Client Component
  const params = useParams();
  
  // Unwrap params (karena bisa string atau array)
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const activityId = Array.isArray(params?.activityid) ? params.activityid[0] : params?.activityid;

  // 2. CARI DATA DARI MOCK DATABASE
  const eventData = MOCK_DATABASE.events.find((e) => e.id === eventId);
  const activityData = eventData?.activities.find((a) => a.id === activityId);

  // Helper untuk cari avatar user berdasarkan nama
  // (Di real app, sebaiknya simpan userId di item, bukan nama)
  const getAvatarByName = (name: string) => {
    // Cari di partisipan activity dulu
    const participant = activityData?.participants.find(p => p.name === name);
    if (participant) return participant.avatarName;
    
    // Kalau ga ada, cari di event level
    const eventParticipant = eventData?.participants.find(p => p.name === name);
    if (eventParticipant) return eventParticipant.avatarName;

    // Fallback ke random dicebear
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
  };

  // 3. HITUNG TOTAL OTOMATIS DARI ITEMS
  const { subTotal, taxAmount, grandTotal } = useMemo(() => {
    if (!activityData?.items) return { subTotal: 0, taxAmount: 0, grandTotal: 0 };

    const sub = activityData.items.reduce((acc, item) => {
      return acc + (item.price * item.quantity);
    }, 0);

    // Asumsi pajak 10% (sesuai screenshot)
    const tax = sub * 0.1; 
    
    return {
      subTotal: sub,
      taxAmount: tax,
      grandTotal: sub + tax
    };
  }, [activityData]);

  const [isEqualSplit, setIsEqualSplit] = useState(false);

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
                    {activityData.participants.map((p, idx) => (
                        <div key={idx} className="flex flex-col items-center shrink-0"> {/* shrink-0 di item juga penting */}
                            <div className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-gray-100 overflow-hidden">
                                    <img 
                                    src={p.avatarName.startsWith("http") ? p.avatarName : `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} 
                                    className="w-full h-full object-cover"
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
                            console.log("Split Mode:", val ? "Equal" : "Itemized");
                        }}
                    />
                </div>
            </div>
        </div>


        {/* SECTION 2: RECEIPT CARD */}
        {/* Kita kasih overflow-hidden biar Wave-nya kepotong rapi kalau ditaruh di dalam,
            TAPI untuk efek kertas sobek di bawah, kita taruh Wave di LUAR div putih ini */}
        <div className="relative drop-shadow-xl filter">
            
            <div className="text-ui-white -mt-px"> {/* margin minus biar nempel rapi */}
                <Wave className="w-full fill-current" />
            </div>
            {/* KERTAS STRUK (BAGIAN ATAS & TENGAH) */}
            <div className="bg-ui-white p-6 pb-2">
                
                {/* Judul & Payer */}
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-ui-black font-display">{activityData.title}</h2>
                    <p className="text-xs text-ui-dark-grey mt-1">
                        Paid by <span className="font-bold text-ui-black">{activityData.payerName}</span>
                    </p>
                </div>

                {/* List Items dari MOCK DATABASE */}
                <div className="flex flex-col gap-6 mb-8">
                    {activityData.items && activityData.items.length > 0 ? (
                        activityData.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
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
                                    <span className="text-sm font-bold text-ui-black font-mono">
                                        {formatCurrency(item.price * item.quantity)}
                                    </span>
                                </div>

                                {/* Baris 2: Avatar Pemakan */}
                                <div className="flex items-center gap-1 pl-8">
                                    {item.memberNames.map((name, i) => (
                                        <div key={i} className="w-5 h-5 rounded-full bg-gray-100 border border-white overflow-hidden shadow-sm">
                                            <img 
                                                src={getAvatarByName(name)} 
                                                className="w-full h-full object-cover"
                                                alt={name}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-xs text-gray-400 py-4">No items yet</p>
                    )}
                </div>

                {/* Garis Putus-putus Divider */}
                <div className="w-full border-b-2 border-dashed border-ui-grey/30 mb-6 relative">
                     {/* Efek Coak Kiri Kanan */}
                     <div className="absolute -left-8 -top-3 w-6 h-6 rounded-full bg-ui-grey/10"></div>
                     <div className="absolute -right-8 -top-3 w-6 h-6 rounded-full bg-ui-grey/10"></div>
                </div>

                {/* Totals Section */}
                <div className="flex flex-col gap-2 pb-6">
                    <div className="flex justify-between items-center text-xs text-ui-dark-grey font-medium">
                        <span>Subtotal</span>
                        <span className="font-mono">{formatCurrency(subTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-ui-dark-grey font-medium">
                        <span>Tax (10%)</span>
                        <span className="font-mono">{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold text-ui-black mt-2">
                        <span>Total Bill</span>
                        <span className="font-mono">{formatCurrency(grandTotal)}</span>
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
      <div className="fixed bottom-8 right-5 z-20">
          <button 
             onClick={() => console.log("Edit Items")} // Nanti arahkan ke page edit item
             className="w-14 h-14 bg-ui-white text-ui-black rounded-full shadow-lg shadow-black/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-ui-grey/10"
          >
             <Edit2 className="w-6 h-6" />
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