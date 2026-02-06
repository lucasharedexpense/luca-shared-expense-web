"use client";

import React, { useState } from "react";
import { Search, Users, Plus, CalendarClock } from "lucide-react";
import { MOCK_DATABASE } from "@/lib/dummy-data";

// Helper hitung total
const getEventTotal = (event: any) => {
  return event.activities.reduce((acc: number, act: any) => {
     const actTotal = act.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0);
     return acc + actTotal;
  }, 0);
};

interface EventListProps {
  onEventClick: (eventId: string) => void;
  onNewEventClick: () => void;
  activeId?: string | null;
}

export default function EventList({ onEventClick, onNewEventClick, activeId }: EventListProps) {
  const [search, setSearch] = useState("");

  const filteredEvents = MOCK_DATABASE.events.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* 1. SEARCH BAR GANTENG (Pill Shape + Abu-abu) */}
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

      {/* 2. LIST CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-20 pr-1">
        
        {/* Tombol Add New (Dashed tapi lebih rapi) */}
        <button 
            onClick={onNewEventClick}
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
                            : "bg-white border-gray-400 hover:border-gray-200"
                        }
                    `}
                >
                    {/* Active Indicator Strip */}
                    {isActive && <div className="absolute left-0 top-4 bottom-4 w-1 bg-ui-accent-yellow rounded-r-full" />}

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
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 pl-2">
                        <div className="flex items-center -space-x-2">
                            {/* Dummy Avatar Circles */}
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
  );
}