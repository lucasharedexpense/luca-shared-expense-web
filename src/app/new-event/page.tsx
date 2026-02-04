"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Plus,
  Type
} from "lucide-react";
import AvatarStack from "@/components/ui/AvatarStack";
import { MOCK_DATABASE, Contact } from "@/lib/dummy-data";

export default function NewEventPage() {
  const router = useRouter();

  // --- STATE FORM ---
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<Contact[]>([]);
  
  // State Modal Pilih Kontak
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // --- HANDLERS ---
  const handleSave = () => {
    if (!title || !date) {
      alert("Please fill in Title and Date!");
      return;
    }

    // Simulasi Save ke Database
    const newEvent = {
      id: `event_${Date.now()}`,
      title,
      location,
      date, // Format date string (YYYY-MM-DD dari input type="date")
      // Convert object Contact -> object ParticipantSimple
      participants: selectedParticipants.map(c => ({
         name: c.name,
         avatarName: c.avatarName
      })),
      activities: [],
      // Field lain default...
    };

    console.log("New Event Created:", newEvent);
    
    // Balik ke Home
    router.push("/");
  };

  const toggleParticipant = (contact: Contact) => {
    const exists = selectedParticipants.find(p => p.id === contact.id);
    if (exists) {
      setSelectedParticipants(prev => prev.filter(p => p.id !== contact.id));
    } else {
      setSelectedParticipants(prev => [...prev, contact]);
    }
  };

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
        <h1 className="text-xl font-bold font-display text-ui-black">New Event</h1>
      </div>

      {/* --- FORM CONTENT --- */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
         <div className="max-w-md mx-auto flex flex-col gap-8">
            
            {/* 1. Event Title (Big Input) */}
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest">Event Title</label>
               <div className="relative">
                  <input 
                    type="text" 
                    placeholder="e.g. Trip to Bali"
                    className="w-full text-3xl font-bold text-ui-black placeholder:text-ui-grey/40 outline-none bg-transparent border-b-2 border-ui-grey/20 focus:border-ui-accent-yellow py-2 transition-colors"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                  <Type className="absolute right-0 top-3 w-6 h-6 text-ui-grey/30 pointer-events-none" />
               </div>
            </div>

            {/* 2. Details (Location & Date) */}
            <div className="grid grid-cols-1 gap-6">
               {/* Location */}
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest flex items-center gap-2">
                     <MapPin className="w-3 h-3" /> Location
                  </label>
                  <input 
                    type="text" 
                    placeholder="Where is it?"
                    className="w-full bg-ui-grey/5 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ui-accent-yellow/50 transition-all font-medium text-ui-black"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
               </div>

               {/* Date */}
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest flex items-center gap-2">
                     <CalendarIcon className="w-3 h-3" /> Date
                  </label>
                  <input 
                    type="date" 
                    className="w-full bg-ui-grey/5 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ui-accent-yellow/50 transition-all font-medium text-ui-black"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
               </div>
            </div>

            {/* 3. Participants Section */}
            <div className="flex flex-col gap-3 mt-4">
               <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest flex items-center gap-2">
                     <Users className="w-3 h-3" /> Who's Joining?
                  </label>
                  <span className="text-xs bg-ui-accent-yellow/20 text-ui-dark-grey px-2 py-1 rounded-full font-bold">
                     {selectedParticipants.length} people
                  </span>
               </div>
               
               {/* Avatar Row + Add Button */}
               <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
                  <button 
                     onClick={() => setIsContactModalOpen(true)}
                     className="w-12 h-12 rounded-full border-2 border-dashed border-ui-dark-grey/30 flex items-center justify-center shrink-0 hover:border-ui-accent-yellow hover:bg-ui-accent-yellow/10 transition-all active:scale-95 group"
                  >
                     <Plus className="w-5 h-5 text-ui-dark-grey group-hover:text-ui-accent-yellow" />
                  </button>

                  {/* Selected Avatars */}
                  {selectedParticipants.map((p) => (
                     <div key={p.id} className="relative group shrink-0 animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-ui-grey/20">
                            <img 
                              src={p.avatarName.startsWith("http") ? p.avatarName : `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} 
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Remove Badge (Hover) */}
                        <button 
                           onClick={() => toggleParticipant(p)}
                           className="absolute -top-1 -right-1 w-5 h-5 bg-ui-accent-red text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                           <Plus className="w-3 h-3 rotate-45" />
                        </button>
                     </div>
                  ))}
               </div>
            </div>

         </div>
      </div>

      {/* --- FOOTER ACTION --- */}
      <div className="p-5 bg-ui-white border-t border-ui-grey/10">
         <button 
            onClick={handleSave}
            className="w-full py-4 rounded-2xl bg-ui-accent-yellow text-ui-black font-bold text-lg shadow-lg shadow-ui-accent-yellow/20 active:scale-[0.98] transition-all hover:brightness-105"
         >
            Create Event
         </button>
      </div>

      {/* --- CONTACT SELECTION MODAL --- */}
      {isContactModalOpen && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-ui-white w-full max-w-md rounded-4xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
               
               {/* Modal Header */}
               <div className="px-6 py-4 border-b border-ui-grey/10 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Select Friends</h3>
                  <button 
                     onClick={() => setIsContactModalOpen(false)}
                     className="p-2 bg-ui-grey/10 rounded-full hover:bg-ui-grey/20"
                  >
                     <Plus className="w-5 h-5 rotate-45 text-ui-dark-grey" />
                  </button>
               </div>

               {/* Contact List */}
               <div className="flex-1 overflow-y-auto p-2">
                  {MOCK_DATABASE.contacts.map((contact) => {
                     const isSelected = selectedParticipants.some(p => p.id === contact.id);
                     return (
                        <div 
                           key={contact.id}
                           onClick={() => toggleParticipant(contact)}
                           className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-colors border ${isSelected ? 'bg-ui-accent-yellow/10 border-ui-accent-yellow' : 'hover:bg-ui-grey/5 border-transparent'}`}
                        >
                           {/* Avatar */}
                           <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                              <img 
                                 src={contact.avatarName.startsWith("http") ? contact.avatarName : `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`} 
                                 className="w-full h-full object-cover"
                              />
                           </div>
                           
                           {/* Info */}
                           <div className="flex-1">
                              <h4 className="font-bold text-sm text-ui-black">{contact.name}</h4>
                              <p className="text-xs text-ui-dark-grey">{contact.phoneNumber || "No phone"}</p>
                           </div>

                           {/* Checkbox Visual */}
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-ui-accent-yellow bg-ui-accent-yellow' : 'border-ui-grey/30'}`}>
                              {isSelected && <Plus className="w-4 h-4 text-ui-black" />}
                           </div>
                        </div>
                     )
                  })}
               </div>

               {/* Modal Footer */}
               <div className="p-4 border-t border-ui-grey/10">
                  <button 
                     onClick={() => setIsContactModalOpen(false)}
                     className="w-full py-3 bg-ui-black text-white font-bold rounded-xl"
                  >
                     Done ({selectedParticipants.length} selected)
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}