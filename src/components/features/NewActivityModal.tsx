"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Loader2, Utensils, Car, Ticket, ShoppingBag, 
  MoreHorizontal, Wallet, Check 
} from "lucide-react";

// --- DUMMY CATEGORIES (Sama kayak sebelumnya) ---
const CATEGORIES = [
  { id: 'food', name: 'Food', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
  { id: 'transport', name: 'Transport', icon: Car, color: 'bg-blue-100 text-blue-600' },
  { id: 'entertainment', name: 'Entertainment', icon: Ticket, color: 'bg-purple-100 text-purple-600' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600' },
];

const getAvatarUrl = (avatarName: string) => {
    if (avatarName?.startsWith("http")) return avatarName;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarName || "user"}`;
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
      payerName: string;
      splitAmong: string[];
  }) => void;
  participants: string[];
  isLoading?: boolean;
  // --- NEW PROP: INITIAL DATA ---
  initialData?: any; 
}

export default function NewActivityModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  participants,
  isLoading = false,
  initialData = null
}: NewActivityModalProps) {
  
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [payerName, setPayerName] = useState("");
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  // --- EFFECT: POPULATE FORM IF EDITING ---
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            // MODE EDIT
            setTitle(initialData.title);
            
            // Hitung total amount dari items yang ada
            const total = initialData.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
            setAmount(new Intl.NumberFormat("id-ID").format(total));
            
            // Set fields lainnya (Asumsi category default 'food' kalau ga ada di data dummy)
            setCategory(initialData.category || "food"); 
            setPayerName(initialData.payerName);
            setSplitAmong(initialData.participants); // List orang yang terlibat split
        } else {
            // MODE CREATE (RESET)
            setTitle("");
            setAmount("");
            setCategory("food");
            if (participants.length > 0) {
                setPayerName(participants[0]); 
                setSplitAmong(participants); 
            }
        }
    }
  }, [isOpen, initialData, participants]);

  if (!isOpen) return null;

  const handleToggleSplit = (name: string) => {
    if (splitAmong.includes(name)) {
      if (splitAmong.length > 1) { 
        setSplitAmong(prev => prev.filter(p => p !== name));
      }
    } else {
      setSplitAmong(prev => [...prev, name]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseInt(amount.replace(/\D/g, ""));
    
    if (!title.trim() || isNaN(numericAmount) || numericAmount <= 0) return;
    
    onSubmit({
        title,
        amount: numericAmount,
        category,
        payerName,
        splitAmong
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, "");
      if (val) {
          setAmount(new Intl.NumberFormat("id-ID").format(parseInt(val)));
      } else {
          setAmount("");
      }
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
            
                {/* 1. TITLE & AMOUNT */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Activity Title</label>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="e.g. Dinner at Sushi Tei" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-xl font-bold text-ui-black placeholder:text-gray-300 outline-none border-b-2 border-gray-100 focus:border-ui-accent-yellow py-2 transition-colors bg-transparent"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount (IDR)</label>
                        <div className="flex items-center gap-2 border-b-2 border-gray-100 focus-within:border-ui-accent-yellow transition-colors py-2">
                            <span className="text-xl font-bold text-gray-400">Rp</span>
                            <input 
                                type="text" 
                                placeholder="0"
                                value={amount}
                                onChange={handleAmountChange}
                                className="w-full text-2xl font-bold text-ui-black placeholder:text-gray-300 outline-none bg-transparent font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. CATEGORY */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {CATEGORIES.map((cat) => {
                            const isSelected = category === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-3 rounded-2xl transition-all border shrink-0
                                        ${isSelected 
                                            ? 'bg-ui-black text-white border-ui-black shadow-lg scale-105' 
                                            : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                                        }
                                    `}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 3. PAYER */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Wallet className="w-3 h-3" /> Paid By
                            </label>
                        </div>
                        <div className="flex flex-col gap-2 max-h-50 overflow-y-auto pr-2 no-scrollbar">
                            {participants.map((pName) => {
                                const isSelected = payerName === pName;
                                const avatarUrl = getAvatarUrl(pName);
                                const bgColor = getAvatarColor(pName);
                                return (
                                    <div 
                                        key={pName} 
                                        onClick={() => setPayerName(pName)}
                                        className={`
                                            flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all
                                            ${isSelected 
                                                ? 'bg-ui-accent-yellow/10 border-ui-accent-yellow ring-1 ring-ui-accent-yellow' 
                                                : 'bg-white border-gray-100 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-full overflow-hidden border border-gray-100 ${bgColor} shrink-0`}>
                                            <img src={avatarUrl} alt={pName} className="w-full h-full object-cover" />
                                        </div>
                                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-ui-black' : 'text-gray-500'}`}>
                                            {pName}
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
                                {splitAmong.length} People
                            </span>
                        </div>
                        <div className="flex flex-col gap-2 max-h-50 overflow-y-auto pr-2 no-scrollbar">
                            {participants.map((pName) => {
                                const isSelected = splitAmong.includes(pName);
                                const avatarUrl = getAvatarUrl(pName);
                                const bgColor = getAvatarColor(pName);
                                return (
                                    <div 
                                        key={pName}
                                        onClick={() => handleToggleSplit(pName)} 
                                        className={`
                                            flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all
                                            ${isSelected 
                                                ? 'bg-ui-accent-yellow/10 border-ui-accent-yellow' 
                                                : 'bg-white border-gray-100 opacity-60 hover:opacity-100'
                                            }
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-full overflow-hidden border border-gray-100 ${bgColor} shrink-0`}>
                                            <img src={avatarUrl} alt={pName} className="w-full h-full object-cover" />
                                        </div>
                                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-ui-black' : 'text-gray-500'}`}>
                                            {pName}
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
                    disabled={!title || !amount || isLoading}
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