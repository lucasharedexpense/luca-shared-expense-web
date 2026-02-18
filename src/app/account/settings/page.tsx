"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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
  Camera,
  Loader2,
  User,
  Shield,
  AlertTriangle,
  Mail
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  deleteAccount, 
  logout 
} from "@/lib/firebase-auth";
import { getEventsWithActivities, updateEvent } from "@/lib/firestore";

// --- HELPER: GET AVATAR URL ---
const getAvatarUrl = (avatarName: string) => {
  if (avatarName?.startsWith("http")) return avatarName;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarName || "user"}`;
};

// --- COMPONENT: SETTINGS GROUP CONTAINER (Agar Senada) ---
const SettingsGroupContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="w-full bg-white rounded-2xl p-2 mb-4 shadow-sm border border-gray-100">
    <h3 className="px-4 pt-3 pb-1 text-sm font-bold text-ui-accent-yellow uppercase tracking-wider">
        {title}
    </h3>
    <div className="flex flex-col p-2 gap-2">
        {children}
    </div>
  </div>
);

// --- COMPONENT: AVATAR SELECTION MODAL ---
interface AvatarSelectionModalProps { isOpen: boolean; onClose: () => void; onSelect: (seed: string) => void; }
const AvatarSelectionModal = ({ isOpen, onClose, onSelect }: AvatarSelectionModalProps) => {
  if (!isOpen) return null;
  
  // Dummy list avatar options (Simulasi Seed Dicebear)
  const avatarOptions = ["Felix", "Aneka", "Zoe", "Jack", "Molly", "Buster", "Bubba", "Sassy", "Bandit"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-ui-black">Choose Avatar</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {avatarOptions.map((seed, idx) => (
            <button 
              key={idx}
              onClick={() => onSelect(seed)}
              className="aspect-square rounded-full overflow-hidden bg-gray-50 border-2 border-transparent hover:border-ui-accent-yellow hover:scale-105 transition-all shadow-sm"
            >
              <Image src={getAvatarUrl(seed)} width={80} height={80} className="w-full h-full object-cover" alt={seed} unoptimized />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: CHANGE PASSWORD MODAL ---
interface InputFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  show: boolean;
  onToggle: () => void;
  onClearError: () => void;
}
const InputField = ({ label, value, onChange, show, onToggle, onClearError }: InputFieldProps) => (
    <div className="relative">
      <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">{label}</label>
      <input 
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => { onChange(e.target.value); onClearError(); }}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-ui-accent-yellow focus:ring-1 focus:ring-ui-accent-yellow transition-all"
      />
      <button onClick={onToggle} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
);

interface ChangePasswordModalProps { isOpen: boolean; onClose: () => void; onConfirm: (oldPass: string, newPass: string) => void; }
const ChangePasswordModal = ({ isOpen, onClose, onConfirm }: ChangePasswordModalProps) => {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    // Simulate delay inside modal
    setTimeout(() => {
        setIsLoading(false);
        onConfirm(oldPass, newPass);
    }, 1000);
  };

  const toggleShow = (field: 'old'|'new'|'confirm') => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-2">
             <h3 className="font-bold text-xl text-ui-black">Change Password</h3>
             <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-6">Enter your current and new password.</p>

        <div className="flex flex-col gap-4">
            <InputField label="Current Password" value={oldPass} onChange={setOldPass} show={showPass.old} onToggle={() => toggleShow('old')} onClearError={() => setError("")} />
            <InputField label="New Password" value={newPass} onChange={setNewPass} show={showPass.new} onToggle={() => toggleShow('new')} onClearError={() => setError("")} />
            <InputField label="Confirm Password" value={confirmPass} onChange={setConfirmPass} show={showPass.confirm} onToggle={() => toggleShow('confirm')} onClearError={() => setError("")} />
            
            {error && (
                <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl">
                    <AlertTriangle className="w-4 h-4" />
                    <p className="text-xs font-bold">{error}</p>
                </div>
            )}
        </div>

        <button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="w-full mt-6 py-3 bg-ui-accent-yellow rounded-xl font-bold text-sm text-ui-black shadow-lg shadow-ui-accent-yellow/20 flex items-center justify-center gap-2 disabled:opacity-70"
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
        </button>
      </div>
    </div>
  );
};

// --- COMPONENT: CONFIRMATION MODAL ---
interface ConfirmModalProps { isOpen: boolean; title: string; message: string; onConfirm: () => void; onClose: () => void; isDanger?: boolean; confirmText?: string; }
const ConfirmModal = ({ isOpen, title, message, onConfirm, onClose, isDanger = false, confirmText = "Yes" }: ConfirmModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDanger ? "bg-red-50 text-red-500" : "bg-ui-accent-yellow/20 text-ui-black"
        }`}>
            {isDanger ? <Trash2 className="w-8 h-8" /> : <LogOut className="w-8 h-8" />}
        </div>
        
        <h3 className="font-bold text-xl mb-2 text-ui-black">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed px-4">{message}</p>
        
        <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-full font-bold text-sm text-gray-600 transition-colors">Cancel</button>
            <button 
                onClick={onConfirm} 
                className={`flex-1 py-3 rounded-full font-bold text-sm text-white shadow-lg transition-all ${
                    isDanger 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
                    : 'bg-ui-black hover:bg-gray-800 shadow-black/30'
                }`}
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
  const { user: authUser, loading: authLoading } = useAuth();

  // State User Data from Firestore
  const [userProfile, setUserProfile] = useState<{
    username: string;
    avatar: string;
    email: string;
    docId?: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // UI States
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch user profile from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) {
        setProfileLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(authUser.uid);
        if (profile) {
          setUserProfile({
            username: profile.username || authUser.displayName || authUser.email?.split("@")[0] || "User",
            avatar: profile.avatarName || "avatar_1",
            email: profile.email || authUser.email || "",
            docId: profile.id,
          });
          setNewUsername(profile.username || authUser.displayName || authUser.email?.split("@")[0] || "User");
        } else {
          // Use auth user data as fallback
          setUserProfile({
            username: authUser.displayName || authUser.email?.split("@")[0] || "User",
            avatar: "avatar_1",
            email: authUser.email || "",
          });
          setNewUsername(authUser.displayName || authUser.email?.split("@")[0] || "User");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setErrorMessage("Failed to load profile");
      } finally {
        setProfileLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserProfile();
    }
  }, [authUser, authLoading]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push("/auth/login");
    }
  }, [authUser, authLoading, router]);

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

  // Error Timer
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Handlers
  const handleUpdateAvatar = async (avatarName: string) => {
    if (!authUser) return;
    setShowAvatarModal(false);
    setIsLoading(true);
    try {
      await updateUserProfile(authUser.uid, { avatarName });
      setUserProfile(prev => prev ? { ...prev, avatar: avatarName } : null);
      // --- AUTO UPDATE ALL EVENTS PARTICIPANT AVATAR ---
      // 1. Fetch all events for this user
      const events = await getEventsWithActivities(authUser.uid);
      // 2. For each event, update the participant entry for the user
      await Promise.all(events.map(async (event) => {
        if (!event.participants) return;
        const updatedParticipants = event.participants.map((p) => {
          if (
            (p.userId && p.userId === authUser.uid) ||
            (!p.userId && (p.name === authUser.displayName || p.name === authUser.email || p.name === userProfile?.username))
          ) {
            return { ...p, avatarName };
          }
          return p;
        });
        await updateEvent(authUser.uid, event.id, { participants: updatedParticipants });
      }));
      setToastMessage("Profile picture updated");
    } catch (error) {
      console.error("Error updating avatar:", error);
      setErrorMessage("Failed to update profile picture");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || !authUser) return;
    setIsLoading(true);
    try {
      await updateUserProfile(authUser.uid, { username: newUsername.trim() });
      setUserProfile(prev => prev ? { ...prev, username: newUsername.trim() } : null);
      setIsEditingUsername(false);
      setToastMessage("Username updated successfully");
    } catch (error) {
      console.error("Error updating username:", error);
      setErrorMessage("Failed to update username");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (oldP: string, newP: string) => {
    setShowPasswordModal(false);
    setIsLoading(true);
    try {
      await changePassword(oldP, newP);
      setToastMessage("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);
      const errMsg = error instanceof Error ? error.message : "Failed to update password";
      setErrorMessage(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    setIsLoading(true);
    try {
      await deleteAccount();
      document.cookie = "luca_session=; path=/; max-age=0";
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      const errMsg = error instanceof Error ? error.message : "Failed to delete account";
      setErrorMessage(errMsg);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
      document.cookie = "luca_session=; path=/; max-age=0";
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      setErrorMessage("Failed to log out");
    }
  };

  // Show loading state
  if (authLoading || profileLoading) {
    return (
      <div className="flex flex-col h-full min-h-screen w-full bg-ui-background items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ui-accent-yellow" />
        <p className="mt-4 text-sm font-medium text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col h-full min-h-screen w-full bg-ui-background items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="mt-4 text-sm font-medium text-gray-500">Failed to load profile</p>
        <button 
          onClick={() => router.push("/home")}
          className="mt-4 px-6 py-2 bg-ui-accent-yellow rounded-xl font-bold text-sm"
        >
          Go Home
        </button>
      </div>
    );
  }

  // Check if user signed in with Google
  const isGoogleUser = authUser?.providerData?.some(
    (provider) => provider.providerId === "google.com"
  ) ?? false;

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-ui-background relative">
      
      {/* HEADER */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-4 bg-white sticky top-0 z-30 border-b border-gray-50">
        <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
             <ArrowLeft className="w-5 h-5 text-ui-black" />
        </button>
        <h1 className="text-xl font-bold font-display text-ui-black">Account Settings</h1>
      </div>

      {/* CONTENT SCROLLABLE */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="p-5 flex flex-col gap-2">
        
            {/* 1. PROFILE PICTURE CARD */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center mb-4">
                <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                    <div className="w-28 h-28 rounded-full bg-gray-50 p-1 overflow-hidden shadow-inner">
                         <Image 
                            src={getAvatarUrl(userProfile.avatar)} 
                            width={112}
                            height={112}
                            className="w-full h-full object-cover rounded-full" 
                            alt="Profile"
                            unoptimized
                         />
                    </div>
                    {/* Edit Badge */}
                    <div className="absolute bottom-0 right-0 bg-ui-accent-yellow text-ui-black p-2 rounded-full border-4 border-white shadow-sm group-hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4" />
                    </div>
                </div>
                <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Tap to change avatar</p>
            </div>

            {/* 2. PERSONAL INFO GROUP */}
            <SettingsGroupContainer title="Personal Information">
                <div className="mb-2">
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Username</label>
                    
                    {!isEditingUsername ? (
                        // Display Mode
                        <div 
                            onClick={() => setIsEditingUsername(true)}
                            className="w-full flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-xl cursor-pointer hover:border-ui-accent-yellow hover:bg-white transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-bold text-sm text-ui-black">{userProfile.username}</span>
                            </div>
                            <Edit2 className="w-4 h-4 text-gray-300 group-hover:text-ui-black transition-colors" />
                        </div>
                    ) : (
                        // Edit Mode
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1">
                            <input 
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="w-full bg-white border border-ui-accent-yellow rounded-xl px-4 py-3 text-sm font-bold text-ui-black outline-none shadow-sm focus:ring-4 focus:ring-ui-accent-yellow/10 transition-all"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setIsEditingUsername(false); setNewUsername(userProfile.username); }}
                                    className="flex-1 py-2.5 bg-gray-100 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleUpdateUsername}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 bg-ui-accent-yellow rounded-xl font-bold text-xs text-ui-black shadow-sm hover:brightness-105 transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading && <Loader2 className="w-3 h-3 animate-spin"/>}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Email Display (Read-only) */}
                <div className="mb-2">
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Email</label>
                    <div className="w-full flex items-center bg-gray-50 border border-gray-200 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-sm text-gray-500">{userProfile.email}</span>
                        </div>
                    </div>
                </div>
            </SettingsGroupContainer>

            {/* 3. SECURITY GROUP */}
            <SettingsGroupContainer title="Security">
                <div className="mb-2">
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">Password</label>
                    {isGoogleUser ? (
                        <div className="w-full flex items-center bg-gray-50 border border-gray-200 p-4 rounded-xl opacity-60">
                            <div className="flex items-center gap-3 flex-1">
                                <Shield className="w-4 h-4 text-gray-400" />
                                <div>
                                    <span className="font-bold text-sm text-gray-400 block">Signed in with Google</span>
                                    <span className="text-xs text-gray-400">Password change is not available for Google accounts</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-xl cursor-pointer hover:border-ui-accent-yellow hover:bg-white transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Shield className="w-4 h-4 text-gray-400" />
                                <span className="font-bold text-sm text-ui-black tracking-widest">••••••••</span>
                            </div>
                            <Edit2 className="w-4 h-4 text-gray-300 group-hover:text-ui-black transition-colors" />
                        </div>
                    )}
                </div>
            </SettingsGroupContainer>

            {/* 4. DANGER ZONE GROUP */}
            <div className="w-full bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 mt-2">
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-3 px-2">Danger Zone</h3>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full py-4 rounded-xl bg-gray-50 text-ui-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                    
                    <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full py-4 rounded-xl bg-red-50 text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border border-red-100"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                    </button>
                </div>
            </div>

        </div>
      </div>

      {/* SUCCESS TOAST */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-ui-black text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
            <div className="bg-green-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" strokeWidth={4} /></div>
            <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* ERROR TOAST */}
      {errorMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-bold text-sm">{errorMessage}</span>
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
        title="Log Out?"
        message="Are you sure you want to log out from this device?"
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        confirmText="Yes, Log Out"
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