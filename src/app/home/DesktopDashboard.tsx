"use client";

import React, { useState } from "react";
import EventList from "@/components/features/EventList";
import { MOCK_DATABASE } from "@/lib/dummy-data";
import { ShoppingCart, ChevronRight, X, ArrowLeft, Receipt, UserCircle } from "lucide-react";

// --- COLUMN 2: EVENT DETAIL (LEBIH CLEAN) ---
const EventDetailColumn = ({ eventId, activeActivityId, onActivityClick, onClose }: any) => {
    const event = MOCK_DATABASE.events.find(e => e.id === eventId);
    if (!event) return null;

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header dengan background halus */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-start bg-gray-50/30">
                <div>
                    <h2 className="text-2xl font-bold font-display text-ui-black line-clamp-1">{event.title}</h2>
                    <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Activity List</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                    <X className="w-5 h-5 text-gray-400 group-hover:text-red-500"/>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {event.activities.map((act) => {
                    const isActive = activeActivityId === act.id;
                    return (
                        <div 
                            key={act.id} 
                            onClick={() => onActivityClick(act.id)}
                            className={`
                                flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200
                                ${isActive 
                                    ? "bg-ui-accent-yellow shadow-md border-ui-accent-yellow transform scale-[1.02]" 
                                    : "bg-white border-gray-100 hover:border-ui-accent-yellow/50 hover:bg-ui-accent-yellow/5"
                                }
                            `}
                        >
                            {/* Icon Box */}
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors
                                ${isActive ? "bg-white text-ui-black" : "bg-gray-50 text-gray-400"}
                            `}>
                                <Receipt className="w-5 h-5" strokeWidth={2.5} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-bold truncate ${isActive ? "text-ui-black" : "text-ui-black"}`}>
                                    {act.title}
                                </h4>
                                <div className={`flex items-center gap-1 text-xs mt-0.5 ${isActive ? "text-ui-black/70" : "text-gray-400"}`}>
                                    <UserCircle className="w-3 h-3" />
                                    <span className="truncate">Paid by {act.payerName}</span>
                                </div>
                            </div>

                            <ChevronRight className={`w-5 h-5 shrink-0 ${isActive ? "text-ui-black" : "text-gray-300"}`} />
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

// --- COLUMN 3: ACTIVITY DETAIL (LEBIH MODERN) ---
const ActivityDetailColumn = ({ eventId, activityId, onClose }: any) => {
    const event = MOCK_DATABASE.events.find(e => e.id === eventId);
    const activity = event?.activities.find(a => a.id === activityId);
    if (!activity) return null;

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl xl:shadow-sm border border-gray-100 overflow-hidden">
            {/* Header Kuning di Kolom 3 biar kontras */}
            <div className="p-6 border-b border-gray-50 flex items-center gap-3 bg-ui-accent-yellow/10">
                <button onClick={onClose} className="xl:hidden p-1 hover:bg-white/50 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-ui-black" />
                </button>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-ui-black line-clamp-1">{activity.title}</h3>
                    <p className="text-[10px] uppercase font-bold text-ui-black/50 tracking-widest">Detail Items</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                    <X className="w-5 h-5 text-ui-black"/>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="py-3 px-6">Item</th>
                            <th className="py-3 px-4 text-center">Qty</th>
                            <th className="py-3 px-6 text-right">Price</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {activity.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-4 px-6 font-medium text-ui-black">{item.itemName}</td>
                                <td className="py-4 px-4 text-center">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">
                                        x{item.quantity}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-right font-mono text-gray-600">
                                    {new Intl.NumberFormat("id-ID").format(item.price)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Total Footer yang Stand Out */}
            <div className="p-6 bg-gray-900 text-white mt-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Total Amount</span>
                        <span className="text-2xl font-bold font-mono text-ui-accent-yellow">
                            Rp {new Intl.NumberFormat("id-ID").format(activity.items.reduce((a,b) => a + (b.price*b.quantity), 0))}
                        </span>
                    </div>
                    {/* Fake action button */}
                    <button className="px-4 py-2 bg-ui-accent-yellow text-ui-black rounded-xl text-xs font-bold hover:brightness-110 transition-all">
                        Edit
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- MAIN LAYOUT ---
export default function DesktopDashboard() {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

    return (
        // BG-GRAY-50/50 agar kartu putih menonjol
        <div className="flex h-[calc(100vh-64px)] w-full gap-5 p-6 relative overflow-hidden bg-gray-50/50">
            
            {/* KOLOM 1: LIST EVENT */}
            <div className={`
                shrink-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                w-[35%] xl:w-[320px]
            `}>
                <h2 className="text-2xl font-bold font-display text-ui-black mb-6 px-1">Dashboard</h2>
                
                {/* Kartu List dengan Background Putih Bersih */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex-1 overflow-hidden flex flex-col">
                    <EventList 
                        activeId={selectedEventId}
                        onEventClick={(id) => {
                            setSelectedEventId(id);
                            setSelectedActivityId(null); 
                        }}
                    />
                </div>
            </div>

            {/* KOLOM 2 */}
            {selectedEventId ? (
                <div className="flex-1 flex flex-col pt-14 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
                    <EventDetailColumn 
                        eventId={selectedEventId} 
                        activeActivityId={selectedActivityId}
                        onActivityClick={setSelectedActivityId}
                        onClose={() => {
                            setSelectedEventId(null);
                            setSelectedActivityId(null);
                        }}
                    />
                </div>
            ) : (
                // EMPTY STATE YANG GANTENG
                <div className="flex-1 pt-14 animate-in fade-in duration-700">
                    <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white/50">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Receipt className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-500">No Event Selected</h3>
                        <p className="text-sm text-gray-400 mt-1 max-w-xs">Select an event from the list on the left to view details and manage expenses.</p>
                    </div>
                </div>
            )}

            {/* KOLOM 3 */}
            {selectedEventId && selectedActivityId && (
                <>
                    <div 
                        className="xl:hidden absolute inset-0 bg-ui-black/20 backdrop-blur-[2px] z-10 animate-in fade-in duration-300"
                        onClick={() => setSelectedActivityId(null)}
                    />

                    <div className={`
                        flex flex-col pt-14 z-20 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                        absolute right-6 top-0 bottom-6 w-[65%] max-w-112.5 shadow-2xl
                        xl:static xl:w-100 xl:shadow-none xl:animate-none xl:pt-14
                        animate-in slide-in-from-right-20
                    `}>
                        <ActivityDetailColumn 
                            eventId={selectedEventId}
                            activityId={selectedActivityId}
                            onClose={() => setSelectedActivityId(null)}
                        />
                    </div>
                </>
            )}
        </div>
    );
}