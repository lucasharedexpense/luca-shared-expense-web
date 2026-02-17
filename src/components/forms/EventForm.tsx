"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Plus,
  Type,
  Check,
  X,
  Loader2,
  ImagePlus
} from "lucide-react";
import { Contact, Event } from "@/lib/dummy-data";
import { useAuth } from "@/lib/auth-context";
import { getContacts, ContactData } from "@/lib/firebase-contacts";
import { uploadEventImage } from "@/lib/firebase-storage";

// Define the shape of data returned by this form
export interface EventFormData {
   title: string;
   location: string;
   date: string;
   participantIds: string[]; // Only store contact IDs
   imageUrl?: string; // Optional image URL
}

interface EventFormProps {
  initialData?: Event; // Optional: Only present during Edit mode
  isEditing?: boolean;
  onSubmit: (data: EventFormData) => void;
}

export default function EventForm({ initialData, isEditing = false, onSubmit }: EventFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FIREBASE CONTACTS STATE ---
  const [firebaseContacts, setFirebaseContacts] = useState<ContactData[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // --- IMAGE STATE ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [uploading, setUploading] = useState(false);

  // Fetch contacts from Firebase
  useEffect(() => {
    if (user?.uid) {
      setContactsLoading(true);
      getContacts(user.uid)
        .then((data) => setFirebaseContacts(data))
        .catch((err) => console.error("Failed to fetch contacts:", err))
        .finally(() => setContactsLoading(false));
    }
  }, [user?.uid]);

  // --- STATE FORM ---
  // If initialData exists (Edit Mode), use those values. Otherwise default to empty.
  const [title, setTitle] = useState(initialData?.title || "");
  const [location, setLocation] = useState(initialData?.location || "");
  
  // Note: Date format from DB is DD/MM/YYYY string.
  const [date, setDate] = useState(() => {
    if (initialData?.date) {
      try {
        let d: Date;
        if (typeof initialData.date === 'object' && initialData.date !== null && 'toDate' in initialData.date) {
          d = (initialData.date as any).toDate();
        } else if (typeof initialData.date === 'string') {
          // Handle DD/MM/YYYY format from Firebase
          const ddmmyyyy = initialData.date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (ddmmyyyy) {
            d = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
          } else {
            d = new Date(initialData.date);
          }
        } else {
          d = new Date(initialData.date);
        }
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0]; // Convert to YYYY-MM-DD for input type="date"
        }
      } catch {
        // fallback
      }
    }
    return new Date().toISOString().split('T')[0];
  });

   // Store only the contact ID in selectedParticipants for true sync
   const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
      initialData?.participants
         ? initialData.participants.map((p) => {
               // Try to find the contact by name and avatarName (legacy events)
               const found = firebaseContacts.find(
                  (c) => c.name === p.name && c.avatarName === p.avatarName
               );
               return found ? found.id : null;
            }).filter((id): id is string => id !== null)
         : []
   );
  
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // --- HANDLERS ---
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

   const handleSave = async () => {
      if (!title || !date) {
         alert("Please fill in Title and Date!");
         return;
      }

      // Upload image if a new file was selected
      let imageUrl = initialData?.imageUrl || "";
      if (imageFile && user?.uid) {
        try {
          setUploading(true);
          imageUrl = await uploadEventImage(user.uid, imageFile);
        } catch (err) {
          console.error("Image upload failed:", err);
          alert("Failed to upload image. Event will be created without image.");
          imageUrl = imagePreview || "";
        } finally {
          setUploading(false);
        }
      }

      // Store only contact IDs
      const formData: EventFormData = {
         title,
         location,
         date,
         participantIds: selectedParticipants,
         imageUrl,
      };

      onSubmit(formData);
   };

   const toggleParticipant = (contact: Contact) => {
      const exists = selectedParticipants.includes(contact.id);
      if (exists) {
         setSelectedParticipants((prev) => prev.filter((id) => id !== contact.id));
      } else {
         setSelectedParticipants((prev) => [...prev, contact.id]);
      }
   };

  return (
    <div className="flex flex-col h-full w-full bg-ui-white z-1">
      
      {/* --- HEADER --- */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-4 border-b border-ui-grey/20">
        <button 
           onClick={() => router.back()}
           className="w-10 h-10 rounded-full bg-ui-grey/10 flex items-center justify-center hover:bg-ui-grey/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ui-black" />
        </button>
        <h1 className="text-xl font-bold font-display text-ui-black">
            {isEditing ? "Edit Event" : "New Event"}
        </h1>
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
                    className="w-full text-3xl font-bold text-ui-black placeholder:text-ui-dark-grey/50 outline-none bg-transparent border-b-2 border-ui-accent-yellow py-2 transition-colors"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus={!isEditing} // Only autofocus on create
                  />
                  <Type className="absolute right-0 top-3 w-6 h-6 text-ui-grey/30 pointer-events-none" />
               </div>
            </div>

            {/* 2. Details (Location & Date) */}
            <div className="grid grid-cols-1 gap-6">
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest flex items-center gap-2">
                     <MapPin className="w-3 h-3" /> Location
                  </label>
                  <input 
                    type="text" 
                    placeholder="Where is it?"
                    className="w-full bg-ui-grey rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ui-accent-yellow/50 transition-all font-medium text-ui-black"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
               </div>

               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest flex items-center gap-2">
                     <CalendarIcon className="w-3 h-3" /> Date
                  </label>
                  <input 
                    type="date"
                    className="w-full bg-ui-grey rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-ui-accent-yellow/50 transition-all font-medium text-ui-black"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
               </div>
            </div>

            {/* 3. Image Upload Section */}
            <div className="flex flex-col gap-3 mt-2">
               <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest">Event Image</label>
               <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageSelect}
                  className="hidden"
               />
               {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-ui-grey/20 group">
                     <img 
                        src={imagePreview} 
                        alt="Event Preview" 
                        className="w-full h-40 object-cover"
                     />
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button 
                           type="button"
                           onClick={() => fileInputRef.current?.click()}
                           className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-ui-black shadow-sm hover:brightness-110 transition-all active:scale-95"
                        >
                           Change
                        </button>
                        <button 
                           type="button"
                           onClick={removeImage}
                           className="px-3 py-1.5 bg-ui-accent-red rounded-lg text-xs font-bold text-white shadow-sm hover:brightness-110 transition-all active:scale-95"
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
                     className="w-full py-8 rounded-2xl border-2 border-dashed border-ui-grey/30 flex flex-col items-center justify-center gap-2 text-ui-dark-grey/60 hover:border-ui-accent-yellow hover:text-ui-accent-yellow hover:bg-ui-accent-yellow/5 transition-all cursor-pointer group"
                  >
                     <ImagePlus className="w-6 h-6 group-hover:text-ui-accent-yellow" />
                     <span className="text-xs font-medium">Click to add event image</span>
                  </button>
               )}
            </div>

            {/* 4. Participants Section */}
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
              <div className="flex items-center bg-ui-grey rounded-xl px-2 gap-3 overflow-x-auto no-scrollbar py-2 min-h-16">
                 <button 
                    onClick={() => setIsContactModalOpen(true)}
                    className="w-12 h-12 rounded-full border-2 border-dashed border-ui-dark-grey/30 flex items-center justify-center shrink-0 hover:border-ui-accent-yellow hover:bg-ui-accent-yellow/10 transition-all active:scale-95 group"
                 >
                    <Plus className="w-5 h-5 text-ui-dark-grey group-hover:text-ui-accent-yellow" />
                 </button>

                          {selectedParticipants.map((id, idx) => {
                             const contact = firebaseContacts.find((c) => c.id === id);
                             if (!contact) return null;
                             return (
                                <div key={id} className="relative group shrink-0 animate-in fade-in zoom-in duration-200">
                                   <div className="w-12 h-12 rounded-full overflow-hidden border border-ui-grey">
                                      <img
                                         src={contact.avatarName?.startsWith("http") ? contact.avatarName : `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`}
                                         alt={contact.name}
                                         className="w-full h-full object-cover"
                                      />
                                   </div>
                                   {/* Remove Badge (Hover) */}
                                   <button
                                      onClick={() => toggleParticipant(contact)}
                                      className="absolute -top-1 -right-1 w-5 h-5 bg-ui-accent-red text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                   >
                                      <X className="w-3 h-3" />
                                   </button>
                                </div>
                             );
                          })}
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
            {isEditing ? "Save Changes" : "Create Event"}
         </button>
      </div>

      {/* --- CONTACT SELECTION MODAL --- */}
      {isContactModalOpen && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-ui-white w-full max-w-md rounded-4xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
               
               <div className="px-6 py-4 border-b border-ui-grey/10 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Select Friends</h3>
                  <button 
                     onClick={() => setIsContactModalOpen(false)}
                     className="p-2 bg-ui-grey/10 rounded-full hover:bg-ui-grey/20"
                  >
                     <X className="w-5 h-5 text-ui-dark-grey" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-2">
                  {contactsLoading ? (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span className="text-sm">Loading contacts...</span>
                    </div>
                  ) : (
                  firebaseContacts.map((contact) => {
                     // Check if participant is selected (by ID)
                     const isSelected = selectedParticipants.includes(contact.id);
                     return (
                        <div 
                           key={contact.id}
                           onClick={() => toggleParticipant(contact as unknown as Contact)}
                           className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-colors border ${isSelected ? 'bg-ui-accent-yellow/10 border-ui-accent-yellow' : 'hover:bg-ui-grey/5 border-transparent'}`}
                        >
                           <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                              <img 
                                 src={contact.avatarName.startsWith("http") ? contact.avatarName : `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`} 
                                 className="w-full h-full object-cover"
                              />
                           </div>
                           
                           <div className="flex-1">
                              <h4 className="font-bold text-sm text-ui-black">{contact.name}</h4>
                              <p className="text-xs text-ui-dark-grey">{contact.phoneNumber || "No phone"}</p>
                           </div>

                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-ui-accent-yellow bg-ui-accent-yellow' : 'border-ui-grey/30'}`}>
                              {isSelected && <Check className="w-4 h-4 text-ui-black" />}
                           </div>
                        </div>
                     )
                  })
                  )}
               </div>

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