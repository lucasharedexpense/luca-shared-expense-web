"use client";

import React, { useState, useEffect } from "react";
import SearchBar from "@/components/ui/SearchBar";
import EventCard from "@/components/ui/EventCard";
import { MOCK_DATABASE } from "@/lib/dummy-data";
import { useRouter } from "next/navigation";

export default function HomeScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [navIndex, setNavIndex] = useState(1);
  const router = useRouter();

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Hack: Kita duplikat data dummy biar listnya jadi banyak & bisa dites scroll
      const data = await MOCK_DATABASE.events;
      setEvents([...data, ...data, ...data]); // Duplikat 3x biar panjang
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // FIX 1: Gunakan 'h-[100dvh]' biar pas sama layar HP & 'overflow-hidden' biar body gak gerak
    <div className="flex flex-col h-dvh w-full bg-ui-accent-yellow relative overflow-hidden">
      
      {/* HEADER & SEARCH (Area Kuning - Fixed/Tidak ikut scroll) */}
      <div className="px-5 py-6 shrink-0 z-10">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* CONTENT AREA (Area Putih) */}
      {/* FIX 2: 'flex-1' buat ngisi sisa layar, 'overflow-hidden' biar anak-nya yang scroll */}
      <div className="flex-1 bg-ui-background rounded-t-[30px] w-full flex flex-col relative z-0 shadow-[-5px_-5px_20px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* SCROLLABLE CONTAINER */}
        {/* FIX 3: 'overflow-y-auto' di sini. 'pb-32' biar item terakhir gak ketutup Navbar */}
        <div className="flex-1 overflow-y-auto no-scrollbar pt-6 pb-50 px-5">
          
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full animate-pulse">
               <div className="w-10 h-10 border-4 border-ui-accent-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredEvents.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-ui-dark-grey">No events found.</p>
             </div>
          ) : (
            // LIST ITEM
            <div className="flex flex-col gap-4">
               {/* Label Kecil */}
               <div className="flex justify-between items-end px-1">
                  <p className="text-ui-dark-grey text-xs font-bold tracking-widest uppercase">
                      Events
                  </p>
                  <span className="text-[10px] text-ui-dark-grey bg-ui-grey px-2 py-1 rounded-full">
                    {filteredEvents.length} Items
                  </span>
               </div>
               
               {/* Mapping Data */}
               {filteredEvents.map((event, index) => (
                 // Pake index buat key karena tadi kita duplikat datanya
                 <EventCard 
                    key={index} 
                    data={event} 
                    // 3. UPDATE LOGIC ONCLICK
                    onClick={(id) => {
                        router.push(`/event/${id}`); 
                    }} 
                />
               ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}