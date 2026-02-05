"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Camera, 
  X, 
  Loader2, 
  Check 
} from "lucide-react";

// --- HELPER: AVATAR URL GENERATOR ---
// Menggunakan Dicebear untuk generate avatar berdasarkan string
const getAvatarUrl = (seed: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

// --- COMPONENT: AVATAR SELECTION MODAL ---
interface AvatarModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSelection: string;
    onSelect: (avatarName: string) => void;
}

const AvatarSelectionModal = ({ isOpen, onClose, currentSelection, onSelect }: AvatarModalProps) => {
    if (!isOpen) return null;

    // List opsi avatar (bisa ditambah)
    const avatarOptions = ["Felix", "Aneka", "Zoe", "Jack", "Molly", "Buster"];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95">
                
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-ui-black">Choose Avatar</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {avatarOptions.map((seed, idx) => {
                        const isSelected = currentSelection === seed;
                        return (
                            <button 
                                key={idx}
                                onClick={() => { onSelect(seed); onClose(); }}
                                className={`relative aspect-square rounded-full overflow-hidden bg-gray-100 transition-all ${
                                    isSelected ? "ring-4 ring-ui-accent-yellow" : "hover:ring-2 hover:ring-gray-300"
                                }`}
                            >
                                <img 
                                    src={getAvatarUrl(seed)} 
                                    alt={seed} 
                                    className="w-full h-full object-cover" 
                                />
                                {isSelected && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <div className="bg-ui-accent-yellow rounded-full p-1">
                                            <Check className="w-4 h-4 text-ui-black" strokeWidth={3} />
                                        </div>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
export default function FillProfilePage() {
  const router = useRouter();

  // State
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(""); // Kosong = belum pilih
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Create Account
  const handleCreateAccount = async () => {
    if (!username.trim()) {
        alert("Username wajib diisi!"); // Bisa diganti toast custom
        return;
    }

    setIsLoading(true);

    try {
        // --- SIMULASI API UPDATE PROFILE ---
        console.log("Updating profile:", { username, avatar: selectedAvatar });
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Pastikan cookie session aman (jika belum di set di signup)
        document.cookie = "luca_session=true; path=/; max-age=86400";
        
        // Redirect ke Home
        router.push("/home");

    } catch (error) {
        console.error("Error creating profile", error);
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-white px-8 py-6 max-w-md mx-auto relative">
      
      {/* 1. BACK BUTTON */}
      <div className="mb-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-7 h-7 text-ui-black" />
        </button>
      </div>

      {/* 2. SCROLLABLE CONTENT */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto no-scrollbar">
        
        <div className="mt-8 text-center mb-10">
            <h1 className="text-3xl font-bold font-display text-ui-black mb-2">
                What's your name?
            </h1>
            <p className="text-sm font-medium text-ui-dark-grey">
                We want to know you more!
            </p>
        </div>

        {/* AVATAR SELECTION AREA */}
        <div className="flex flex-col items-center gap-4 mb-10">
            <button 
                onClick={() => setShowAvatarModal(true)}
                className="w-36 h-36 rounded-full bg-ui-grey overflow-hidden relative group transition-all hover:brightness-95 active:scale-95 shadow-sm"
            >
                {selectedAvatar ? (
                    <img 
                        src={getAvatarUrl(selectedAvatar)} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-ui-dark-grey" />
                    </div>
                )}
                
                {/* Overlay Hint on Hover (Desktop) / Always hidden on mobile visually but interactive */}
            </button>
            
            <button 
                onClick={() => setShowAvatarModal(true)}
                className="text-xs font-bold text-ui-accent-yellow uppercase tracking-wide hover:underline"
            >
                Tap to change avatar
            </button>
        </div>

        {/* USERNAME INPUT */}
        <div className="w-full h-12.5 bg-ui-grey rounded-full flex items-center px-6 mb-8">
            <User className="w-4 h-4 text-ui-black mr-4" />
            <input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="flex-1 bg-transparent outline-none text-sm font-medium text-ui-black placeholder:text-ui-black/50"
            />
        </div>

        {/* CREATE ACCOUNT BUTTON */}
        <button 
            onClick={handleCreateAccount}
            disabled={isLoading || !username}
            className="w-full h-12.5 bg-ui-accent-yellow text-ui-black font-bold text-sm rounded-full hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                </>
            ) : (
                "Create Account"
            )}
        </button>

      </div>

      {/* 3. MODAL OVERLAY */}
      <AvatarSelectionModal 
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentSelection={selectedAvatar}
        onSelect={setSelectedAvatar}
      />

    </div>
  );
}