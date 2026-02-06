"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Type, Loader2, Search, Check } from "lucide-react";
import { MOCK_DATABASE } from "@/lib/dummy-data";

// Helper (Sama kayak sebelumnya)
const getAvatarColor = (name: string) => {
  const colors = ["bg-red-100", "bg-blue-100", "bg-green-100", "bg-orange-100", "bg-purple-100", "bg-teal-100"];
  return colors[name.length % colors.length];
};

const getAvatarSrc = (avatarName: string) => {
  if (avatarName?.startsWith("http")) return avatarName;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarName || "user"}`;
};

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, date: Date, participants: string[]) => void;
  isLoading?: boolean;
  // --- NEW PROP: INITIAL DATA ---
  initialData?: {
    title: string;
    date: string;
    participants: string[];
  } | null;
}

export default function NewEventModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false,
  initialData = null 
}: NewEventModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchContact, setSearchContact] = useState("");

  // --- EFFECT: ISI FORM SAAT MODAL DIBUKA (EDIT MODE) ---
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            // Edit Mode
            setTitle(initialData.title);
            // Format Date ke YYYY-MM-DD untuk input type="date"
            const isoDate = new Date(initialData.date).toISOString().split('T')[0];
            setDate(isoDate);
            // Filter "You" atau user sendiri dari list participants biar gak dobel
            const others = initialData.participants.filter(p => p !== "You" && p !== MOCK_DATABASE.username);
            setSelectedIds(others);
        } else {
            // Create Mode (Reset)
            setTitle("");
            setDate(new Date().toISOString().split('T')[0]);
            setSelectedIds([]);
        }
        setSearchContact("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const toggleParticipant = (name: string) => {
    if (selectedIds.includes(name)) {
      setSelectedIds(selectedIds.filter(id => id !== name));
    } else {
      setSelectedIds([...selectedIds, name]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title, new Date(date), selectedIds);
  };

  // Filter Contacts
  const filteredContacts = MOCK_DATABASE.contacts
    .filter(c => c.name !== MOCK_DATABASE.username)
    .filter(c => c.name.toLowerCase().includes(searchContact.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h3 className="font-bold text-xl text-ui-black font-display">
                {initialData ? "Edit Event" : "New Event"}
            </h3>
            <p className="text-xs text-gray-500">
                {initialData ? "Update event details" : "Create a new bill splitting group"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 no-scrollbar">
            <form id="createEventForm" onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Input Title */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Event Name</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Type className="w-4 h-4" />
                    </div>
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="e.g. Trip to Japan" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-ui-accent-yellow focus:ring-4 focus:ring-ui-accent-yellow/10 transition-all outline-none font-medium text-ui-black"
                    />
                </div>
            </div>

            {/* Input Date */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Date</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-ui-accent-yellow focus:ring-4 focus:ring-ui-accent-yellow/10 transition-all outline-none font-medium text-ui-black"
                    />
                </div>
            </div>

            {/* Participants */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Invite Friends</label>
                    <span className="text-xs font-bold text-ui-accent-yellow">{selectedIds.length} Selected</span>
                </div>
                {/* Search */}
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search contacts..."
                        value={searchContact}
                        onChange={(e) => setSearchContact(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-gray-200 text-xs focus:border-ui-accent-yellow outline-none transition-all"
                    />
                </div>
                {/* Grid List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-55 overflow-y-auto no-scrollbar p-1">
                    {filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => {
                            const isSelected = selectedIds.includes(contact.name);
                            const avatarSrc = `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`;
                            const bgColor = getAvatarColor(contact.name);

                            return (
                                <div 
                                    key={contact.id}
                                    onClick={() => toggleParticipant(contact.name)}
                                    className={`
                                        flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all select-none
                                        ${isSelected 
                                            ? "bg-ui-accent-yellow/10 border-ui-accent-yellow ring-1 ring-ui-accent-yellow" 
                                            : "bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                                        }
                                    `}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-9 h-9 rounded-full overflow-hidden border border-gray-100 ${bgColor}`}>
                                            <img src={avatarSrc} alt={contact.name} className="w-full h-full object-cover"/>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute -bottom-1 -right-1 bg-ui-accent-yellow rounded-full p-0.5 border-2 border-white shadow-sm">
                                                <Check className="w-2.5 h-2.5 text-ui-black" strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-sm font-medium truncate ${isSelected ? "text-ui-black font-bold" : "text-gray-600"}`}>
                                        {contact.name}
                                    </span>
                                </div>
                            )
                        })
                    ) : (
                        <div className="col-span-1 sm:col-span-2 text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                            <p className="text-xs">No contacts found.</p>
                        </div>
                    )}
                </div>
            </div>
            </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-50 shrink-0">
            <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 h-12 rounded-xl bg-gray-100 font-bold text-gray-500 hover:bg-gray-200 transition-colors text-sm"
            >
                Cancel
            </button>
            <button 
                type="submit"
                form="createEventForm"
                disabled={!title.trim() || isLoading}
                className="flex-1 h-12 rounded-xl bg-ui-accent-yellow text-ui-black font-bold shadow-lg shadow-ui-accent-yellow/20 hover:brightness-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? "Save Changes" : "Create Event")}
            </button>
        </div>
      </div>
    </div>
  );
}