"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Share2, RefreshCw, ArrowRight, Check, ChevronDown, ChevronUp } from "lucide-react";
import { MOCK_DATABASE } from "@/lib/dummy-data";

// --- TYPES ---
interface Settlement {
  id: string;
  fromName: string;
  toName: string;
  amount: number;
  isPaid: boolean;
}

interface ConsumptionDetail {
  userName: string;
  totalConsumption: number;
  items: {
    itemName: string;
    activityTitle: string;
    price: number;
    quantity: number; // Qty yang dimakan user ini (bukan total qty item)
    splitAmount: number;
  }[];
}

// --- HELPER: FORMAT CURRENCY ---
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

// --- HELPER: GET AVATAR ---
// (Logic yang sama dengan page sebelumnya)
const getAvatarByName = (name: string, participants: any[]) => {
    const p = participants.find(p => p.name === name);
    const avatar = p?.avatarName;
    if (avatar && avatar.startsWith("http")) return avatar;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
};

// --- LOGIC PLACEHOLDER: CALCULATE SUMMARY ---
// Ini fungsi pura-pura backend untuk menghitung settlement
const calculateSummary = (event: any) => {
    const consumptionMap: Record<string, number> = {};
    const paidMap: Record<string, number> = {};
    const detailsMap: Record<string, ConsumptionDetail> = {};

    // Init maps
    event.participants.forEach((p: any) => {
        consumptionMap[p.name] = 0;
        paidMap[p.name] = 0;
        detailsMap[p.name] = { userName: p.name, totalConsumption: 0, items: [] };
    });

    let totalExpense = 0;

    // 1. Loop semua activity & item
    event.activities.forEach((activity: any) => {
        // Hitung siapa yang bayar (Creditor)
        // Kita hitung total per activity dulu (simplified)
        let activityTotal = 0;

        activity.items.forEach((item: any) => {
            const itemTotal = (item.price * item.quantity) - (item.discountAmount || 0);
            
            // Tax pro-rate (simplified: tax dianggap flat ke harga item)
            const taxRate = item.taxPercentage || activity.items[0]?.taxPercentage || 0;
            const itemTotalWithTax = itemTotal + (itemTotal * (taxRate / 100));
            
            activityTotal += itemTotalWithTax;

            // Hitung Konsumsi (Split bill)
            const splitCount = item.memberNames.length;
            if (splitCount > 0) {
                const splitAmount = itemTotalWithTax / splitCount;
                
                item.memberNames.forEach((memberName: string) => {
                    if (consumptionMap[memberName] !== undefined) {
                        consumptionMap[memberName] += splitAmount;
                        
                        // Masukkan ke details
                        detailsMap[memberName].items.push({
                            itemName: item.itemName,
                            activityTitle: activity.title,
                            price: item.price,
                            quantity: 1, // Asumsi split equal, user dianggap makan 1 porsi dari split
                            splitAmount: splitAmount
                        });
                        detailsMap[memberName].totalConsumption += splitAmount;
                    }
                });
            }
        });

        // Catat yang bayar
        if (paidMap[activity.payerName] !== undefined) {
            paidMap[activity.payerName] += activityTotal;
        }
        totalExpense += activityTotal;
    });

    // 2. Hitung Balance (Paid - Consumed)
    // Positif = Dia kelebihan bayar (harus nerima duit)
    // Negatif = Dia kurang bayar (harus ngasih duit)
    const balances: { name: string; amount: number }[] = [];
    Object.keys(consumptionMap).forEach(name => {
        const balance = paidMap[name] - consumptionMap[name];
        balances.push({ name, amount: balance });
    });

    // 3. Generate Settlements (Greedy Algorithm Sederhana)
    const settlements: Settlement[] = [];
    
    // Pisahkan Debtor (utang) dan Creditor (piutang)
    let debtors = balances.filter(b => b.amount < -1).sort((a, b) => a.amount - b.amount); // Ascending (paling minus duluan)
    let creditors = balances.filter(b => b.amount > 1).sort((a, b) => b.amount - a.amount); // Descending (paling plus duluan)

    let i = 0; // index debtors
    let j = 0; // index creditors

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // Cari nilai settlement (min dari utang si debtor atau piutang si creditor)
        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

        // Push settlement
        settlements.push({
            id: `settle_${i}_${j}`,
            fromName: debtor.name,
            toName: creditor.name,
            amount: amount,
            isPaid: false // Default false
        });

        // Update sisa
        debtor.amount += amount;
        creditor.amount -= amount;

        // Geser index kalau sudah lunas/selesai
        if (Math.abs(debtor.amount) < 1) i++;
        if (creditor.amount < 1) j++;
    }

    return {
        totalExpense,
        settlements,
        consumptionDetails: Object.values(detailsMap).filter(d => d.totalConsumption > 0)
    };
};


