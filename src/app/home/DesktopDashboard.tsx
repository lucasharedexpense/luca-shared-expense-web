"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import EventList from "@/components/features/EventList";
import NewActivityModal from "@/components/features/NewActivityModal";
import SearchBar from "@/components/ui/SearchBar";
import type { Contact } from "@/lib/dummy-data";
import { useAuth } from "@/lib/useAuth";
import { getEventsWithActivities, deleteActivity, createActivity, updateActivity, createItem, updateItem, deleteItem } from "@/lib/firestore";
import type { EventWithActivities, Activity as FirestoreActivity } from "@/lib/firestore";
import { 
    ChevronRight, X, ArrowLeft, Receipt, UserCircle, Plus, Edit2, 
    Trash2, Save, RotateCcw, 
    Calculator
} from "lucide-react";
import SummaryModal from "@/components/features/SummaryModel";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface Item {
    id?: string;
    itemName: string;
    quantity: number;
    price: number;
    memberNames: string[];
    discountAmount?: number;
    taxPercentage?: number;
    timestamp?: number;
}

interface Participant {
    id?: string;
    name: string;
    avatarName?: string;
    phoneNumber?: string;
    bankAccounts?: unknown[];
}

// Activity type aligns with firestore Activity
type Activity = FirestoreActivity & {
    items?: Item[];
};



interface ActivityFormData {
    title: string;
    amount: number;
    category: string;
    payerId: string;
    splitAmongIds: string[];
}

// --- HELPER COMPONENTS ---

// 1. ITEM MODAL (Untuk Tambah/Edit Item di dalam Activity)
interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Item) => Promise<void>;
    initialItem: Item;
    activityParticipants: Participant[];
}

