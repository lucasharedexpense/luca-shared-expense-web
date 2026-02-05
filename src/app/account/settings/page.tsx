"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Edit2, 
  LogOut, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Camera 
} from "lucide-react";
import { MOCK_DATABASE } from "@/lib/dummy-data";

// --- HELPER: GET AVATAR URL ---
const getAvatarUrl = (avatarName: string) => {
  if (avatarName.startsWith("http")) return avatarName;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarName}`;
};

// --- COMPONENT: AVATAR SELECTION MODAL ---
const AvatarSelectionModal = ({ isOpen, onClose, onSelect }: any) => {
  if (!isOpen) return null;
  
  // Dummy list avatar options
  const avatarOptions = ["avatar_1", "avatar_2", "avatar_3", "avatar_4", "avatar_5", "avatar_6"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Choose Avatar</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {avatarOptions.map((av, idx) => (
            <button 
              key={idx}
              onClick={() => onSelect(av)}
              className="aspect-square rounded-full overflow-hidden border-2 border-transparent hover:border-ui-accent-yellow transition-all bg-gray-100"
            >
              <img src={getAvatarUrl(av)} className="w-full h-full object-cover" alt={av} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: CHANGE PASSWORD MODAL ---
const ChangePasswordModal = ({ isOpen, onClose, onConfirm }: any) => {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!oldPass || !newPass || !confirmPass) {
      setError("All fields are required");
      return;
    }
    if (newPass !== confirmPass) {
      setError("New passwords do not match");
      return;
    }
    onConfirm(oldPass, newPass);
  };

  const toggleShow = (field: 'old'|'new'|'confirm') => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
        <h3 className="font-bold text-xl mb-1">Change Password</h3>
        <p className="text-sm text-gray-500 mb-6">Enter your current and new password.</p>

        <div className="flex flex-col gap-4">
            {/* Old Password */}
            <div className="relative">
                <input 
                    type={showPass.old ? "text" : "password"}
                    placeholder="Current Password"
                    value={oldPass}
                    onChange={(e) => { setOldPass(e.target.value); setError(""); }}
                    className="w-full bg-ui-grey/20 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ui-accent-yellow transition-all"
                />
                <button onClick={() => toggleShow('old')} className="absolute right-3 top-3 text-gray-400">
                    {showPass.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>

            {/* New Password */}
            <div className="relative">
                <input 
                    type={showPass.new ? "text" : "password"}
                    placeholder="New Password"
                    value={newPass}
                    onChange={(e) => { setNewPass(e.target.value); setError(""); }}
                    className="w-full bg-ui-grey/20 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ui-accent-yellow transition-all"
                />
                <button onClick={() => toggleShow('new')} className="absolute right-3 top-3 text-gray-400">
                    {showPass.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
                <input 
                    type={showPass.confirm ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPass}
                    onChange={(e) => { setConfirmPass(e.target.value); setError(""); }}
                    className="w-full bg-ui-grey/20 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ui-accent-yellow transition-all"
                />
                <button onClick={() => toggleShow('confirm')} className="absolute right-3 top-3 text-gray-400">
                    {showPass.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm text-gray-600">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 py-3 bg-ui-accent-yellow rounded-xl font-bold text-sm text-ui-black shadow-lg shadow-ui-accent-yellow/20">Change</button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: CONFIRMATION MODAL (Generic) ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onClose, isDanger = false, confirmText = "Yes" }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl text-center">
        {isDanger ? (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <Trash2 className="w-8 h-8" />
            </div>
        ) : (
            <div className="w-16 h-16 bg-ui-accent-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4 text-ui-black">
                <LogOut className="w-8 h-8" />
            </div>
        )}
        
        <h3 className="font-bold text-xl mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
        
        <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-full font-bold text-sm text-gray-600">No</button>
            <button 
                onClick={onConfirm} 
                className={`flex-1 py-3 rounded-full font-bold text-sm text-white shadow-lg ${isDanger ? 'bg-red-500 shadow-red-500/30' : 'bg-ui-black shadow-black/30'}`}
            >
                {confirmText}
            </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function AccountSettingsPage() {
  const router = useRouter();

  // State User Data (Initial load dari MOCK_DATABASE user pertama)
  const [user, setUser] = useState({
    username: MOCK_DATABASE.username, // "Beben"
    avatar: MOCK_DATABASE.avatarName, // "avatar_5"
  });

  // UI States
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user.username);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Toast Timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handlers
  const handleUpdateAvatar = (avatarName: string) => {
    setIsLoading(true);
    // Simulate API Call
    setTimeout(() => {
        setUser(prev => ({ ...prev, avatar: avatarName }));
        setIsLoading(false);
        setShowAvatarModal(false);
        setToastMessage("Profile picture updated");
    }, 800);
  };

  const handleUpdateUsername = () => {
    if (!newUsername.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
        setUser(prev => ({ ...prev, username: newUsername }));
        setIsLoading(false);
        setIsEditingUsername(false);
        setToastMessage("Username updated successfully");
    }, 800);
  };

  const handleUpdatePassword = (oldP: string, newP: string) => {
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setShowPasswordModal(false);
        setToastMessage("Password updated successfully");
    }, 1000);
  };

  const handleDeleteAccount = () => {
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setShowDeleteModal(false);
        router.push("/login"); // Redirect ke login/landing
    }, 1500);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    // Clear session logic here...
    router.push("/login"); 
  };

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      
      {/* HEADER */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
             <ArrowLeft className="w-5 h-5 text-ui-black" />
        </button>
        <h1 className="text-xl font-bold font-display text-ui-black">Account Settings</h1>
      </div>

      {/* CONTENT SCROLLABLE */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        
        {/* 1. PROFILE PICTURE SECTION */}
        <div className="py-8 flex flex-col items-center justify-center bg-gray-50/50">
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                <div className="w-32 h-32 rounded-full bg-[#FF8C42] border-4 border-ui-accent-yellow p-1 overflow-hidden shadow-xl shadow-orange-200">
                     <img 
                        src={getAvatarUrl(user.avatar)} 
                        className="w-full h-full object-cover rounded-full bg-white" 
                        alt="Profile"
                     />
                </div>
                {/* Edit Badge */}
                <div className="absolute bottom-1 right-1 bg-ui-black text-white p-2 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                </div>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">Tap to change profile picture</p>
        </div>

        <div className="px-6 mt-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Profile Information</h2>
            
            {/* 2. USERNAME SECTION */}
            <div className="mb-6">
                <label className="text-sm font-bold text-ui-black mb-2 block">Username</label>
                
                {!isEditingUsername ? (
                    // Display Mode (Card)
                    <div 
                        onClick={() => setIsEditingUsername(true)}
                        className="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-xl cursor-pointer hover:border-ui-accent-yellow transition-colors group"
                    >
                        <span className="font-medium text-ui-black">{user.username}</span>
                        <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-ui-black transition-colors" />
                    </div>
                ) : (
                    // Edit Mode (Input)
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                        <input 
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full bg-gray-50 border border-ui-accent-yellow rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ui-accent-yellow/20"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={() => { setIsEditingUsername(false); setNewUsername(user.username); }}
                                className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm text-gray-600"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdateUsername}
                                disabled={isLoading}
                                className="flex-1 py-3 bg-ui-accent-yellow rounded-xl font-bold text-sm text-ui-black shadow-sm"
                            >
                                {isLoading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* DIVIDER */}
        <div className="h-px bg-gray-100 mx-6 mb-6" />

        <div className="px-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Security</h2>

            {/* 3. PASSWORD SECTION */}
            <div className="mb-6">
                <label className="text-sm font-bold text-ui-black mb-2 block">Password</label>
                <div 
                    onClick={() => setShowPasswordModal(true)}
                    className="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-xl cursor-pointer hover:border-ui-accent-yellow transition-colors group"
                >
                    <span className="font-medium text-ui-black tracking-widest">••••••••</span>
                    <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-ui-black transition-colors" />
                </div>
            </div>
        </div>

        {/* DIVIDER */}
        <div className="h-px bg-gray-100 mx-6 mb-6" />

        <div className="px-6 pb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Actions</h2>

            {/* 4. DANGER ACTIONS */}
            <div className="flex flex-col gap-3">
                <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full py-4 rounded-xl bg-red-50 text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                >
                    Delete Account
                </button>
                
                <button 
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full py-4 rounded-xl bg-ui-accent-yellow text-ui-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-ui-accent-yellow/20 hover:bg-yellow-400 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </div>

      </div>

      {/* SUCCESS TOAST */}
      {toastMessage && (
        <div className="absolute bottom-8 left-6 right-6 bg-green-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-100">
            <div className="bg-white/20 p-1 rounded-full"><Check className="w-4 h-4" /></div>
            <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* --- MODALS --- */}
      <AvatarSelectionModal 
        isOpen={showAvatarModal} 
        onClose={() => setShowAvatarModal(false)} 
        onSelect={handleUpdateAvatar} 
      />

      <ChangePasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handleUpdatePassword}
      />

      <ConfirmModal 
        isOpen={showLogoutModal}
        title="Keluar Akun?"
        message="Kamu harus login ulang untuk mengakses data Luca."
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        confirmText="Yes, Logout"
      />

      <ConfirmModal 
        isOpen={showDeleteModal}
        title="Delete Account?"
        message="This action cannot be undone. All your data will be permanently deleted."
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isDanger={true}
        confirmText="Delete Forever"
      />

    </div>
  );
}