// --- SUB-COMPONENTS ---

// 1. Tab Switcher
const SummaryTabSwitcher = ({ currentTab, onTabChange }: { currentTab: 'SETTLEMENT' | 'DETAILS', onTabChange: (t: any) => void }) => (
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
const SettlementCard = ({ item, participants, onToggle }: { item: Settlement, participants: any[], onToggle: () => void }) => {
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
                    <img src={getAvatarByName(item.fromName, participants)} className="w-10 h-10 rounded-full object-cover bg-gray-200 border border-white" />
                    <div className="absolute -bottom-1 -right-1 bg-red-100 text-[8px] font-bold px-1 rounded text-red-600 border border-white">PAY</div>
                </div>
                
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                </div>

                <div className="relative">
                    <img src={getAvatarByName(item.toName, participants)} className="w-10 h-10 rounded-full object-cover bg-gray-200 border border-white" />
                    <div className="absolute -bottom-1 -right-1 bg-green-100 text-[8px] font-bold px-1 rounded text-green-600 border border-white">GET</div>
                </div>
            </div>

            {/* Amount & Status */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <span className={`font-bold font-mono ${item.isPaid ? 'line-through text-gray-400' : 'text-ui-black'}`}>
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
const UserConsumptionCard = ({ detail, participants }: { detail: ConsumptionDetail, participants: any[] }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div 
            onClick={() => setExpanded(!expanded)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={getAvatarByName(detail.userName, participants)} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                    <span className="font-bold text-sm text-ui-black">{detail.userName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm font-mono text-ui-black">{formatCurrency(detail.totalConsumption)}</span>
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
                            <span className="text-xs font-bold font-mono">{formatCurrency(item.splitAmount)}</span>
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
    
    const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const [currentTab, setCurrentTab] = useState<'SETTLEMENT' | 'DETAILS'>('SETTLEMENT');
    
    // Local state untuk tracking settlement yang sudah dibayar (checkbox)
    const [paidSettlementIds, setPaidSettlementIds] = useState<string[]>([]);

    // 1. Load Data & Calculate
    const { eventData, summaryData } = useMemo(() => {
        const event = MOCK_DATABASE.events.find(e => e.id === eventId);
        if (!event) return { eventData: null, summaryData: null };
        
        return { 
            eventData: event, 
            summaryData: calculateSummary(event) 
        };
    }, [eventId]);

    if (!eventData || !summaryData) return <div className="p-10 text-center">Event not found</div>;

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
                        <h2 className="text-xl font-bold text-ui-black mb-6">{eventData.title}</h2>
                    </div>

                    {/* Tab Switcher */}
                    <SummaryTabSwitcher currentTab={currentTab} onTabChange={setCurrentTab} />

                    {/* Tab Content */}
                    <div className="mt-6 px-5 flex flex-col gap-4">
                        
                        {/* Total Expense Card (Always Visible) */}
                        <div className="bg-ui-accent-yellow/20 p-4 rounded-xl flex justify-between items-center border border-ui-accent-yellow/50">
                            <span className="font-semibold text-sm text-ui-black">Total Expense</span>
                            <span className="font-bold text-lg font-mono text-ui-black">{formatCurrency(summaryData.totalExpense)}</span>
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
                                                    participants={eventData.participants}
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
                                            participants={eventData.participants} 
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
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-10">
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