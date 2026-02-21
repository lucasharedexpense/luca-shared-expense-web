"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { 
  Plus, 
  X, 
  Phone, 
  CreditCard, 
  Trash2, 
  Edit2,
  RefreshCw,
  Camera,
  User,
  Loader2,
  AlertTriangle,
  Check
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ContactData, getContacts, addContact, updateContact, deleteContact } from "@/lib/firebase-contacts";
import SearchBar from "../ui/SearchBar";

// --- HELPER: Random Color ---
const getAvatarColor = (name: string) => {
  const colors = ["bg-red-400", "bg-blue-400", "bg-green-400", "bg-orange-400", "bg-purple-400", "bg-teal-400"];
  return colors[name.length % colors.length];
};

export default function ContactsPage() {
  const { user: authUser, loading: authLoading } = useAuth();

  // --- STATE ---
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modal States
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // --- FETCH CONTACTS FROM FIREBASE ---
  useEffect(() => {
    const fetchContacts = async () => {
      if (!authUser) {
        setIsLoadingContacts(false);
        return;
      }
      try {
        const data = await getContacts(authUser.uid);
        setContacts(data);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setErrorMessage("Failed to load contacts");
      } finally {
        setIsLoadingContacts(false);
      }
    };
    if (!authLoading) fetchContacts();
  }, [authUser, authLoading]);

  // Toast timers
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);
  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  // --- LOGIC GROUPING (A-Z) ---
  const groupedContacts = useMemo(() => {
    // 1. Filter Search
    const filtered = contacts.filter((c) => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Sort A-Z
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

    // 3. Grouping
    const groups: Record<string, ContactData[]> = {};
    sorted.forEach((contact) => {
      const firstChar = contact.name.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstChar) ? firstChar : "#";
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(contact);
    });
    
    return groups;
  }, [contacts, searchQuery]);

  // List huruf untuk Sidebar
  const activeLetters = Object.keys(groupedContacts).sort();

  // Scroll Handler untuk Alphabet Sidebar
  const scrollToSection = (letter: string) => {
    const container = document.getElementById("contact-list-container");
    const element = document.getElementById(`group-${letter}`);
    
    if (container && element) {
      // offsetTop adalah jarak elemen dari atas container
      // Kita kurangi sedikit (misal 24px) sebagai buffer biar ga terlalu mepet atas
      const topPos = element.offsetTop; 
      
      container.scrollTo({
        top: topPos,
        behavior: "smooth"
      });
    }
  };

  // --- CRUD HANDLERS (Firebase) ---
  const handleSaveContact = async (contactData: ContactData) => {
    if (!authUser) return;
    setIsSaving(true);
    try {
      if (editingContact) {
        // Update existing contact
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _updateId, ...updateData } = contactData;
        await updateContact(authUser.uid, editingContact.id, updateData);
        setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...contactData, id: editingContact.id } : c));
        setToastMessage("Contact updated successfully");
      } else {
        // Add new contact
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _newId, ...newData } = contactData;
        const newId = await addContact(authUser.uid, newData);
        setContacts(prev => [...prev, { ...contactData, id: newId }]);
        setToastMessage("Contact added successfully");
      }
      setIsFormOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error("Error saving contact:", error);
      setErrorMessage("Failed to save contact");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact || !authUser) return;
    
    // Check if contact is currently in any event
    const isInEvent = selectedContact.isEvent.some((event) => event.stillEvent === 1);
    
    if (isInEvent) {
      setErrorMessage("Cannot delete contact: This contact is currently participating in one or more events");
      setIsDeleteConfirmOpen(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await deleteContact(authUser.uid, selectedContact.id);
      setContacts(prev => prev.filter(c => c.id !== selectedContact.id));
      setSelectedContact(null);
      setIsDeleteConfirmOpen(false);
      setToastMessage("Contact deleted");
    } catch (error) {
      console.error("Error deleting contact:", error);
      setErrorMessage("Failed to delete contact");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // CONTAINER UTAMA (Penting: h-full biar tingginya ngikutin Layout parent)
    <div className="flex flex-col h-full w-full bg-ui-background">
      
      {/* 1. HEADER SECTION (Fixed / Tidak ikut scroll) */}
      <div className="px-5 pb-4 pt-4 shrink-0 z-20 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold font-display text-ui-black">Contacts</h1>

        {/* Search & Add */}
        <div className="flex gap-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search contacts..."/>
          <button 
             onClick={() => { setEditingContact(null); setIsFormOpen(true); }}
             className="w-12.5 h-12.5 rounded-full bg-ui-accent-yellow shadow-md flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
             <Plus className="w-6 h-6 text-ui-black" />
          </button>
        </div>
      </div>

      {/* 2. AREA PUTIH (Content Wrapper) */}
      <div className="flex-1 overflow-hidden flex flex-col relative z-0">
         
         {/* Loading State */}
         {isLoadingContacts ? (
           <div className="flex-1 flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-ui-accent-yellow" />
             <p className="mt-4 text-sm font-medium text-gray-500">Loading contacts...</p>
           </div>
         ) : (
           <>
             {/* 3. SCROLLABLE LIST AREA */}
             <div 
                id="contact-list-container"
                className="flex-1 overflow-y-auto min-h-0 no-scrollbar pb-40 pl-5 pr-8 relative"
             >
                
                {activeLetters.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full text-center px-10">
                      <p className="text-ui-dark-grey font-medium">{searchQuery ? "No contacts found" : "No contacts yet. Tap + to add one!"}</p>
                   </div>
                ) : (
                   activeLetters.map((letter) => (
                      <div key={letter} id={`group-${letter}`} className="mb-6 scroll-mt-6">
                         {/* Sticky Header Huruf */}
                         <div className="sticky top-0 pb-2 z-10 bg-ui-background border-b border-ui-grey/30 mb-0">
                            <span className="text-ui-black font-black text-xl font-display">{letter}</span>
                         </div>
                         
                         {/* List Item per Huruf */}
                         <div className="flex flex-col gap-3">
                            {groupedContacts[letter].map((contact) => (
                               <ContactItem 
                                  key={contact.id} 
                                  contact={contact} 
                                  onClick={() => setSelectedContact(contact)} 
                               />
                            ))}
                         </div>
                      </div>
                   ))
                )}
             </div>

             {/* 4. ALPHABET SIDEBAR */}
             {activeLetters.length > 0 && (
                <div className="absolute right-1 top-6 bottom-32 w-6 flex flex-col items-center justify-center gap-1 z-20 pointer-events-none">
                   <div className="pointer-events-auto flex flex-col gap-1 py-2 px-1 bg-ui-grey/10 rounded-full backdrop-blur-sm">
                       {activeLetters.map((letter) => (
                          <button 
                             key={letter}
                             onClick={() => scrollToSection(letter)}
                             className="text-[10px] font-bold text-ui-dark-grey w-4 h-4 flex items-center justify-center rounded-full hover:bg-ui-accent-yellow hover:text-ui-black transition-colors"
                          >
                             {letter}
                          </button>
                       ))}
                   </div>
                </div>
             )}
           </>
         )}
      </div>

      {/* --- MODALS --- */}
      {selectedContact && (
         <DetailModal 
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            onEdit={() => { setEditingContact(selectedContact); setIsFormOpen(true); setSelectedContact(null); }}
            onDelete={() => setIsDeleteConfirmOpen(true)}
         />
      )}
      {isFormOpen && (
         <ContactFormModal 
            initialData={editingContact}
            onClose={() => { setIsFormOpen(false); setEditingContact(null); }}
            onSave={handleSaveContact}
            isSaving={isSaving}
         />
      )}
      {isDeleteConfirmOpen && (
         <DeleteConfirmModal 
            name={selectedContact?.name || ""}
            isInEvent={selectedContact?.isEvent.some((event) => event.stillEvent === 1) ?? false}
            onClose={() => setIsDeleteConfirmOpen(false)}
            onConfirm={handleDeleteContact}
            isDeleting={isSaving}
         />
      )}

      {/* SUCCESS TOAST */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-ui-black text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-[70]">
            <div className="bg-green-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" strokeWidth={4} /></div>
            <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* ERROR TOAST */}
      {errorMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-[70]">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-bold text-sm">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function ContactItem({ contact, onClick }: { contact: ContactData; onClick: () => void }) {
  // Logic Avatar
  const isUrl = contact.avatarName?.startsWith("http");
  const avatarSrc = isUrl 
    ? contact.avatarName 
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`;

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 hover:bg-gray-50 rounded-2xl transition-all active:scale-[0.98] cursor-pointer"
    >
      <div className={`w-12 h-12 rounded-full border border-ui-grey/20 overflow-hidden shrink-0 ${getAvatarColor(contact.name)}`}>
         <Image src={avatarSrc} alt={contact.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
      </div>
      <div className="flex-1 min-w-0">
         <h4 className="font-medium text-ui-black text-[16px] truncate">{contact.name}</h4>
         <p className="text-sm text-ui-dark-grey truncate font-medium">
            {contact.phoneNumber || "No phone"}
         </p>
      </div>
    </div>
  );
}

// (Modal Components sama seperti sebelumnya, letakkan di bawah file ini)
// ... DetailModal, ContactFormModal, DeleteConfirmModal ...
function DeleteConfirmModal({ name, isInEvent, onClose, onConfirm, isDeleting }: { name: string; isInEvent?: boolean; onClose: () => void; onConfirm: () => void; isDeleting?: boolean }) {
    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-ui-white w-full max-w-xs rounded-2xl p-6 shadow-2xl">
               <h3 className="text-lg font-bold text-ui-black mb-2">Hapus Contact?</h3>
               
               {isInEvent ? (
                  <div className="mb-6">
                     <div className="flex gap-3 rounded-xl bg-ui-accent-red/10 p-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-ui-accent-red shrink-0 mt-0.5" />
                        <p className="text-sm text-ui-accent-red font-medium">
                           <b>{name}</b> is currently participating in an event and cannot be deleted.
                        </p>
                     </div>
                     <p className="text-xs text-ui-dark-grey">Remove this contact from the event first to delete.</p>
                  </div>
               ) : (
                  <p className="text-sm text-ui-dark-grey mb-6">
                     Apakah Anda yakin ingin menghapus <b>{name}</b>?
                  </p>
               )}
               
               <div className="flex gap-3">
                  <button onClick={onClose} disabled={isDeleting} className="flex-1 py-3 rounded-xl bg-ui-grey font-semibold text-sm disabled:opacity-50">Batal</button>
                  <button onClick={onConfirm} disabled={isDeleting || isInEvent} className="flex-1 py-3 rounded-xl bg-ui-accent-red text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Hapus
                  </button>
               </div>
            </div>
         </div>
    )
}

// Pastikan DetailModal dan ContactFormModal dari kode sebelumnya ada di sini juga

// ==========================================
// SUB COMPONENTS (Biar file utama gak penuh)
// ==========================================

// 2. Detail Modal
function DetailModal({ contact, onClose, onEdit, onDelete }: { contact: ContactData; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
   const isUrl = contact.avatarName?.startsWith("http");
   const avatarSrc = isUrl ? contact.avatarName : `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`;

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
         
         <div className="bg-ui-white h-120 overflow-y-auto no-scrollbar w-full max-w-sm rounded-4xl overflow-hidden relative z-10 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            {/* Header Image Pattern (Hiasan) */}
            <div className="h-24 bg-ui-accent-yellow w-full relative">
               <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white rounded-full">
                  <X className="w-5 h-5 text-ui-black" />
               </button>
            </div>

            <div className="px-6 pb-8 -mt-12 flex flex-col items-center">
               {/* Big Avatar */}
               <div className="w-24 h-24 rounded-full border-4 z-10 border-ui-white bg-ui-grey overflow-hidden shadow-md mb-4">
                  <Image src={avatarSrc} alt={contact.name} width={96} height={96} className="w-full h-full object-cover" unoptimized />
               </div>

               <h2 className="text-2xl font-bold text-ui-black font-display text-center">{contact.name}</h2>

               {/* Info Cards */}
               <div className="w-full flex flex-col gap-3 mb-8">
                  <div className="w-full px-4 rounded-xl flex items-center justify-center gap-1">
                     <Phone className="w-4 h-4 text-ui-dark-grey" />
                     <p className="text-ui-dark-grey font-medium">{contact.phoneNumber || "-"}</p>
                  </div>

                  {/* Bank Accounts List */}
                  {contact.bankAccounts && contact.bankAccounts.length > 0 ? (
                     contact.bankAccounts.map((bank: ContactData["bankAccounts"][number], idx: number) => (
                        <div key={idx} className="bg-ui-grey p-4 rounded-xl flex items-center gap-4">
                           <CreditCard className="w-5 h-5 text-ui-dark-grey" />
                           <div className="flex-1">
                              <p className="text-xs text-ui-dark-grey font-bold uppercase">{bank.bankName}</p>
                              <p className="text-ui-black font-medium">{bank.accountNumber}</p>
                           </div>
                        </div>
                     ))
                  ) : (
                     <div className="bg-ui-grey/20 p-4 rounded-xl flex items-center gap-3 opacity-50">
                        <CreditCard className="w-5 h-5 text-ui-dark-grey" />
                        <span className="text-sm text-ui-dark-grey">No bank accounts linked</span>
                     </div>
                  )}
               </div>

               {/* Actions */}
               <div className="flex w-full gap-3">
                  <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-ui-accent-yellow text-ui-black active:scale-95 transition-transform">
                     <Edit2 className="w-4 h-4" />
                     <span className="font-bold text-sm">Edit</span>
                  </button>
                  <button onClick={onDelete} className="w-12 flex items-center justify-center py-3 rounded-xl bg-ui-grey text-ui-accent-red active:scale-95 transition-transform">
                     <Trash2 className="w-5 h-5" />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}


// 3. Form Modal (Add / Edit)
function ContactFormModal({ initialData, onClose, onSave, isSaving }: { initialData: ContactData | null; onClose: () => void; onSave: (data: ContactData) => void; isSaving?: boolean }) {
   const [name, setName] = useState(initialData?.name || "");
   const [phone, setPhone] = useState(initialData?.phoneNumber || "");
   
   // --- STATE BANK ACCOUNTS ---
   // Kita simpan list bank di state lokal dulu sebelum di-save
   const [bankAccounts, setBankAccounts] = useState<ContactData["bankAccounts"]>(initialData?.bankAccounts || []);
   
   // State untuk input bank baru
   const [newBankName, setNewBankName] = useState("");
   const [newRekening, setNewRekening] = useState("");

   // --- STATE AVATAR ---
   // If editing, use the existing avatar URL directly; otherwise generate a random one
   const [useExistingAvatar, setUseExistingAvatar] = useState(!!initialData?.avatarName);
   const [tempAvatarSeed, setTempAvatarSeed] = useState(
      () => `user_${Math.floor(Math.random() * 1000)}`
   );

   const getAvatarUrl = (seed: string) => 
      `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

   // Determine the displayed avatar: existing saved URL or generated from seed
   const displayedAvatar = useExistingAvatar && initialData?.avatarName
      ? initialData.avatarName
      : getAvatarUrl(tempAvatarSeed);

   const handleRandomizeAvatar = () => {
      setUseExistingAvatar(false);
      setTempAvatarSeed(`user_${Math.floor(Math.random() * 1000)}`);
   };

   // --- HANDLER BANK ---
   const handleAddBank = () => {
      if (!newBankName || !newRekening) return; // Validasi sederhana
      
      const newAccount = {
         bankName: newBankName,
         accountNumber: newRekening
      };
      
      setBankAccounts([...bankAccounts, newAccount]);
      // Reset input
      setNewBankName("");
      setNewRekening("");
   };

   const handleDeleteBank = (index: number) => {
      const updatedBanks = [...bankAccounts];
      updatedBanks.splice(index, 1);
      setBankAccounts(updatedBanks);
   };
   
   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const newContact: ContactData = {
         id: initialData?.id || "",
         name,
         phoneNumber: phone,
         avatarName: displayedAvatar, 
         bankAccounts: bankAccounts,
         isEvent: initialData?.isEvent || [],
      };
      onSave(newContact);
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all">
         {/* Container Modal (Scrollable) */}
         <div className="bg-ui-white h-120 w-full max-w-sm rounded-4xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col relative max-h-[85vh]">
            
            {/* Header Sticky (Biar tombol close selalu kelihatan) */}
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-end p-4">
               <button 
                  onClick={onClose}
                  className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors backdrop-blur-sm"
               >
                  <X className="w-5 h-5 text-ui-dark-grey" />
               </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto no-scrollbar flex flex-col">
               
               {/* Avatar Section */}
               <div className="flex flex-col items-center pt-8 pb-6 px-6 bg-linear-to-b from-ui-accent-yellow/10 to-transparent shrink-0">
                  <div className="relative group cursor-pointer" onClick={handleRandomizeAvatar}>
                     <div className="w-24 h-24 rounded-full border-4 border-ui-white bg-ui-grey/10 overflow-hidden shadow-md">
                        <Image 
                           src={displayedAvatar} 
                           alt="Avatar Preview" 
                           width={96}
                           height={96}
                           className="w-full h-full object-cover"
                           unoptimized
                        />
                     </div>
                     <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <RefreshCw className="w-8 h-8 text-white drop-shadow-md" />
                     </div>
                     <div className="absolute bottom-0 right-0 bg-ui-black p-1.5 rounded-full border-2 border-ui-white">
                        <Camera className="w-3 h-3 text-white" />
                     </div>
                  </div>
                  <p className="text-xs text-ui-dark-grey mt-2 font-medium opacity-60">Tap to randomize</p>
               </div>

               {/* Form Inputs */}
               <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-5">
                  
                  {/* Name Input */}
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-wider ml-1">Full Name</label>
                     <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ui-dark-grey group-focus-within:text-ui-accent-yellow transition-colors">
                           <User className="w-5 h-5" />
                        </div>
                        <input 
                           type="text" required
                           className="w-full bg-ui-grey p-4 pl-12 rounded-2xl outline-none focus:bg-white focus:ring-2 ring-ui-accent-yellow/50 border border-transparent focus:border-ui-accent-yellow/20 text-ui-black font-medium transition-all placeholder:text-ui-dark-grey/40"
                           value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Budi Santoso"
                        />
                     </div>
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-wider ml-1">Phone Number</label>
                     <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ui-dark-grey group-focus-within:text-ui-accent-yellow transition-colors">
                           <Phone className="w-5 h-5" />
                        </div>
                        <input 
                           type="tel" 
                           className="w-full bg-ui-grey p-4 pl-12 rounded-2xl outline-none focus:bg-white focus:ring-2 ring-ui-accent-yellow/50 border border-transparent focus:border-ui-accent-yellow/20 text-ui-black font-medium transition-all placeholder:text-ui-dark-grey/40"
                           value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812..."
                        />
                     </div>
                  </div>

                  {/* --- BANK ACCOUNTS SECTION --- */}
                  <div className="space-y-3 pt-2">
                     <label className="text-xs font-bold text-ui-dark-grey uppercase tracking-wider ml-1 flex items-center gap-2">
                        Bank Accounts <span className="bg-ui-grey/20 text-[10px] px-1.5 py-0.5 rounded-md">{bankAccounts.length}</span>
                     </label>

                     {/* List Existing Banks */}
                     <div className="flex flex-col gap-2">
                        {bankAccounts.map((bank, index) => (
                           <div key={index} className="flex items-center justify-between bg-ui-white border border-ui-grey/20 p-3 rounded-xl shadow-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                 <div className="w-8 h-8 rounded-full bg-ui-accent-yellow/10 flex items-center justify-center shrink-0">
                                    <CreditCard className="w-4 h-4 text-ui-black" />
                                 </div>
                                 <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-ui-dark-grey uppercase truncate">{bank.bankName}</span>
                                    <span className="text-sm font-bold text-ui-black truncate font-mono">{bank.accountNumber}</span>
                                 </div>
                              </div>
                              <button 
                                 type="button"
                                 onClick={() => handleDeleteBank(index)}
                                 className="p-2 hover:bg-ui-accent-red/10 rounded-lg group transition-colors"
                              >
                                 <Trash2 className="w-4 h-4 text-ui-grey group-hover:text-ui-accent-red transition-colors" />
                              </button>
                           </div>
                        ))}
                     </div>

                     {/* Add New Bank Form */}
                     <div className="bg-ui-grey/5 rounded-2xl border border-dashed border-ui-grey/30 flex flex-col gap-2 mt-1">
                        <div className="bg-ui-grey rounded-xl">
                           <input 
                              placeholder="Bank (e.g. BCA)" 
                              className="flex-1 ps-5 p-2.5 w-full rounded-xl text-sm outline-none border border-ui-grey/20 focus:border-ui-accent-yellow transition-colors placeholder:text-ui-dark-grey text-ui-black"
                              value={newBankName}
                              onChange={(e) => setNewBankName(e.target.value)}
                           />
                        </div>
                        <div className="bg-ui-grey rounded-xl">
                           <input 
                              placeholder="No. Rekening" 
                              type="text"
                              inputMode="numeric"
                              className="flex-[1.5] ps-5 p-2.5 w-full rounded-xl text-sm outline-none border border-ui-grey/20 focus:border-ui-accent-yellow transition-colors placeholder:text-ui-dark-grey text-ui-black font-mono"
                              value={newRekening}
                              onChange={(e) => setNewRekening(e.target.value)}
                           />
                        </div>
                        <button 
                           type="button"
                           onClick={handleAddBank}
                           disabled={!newBankName || !newRekening}
                           className="w-full py-2 bg-ui-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-ui-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                           <Plus className="w-3.5 h-3.5" />
                           Add Bank Account
                        </button>
                     </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4 pt-2 border-t border-ui-grey/10">
                     <button 
                        type="button" 
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 py-3.5 rounded-2xl bg-ui-grey/10 hover:bg-ui-grey/20 font-bold text-sm text-ui-dark-grey transition-colors disabled:opacity-50"
                     >
                        Cancel
                     </button>
                     <button 
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 py-3.5 rounded-2xl bg-ui-accent-yellow hover:brightness-105 font-bold text-sm text-ui-black shadow-lg shadow-ui-accent-yellow/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {initialData ? "Update Contact" : "Save Contact"}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
}