const ItemModal = ({ isOpen, onClose, onSave, initialItem, activityParticipants }: ItemModalProps) => {
    const [formData, setFormData] = useState<Item>(initialItem);
    const [isSaving, setIsSaving] = useState(false);

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

    // Helper to get avatar URL
    const getAvatarUrl = (participant: Participant): string => {
        const avatarName = participant.avatarName;
        if (avatarName?.startsWith("http")) return avatarName;
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarName || participant.name || "user"}`;
    };

    // Helper to get participant name
    const getParticipantName = (participant: Participant): string => participant.name;

    const handleSaveClick = async () => {
        // Validation
        if (!formData.itemName.trim()) {
            alert("Please fill in Item Name");
            return;
        }
        if (formData.price <= 0) {
            alert("Price must be greater than 0");
            return;
        }
        if (formData.memberNames.length === 0) {
            alert("Please select at least one person");
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h3 className="font-bold text-lg text-ui-black">Manage Item</h3>
                    <button onClick={onClose} disabled={isSaving}><X className="w-5 h-5 text-gray-400" /></button>
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
                            disabled={isSaving}
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
                                    className="w-full border-b border-gray-200 py-2 pl-6 font-bold text-ui-black outline-none focus:border-ui-accent-yellow disabled:opacity-50"
                                    placeholder="0"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                        <div className="w-20">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Qty</label>
                            <input 
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })}
                                className="w-full border-b border-gray-200 py-2 text-center font-bold text-ui-black outline-none focus:border-ui-accent-yellow disabled:opacity-50"
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Shared By</label>
                        <div className="flex flex-wrap gap-4">
                            {activityParticipants.map((participant: Participant, idx: number) => {
                                const participantName = getParticipantName(participant);
                                const isSelected = formData.memberNames.includes(participantName);
                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => !isSaving && toggleMember(participantName)}
                                        disabled={isSaving}
                                        className="flex flex-col items-center gap-2 cursor-pointer transition-opacity disabled:opacity-50"
                                    >
                                        <div className={`relative w-12 h-12 rounded-full border-2 transition-all overflow-hidden ${isSelected ? 'border-ui-accent-yellow opacity-100' : 'border-transparent opacity-30 grayscale'}`}>
                                            <Image
                                                src={getAvatarUrl(participant)}
                                                alt={participantName}
                                                width={48}
                                                height={48}
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                        <span className={`text-xs font-semibold text-center transition-opacity ${isSelected ? 'text-ui-black opacity-100' : 'opacity-50'}`}>
                                            {participantName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Tax %</label>
                            <div className="relative">
                                <input 
                                    type="number"
                                    value={formData.taxPercentage || ""}
                                    onChange={(e) => setFormData({ ...formData, taxPercentage: parseFloat(e.target.value) || 0 })}
                                    className="w-full border-b border-gray-200 py-2 font-bold text-ui-black outline-none focus:border-ui-accent-yellow disabled:opacity-50"
                                    placeholder="0"
                                    step="0.5"
                                    min="0"
                                    disabled={isSaving}
                                />
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Discount</label>
                            <div className="relative">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                                <input 
                                    type="number"
                                    value={formData.discountAmount || ""}
                                    onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                                    className="w-full border-b border-gray-200 py-2 pl-6 font-bold text-ui-black outline-none focus:border-ui-accent-yellow disabled:opacity-50"
                                    placeholder="0"
                                    min="0"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSaveClick}
                    disabled={isSaving}
                    className="w-full py-3 bg-ui-accent-yellow rounded-xl font-bold text-ui-black mt-2 shadow-lg shadow-ui-accent-yellow/20 hover:brightness-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-ui-black border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Item"
                    )}
                </button>
            </div>
        </div>
    );
};


// --- COLUMN 2: EVENT DETAIL ---
interface EventDetailColumnProps {
    eventId: string;
    activeActivityId: string | null;
    onActivityClick: (id: string) => void;
    onClose: () => void;
    onAddClick: () => void;
    onEditActivity: (activity: Activity) => void;
    onSummaryClick: () => void;
    onDeleteActivity: (id: string) => void;
    events: EventWithActivities[];
}

const EventDetailColumn = ({ 
    eventId, activeActivityId, onActivityClick, onClose, 
    onAddClick, onEditActivity, onSummaryClick, onDeleteActivity, events
}: EventDetailColumnProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const event = events.find((e) => e.id === eventId);
    if (!event) return null;

    // Filter activities based on search query
    const filteredActivities = event.activities.filter((activity) => {
        const query = searchQuery.toLowerCase();
        return (
            activity.title.toLowerCase().includes(query) ||
            activity.category.toLowerCase().includes(query) ||
            activity.payerName.toLowerCase().includes(query)
        );
    });

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
                
                {/* Search Bar */}
                <div className="mb-3 sticky top-0 bg-white z-10 py-1">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search activity..."
                    />
                </div>

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
                {filteredActivities.length === 0 && event.activities.length > 0 ? (
                    <div className="text-center py-8 opacity-50">
                        <p className="text-sm text-gray-500">No activities match your search.</p>
                    </div>
                ) : (
                    filteredActivities.map((act) => {
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
                })
                )}
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
interface ActivityDetailColumnProps {
    eventId: string;
    activityId: string;
    onClose: () => void;
    onUpdateActivity: (activity: Activity) => void;
    events: EventWithActivities[];
    userId: string | null;
}

const ActivityDetailColumn = ({ eventId, activityId, onClose, onUpdateActivity, events, userId }: ActivityDetailColumnProps) => {
    const event = events.find((e) => e.id === eventId);
    const activity = event?.activities.find((a) => a.id === activityId);

    // --- STATE EDIT MODE ---
    const [isEditing, setIsEditing] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    
    // Modal Item States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialItem, setModalInitialItem] = useState<Item | null>(null);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [itemIds, setItemIds] = useState<(string | null)[]>([]);

    // Real-time items listener from Firebase
    useEffect(() => {
        if (!userId || !eventId || !activityId) return;

        const itemsRef = collection(
            db,
            "users",
            userId,
            "events",
            eventId,
            "activities",
            activityId,
            "items"
        );

        const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
            const itemsList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Item[];
            setItems(itemsList);
            setItemIds(itemsList.map(item => item.id ?? null));
        });

        return () => unsubscribe();
    }, [userId, eventId, activityId]);

    // Calculations - Now based on items from Firebase
    const subTotal = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);
    const totalTaxAmount = useMemo(() => {
        return items.reduce((acc: number, item: Item) => {
            const itemTotal = item.price * item.quantity;
            const itemTax = (itemTotal * (item.taxPercentage ?? 0)) / 100;
            return acc + itemTax;
        }, 0);
    }, [items]);
    const totalDiscountAmount = useMemo(() => {
        return items.reduce((acc: number, item: Item) => acc + (item.discountAmount ?? 0), 0);
    }, [items]);
    const grandTotal = subTotal + totalTaxAmount - totalDiscountAmount;

    // Handlers
    const handleSave = () => {
        if (!activity) return;
        onUpdateActivity({
            ...activity,
            items: items as unknown as FirestoreActivity['items'],
        });
        setIsEditing(false);
    };

    const handleAddItem = () => {
        if (!activity) return;
        setEditingItemIndex(null);
        
        const firstParticipant = activity.participants?.[0];
        const defaultMemberName = firstParticipant?.name;

        setModalInitialItem({
            itemName: "", 
            quantity: 1, 
            price: 0,
            memberNames: [activity.payerName || defaultMemberName || ""],
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

    const handleDeleteItem = async (idx: number) => {
        if(confirm("Delete item?")) {
            try {
                // Delete from Firebase if item has ID
                if (itemIds[idx] && userId) {
                    await deleteItem(userId, eventId, activityId, itemIds[idx]!);
                }
                
                // Delete from local state
                setItems(prev => prev.filter((_, i) => i !== idx));
                setItemIds(prev => prev.filter((_, i) => i !== idx));
            } catch (error) {
                console.error("Error deleting item:", error);
                alert("Failed to delete item.");
            }
        }
    };

    const handleModalSave = async (item: Item) => {
        try {
            if (editingItemIndex !== null) {
                // Update existing item
                const itemId = itemIds[editingItemIndex];
                if (itemId && userId) {
                    // Update in Firebase
                    await updateItem(userId, eventId, activityId, itemId, {
                        itemName: item.itemName,
                        price: item.price,
                        quantity: item.quantity,
                        memberNames: item.memberNames,
                        discountAmount: item.discountAmount,
                        taxPercentage: item.taxPercentage,
                    });
                }
                
                // Update local state
                const newItems = [...items];
                newItems[editingItemIndex] = item;
                setItems(newItems);
            } else {
                // Create new item
                if (userId) {
                    const itemId = await createItem(userId, eventId, activityId, {
                        itemName: item.itemName,
                        price: item.price,
                        quantity: item.quantity,
                        memberNames: item.memberNames,
                        discountAmount: item.discountAmount,
                        taxPercentage: item.taxPercentage,
                    });
                    
                    // Add to local state with new ID
                    const newItem = { ...item, id: itemId };
                    setItems([...items, newItem]);
                    setItemIds([...itemIds, itemId]);
                } else {
                    // Fallback: add without Firebase
                    setItems([...items, item]);
                    setItemIds([...itemIds, null]);
                }
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving item:", error);
            alert("Failed to save item.");
        }
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
                                            <div key={i} className="w-4 h-4 rounded-full bg-gray-200 border border-white overflow-hidden relative">
                                                <Image
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m}`}
                                                    alt={m}
                                                    width={16}
                                                    height={16}
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {((item.taxPercentage ?? 0) > 0 || (item.discountAmount ?? 0) > 0) && (
                                        <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                                            {(item.taxPercentage ?? 0) > 0 && <div>Tax: {item.taxPercentage}%</div>}
                                            {(item.discountAmount ?? 0) > 0 && <div>Discount: Rp{item.discountAmount!.toLocaleString("id-ID")}</div>}
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-2 text-center">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">
                                        x{item.quantity}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-right font-mono text-gray-600">
                                    {(() => {
                                        const itemSubtotal = item.price * item.quantity;
                                        const itemTax = (itemSubtotal * (item.taxPercentage ?? 0)) / 100;
                                        const itemFinal = itemSubtotal + itemTax - (item.discountAmount ?? 0);
                                        return new Intl.NumberFormat("id-ID").format(itemFinal);
                                    })()}
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
                        {totalTaxAmount > 0 && (
                          <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">Total Tax</span>
                              <span className="font-mono">{new Intl.NumberFormat("id-ID").format(totalTaxAmount)}</span>
                          </div>
                        )}
                        {totalDiscountAmount > 0 && (
                          <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">Total Discount</span>
                              <span className="font-mono">-{new Intl.NumberFormat("id-ID").format(totalDiscountAmount)}</span>
                          </div>
                        )}
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
                            <button onClick={() => { setIsEditing(false); setItems(JSON.parse(JSON.stringify(activity.items ?? []))); }} className="p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors">
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

            {/* Modal di render disini biar ada di atas semua kolom */}
            {isModalOpen && modalInitialItem && (
                <ItemModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)}
                    initialItem={modalInitialItem}
                    onSave={handleModalSave}
                    activityParticipants={activity.participants ?? []}
                />
            )}
        </div>
    );
};


