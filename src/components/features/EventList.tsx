"use client";

import React, { useState } from "react";
import { Search, Plus, CalendarClock, Edit2 } from "lucide-react"; // Import Edit2
import { MOCK_DATABASE } from "@/lib/dummy-data";
import NewEventModal from "./NewEventModal";

// Helper hitung total
const getEventTotal = (event: any) => {
  return event.activities.reduce((acc: number, act: any) => {
     const actTotal = act.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0);
     return acc + actTotal;
  }, 0);
};

interface EventListProps {
  onEventClick: (eventId: string) => void;
  activeId?: string | null;
}

export default function EventList({ onEventClick, activeId }: EventListProps) {
  const [search, setSearch] = useState("");
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState(MOCK_DATABASE.events);

  // --- STATE UNTUK EDIT ---
  // Menyimpan data event yang sedang diedit, atau null jika create baru
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  // HANDLER: Buka Modal Create
  const openCreateModal = () => {
    setEditingEvent(null); // Reset edit state
    setShowNewEventModal(true);
  };

  // HANDLER: Buka Modal Edit
  const openEditModal = (e: React.MouseEvent, event: any) => {
    e.stopPropagation(); // Biar ga ke-trigger onEventClick (pindah halaman)
    setEditingEvent(event);
    setShowNewEventModal(true);
  };

  // HANDLER: Save (Create / Update)
  const handleSaveEvent = (title: string, date: Date, participants: string[]) => {
    setIsLoading(true);

    setTimeout(() => {
        if (editingEvent) {
            // --- LOGIC UPDATE ---
            const updatedEvents = events.map(ev => {
                if (ev.id === editingEvent.id) {
                    return {
                        ...ev,
                        title: title,
                        date: date.toISOString(),
                        // Gabungkan "You" jika belum ada, plus participants baru
                        participants: ["You", ...participants], 
                    };
                }
                return ev;
            });
            // @ts-ignore
            setEvents(updatedEvents);
        } else {
            // --- LOGIC CREATE ---
            const newEvent = {
                id: Math.random().toString(36).substr(2, 9),
                title: title,
                date: date.toISOString(),
                status: "active",
                participants: ["You", ...participants],
                activities: []
            };
            // @ts-ignore
            setEvents([newEvent, ...events]);
            onEventClick(newEvent.id);
        }
        
        // Reset & Close
        setIsLoading(false);
        setShowNewEventModal(false);
        setEditingEvent(null);
        
    }, 800);
  };

  return (
    <>
        <div className="flex flex-col h-full">
            {/* SEARCH BAR */}
            <div className="mb-4 sticky top-0 bg-white z-10 py-2">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-ui-black transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-full bg-gray-100 border-none outline-none focus:bg-white focus:ring-2 focus:ring-ui-accent-yellow transition-all text-sm font-medium placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* LIST CONTENT */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-20 pr-1">
                
                {/* Button Add New */}
                <button 
                    onClick={openCreateModal}
                    className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-wide hover:border-ui-accent-yellow hover:text-ui-black hover:bg-ui-accent-yellow/5 transition-all group"
                >
                    <div className="p-1 rounded-full bg-gray-100 group-hover:bg-ui-accent-yellow transition-colors">
                        <Plus className="w-4 h-4 text-gray-500 group-hover:text-ui-black" />
                    </div>
                    Create New Event
                </button>

                {filteredEvents.map((event) => {
                    const isActive = activeId === event.id;
                    return (
                        <div 
                            key={event.id}
                            onClick={() => onEventClick(event.id)}
                            className={`
                                relative p-4 rounded-2xl border transition-all cursor-pointer group
                                hover:shadow-md hover:-translate-y-0.5
                                ${isActive 
                                    ? "bg-ui-accent-yellow/5 border-ui-accent-yellow ring-1 ring-ui-accent-yellow shadow-sm" 
                                    : "bg-white border-gray-100 hover:border-gray-200"
                                }
                            `}
                        >
                            {/* Active Indicator */}
                            {isActive && <div className="absolute left-0 top-4 bottom-4 w-1 bg-ui-accent-yellow rounded-r-full" />}

                            {/* Header Card */}
                            <div className="flex justify-between items-start mb-2 pl-2">
                                <div>
                                    <h3 className={`font-bold text-sm line-clamp-1 mb-1 ${isActive ? "text-ui-black" : "text-gray-700"}`}>
                                        {event.title}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                                        <CalendarClock className="w-3 h-3" />
                                        <span>{new Date(event.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                
                                {/* TOMBOL EDIT (Hanya muncul saat hover card) */}
                                <button 
                                    onClick={(e) => openEditModal(e, event)}
                                    className={"p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-ui-accent-yellow hover:text-ui-black transition-all opacity-0 group-hover:opacity-100"}
                                    title="Edit Event"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            
                            {/* Footer Card */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 pl-2">
                                <div className="flex items-center -space-x-2">
                                    {[...Array(Math.min(3, event.participants.length))].map((_, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                            {String.fromCharCode(65+i)}
                                        </div>
                                    ))}
                                    {event.participants.length > 3 && (
                                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                                            +{event.participants.length - 3}
                                        </div>
                                    )}
                                </div>

                                <span className="text-sm font-bold text-ui-black">
                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(getEventTotal(event))}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* --- MODAL (CREATE / EDIT) --- */}
        <NewEventModal 
            isOpen={showNewEventModal}
            onClose={() => setShowNewEventModal(false)}
            onSubmit={handleSaveEvent}
            isLoading={isLoading}
            initialData={editingEvent} // Kirim data kalau lagi edit
        />
    </>
  );
}