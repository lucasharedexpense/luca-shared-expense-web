"use client";

import React, { useState, useEffect, useMemo } from "react";
import EventList from "@/components/features/EventList";
import { Item } from "@/lib/dummy-data";
import NewActivityModal from "@/components/features/NewActivityModal";
import { useAuth } from "@/lib/useAuth";
import { getEventsWithActivities } from "@/lib/firestore";
import { 
    ChevronRight, X, ArrowLeft, Receipt, UserCircle, Plus, Edit2, 
    Trash2, Check, Save, RotateCcw, 
    Calculator
} from "lucide-react";
import SummaryModal from "@/components/features/SummaryModel";

// --- HELPER COMPONENTS ---

// 1. DUAL INPUT (Untuk Tax & Discount)
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
        <div className="flex gap-2 items-center bg-gray-800 rounded-lg p-1">
            <div className="relative w-12">
                <input 
                    type="number"
                    value={percentValue > 0 ? parseFloat(percentValue.toFixed(1)) : ""}
                    onChange={(e) => handlePercentChange(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-right text-xs font-bold text-white outline-none pr-3"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
            </div>
            <div className="w-px h-4 bg-gray-600"></div>
            <div className="relative flex-1">
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Rp</span>
                <input 
                    type="text"
                    value={amountValue > 0 ? amountValue.toLocaleString("id-ID") : ""}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-right text-xs font-bold text-white outline-none pl-4"
                />
            </div>
        </div>
    );
};

