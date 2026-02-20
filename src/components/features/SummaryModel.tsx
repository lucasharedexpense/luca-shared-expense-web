"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { getContacts, updateContact } from "@/lib/firebase-contacts";
import Image from "next/image";
import { X, ArrowRight, Check, ChevronDown, ChevronUp, Share2, Receipt } from "lucide-react";
import { calculateSummary, ConsumptionDetail } from "@/lib/settlement-logic";
import { EventWithActivities } from "@/lib/firestore";

// Helper Avatar (Sama kayak sebelumnya)
const getAvatarUrl = (name: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

// Helper Currency
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventWithActivities;
}

export default function SummaryModal({ isOpen, onClose, event }: SummaryModalProps) {
    const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<'SETTLEMENT' | 'DETAILS'>('SETTLEMENT');
  
  // Calculate Data
  const summaryData = useMemo(() => {
      if (!event) return null;
      return calculateSummary({
        ...event,
        participants: event.participants ?? [],
        activities: event.activities.map((a) => ({ ...a, items: a.items ?? [] })),
      });
  }, [event]);

  if (!isOpen || !summaryData) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* SIDEBAR / HEADER SECTION (Left Panel) */}
        <div className="w-1/3 bg-gray-50 border-r border-gray-100 flex flex-col p-6">
            <h2 className="text-2xl font-bold font-display text-ui-black mb-1">{event.title}</h2>
            <p className="text-sm text-gray-500 mb-6">Total Expense Summary</p>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
                <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Bill</span>
                <span className="text-3xl font-bold text-ui-black">
                    {formatCurrency(summaryData.totalExpense)}
                </span>
            </div>

            {/* Tabs Vertical Style */}
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => setActiveTab('SETTLEMENT')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'SETTLEMENT' ? 'bg-ui-accent-yellow text-ui-black font-bold shadow-sm' : 'hover:bg-gray-200 text-gray-500 font-medium'}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeTab === 'SETTLEMENT' ? 'bg-white/30' : 'bg-gray-200'}`}>
                        <Check className="w-4 h-4" />
                    </div>
                    Settlement Plan
                </button>
                <button 
                    onClick={() => setActiveTab('DETAILS')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'DETAILS' ? 'bg-ui-accent-yellow text-ui-black font-bold shadow-sm' : 'hover:bg-gray-200 text-gray-500 font-medium'}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeTab === 'DETAILS' ? 'bg-white/30' : 'bg-gray-200'}`}>
                        <Receipt className="w-4 h-4" />
                    </div>
                    Consumption Details
                </button>
            </div>

            <div className="mt-auto">
                <button className="w-full py-3 bg-ui-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    <Share2 className="w-4 h-4" /> Share Summary
                </button>
                <button
                                        className="hidden md:inline-block w-full mt-3 px-6 py-3 bg-ui-accent-yellow text-ui-black font-bold rounded-xl shadow-md hover:bg-yellow-400 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                        onClick={async () => {
                                            if (!userId || !event?.createdAt) return;
                                            try {
                                                const contacts = await getContacts(userId);
                                                const updatePromises = contacts.map(contact => {
                                                    const updatedIsEvent = contact.isEvent.filter(ev => ev.eventCreatedAt !== event.createdAt && ev.stillEvent !== 1);
                                                    return updateContact(userId, contact.id, { isEvent: updatedIsEvent });
                                                });
                                                await Promise.all(updatePromises);
                                                // Optionally close modal or show success
                                                onClose();
                                            } catch (err) {
                                                console.error("Failed to finish event:", err);
                                            }
                                        }}
                                >
                                        Finish Event
                                </button>
            </div>
        </div>

        {/* CONTENT SECTION (Right Panel) */}
        <div className="flex-1 flex flex-col relative">
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10">
                <X className="w-6 h-6 text-gray-400" />
            </button>

            <div className="flex-1 overflow-y-auto p-8 pt-16 no-scrollbar">
                
                {activeTab === 'SETTLEMENT' ? (
                    // --- SETTLEMENT LIST ---
                    <div className="max-w-md mx-auto flex flex-col gap-4">
                        {summaryData.settlements.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                                <p>No settlements needed.<br/>Everyone is squared up! 🎉</p>
                            </div>
                        ) : (
                            <>
                                {summaryData.settlements.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                        {/* Transfer Flow */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="flex flex-col items-center gap-1 min-w-15">
                                                <Image src={getAvatarUrl(item.fromName)} alt={item.fromName} width={40} height={40} className="w-10 h-10 rounded-full bg-gray-100 object-cover" unoptimized />
                                                <span className="text-xs font-bold text-gray-600 truncate max-w-20">{item.fromName}</span>
                                            </div>
                                            <div className="flex-1 flex flex-col items-center">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase mb-1">PAYS</span>
                                                <div className="w-full h-px bg-gray-200 relative">
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                                        <ArrowRight className="w-4 h-4 text-gray-300" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 min-w-15">
                                                <Image src={getAvatarUrl(item.toName)} alt={item.toName} width={40} height={40} className="w-10 h-10 rounded-full bg-gray-100 object-cover" unoptimized />
                                                <span className="text-xs font-bold text-gray-600 truncate max-w-20">{item.toName}</span>
                                            </div>
                                        </div>
                                        {/* Amount */}
                                        <div className="ml-6 text-right">
                                            <span className="block font-bold text-lg text-ui-black">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                        <p className="text-xs text-gray-400 text-center mt-4">Calculated to minimize total transactions.</p>
                    </div>
                ) : (
                    // --- DETAILS LIST ---
                    <div className="max-w-lg mx-auto flex flex-col gap-4">
                        {summaryData.consumptionDetails.map((detail, idx) => (
                            <ConsumptionCard key={idx} detail={detail} />
                        ))}
                    </div>
                )}

            </div>
        </div>

      </div>
    </div>
  );
}

// Sub-component for Consumption Details
const ConsumptionCard = ({ detail }: { detail: ConsumptionDetail }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div 
            onClick={() => setExpanded(!expanded)}
            className="bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:border-ui-accent-yellow/50 transition-all shadow-sm"
        >
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Image src={getAvatarUrl(detail.userName)} alt={detail.userName} width={40} height={40} className="w-10 h-10 rounded-full bg-gray-100 object-cover" unoptimized />
                    <div>
                        <h4 className="font-bold text-sm text-ui-black">{detail.userName}</h4>
                        <p className="text-xs text-gray-400">{detail.items.length} items consumed</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-bold text-ui-black">{formatCurrency(detail.totalConsumption)}</span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
            </div>

            {expanded && (
                <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2 animate-in slide-in-from-top-2">
                    {detail.items.map((item, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600">{item.itemName}</span>
                            <span className="text-gray-400">{formatCurrency(item.splitAmount)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};