"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Share2, ArrowRight, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { getEventsWithActivities } from "@/lib/firestore";
import type { Participant, EventWithActivities } from "@/lib/firestore";
import { calculateSummary } from "@/lib/settlement-logic";
import type { Settlement, ConsumptionDetail } from "@/lib/settlement-logic";

// ─── EXTENDED LOCAL TYPES ──────────────────────────────────────────────────────

/** Settlement extended with local UI isPaid flag */
interface SettlementWithPaid extends Settlement {
  isPaid: boolean;
}

// --- HELPER: FORMAT CURRENCY ---
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

// --- HELPER: GET AVATAR ---
const getAvatarByName = (name: string, participants: Participant[]) => {
    const p = participants.find((participant) => participant.name === name);
    const avatar = p?.avatar;
    if (avatar && avatar.startsWith("http")) return avatar;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
};

// --- SUB-COMPONENTS ---

// 1. Tab Switcher
const SummaryTabSwitcher = ({ currentTab, onTabChange }: { currentTab: 'SETTLEMENT' | 'DETAILS', onTabChange: (t: 'SETTLEMENT' | 'DETAILS') => void }) => (
    <div className="mx-6 h-12 bg-white rounded-full border border-gray-100 p-1 flex relative">
        <button 
            onClick={() => onTabChange('SETTLEMENT')}
            className={`flex-1 rounded-full text-sm font-bold z-10 transition-colors ${currentTab === 'SETTLEMENT' ? 'text-ui-black' : 'text-ui-dark-grey'}`}
        >
            Settlement
        </button>
        <button 
            onClick={() => onTabChange('DETAILS')}
            className={`flex-1 rounded-full text-sm font-bold z-10 transition-colors ${currentTab === 'DETAILS' ? 'text-ui-black' : 'text-ui-dark-grey'}`}
        >
            Details
        </button>
        
        {/* Animated Background Pill */}
        <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-ui-accent-yellow rounded-full transition-all duration-300 ease-in-out ${
                currentTab === 'SETTLEMENT' ? 'left-1' : 'left-[calc(50%+4px)]'
            }`}
        />
    </div>
);

// 2. Settlement Card
const SettlementCard = ({ item, participants, onToggle }: { item: SettlementWithPaid, participants: Participant[], onToggle: () => void }) => {
    return (
        <div 
            onClick={onToggle}
            className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                item.isPaid 
                ? 'bg-gray-50 border-transparent opacity-80' 
                : 'bg-white border-ui-accent-yellow/50 shadow-sm'
            }`}
        >
            {/* Avatars Flow */}
            <div className="flex items-center gap-2 flex-1">
                <div className="relative">
                    <Image
                        src={getAvatarByName(item.fromName, participants)}
                        alt={item.fromName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover bg-gray-200 border border-white"
                        unoptimized
                    />
                    <div className="absolute -bottom-1 -right-1 bg-red-100 text-[8px] font-bold px-1 rounded text-red-600 border border-white">PAY</div>
                </div>
                
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                </div>

                <div className="relative">
                    <Image
                        src={getAvatarByName(item.toName, participants)}
                        alt={item.toName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover bg-gray-200 border border-white"
                        unoptimized
                    />
                    <div className="absolute -bottom-1 -right-1 bg-green-100 text-[8px] font-bold px-1 rounded text-green-600 border border-white">GET</div>
                </div>
            </div>

            {/* Amount & Status */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <span className={`font-bold ${item.isPaid ? 'line-through text-gray-400' : 'text-ui-black'}`}>
                        {formatCurrency(item.amount)}
                    </span>
                    {item.isPaid ? (
                         <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                            PAID <Check className="w-3 h-3" />
                         </span>
                    ) : (
                        <span className="text-[10px] font-bold text-red-400">UNPAID</span>
                    )}
                </div>

                {/* Checkbox */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    item.isPaid ? 'bg-green-500 border-green-500' : 'border-gray-300'
                }`}>
                    {item.isPaid && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
            </div>
        </div>
    )
};

// 3. Consumption Card (Details)
const UserConsumptionCard = ({ detail, participants }: { detail: ConsumptionDetail, participants: Participant[] }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div 
            onClick={() => setExpanded(!expanded)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Image
                        src={getAvatarByName(detail.userName, participants)}
                        alt={detail.userName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover bg-gray-200"
                        unoptimized
                    />
                    <span className="font-bold text-sm text-ui-black">{detail.userName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ui-black">{formatCurrency(detail.totalConsumption)}</span>
                    {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
            </div>

            {/* Expanded List */}
            {expanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-xs text-gray-400 mb-1">{detail.items.length} items consumed</p>
                    {detail.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-ui-accent-yellow/10">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-ui-black">{item.itemName}</span>
                                <span className="text-[10px] text-gray-500">{item.activityTitle}</span>
                            </div>
                            <span className="text-xs font-bold">{formatCurrency(item.splitAmount)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}


// --- MAIN PAGE COMPONENT ---
export default function SummaryPage() {
    const router = useRouter();
    const params = useParams();
    const { userId, loading: authLoading } = useAuth();
    
    const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const [currentTab, setCurrentTab] = useState<'SETTLEMENT' | 'DETAILS'>('SETTLEMENT');
    const [eventData, setEventData] = useState<EventWithActivities | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Local state untuk tracking settlement yang sudah dibayar (checkbox)
    const [paidSettlementIds, setPaidSettlementIds] = useState<string[]>([]);

    // Fetch event data dari Firebase
    useEffect(() => {
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

        fetchEvent();
    }, [userId, eventId, authLoading]);

    // Calculate summary dari fetched data
    const summaryData = useMemo(() => {
        if (!eventData) return null;
        // Cast: EventWithActivities is structurally compatible with SummaryEvent;
        // items is optional in Activity but required in SummaryActivity — safe at runtime
        // because calculateSummary guards against empty arrays internally.
        return calculateSummary(eventData as Parameters<typeof calculateSummary>[0]);
    }, [eventData]);

    if (!eventData || !summaryData) return (
        <div className="p-10 text-center bg-ui-background h-full flex flex-col items-center justify-center gap-4">
            {loading ? (
                <>
                    <div className="w-12 h-12 border-4 border-ui-accent-yellow border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-ui-dark-grey">Loading summary...</p>
                </>
            ) : (
                <>
                    <p className="text-ui-dark-grey font-bold">Event not found</p>
                    <button onClick={() => router.back()} className="text-ui-accent-yellow font-bold hover:underline">Go Back</button>
                </>
            )}
        </div>
    );

    const togglePaid = (id: string) => {
        if (paidSettlementIds.includes(id)) {
            setPaidSettlementIds(prev => prev.filter(pid => pid !== id));
        } else {
            setPaidSettlementIds(prev => [...prev, id]);
        }
    };

    return (
        <div className="flex flex-col h-screen w-full bg-ui-accent-yellow">
            
            <div className="w-full h-4"></div>

            {/* 2. White Container (Rounded Top) */}
            <div className="flex-1 bg-ui-background rounded-t-[30px] overflow-hidden flex flex-col relative shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                    <div className="pt-6 px-6">
                        <h2 className="text-xl font-bold text-ui-black mb-6">{eventData.title ?? eventData.name}</h2>
                    </div>

                    {/* Tab Switcher */}
                    <SummaryTabSwitcher currentTab={currentTab} onTabChange={setCurrentTab} />

                    {/* Tab Content */}
                    <div className="mt-6 px-5 flex flex-col gap-4">
                        
                        {/* Total Expense Card (Always Visible) */}
                        <div className="bg-ui-accent-yellow/20 p-4 rounded-xl flex justify-between items-center border border-ui-accent-yellow/50">
                            <span className="font-semibold text-sm text-ui-black">Total Expense</span>
                            <span className="font-bold text-lg text-ui-black">{formatCurrency(summaryData.totalExpense)}</span>
                        </div>

                        {currentTab === 'SETTLEMENT' ? (
                            // --- SETTLEMENT VIEW ---
                            <>
                                <h3 className="font-bold text-lg mt-2">Settlements ({summaryData.settlements.length})</h3>
                                {summaryData.settlements.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        No settlements needed. <br/> Everyone is settled up! 🎉
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {summaryData.settlements.map((item) => {
                                            // Override isPaid status with local state
                                            const isPaid = paidSettlementIds.includes(item.id);
                                            return (
                                                <SettlementCard 
                                                    key={item.id} 
                                                    item={{ ...item, isPaid }} 
                                                    participants={eventData.participants ?? []}
                                                    onToggle={() => togglePaid(item.id)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 text-center mt-4 px-4">
                                    All calculations are optimized to minimize the number of transactions.
                                </p>
                            </>
                        ) : (
                            // --- DETAILS VIEW ---
                            <>
                                <h3 className="font-bold text-lg mt-2">Consumption by User</h3>
                                <div className="flex flex-col gap-3">
                                    {summaryData.consumptionDetails.map((detail, idx) => (
                                        <UserConsumptionCard 
                                            key={idx} 
                                            detail={detail} 
                                            participants={eventData.participants ?? []} 
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-4 px-4">
                                    This shows what each person consumed, not who paid.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. Bottom Share Button (Sticky inside white container) */}
                {currentTab === 'SETTLEMENT' && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-white via-white to-transparent pt-10">
                        <button 
                            onClick={() => console.log("Share Clicked")}
                            className="w-full h-14 bg-ui-black text-white rounded-full shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all font-bold text-lg"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="mt-0.5">Share Settlement Plan</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}