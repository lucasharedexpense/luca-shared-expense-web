"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Check, X, Pencil, Users } from "lucide-react";
import { MOCK_DATABASE, Item } from "@/lib/dummy-data"; // Pastikan path import ini benar
import { Wave } from "@/components/ui/Icons";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

// --- HELPER: FORMAT CURRENCY ---
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

// --- COMPONENT: DUAL INPUT (Sync % & Rp) ---
interface DualInputProps {
    baseAmount: number;
    amountValue: number;
    percentValue: number;
    onUpdate: (amount: number, percent: number) => void;
}

const DualInput = ({ baseAmount, amountValue, percentValue, onUpdate }: DualInputProps) => {
    const handlePercentChange = (val: string) => {
        const p = parseFloat(val) || 0;
        const a = baseAmount * (p / 100);
        onUpdate(a, p);
    };
    const handleAmountChange = (val: string) => {
        const cleanVal = val.replace(/\D/g, ""); 
        const a = parseFloat(cleanVal) || 0;
        const p = baseAmount > 0 ? (a / baseAmount) * 100 : 0;
        onUpdate(a, p);
    };

    return (
        <div className="flex gap-2 items-center">
            <div className="relative w-14">
                <input 
                    type="number"
                    value={percentValue > 0 ? parseFloat(percentValue.toFixed(1)) : ""}
                    onChange={(e) => handlePercentChange(e.target.value)}
                    placeholder="0"
                    className="w-full border-b border-ui-grey/30 py-1 pr-3 px-1 text-right text-xs font-bold focus:border-ui-accent-yellow outline-none bg-transparent"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
            </div>
            <div className="relative flex-1">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Rp</span>
                <input 
                    type="text"
                    value={amountValue > 0 ? amountValue.toLocaleString("id-ID") : ""}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full border-b border-ui-grey/30 py-1 pl-5 pr-1 text-right text-xs font-bold focus:border-ui-accent-yellow outline-none bg-transparent"
                />
            </div>
        </div>
    );
};

// --- COMPONENT: PARTICIPANTS MODAL (Ambil dari Event Participants) ---
interface ParticipantsModalProps {
    isOpen: boolean;
    onClose: () => void;
    allEventParticipants: { name: string; avatarName: string }[]; // Data murni dari DB Event
    selectedNames: string[];
    onSave: (names: string[]) => void;
}

