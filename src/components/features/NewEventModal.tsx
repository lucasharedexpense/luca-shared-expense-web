"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, Type, Loader2, Search, Check, MapPin, ImagePlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getContacts, ContactData } from "@/lib/firebase-contacts";
import { uploadEventImage } from "@/lib/firebase-storage";


// Helper: Get avatar color
const getAvatarColor = (name: string) => {
  const colors = ["bg-red-100", "bg-blue-100", "bg-green-100", "bg-orange-100", "bg-purple-100", "bg-teal-100"];
  return colors[name.length % colors.length];
};

// Helper: Get avatar src
const getAvatarSrc = (avatarName: string) => {
  if (avatarName?.startsWith("http")) return avatarName;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarName || "user"}`;
};

// Helper: Alphabetical sort, non-alphabetic at bottom
const alphaSort = (a: { name: string }, b: { name: string }) => {
  const isAlpha = (str: string) => /^[A-Za-z]/.test(str);
  const aAlpha = isAlpha(a.name);
  const bAlpha = isAlpha(b.name);
  if (aAlpha && !bAlpha) return -1;
  if (!aAlpha && bAlpha) return 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
};

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    date: Date;
    location: string;
    imageUrl: string;
    participants: { name: string; avatarName: string }[];
  }) => void;
  isLoading?: boolean;
  initialData?: {
    title: string;
    date: string;
    location?: string;
    imageUrl?: string;
    participants: { name: string; avatarName: string }[];
  } | null;
}

export default function NewEventModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false,
  initialData = null 
}: NewEventModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<ContactData[]>([]);
  const [searchContact, setSearchContact] = useState("");
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // --- EFFECT: FETCH CONTACTS FROM FIREBASE ---
  useEffect(() => {
    if (isOpen && user?.uid) {
      setContactsLoading(true);
      getContacts(user.uid)
        .then((data) => setContacts(data))
        .catch((err) => console.error("Failed to fetch contacts:", err))
        .finally(() => setContactsLoading(false));
    }
  }, [isOpen, user?.uid]);

  // --- EFFECT: ISI FORM SAAT MODAL DIBUKA (EDIT MODE) ---
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            // Edit Mode
            setTitle(initialData.title);
            setLocation(initialData.location || "");
            setImagePreview(initialData.imageUrl || null);
            setImageFile(null);
            // Parse DD/MM/YYYY or other date formats to YYYY-MM-DD for input type="date"
            let parsedDate: Date;
            const ddmmyyyy = initialData.date.match?.(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (ddmmyyyy) {
              parsedDate = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
            } else {
              parsedDate = new Date(initialData.date);
            }
            const isoDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            setDate(isoDate);
            // Filter user sendiri dari list participants biar gak dobel
            const others = initialData.participants.filter(p => p.name !== "You" && p.name !== user?.displayName);
            setSelectedContacts(others.map(p => ({
              id: p.name,
              name: p.name,
              avatarName: p.avatarName,
              bankAccounts: [],
              description: "",
              phoneNumber: "",
              userId: "",
            })));
        } else {
            // Create Mode (Reset)
            setTitle("");
            setDate(new Date().toISOString().split('T')[0]);
            setLocation("");
            setImageFile(null);
            setImagePreview(null);
            setSelectedContacts([]);
        }
        setSearchContact("");
    }
  }, [isOpen, initialData, user?.displayName]);

  if (!isOpen) return null;

  const toggleParticipant = (contact: ContactData) => {
    const exists = selectedContacts.find(c => c.id === contact.id || c.name === contact.name);
    if (exists) {
      setSelectedContacts(selectedContacts.filter(c => c.name !== contact.name));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user?.uid) return;
    // Require at least one contact selected (so total participants is at least 2)
    if (selectedContacts.length < 1) {
      alert("Please select at least one participant to create an event.");
      return;
    }

    let imageUrl = initialData?.imageUrl || "";

    // Upload image if a new file was selected
    if (imageFile) {
      try {
        setUploading(true);
        imageUrl = await uploadEventImage(user.uid, imageFile);
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Failed to upload image. Event will be created without image.");
        imageUrl = "";
      } finally {
        setUploading(false);
      }
    }

    // Sort participants before submit
    const participants = selectedContacts
      .slice()
      .sort(alphaSort)
      .map(c => ({
        name: c.name,
        avatarName: c.avatarName || c.name,
      }));
    onSubmit({ title, date: new Date(date), location, imageUrl, participants });
  };

  // Filter and sort Contacts from Firebase data
  const filteredContacts = contacts
    .filter(c => c.name.toLowerCase().includes(searchContact.toLowerCase()))
    .sort(alphaSort);

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
              {title.trim().length === 0 && (
                <div className="mt-1 px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Event name is required.
                </div>
              )}
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

            {/* Input Location */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Location</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="e.g. Bali, Indonesia" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-ui-accent-yellow focus:ring-4 focus:ring-ui-accent-yellow/10 transition-all outline-none font-medium text-ui-black"
                    />
                </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Event Image</label>
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageSelect}
                    className="hidden"
                />
                {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-100 group">
                        <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-36 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-ui-black shadow-sm"
                            >
                                Change
                            </button>
                            <button 
                                type="button"
                                onClick={removeImage}
                                className="px-3 py-1.5 bg-red-500 rounded-lg text-xs font-bold text-white shadow-sm"
                            >
                                Remove
                            </button>
                        </div>
                        {uploading && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-ui-accent-yellow" />
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-ui-accent-yellow hover:text-ui-black hover:bg-ui-accent-yellow/5 transition-all cursor-pointer group"
                    >
                        <ImagePlus className="w-6 h-6 group-hover:text-ui-accent-yellow" />
                        <span className="text-xs font-medium">Click to add event image</span>
                    </button>
                )}
            </div>

            {/* Participants */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Invite Friends</label>
                    <span className="text-xs font-bold text-ui-accent-yellow">{selectedContacts.length} Selected</span>
                </div>
                {/* Warn if not enough participants */}
                {selectedContacts.length < 1 && (
                  <div className="mb-2 px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs rounded-lg flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Please select at least one participant to create an event.
                  </div>
                )}
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
                    {contactsLoading ? (
                        <div className="col-span-1 sm:col-span-2 flex items-center justify-center py-8 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            <span className="text-xs">Loading contacts...</span>
                        </div>
                    ) : filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => {
                          const isSelected = selectedContacts.some(c => c.id === contact.id || c.name === contact.name);
                          // Use the actual avatarName from the contact, fallback to Dicebear if not present
                          const avatarSrc = contact.avatarName?.startsWith("http")
                            ? contact.avatarName
                            : contact.avatarName
                              ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.avatarName}`
                              : `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`;
                          const bgColor = getAvatarColor(contact.name);

                          return (
                            <div 
                              key={contact.id}
                              onClick={() => toggleParticipant(contact)}
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
              disabled={!title.trim() || isLoading || uploading || selectedContacts.length < 1}
              className="flex-1 h-12 rounded-xl bg-ui-accent-yellow text-ui-black font-bold shadow-lg shadow-ui-accent-yellow/20 hover:brightness-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {(isLoading || uploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? "Save Changes" : "Create Event")}
            </button>
        </div>
      </div>
    </div>
  );
}