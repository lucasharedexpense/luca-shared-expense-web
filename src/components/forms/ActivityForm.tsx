"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Utensils, 
  Car, 
  Ticket, 
  ShoppingBag, 
  MoreHorizontal,
  Check,
  Wallet
} from "lucide-react";
import { Contact } from "@/lib/dummy-data";

// --- DUMMY CATEGORIES ---
const CATEGORIES = [
  { id: 'food', name: 'Food', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
  { id: 'transport', name: 'Transport', icon: Car, color: 'bg-blue-100 text-blue-600' },
  { id: 'entertainment', name: 'Entertainment', icon: Ticket, color: 'bg-purple-100 text-purple-600' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600' },
];

export interface ActivityFormData {
  title: string;
  amount: number;
  category: string;
  payerId: string;
  splitAmongIds: string[];
}

interface ActivityFormProps {
  initialData?: any;
  eventParticipants: Contact[]; // WAJIB: Kita butuh list orang yg ada di event ini
  isEditing?: boolean;
  onSubmit: (data: ActivityFormData) => void;
}

export default function ActivityForm({ 
  initialData, 
  eventParticipants = [], // Default kosong kalo loading
  isEditing = false, 
  onSubmit 
}: ActivityFormProps) {
  const router = useRouter();

  // --- STATE ---
  const [title, setTitle] = useState(initialData?.title || "");
  const [category, setCategory] = useState(initialData?.category || "food");
  
  // Default Payer: Orang pertama di list (atau user sendiri)
  const [payerId, setPayerId] = useState(initialData?.payerId || eventParticipants[0]?.id || "");
  
  // Default Split: Semua orang kena split
  const [splitAmongIds, setSplitAmongIds] = useState<string[]>(
      initialData?.splitAmongIds || eventParticipants.map(p => p.id)
  );

  // --- HANDLERS ---
  const handleToggleSplit = (id: string) => {
    if (splitAmongIds.includes(id)) {
      // Ga boleh kosong, minimal 1 orang
      if (splitAmongIds.length > 1) {
        setSplitAmongIds(prev => prev.filter(pid => pid !== id));
      }
    } else {
      setSplitAmongIds(prev => [...prev, id]);
    }
  };

  const handleSubmit = () => {
    if (!title) {
        alert("Please fill in Title");
        return;
    }

    onSubmit({
        title,
        amount: 0, // Amount will be calculated from items
        category,
        payerId,
        splitAmongIds
    });
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
        <h1 className="text-xl font-bold font-display text-ui-black">
            {isEditing ? "Edit Activity" : "New Activity"}
        </h1>
      </div>

      {/* --- FORM SCROLLABLE --- */}
      <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar">
         <div className="max-w-md mx-auto flex flex-col gap-8">
            
            {/* 1. TITLE (Big Input) */}
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest">Activity Title</label>
               <input 
                 type="text" 
                 placeholder="e.g. Dinner at McD"
                 className="w-full text-2xl font-bold text-ui-black placeholder:text-ui-dark-grey/50 outline-none bg-transparent border-b-2 border-ui-accent-yellow py-2 transition-colors"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 autoFocus={!isEditing}
               />
            </div>

            {/* 2. CATEGORY (Horizontal Scroll) */}
            <div className="flex flex-col gap-3">
               <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest">Category</label>
               <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                  {CATEGORIES.map((cat) => {
                      const isSelected = category === cat.id;
                      return (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all border ${isSelected ? 'bg-ui-black text-white border-ui-black shadow-lg' : 'bg-ui-grey/5 border-transparent text-ui-dark-grey'}`}
                        >
                            <div className={`p-1 rounded-full ${isSelected ? 'bg-white/20' : cat.color}`}>
                                <cat.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold whitespace-nowrap">{cat.name}</span>
                        </button>
                      )
                  })}
               </div>
            </div>

            {/* 3. PAYER (Who Paid?) */}
            <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest flex items-center gap-2">
                        <Wallet className="w-3 h-3" /> Who Paid?
                    </label>
               </div>
               
               <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                   {eventParticipants.map((participant) => {
                       const isSelected = payerId === participant.id;
                       return (
                           <div 
                                key={participant.id} 
                                onClick={() => setPayerId(participant.id)}
                                className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${isSelected ? 'scale-105 opacity-100' : 'opacity-50 hover:opacity-100'}`}
                           >
                               <div className={`w-14 h-14 rounded-full p-1 border-2 ${isSelected ? 'border-ui-accent-yellow' : 'border-transparent'}`}>
                                   <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                                       <img src={participant.avatarName} className="w-full h-full object-cover" />
                                   </div>
                               </div>
                               <span className={`text-xs font-bold text-center w-16 truncate ${isSelected ? 'text-ui-black' : 'text-ui-dark-grey'}`}>
                                   {participant.name}
                               </span>
                           </div>
                       )
                   })}
               </div>
            </div>

            {/* 4. SPLIT (For Whom?) */}
            <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest">Split Among</label>
                    <span className="text-xs font-bold bg-ui-accent-yellow/20 px-2 py-1 rounded-md text-ui-dark-grey">
                        {splitAmongIds.length} People
                    </span>
               </div>
               
               <div className="flex flex-col gap-2">
                   {eventParticipants.map((participant) => {
                       const isSelected = splitAmongIds.includes(participant.id);
                       return (
                           <div 
                                key={participant.id}
                                onClick={() => handleToggleSplit(participant.id)} 
                                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-ui-white border-ui-accent-yellow shadow-sm' : 'bg-ui-grey/5 border-transparent'}`}
                           >
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                                       <img src={participant.avatarName} className="w-full h-full object-cover" />
                                   </div>
                                   <span className="font-bold text-sm text-ui-black">{participant.name}</span>
                               </div>
                               
                               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-ui-accent-yellow border-ui-accent-yellow' : 'border-ui-grey/30'}`}>
                                   {isSelected && <Check className="w-4 h-4 text-ui-black" />}
                               </div>
                           </div>
                       )
                   })}
               </div>
            </div>

         </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="p-5 bg-ui-white border-t border-ui-grey/10">
         <button 
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl bg-ui-black text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-all hover:opacity-90"
         >
            {isEditing ? "Save Changes" : "Add Activity"}
         </button>
      </div>

    </div>
  );
}