// 2. ITEM MODAL (Untuk Tambah/Edit Item di dalam Activity)
const ItemModal = ({ isOpen, onClose, onSave, initialItem, activityParticipants }: any) => {
    const [formData, setFormData] = useState<Item>(initialItem);

    useEffect(() => {
        if (isOpen) setFormData(initialItem);
    }, [isOpen, initialItem]);

    if (!isOpen) return null;

    const toggleMember = (name: string) => {
        const current = [...formData.memberNames];
        if (current.includes(name)) {
            if (current.length > 1) setFormData({ ...formData, memberNames: current.filter(m => m !== name) });
        } else {
            setFormData({ ...formData, memberNames: [...current, name] });
        }
    };

    // Helper Avatar Url
    const getAvatarUrl = (name: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h3 className="font-bold text-lg text-ui-black">Manage Item</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Item Name</label>
                        <input 
                            value={formData.itemName}
                            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                            className="w-full border-b border-gray-200 py-2 font-bold text-lg text-ui-black outline-none focus:border-ui-accent-yellow"
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
                                    className="w-full border-b border-gray-200 py-2 pl-6 font-bold text-ui-black outline-none focus:border-ui-accent-yellow"
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
                                className="w-full border-b border-gray-200 py-2 text-center font-bold text-ui-black outline-none focus:border-ui-accent-yellow"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Shared By</label>
                        <div className="flex flex-wrap gap-2">
                            {activityParticipants.map((name: string, idx: number) => {
                                const isSelected = formData.memberNames.includes(name);
                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => toggleMember(name)}
                                        className={`relative w-10 h-10 rounded-full border-2 transition-all overflow-hidden ${isSelected ? 'border-ui-accent-yellow opacity-100' : 'border-transparent opacity-30 grayscale'}`}
                                    >
                                        <img src={getAvatarUrl(name)} className="w-full h-full object-cover" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => onSave(formData)}
                    className="w-full py-3 bg-ui-accent-yellow rounded-xl font-bold text-ui-black mt-2 shadow-lg shadow-ui-accent-yellow/20"
                >
                    Save Item
                </button>
            </div>
        </div>
    );
};


// --- COLUMN 2: EVENT DETAIL ---
const EventDetailColumn = ({ 
    eventId, activeActivityId, onActivityClick, onClose, 
    onAddClick, onEditActivity, onSummaryClick, onDeleteActivity, events
}: any) => {
    const event = events.find((e: any) => e.id === eventId);
    if (!event) return null;

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
            
            {/* 1. HEADER (Bersih, Tanpa Tombol Settlement Kecil) */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-start bg-gray-50/30">
                <div>
                    <h2 className="text-2xl font-bold font-display text-ui-black line-clamp-1">{event.title}</h2>
                    <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Activity List</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                    <X className="w-5 h-5 text-gray-400 group-hover:text-red-500"/>
                </button>
            </div>

            {/* 2. LIST CONTENT (Scrollable) */}
            {/* Tambahkan 'pb-28' agar konten terbawah tidak ketutup tombol floating */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-28">
                
                {/* Tombol Add New Activity (Tetap di atas sebagai input) */}
                <button 
                    onClick={onAddClick}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-wide hover:border-ui-accent-yellow hover:text-ui-black hover:bg-ui-accent-yellow/5 transition-all group"
                >
                    <div className="p-1 rounded-full bg-gray-100 group-hover:bg-ui-accent-yellow transition-colors">
                        <Plus className="w-3.5 h-3.5 text-gray-500 group-hover:text-ui-black" />
                    </div>
                    Add New Activity
                </button>

                {/* List Activities */}
                {event.activities.map((act: any) => {
                    const isActive = activeActivityId === act.id;
                    return (
                        <div 
                            key={act.id} 
                            onClick={() => onActivityClick(act.id)}
                            className={`
                                flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 group
                                ${isActive 
                                    ? "bg-ui-accent-yellow shadow-md border-ui-accent-yellow transform scale-[1.02]" 
                                    : "bg-white border-gray-100 hover:border-ui-accent-yellow/50 hover:bg-ui-accent-yellow/5"
                                }
                            `}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-white text-ui-black" : "bg-gray-50 text-gray-400"}`}>
                                <Receipt className="w-5 h-5" strokeWidth={2.5} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-bold truncate ${isActive ? "text-ui-black" : "text-ui-black"}`}>
                                    {act.title}
                                </h4>
                                <div className={`flex items-center gap-1 text-xs mt-0.5 ${isActive ? "text-ui-black/70" : "text-gray-400"}`}>
                                    <UserCircle className="w-3 h-3" />
                                    <span className="truncate">Paid by {act.payerName}</span>
                                </div>
                            </div>

                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    onEditActivity(act); 
                                }}
                                className={`
                                    p-2 rounded-full transition-all opacity-0 group-hover:opacity-100
                                    ${isActive 
                                        ? "bg-white/20 text-ui-black hover:bg-white" 
                                        : "bg-gray-100 text-gray-500 hover:bg-ui-accent-yellow hover:text-ui-black"
                                    }
                                `}
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>

                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); // Mencegah row ikut terklik
                                    onDeleteActivity(act.id); // Panggil fungsi delete
                                }}
                                className={`
                                    p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 ml-1
                                    ${isActive 
                                        ? "bg-white/20 text-ui-black hover:bg-white hover:text-red-500" 
                                        : "bg-gray-100 text-gray-500 hover:bg-ui-accent-red hover:text-ui-white"
                                    }
                                `}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <ChevronRight className={`w-5 h-5 shrink-0 ${isActive ? "text-ui-black" : "text-gray-300"}`} />
                        </div>
                    )
                })}
            </div>

            {/* 3. BIG FLOATING ACTION BUTTON (Summary) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-white via-white to-transparent pt-12">
                <button 
                    onClick={onSummaryClick}
                    className="w-full py-4 bg-ui-accent-yellow text-ui-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all group"
                >
                    <div className="p-1.5 bg-ui-white rounded-full text-ui-black group-hover:rotate-12 transition-transform">
                        <Calculator className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-lg">View Settlement</span>
                </button>
            </div>

        </div>
    );
};

// --- COLUMN 3: ACTIVITY DETAIL (NOW WITH EDIT LOGIC) ---
const ActivityDetailColumn = ({ eventId, activityId, onClose, onUpdateActivity, events }: any) => {
    const event = events.find((e: any) => e.id === eventId);
    const activity = event?.activities.find((a: any) => a.id === activityId);

    // --- STATE EDIT MODE ---
    const [isEditing, setIsEditing] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    
    // Tax & Discount States
    const [taxPercent, setTaxPercent] = useState(0);
    const [taxAmount, setTaxAmount] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountPercent, setDiscountPercent] = useState(0);

    // Modal Item States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialItem, setModalInitialItem] = useState<Item | null>(null);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    // 
    // Sync state when activity changes
    useEffect(() => {
        if (activity) {
            setIsEditing(false); // Default view mode
            setItems(JSON.parse(JSON.stringify(activity.items)));
            // Reset Calculations (Asumsi data dummy belum nyimpen tax/discount global activity, kita default 0)
            setTaxPercent(10); // Default PPN 10% biar keliatan
            setDiscountAmount(0);
        }
    }, [activity]);

    // Calculations
    const subTotal = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);
    
    useEffect(() => {
        const taxable = Math.max(0, subTotal - discountAmount);
        setTaxAmount(taxable * (taxPercent / 100));
    }, [subTotal, taxPercent, discountAmount]);

    const grandTotal = subTotal + taxAmount - discountAmount;

    // Handlers
    const handleSave = () => {
        // Panggil fungsi parent untuk update DB
        onUpdateActivity({
            ...activity,
            items: items,
            // Simpan logic tax/discount ke DB kalau strukturnya mendukung (di sini kita mock aja)
        });
        setIsEditing(false);
    };

    const handleAddItem = () => {
        setEditingItemIndex(null);
        
        // --- FIX LOGIC DISINI ---
        // Ambil participant pertama
        const firstParticipant = activity?.participants[0];
        
        // Cek tipenya: kalau object ambil .name, kalau string ambil langsung
        const defaultMemberName = typeof firstParticipant === 'object' 
            ? firstParticipant?.name 
            : firstParticipant;

        setModalInitialItem({
            itemName: "", 
            quantity: 1, 
            price: 0,
            // Gunakan defaultMemberName yang sudah pasti string
            memberNames: [activity?.payerName || defaultMemberName || ""],
            discountAmount: 0, 
            taxPercentage: 0, 
            timestamp: Date.now()
        });
        setIsModalOpen(true);
    };

    const handleEditItem = (idx: number) => {
        setEditingItemIndex(idx);
        setModalInitialItem(items[idx]);
        setIsModalOpen(true);
    };

    const handleDeleteItem = (idx: number) => {
        if(confirm("Delete item?")) {
            setItems(prev => prev.filter((_, i) => i !== idx));
        }
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

    if (!activity) return null;

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl xl:shadow-sm border border-gray-100 overflow-hidden relative">
            
            {/* Header */}
            <div className={`p-6 border-b border-gray-50 flex items-center gap-3 transition-colors ${isEditing ? 'bg-ui-accent-yellow text-ui-black' : 'bg-ui-accent-yellow/10'}`}>
                <button onClick={onClose} className="xl:hidden p-1 hover:bg-white/50 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-ui-black" />
                </button>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-ui-black line-clamp-1">{activity.title}</h3>
                    <p className={`text-[10px] uppercase font-bold tracking-widest ${isEditing ? 'text-ui-black/60' : 'text-ui-black/50'}`}>
                        {isEditing ? "Editing Mode" : "Detail Items"}
                    </p>
                </div>
                {!isEditing && (
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                        <X className="w-5 h-5 text-ui-black"/>
                    </button>
                )}
            </div>
            
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-0 pb-40">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="py-3 px-6">Item</th>
                            <th className="py-3 px-2 text-center">Qty</th>
                            <th className="py-3 px-6 text-right">Price</th>
                            {isEditing && <th className="w-10"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {items.map((item, idx) => (
                            <tr 
                                key={idx} 
                                className={`transition-colors ${isEditing ? 'hover:bg-yellow-50 cursor-pointer' : 'hover:bg-gray-50'}`}
                                onClick={() => isEditing && handleEditItem(idx)}
                            >
                                <td className="py-4 px-6 font-medium text-ui-black">
                                    {item.itemName}
                                    <div className="flex -space-x-1 mt-1">
                                        {item.memberNames.map((m, i) => (
                                            <div key={i} className="w-4 h-4 rounded-full bg-gray-200 border border-white overflow-hidden">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m}`} className="w-full h-full object-cover"/>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="py-4 px-2 text-center">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">
                                        x{item.quantity}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-right font-mono text-gray-600">
                                    {new Intl.NumberFormat("id-ID").format(item.price * item.quantity)}
                                </td>
                                {isEditing && (
                                    <td className="pr-4 text-center">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteItem(idx); }}
                                            className="p-1.5 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {isEditing && (
                    <div className="p-4 flex justify-center border-t border-gray-50">
                        <button onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-ui-black rounded-full text-xs font-bold transition-colors">
                            <Plus className="w-3 h-3" /> Add Item
                        </button>
                    </div>
                )}
            </div>
            
            {/* Footer Calculation */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-900 text-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                {/* Expanded Footer for Edit Mode */}
                {isEditing && (
                    <div className="px-6 pt-4 pb-2 border-b border-gray-700 space-y-2 animate-in slide-in-from-bottom-5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Subtotal</span>
                            <span className="font-mono">{new Intl.NumberFormat("id-ID").format(subTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Discount</span>
                            <DualInput 
                                baseAmount={subTotal} 
                                percentValue={discountPercent} 
                                amountValue={discountAmount} 
                                onUpdate={(amt, pct) => { setDiscountAmount(amt); setDiscountPercent(pct); }} 
                            />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Tax</span>
                            <DualInput 
                                baseAmount={Math.max(0, subTotal - discountAmount)} 
                                percentValue={taxPercent} 
                                amountValue={taxAmount} 
                                onUpdate={(amt, pct) => { setTaxAmount(amt); setTaxPercent(pct); }} 
                            />
                        </div>
                    </div>
                )}

                <div className="p-6 flex justify-between items-center">
                    <div>
                        <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Total Amount</span>
                        <span className="text-2xl font-bold font-mono text-ui-accent-yellow">
                            Rp {new Intl.NumberFormat("id-ID").format(grandTotal)}
                        </span>
                    </div>
                    
                    {isEditing ? (
                        <div className="flex gap-2">
                            <button onClick={() => { setIsEditing(false); setItems(JSON.parse(JSON.stringify(activity.items))); }} className="p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors">
                                <RotateCcw className="w-5 h-5 text-gray-300" />
                            </button>
                            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-ui-accent-yellow text-ui-black rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20">
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white border border-gray-600 rounded-xl text-xs font-bold hover:bg-gray-700 transition-all">
                            <Edit2 className="w-4 h-4" /> Edit
                        </button>
                    )}
                </div>
            </div>

            {/* 
                [Image of Modal UI Design]
            */}
            {/* Modal di render disini biar ada di atas semua kolom */}
            {isModalOpen && modalInitialItem && (
                <ItemModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)}
                    initialItem={modalInitialItem}
                    onSave={handleModalSave}
                    activityParticipants={activity.participants}
                />
            )}
        </div>
    );
};


// --- MAIN LAYOUT ---
export default function DesktopDashboard() {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const { userId, loading: authLoading } = useAuth();

    // State Modal & Refresh
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

    // Fetch events from Firebase
    useEffect(() => {
        const loadEvents = async () => {
            if (authLoading) return;
            if (!userId) {
                setEvents([]);
                return;
            }
            try {
                const data = await getEventsWithActivities(userId);
                setEvents(data);
            } catch (error) {
                console.error("Error loading events:", error);
                setEvents([]);
            }
        };
        loadEvents();
    }, [userId, authLoading]);

    const activeEvent = events.find((e: any) => e.id === selectedEventId);

    const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: any) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div 
                    className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                        <Trash2 className="w-10 h-10 text-red-500" />
                    </div>
                    
                    <h3 className="text-2xl font-bold font-display text-ui-black mb-2">Delete Activity?</h3>
                    <p className="text-sm text-gray-500 mb-8 px-4 leading-relaxed">
                        Are you sure you want to delete this activity? This action cannot be undone and will affect the final settlement.
                    </p>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={onClose} 
                            className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirm} 
                            className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // --- HANDLER UPDATE DB (Simulated) ---
    const handleUpdateActivityDetail = (updatedActivity: any) => {
        if (!selectedEventId) return;
        const eventIndex = events.findIndex((e: any) => e.id === selectedEventId);
        if (eventIndex === -1) return;

        // @ts-ignore
        const actIndex = events[eventIndex].activities.findIndex((a: any) => a.id === updatedActivity.id);
        if (actIndex >= 0) {
            // @ts-ignore
            events[eventIndex].activities[actIndex] = updatedActivity;
            setRefreshKey(prev => prev + 1); // Refresh UI
        }
    };

    const handleDeleteClick = (activityId: string) => {
        setActivityToDelete(activityId);
    };

    const confirmDeleteActivity = () => {
        if (!selectedEventId || !activityToDelete) return;
        
        const eventIndex = events.findIndex((e: any) => e.id === selectedEventId);
        if (eventIndex !== -1) {
            // @ts-ignore
            events[eventIndex].activities = events[eventIndex].activities.filter((a: any) => a.id !== activityToDelete);
            
            // Tutup detail kalo yang dihapus lagi dibuka
            if (selectedActivityId === activityToDelete) {
                setSelectedActivityId(null);
            }
            setRefreshKey(prev => prev + 1);
        }
        
        // Reset State
        setActivityToDelete(null);
    };

    // ... (Handler Create/Edit Activity yg lama tetep sama)
    // Helper avatar
    const getAvatarUrl = (name: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

    const handleCreateActivity = (data: { title: string; amount: number; category: string; payerName: string; splitAmong: string[]; }) => {
        if (!selectedEventId) return;
        setIsLoading(true);
        setTimeout(() => {
            const eventIndex = events.findIndex((e: any) => e.id === selectedEventId);
            if (eventIndex === -1) return;

            const newItems = data.splitAmong.map((participantName: any) => ({
                itemName: "Shared Split", quantity: 1, price: Math.floor(data.amount / data.splitAmong.length),
                discountAmount: 0, taxPercentage: 0, timestamp: Date.now(), memberNames: [participantName] 
            }));
            const formattedParticipants = data.splitAmong.map(name => ({ name: name, avatarName: getAvatarUrl(name) }));

            if (editingActivity) {
                // Update Existing Header
                // @ts-ignore
                const activities = events[eventIndex].activities;
                const actIndex = activities.findIndex((a: any) => a.id === editingActivity.id);
                if (actIndex >= 0) {
                    activities[actIndex] = { ...activities[actIndex], title: data.title, payerName: data.payerName, participants: formattedParticipants, items: newItems, category: data.category };
                }
            } else {
                // Create New
                const newActivity = { id: Math.random().toString(36).substr(2, 9), title: data.title, payerName: data.payerName, items: newItems, participants: formattedParticipants, category: data.category };
                // @ts-ignore
                events[eventIndex].activities.unshift(newActivity);
                setSelectedActivityId(newActivity.id);
            }
            setIsLoading(false); setShowActivityModal(false); setEditingActivity(null); setRefreshKey(prev => prev + 1); 
        }, 800);
    };

    const openCreateModal = () => { setEditingActivity(null); setShowActivityModal(true); };
    const openEditModal = (activity: any) => { setEditingActivity(activity); setShowActivityModal(true); };

    return (
        <div className="flex h-[calc(100vh-64px)] w-full gap-5 p-6 relative overflow-hidden bg-gray-50/50">
            {/* KOLOM 1: LIST */}
            <div className="shrink-0 flex flex-col w-[35%] xl:w-[320px]">
                <h2 className="text-2xl font-bold font-display text-ui-black mb-6 px-1">Dashboard</h2>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex-1 overflow-hidden flex flex-col">
                    <EventList key={refreshKey} activeId={selectedEventId} onEventClick={(id) => { setSelectedEventId(id); setSelectedActivityId(null); }} events={events} />
                </div>
            </div>

            {/* KOLOM 2: EVENT DETAIL */}
            {selectedEventId ? (
                <div className="flex-1 flex flex-col pt-14 min-w-0 transition-all duration-500">
                    <EventDetailColumn 
                        key={refreshKey} 
                        eventId={selectedEventId} 
                        activeActivityId={selectedActivityId}
                        onActivityClick={setSelectedActivityId}
                        onAddClick={openCreateModal}
                        onEditActivity={openEditModal}
                        onDeleteActivity={handleDeleteClick}
                        onSummaryClick={() => setShowSummaryModal(true)}
                        onClose={() => { setSelectedEventId(null); setSelectedActivityId(null); }}
                        events={events}
                    />
                </div>
            ) : (
                <div className="flex-1 pt-14 animate-in fade-in">
                    <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white/50">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Receipt className="w-10 h-10 text-gray-300" /></div>
                        <h3 className="text-lg font-bold text-gray-500">No Event Selected</h3>
                    </div>
                </div>
            )}

            {/* KOLOM 3: ACTIVITY DETAIL (EDITABLE) */}
            {selectedEventId && selectedActivityId && (
                <>
                    <div className="xl:hidden absolute inset-0 bg-ui-black/20 backdrop-blur-[2px] z-10" onClick={() => setSelectedActivityId(null)} />
                    <div className="flex flex-col pt-14 z-20 absolute right-6 top-0 bottom-6 w-[65%] max-w-112.5 shadow-2xl xl:static xl:w-100 xl:shadow-none xl:pt-14 animate-in slide-in-from-right-20">
                        <ActivityDetailColumn 
                            eventId={selectedEventId}
                            activityId={selectedActivityId}
                            onClose={() => setSelectedActivityId(null)}
                            onUpdateActivity={handleUpdateActivityDetail}
                            events={events}
                        />
                    </div>
                </>
            )}

            {/* MODAL HEADER EDIT/CREATE */}
            {activeEvent && (
                <NewActivityModal 
                    isOpen={showActivityModal}
                    onClose={() => setShowActivityModal(false)}
                    onSubmit={handleCreateActivity}
                    // @ts-ignore
                    participants={activeEvent.participants.map((p: any) => typeof p === 'string' ? p : p.name)}
                    isLoading={isLoading}
                    initialData={editingActivity}
                />
            )}

            {activeEvent && (
                <SummaryModal 
                    isOpen={showSummaryModal}
                    onClose={() => setShowSummaryModal(false)}
                    event={activeEvent}
                />
            )}

            <DeleteConfirmationModal 
                isOpen={!!activityToDelete}
                onClose={() => setActivityToDelete(null)}
                onConfirm={confirmDeleteActivity}
            />
        </div>
    );
}