const ParticipantsModal = ({ isOpen, onClose, allEventParticipants, selectedNames, onSave }: ParticipantsModalProps) => {
    // State is initialized from props. Parent passes key={String(isOpen)+selectedNames.join()}
    // to remount this component when it opens, avoiding setState-in-effect.
    const [tempSelected, setTempSelected] = useState<string[]>(selectedNames);

    if (!isOpen) return null;

    const toggle = (name: string) => {
        if (tempSelected.includes(name)) {
            setTempSelected(prev => prev.filter(n => n !== name));
        } else {
            setTempSelected(prev => [...prev, name]);
        }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h3 className="font-bold text-lg">Who joined?</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                
                <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto no-scrollbar">
                    {allEventParticipants.map((p, idx) => {
                        const isSelected = tempSelected.includes(p.name);
                        return (
                            <div 
                                key={idx} 
                                onClick={() => toggle(p.name)}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-ui-accent-yellow bg-ui-accent-yellow/5' : 'border-gray-100 hover:bg-gray-50'}`}
                            >
                                <div className="relative shrink-0">
                                    <Image 
                                        src={p.avatarName.startsWith("http") ? p.avatarName : `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} 
                                        alt={p.name}
                                        width={40} height={40}
                                        className="w-10 h-10 rounded-full object-cover bg-gray-200"
                                        unoptimized
                                    />
                                    {isSelected && <div className="absolute -bottom-1 -right-1 bg-ui-accent-yellow rounded-full p-0.5 border-2 border-white"><Check className="w-3 h-3 text-black" /></div>}
                                </div>
                                <span className={`flex-1 font-bold text-sm ${isSelected ? 'text-black' : 'text-gray-500'}`}>{p.name}</span>
                            </div>
                        );
                    })}
                </div>

                <button 
                    onClick={() => { onSave(tempSelected); onClose(); }}
                    className="w-full py-3 bg-ui-accent-yellow rounded-xl font-bold text-ui-black mt-2"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

// --- COMPONENT: ITEM MODAL (Ambil dari Selected Activity Participants) ---
interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Item) => void;
    initialItem: Item;
    activityParticipants: string[]; // List nama orang yg sudah terpilih di activity
    getAvatarByName: (name: string) => string;
}

const ItemModal = ({ isOpen, onClose, onSave, initialItem, activityParticipants, getAvatarByName }: ItemModalProps) => {
    // State is initialized from props. Parent passes key={editingItemIndex ?? 'new'}
    // to remount this component when switching items, avoiding setState-in-effect.
    const [formData, setFormData] = useState<Item>(initialItem);

    if (!isOpen) return null;

    const toggleMember = (name: string) => {
        const current = [...formData.memberNames];
        if (current.includes(name)) {
            if (current.length > 1) setFormData({ ...formData, memberNames: current.filter(m => m !== name) });
        } else {
            setFormData({ ...formData, memberNames: [...current, name] });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h3 className="font-bold text-lg">Menu Item</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Item Name</label>
                        <input 
                            value={formData.itemName}
                            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                            className="w-full border-b border-gray-200 py-2 font-bold text-lg outline-none focus:border-ui-accent-yellow"
                            placeholder="e.g. Nasi Goreng"
                            autoFocus
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Price</label>
                            <div className="relative">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                                <input 
                                    type="number"
                                    value={formData.price || ""}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                    className="w-full border-b border-gray-200 py-2 pl-6 font-bold outline-none focus:border-ui-accent-yellow"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="w-20">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Qty</label>
                            <input 
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })}
                                className="w-full border-b border-gray-200 py-2 text-center font-bold outline-none focus:border-ui-accent-yellow"
                            />
                        </div>
                    </div>

                    {/* Participant Selector (Dynamic from Activity Participants) */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Shared By</label>
                        <div className="flex flex-wrap gap-2">
                            {activityParticipants.map((name, idx) => {
                                const isSelected = formData.memberNames.includes(name);
                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => toggleMember(name)}
                                        className={`relative w-10 h-10 rounded-full border-2 transition-all overflow-hidden ${isSelected ? 'border-ui-accent-yellow opacity-100' : 'border-transparent opacity-30 grayscale'}`}
                                    >
                                        <Image src={getAvatarByName(name)} alt={name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => onSave(formData)}
                    className="w-full py-3 bg-ui-accent-yellow rounded-xl font-bold text-ui-black mt-2"
                >
                    Save Item
                </button>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
export default function ActivityEditPage() {
  const router = useRouter();
  const params = useParams();
  
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const activityId = Array.isArray(params?.activityid) ? params.activityid[0] : params?.activityid;

  // 1. LOAD DATA DARI DB
  const eventData = MOCK_DATABASE.events.find((e) => e.id === eventId);
  const originalActivity = eventData?.activities.find((a) => a.id === activityId);

  // States initialized directly from originalActivity to avoid setState-in-effect
  const [title, setTitle] = useState(() => originalActivity?.title ?? "");
  const [payerName, setPayerName] = useState(() => originalActivity?.payerName ?? "");
  const [items, setItems] = useState<Item[]>(() =>
    originalActivity ? JSON.parse(JSON.stringify(originalActivity.items)) : []
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(() =>
    originalActivity?.participants.map(p => p.name) ?? []
  );
  const [taxPercent, setTaxPercent] = useState(() => originalActivity?.items[0]?.taxPercentage ?? 10);
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0);
  const [globalDiscountAmount, setGlobalDiscountAmount] = useState(0);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [modalInitialItem, setModalInitialItem] = useState<Item | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; index: number | null; name: string }>({
    isOpen: false,
    index: null,
    name: ""
  });

  // Calculations
  const subTotal = useMemo(() =>
    items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  , [items]);

  // Derive taxAmount directly — no setState in effect needed
  const taxAmount = useMemo(() => {
    const taxableAmount = Math.max(0, subTotal - globalDiscountAmount);
    return taxableAmount * (taxPercent / 100);
  }, [subTotal, taxPercent, globalDiscountAmount]);

  const grandTotal = subTotal + taxAmount - globalDiscountAmount;

  // Helper Avatar (Lookup ke Event Data)
  const getAvatarByName = (name: string) => {
    const p = eventData?.participants.find(p => p.name === name);
    const avatar = p?.avatarName;

    // 1. Cek apakah ada avatar & apakah formatnya URL
    if (avatar && avatar.startsWith("http")) {
        return avatar;
    }
    
    // 2. Fallback: Kalau "avatar_1" atau null, generate Dicebear pake seed name
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
  };

  // Handlers
  const handleDeleteItem = (index: number) => {
      // Validasi: Jangan hapus kalau sisa 1 item (opsional)
      if (items.length <= 1) {
          alert("Minimal harus ada satu item.");
          return;
      }

      const itemToDelete = items[index];
      setDeleteModal({
          isOpen: true,
          index: index,
          name: itemToDelete.itemName || "Item ini"
      });
  };

  const confirmDelete = () => {
      if (deleteModal.index !== null) {
          setItems(prev => prev.filter((_, i) => i !== deleteModal.index));
      }
      setDeleteModal({ isOpen: false, index: null, name: "" });
  };

  const openAddModal = () => {
      setEditingItemIndex(null);
      setModalInitialItem({
          discountAmount: 0,
          itemName: "",
          // Default user pertama: Payer atau orang pertama di list activity
          memberNames: [payerName || selectedParticipants[0] || ""],
          price: 0,
          quantity: 1,
          taxPercentage: taxPercent,
          timestamp: Date.now()
      });
      setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
      setEditingItemIndex(index);
      setModalInitialItem(items[index]);
      setIsModalOpen(true);
  };

  const handleModalSave = (item: Item) => {
      if (editingItemIndex !== null) {
          const newItems = [...items];
          newItems[editingItemIndex] = item;
          setItems(newItems);
      } else {
          setItems([...items, item]);
      }
      setIsModalOpen(false);
  };

  const handleSave = () => {
      // Logic save ke DB (di sini cuma console log)
      console.log("Saving...", { title, items, grandTotal, selectedParticipants });
      router.back();
  };

  const [isPayerOpen, setIsPayerOpen] = useState(false);

  if (!originalActivity) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full w-full bg-ui-background">
      
      {/* HEADER */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
             <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-display">Edit Activity</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-32 no-scrollbar">
        <div className="relative drop-shadow-xl filter">
            <div className="bg-ui-white rounded-t-3xl p-6 pb-2">
                
                {/* 1. PARTICIPANTS (Edit who joined this activity) */}
                <div className="flex items-center justify-between mb-6 bg-ui-grey p-2 rounded-2xl border border-gray-100">
                     <div className="flex -space-x-2 overflow-hidden px-2 py-1">
                        {/* Map dari state selectedParticipants (bukan dummy) */}
                        {selectedParticipants.map((name, idx) => (
                            <div key={idx} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 overflow-hidden">
                                <Image src={getAvatarByName(name)} alt={name} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                            </div>
                        ))}
                     </div>
                     <button 
                        onClick={() => setIsParticipantModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-ui-white border border-gray-200 rounded-xl text-[10px] font-bold text-ui-black hover:bg-gray-100 transition-colors shadow-sm"
                     >
                        <Users className="w-3 h-3" />
                        Edit People
                     </button>
                </div>

                {/* 2. TITLE & PAYER INPUT */}
                <div className="flex flex-col gap-3 mb-4">
                    <div className="relative">
                         <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Title</label>
                         <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border-b-2 py-1 text-lg font-bold text-center border-ui-accent-yellow outline-none bg-transparent"
                         />
                         <Pencil className="w-4 h-4 text-gray-500 absolute right-0 bottom-2" />
                    </div>
                    <div className="relative flex text-left align-middle justify-center">
                        {/* 1. TRIGGER BUTTON (Tampilan saat ini) */}
                        <button 
                            onClick={() => setIsPayerOpen(!isPayerOpen)}
                            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full pl-1 pr-3 py-1 transition-all"
                        >
                            {/* Avatar Kecil */}
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-white shadow-sm">
                                <Image src={getAvatarByName(payerName)} alt="Payer" width={20} height={20} className="w-full h-full object-cover" unoptimized />
                            </div>
                            
                            {/* Nama Payer */}
                            <span className="text-xs font-bold text-ui-black">
                                {payerName}
                            </span>
                            
                            {/* Chevron Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${isPayerOpen ? 'rotate-180' : ''}`}>
                                <path d="m6 9 6 6 6-6"/>
                            </svg>
                        </button>

                        {/* 2. DROPDOWN LIST (Muncul pas diklik) */}
                        {isPayerOpen && (
                            <>
                                {/* Backdrop invisible buat nutup pas klik luar */}
                                <div 
                                    className="fixed inset-0 z-40 cursor-default" 
                                    onClick={() => setIsPayerOpen(false)}
                                />
                                
                                {/* The List */}
                                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-1 animate-in fade-in zoom-in-95 duration-200 origin-top">
                                    <div className="text-[10px] font-bold text-gray-400 px-3 py-2 uppercase tracking-wider">
                                        Select Payer
                                    </div>
                                    
                                    <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto no-scrollbar">
                                        {selectedParticipants.map((name) => (
                                            <button
                                                key={name}
                                                onClick={() => {
                                                    setPayerName(name);
                                                    setIsPayerOpen(false);
                                                }}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${payerName === name ? 'bg-ui-accent-yellow/10 text-black' : 'hover:bg-gray-50 text-gray-600'}`}
                                            >
                                                <Image src={getAvatarByName(name)} alt={name} width={24} height={24} className="w-6 h-6 rounded-full object-cover bg-gray-100" unoptimized />
                                                <span className={`text-xs ${payerName === name ? 'font-bold' : 'font-medium'}`}>
                                                    {name}
                                                </span>
                                                
                                                {/* Checkmark kalau aktif */}
                                                {payerName === name && (
                                                    <Check className="w-3 h-3 text-ui-black ml-auto" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex justify-center align-middle mb-4">
                    <p className="text-xs text-ui-dark-grey">Click a menu to edit</p>
                </div>

                {/* 3. ITEMS LIST */}
                <div className="flex flex-col gap-6 mb-4">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-2 group">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3 items-start flex-1 cursor-pointer" onClick={() => openEditModal(idx)}>
                                    <span className="text-sm text-ui-dark-grey pt-0.5 opacity-60">{item.quantity}x</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-ui-black leading-snug">{item.itemName}</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            {item.memberNames.map((name, i) => (
                                                <div key={i} className="w-4 h-4 rounded-full bg-gray-100 border border-white overflow-hidden">
                                                    <Image src={getAvatarByName(name)} alt={name} width={16} height={16} className="w-full h-full object-cover" unoptimized />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-ui-black">
                                        {formatCurrency(item.price * item.quantity)}
                                    </span>
                                    <button onClick={() => handleDeleteItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ADD BUTTON */}
                <div className="flex justify-center mb-6">
                    <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-ui-grey rounded-full text-xs font-bold text-ui-dark-grey hover:bg-ui-accent-yellow/20 hover:text-ui-black transition-colors">
                        <Plus className="w-3 h-3" /> Add Menu Item
                    </button>
                </div>

                {/* DIVIDER */}
                <div className="w-full border-b-2 border-dashed border-ui-dark-grey mb-6 relative">
                     <div className="absolute -left-8 -top-3 w-6 h-6 rounded-full bg-ui-grey/10"></div>
                     <div className="absolute -right-8 -top-3 w-6 h-6 rounded-full bg-ui-grey/10"></div>
                </div>

                {/* 4. TOTALS */}
                <div className="flex flex-col gap-3 pb-6">
                    <div className="flex justify-between items-center text-xs text-ui-dark-grey font-medium">
                        <span>Subtotal</span>
                        <span className="font-bold text-ui-black">
                            {formatCurrency(subTotal)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-ui-dark-grey font-medium">Discount</span>
                        <div className="w-36">
                             <DualInput 
                                baseAmount={subTotal}
                                percentValue={globalDiscountPercent}
                                amountValue={globalDiscountAmount}
                                onUpdate={(amt, pct) => { setGlobalDiscountAmount(amt); setGlobalDiscountPercent(pct); }}
                             />
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-ui-dark-grey font-medium">Tax</span>
                        <div className="w-36">
                             <DualInput 
                                baseAmount={Math.max(0, subTotal - globalDiscountAmount)}
                                percentValue={taxPercent}
                                amountValue={taxAmount}
                                onUpdate={(_amt, pct) => { setTaxPercent(pct); }}
                             />
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold text-ui-black mt-2 pt-2 border-t border-ui-grey/10">
                        <span>Total Bill</span>
                        <span className="">
                            {formatCurrency(grandTotal)}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="text-ui-white -mt-px">
                <Wave className="w-full rotate-180 fill-current" />
            </div>
        </div>
      </div>

      {/* FLOATING SAVE BUTTON */}
      <div className="fixed bottom-8 right-5 z-20">
          <button onClick={handleSave} className="w-16 h-16 bg-ui-accent-yellow text-ui-black rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
             <Check className="w-8 h-8" strokeWidth={3} />
          </button>
      </div>

      {/* MODALS */}
      {isModalOpen && modalInitialItem && (
        <ItemModal 
            key={editingItemIndex ?? 'new'}
            isOpen={isModalOpen}
            initialItem={modalInitialItem}
            activityParticipants={selectedParticipants}
            getAvatarByName={getAvatarByName}
            onClose={() => setIsModalOpen(false)}
            onSave={handleModalSave}
        />
      )}

      {isParticipantModalOpen && (
        <ParticipantsModal 
            key={selectedParticipants.join(",")}
            isOpen={isParticipantModalOpen}
            onClose={() => setIsParticipantModalOpen(false)}
            allEventParticipants={eventData?.participants || []}
            selectedNames={selectedParticipants}
            onSave={setSelectedParticipants}
        />
      )}

      <DeleteConfirmModal 
         isOpen={deleteModal.isOpen}
         title="Hapus Menu?"
         name={deleteModal.name}
         onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
         onConfirm={confirmDelete}
      />

    </div>
  );
}