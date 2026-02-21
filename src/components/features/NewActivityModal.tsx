"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  X, Loader2, Utensils, Car, Ticket, ShoppingBag, 
  MoreHorizontal, Wallet, Check 
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  avatarName?: string;
}

// --- DUMMY CATEGORIES (Sama kayak sebelumnya) ---
const CATEGORIES = [
  { id: 'food', name: 'Food', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
  { id: 'transport', name: 'Transport', icon: Car, color: 'bg-blue-100 text-blue-600' },
  { id: 'entertainment', name: 'Entertainment', icon: Ticket, color: 'bg-purple-100 text-purple-600' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600' },
];

const getAvatarUrl = (contact: Participant) => {
    const avatarName = contact?.avatarName ?? contact?.name;
    if (avatarName?.startsWith("http")) return avatarName;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarName ?? "user"}`;
};

const getAvatarColor = (name: string) => {
    const colors = ["bg-red-100", "bg-blue-100", "bg-green-100", "bg-orange-100", "bg-purple-100", "bg-teal-100"];
    return colors[name.length % colors.length];
};

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
      title: string;
      amount: number;
      category: string;
      payerId: string;
      splitAmongIds: string[];
  }) => void;
  participants: Participant[];
  isLoading?: boolean;
  initialData?: InitialActivityData | null;
}

// ─── INITIAL DATA SHAPE ───────────────────────────────────────────────────────

interface ActivityItemData {
  price: number;
  quantity: number;
}

interface InitialActivityData {
  title: string;
  items?: ActivityItemData[];
  category?: string;
  payerId?: string;
  splitAmongIds?: string[];
}

// ─── FORM STATE ───────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  amount: string;
  category: string;
  payerId: string;
  splitAmongIds: string[];
}

function buildFormState(data: InitialActivityData | null, contacts: Participant[]): FormState {
  if (data) {
    const total = data.items?.reduce((acc, item) => acc + item.price * item.quantity, 0) ?? 0;
    return {
      title: data.title,
      amount: total > 0 ? new Intl.NumberFormat("id-ID").format(total) : "",
      category: data.category ?? "food",
      payerId: data.payerId ?? "",
      splitAmongIds: data.splitAmongIds ?? [],
    };
  }
  return {
    title: "",
    amount: "",
    category: "food",
    payerId: contacts[0]?.id ?? "",
    splitAmongIds: contacts.map((p) => p.id),
  };
}

export default function NewActivityModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  participants,
  isLoading = false,
  initialData = null
}: NewActivityModalProps) {
  
  const [form, setForm] = useState<FormState>(() => buildFormState(initialData ?? null, participants));
  // Form state is initialized from props. The parent should pass a `key` prop
  // (e.g. key={initialData?.title ?? 'new'}) to remount this component when
  // switching between create/edit modes, avoiding setState-in-effect.

  if (!isOpen) return null;

  const handleToggleSplit = (id: string) => {
    if (form.splitAmongIds.includes(id)) {
      if (form.splitAmongIds.length > 1) {
        setForm(prev => ({ ...prev, splitAmongIds: prev.splitAmongIds.filter(p => p !== id) }));
      }
    } else {
      setForm(prev => ({ ...prev, splitAmongIds: [...prev.splitAmongIds, id] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseInt(form.amount.replace(/\D/g, "")) || 0;
    if (!form.title.trim()) return;
    onSubmit({
        title: form.title,
        amount: numericAmount,
        category: form.category,
        payerId: form.payerId,
        splitAmongIds: form.splitAmongIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl p-0 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-xl text-ui-black font-display">
                {initialData ? "Edit Activity" : "New Activity"}
            </h3>
            <p className="text-xs text-gray-500">
                {initialData ? "Update expense details" : "Record an expense for this event"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            <form id="createActivityForm" onSubmit={handleSubmit} className="flex flex-col gap-8">
            
                {/* 1. TITLE */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Activity Title</label>
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="e.g. Dinner at Sushi Tei" 
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full text-xl font-bold text-ui-black placeholder:text-gray-300 outline-none border-b-2 border-gray-100 focus:border-ui-accent-yellow py-2 transition-colors bg-transparent"
                    />
                </div>

                {/* 2. CATEGORY */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {CATEGORIES.map((cat) => {
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, category: cat.id }))}
                                    className={`
                                        flex items-center gap-2 px-4 py-3 rounded-2xl transition-all border shrink-0
                                        ${form.category === cat.id 
                                            ? 'bg-ui-black text-white border-ui-black shadow-lg scale-105' 
                                            : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <div className={`p-1 rounded-full ${form.category === cat.id ? 'bg-white/20' : cat.color}`}>
                                        <cat.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold whitespace-nowrap">{cat.name}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 3. PAYER */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Wallet className="w-3 h-3" /> Paid By
                            </label>
                        </div>
                        <div className="flex flex-col gap-2 max-h-50 overflow-y-auto pr-2 no-scrollbar">
                            {participants.map((contact) => {
                                const isSelected = form.payerId === contact.id;
                                const avatarUrl = getAvatarUrl(contact);
                                const bgColor = getAvatarColor(contact.name);
                                return (
                                    <div 
                                        key={contact.id} 
                                        onClick={() => setForm(prev => ({ ...prev, payerId: contact.id }))}
                                        className={`
                                            flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all
                                            ${isSelected 
                                                ? 'bg-ui-accent-yellow/10 border-ui-accent-yellow ring-1 ring-ui-accent-yellow' 
                                                : 'bg-white border-gray-100 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-full overflow-hidden border border-gray-100 ${bgColor} shrink-0`}>
                                            <Image src={avatarUrl} alt={contact.name} width={32} height={32} className="object-cover" unoptimized />
                                        </div>
                                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-ui-black' : 'text-gray-500'}`}>
                                            {contact.name}
                                        </span>
                                        {isSelected && <Check className="w-4 h-4 text-ui-black ml-auto" />}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* 4. SPLIT */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Split Among</label>
                            <span className="text-[10px] font-bold bg-ui-accent-yellow/20 px-2 py-0.5 rounded-md text-ui-black">
                                {form.splitAmongIds.length} People
                            </span>
                        </div>
                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                            {participants.map((contact) => {
                                const isSelected = form.splitAmongIds.includes(contact.id);
                                const avatarUrl = getAvatarUrl(contact);
                                const bgColor = getAvatarColor(contact.name);
                                return (
                                    <div 
                                        key={contact.id}
                                        onClick={() => handleToggleSplit(contact.id)} 
                                        className={`
                                            flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all
                                            ${isSelected 
                                                ? 'bg-ui-accent-yellow/10 border-ui-accent-yellow' 
                                                : 'bg-white border-gray-100 opacity-60 hover:opacity-100'
                                            }
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-full overflow-hidden border border-gray-100 ${bgColor} shrink-0`}>
                                            <Image src={avatarUrl} alt={contact.name} width={32} height={32} className="object-cover" unoptimized />
                                        </div>
                                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-ui-black' : 'text-gray-500'}`}>
                                            {contact.name}
                                        </span>
                                        {isSelected && (
                                            <div className="ml-auto w-5 h-5 bg-ui-accent-yellow rounded-full flex items-center justify-center">
                                                <Check className="w-3 h-3 text-ui-black" strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </form>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex gap-3">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="flex-1 h-12 rounded-xl bg-white border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-colors text-sm"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    form="createActivityForm"
                    disabled={!form.title || isLoading}
                    className="flex-2 h-12 rounded-xl bg-ui-black text-white font-bold shadow-lg shadow-black/20 hover:opacity-90 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? "Save Changes" : "Create Activity")}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}