// --- DELETE CONFIRMATION MODAL ---
interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: DeleteConfirmationModalProps) => {
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
    );
};

// --- MAIN LAYOUT ---
export default function DesktopDashboard() {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
    const [events, setEvents] = useState<EventWithActivities[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const { userId, loading: authLoading } = useAuth();

    // State Modal & Refresh
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

    // Fetch events from Firebase
    const refreshEvents = useCallback(async () => {
        if (authLoading || !userId) {
            if (!authLoading) setEvents([]);
            setEventsLoading(false);
            return;
        }
        try {
            setEventsLoading(true);
            const data = await getEventsWithActivities(userId);
            setEvents(data);
        } catch (error) {
            console.error("Error loading events:", error);
            setEvents([]);
        } finally {
            setEventsLoading(false);
        }
    }, [userId, authLoading]);

    useEffect(() => {
        refreshEvents();
    }, [refreshEvents]);

    // Suppress unused eventsLoading warning while it's reserved for a loading UI
    void eventsLoading;

    const activeEvent = events.find((e) => e.id === selectedEventId);

    // --- HANDLER UPDATE DB ---
    const handleUpdateActivityDetail = (updatedActivity: Activity) => {
        if (!selectedEventId) return;
        const eventIndex = events.findIndex((e) => e.id === selectedEventId);
        if (eventIndex === -1) return;

        const actIndex = events[eventIndex].activities.findIndex((a) => a.id === updatedActivity.id);
        if (actIndex >= 0) {
            const updatedEvents = [...events];
            updatedEvents[eventIndex].activities[actIndex] = updatedActivity as unknown as FirestoreActivity;
            setEvents(updatedEvents);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleDeleteClick = (activityId: string) => {
        setActivityToDelete(activityId);
    };

    const confirmDeleteActivity = async () => {
        if (!selectedEventId || !activityToDelete || !userId) return;
        
        try {
            await deleteActivity(userId, selectedEventId, activityToDelete);
            
            // Tutup detail kalo yang dihapus lagi dibuka
            if (selectedActivityId === activityToDelete) {
                setSelectedActivityId(null);
            }
            
            // Refresh from Firebase
            await refreshEvents();
        } catch (error) {
            console.error("Error deleting activity:", error);
            alert("Failed to delete activity.");
        } finally {
            setActivityToDelete(null);
        }
    };

    // Helper avatar
    const getAvatarUrl = (name: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

    // Convert ParticipantSimple to Contact-like objects with IDs
    const getParticipantsWithIds = (participants: Participant[]): Contact[] => {
        return participants.map((p, idx) => ({
            id: `participant-${idx}-${p.name}`,
            name: p.name,
            avatarName: p.avatarName ?? "",
            phoneNumber: "",
            bankAccounts: [],
            userId: "",
        }));
    };

    const handleCreateActivity = async (data: ActivityFormData) => {
        if (!selectedEventId || !userId) return;
        setIsLoading(true);
        
        try {
            // Get the participants array with IDs
            const participantsWithIds = getParticipantsWithIds(activeEvent?.participants ?? []);
            
            // Map IDs back to names and avatars
            const payerContact = participantsWithIds.find(p => p.id === data.payerId);
            const payerName = payerContact?.name ?? "Unknown";
            
            const splitParticipants = data.splitAmongIds.map(id => {
                const contact = participantsWithIds.find(p => p.id === id);
                return {
                    id: contact?.id ?? id,
                    name: contact?.name ?? "Unknown",
                    avatarName: contact?.avatarName ?? getAvatarUrl(contact?.name ?? "Unknown")
                };
            });

            const formattedParticipants = splitParticipants.map(p => ({
                name: p.name,
                avatarName: p.avatarName
            }));

            const paidByData = {
                name: payerName,
                avatarName: payerContact?.avatarName ?? getAvatarUrl(payerName)
            };

            if (editingActivity) {
                // Update Existing Activity in Firebase
                await updateActivity(userId, selectedEventId, editingActivity.id, {
                    title: data.title,
                    amount: data.amount,
                    category: data.category,
                    paidBy: paidByData,
                    participants: formattedParticipants,
                    payerName: payerName
                });
            } else {
                // Create New Activity in Firebase
                await createActivity(userId, selectedEventId, {
                    title: data.title,
                    amount: data.amount,
                    category: data.category,
                    paidBy: paidByData,
                    participants: formattedParticipants,
                    payerName: payerName
                });
            }

            // Refresh data from Firebase
            await refreshEvents();
            
            setIsLoading(false); 
            setShowActivityModal(false); 
            setEditingActivity(null); 
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error("Error creating/updating activity:", error);
            alert("Failed to save activity. Please try again.");
            setIsLoading(false);
        }
    };

    const openCreateModal = () => { setEditingActivity(null); setShowActivityModal(true); };
    const openEditModal = (activity: Activity) => { setEditingActivity(activity); setShowActivityModal(true); };

    return (
        <div className="flex h-[calc(100vh-64px)] w-full gap-5 p-6 relative overflow-hidden bg-gray-50/50">
            {/* KOLOM 1: LIST */}
            <div className="shrink-0 flex flex-col w-[35%] xl:w-[320px]">
                <h2 className="text-2xl font-bold font-display text-ui-black mb-6 px-1">Dashboard</h2>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex-1 overflow-hidden flex flex-col">
                    <EventList key={refreshKey} activeId={selectedEventId} onEventClick={(id) => { setSelectedEventId(id); setSelectedActivityId(null); }} events={events} onRefresh={refreshEvents} />
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
                            key={selectedActivityId}
                            eventId={selectedEventId}
                            activityId={selectedActivityId}
                            onClose={() => setSelectedActivityId(null)}
                            onUpdateActivity={handleUpdateActivityDetail}
                            events={events}
                            userId={userId}
                        />
                    </div>
                </>
            )}

            {/* MODAL HEADER EDIT/CREATE */}
            {activeEvent && (
                <NewActivityModal 
                    key={editingActivity ? `edit-${editingActivity.id}` : 'new'}
                    isOpen={showActivityModal}
                    onClose={() => setShowActivityModal(false)}
                    onSubmit={handleCreateActivity}
                    participants={getParticipantsWithIds(activeEvent.participants ?? [])}
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