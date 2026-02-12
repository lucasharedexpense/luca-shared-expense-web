"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ChevronRight, 
  Lock, 
  Shield, 
  Bell, 
  Globe, 
  Moon, 
  HelpCircle, 
  Info, 
  LogOut, 
  User as UserIcon,
  X,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getUserProfile, changePassword, logout } from "@/lib/firebase-auth";

// --- HELPER: AVATAR URL ---
const getAvatarUrl = (avatarName: string) => {
  if (avatarName?.startsWith("http")) return avatarName;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarName || "user"}`;
};

// --- COMPONENT: SETTINGS GROUP CONTAINER ---
const SettingsGroupContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="w-full bg-white rounded-2xl p-2 mb-4 shadow-sm border border-gray-100">
    <h3 className="px-4 pt-3 pb-1 text-sm font-bold text-ui-accent-yellow uppercase tracking-wider">
        {title}
    </h3>
    <div className="flex flex-col">
        {children}
    </div>
  </div>
);

// --- COMPONENT: SETTINGS ITEM ---
interface SettingsItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onClick: () => void;
    isDanger?: boolean;
    disabled?: boolean;
}

const SettingsItem = ({ icon, title, subtitle, onClick, isDanger = false, disabled = false }: SettingsItemProps) => (
  <button 
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`w-full flex items-center p-4 transition-colors rounded-xl group text-left ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
    }`}
  >
    {/* Icon Box */}
    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-ui-black'}`}>
        {icon}
    </div>

    {/* Text */}
    <div className="flex-1 ml-4 mr-2">
        <h4 className={`text-sm font-bold ${isDanger ? 'text-red-500' : 'text-ui-black'}`}>
            {title}
        </h4>
        {subtitle && (
            <p className="text-xs text-ui-dark-grey mt-0.5">{subtitle}</p>
        )}
    </div>

    {/* Arrow */}
    {!isDanger && !disabled && (
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-ui-black transition-colors" />
    )}
  </button>
);

// --- COMPONENT: PASSWORD CHANGE MODAL ---
const PasswordChangeModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (oldPass: string, newPass: string) => void }) => {
    const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });
    const [values, setValues] = useState({ old: "", new: "", confirm: "" });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    if (!isOpen) return null;
  
    const toggle = (key: keyof typeof showPass) => setShowPass(p => ({ ...p, [key]: !p[key] }));

    const handleSubmit = async () => {
      if (!values.old || !values.new || !values.confirm) {
        setError("All fields are required");
        return;
      }
      if (values.new !== values.confirm) {
        setError("New passwords do not match");
        return;
      }
      if (values.new.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        await onSubmit(values.old, values.new);
        setValues({ old: "", new: "", confirm: "" });
      } catch (err: any) {
        setError(err.message || "Failed to update password");
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-2">
             <h3 className="font-bold text-xl text-ui-black">Change Password</h3>
             <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <p className="text-sm text-gray-500 mb-6">Enter your current and new password.</p>
  
          <div className="flex flex-col gap-4">
              {[{ label: 'Current Password', key: 'old' as const }, { label: 'New Password', key: 'new' as const }, { label: 'Confirm New Password', key: 'confirm' as const }].map(({ label, key }) => {
                  const isVisible = showPass[key];
                  return (
                    <div key={key} className="relative">
                        <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">{label}</label>
                        <input 
                            type={isVisible ? "text" : "password"}
                            value={values[key]}
                            onChange={(e) => { setValues(prev => ({ ...prev, [key]: e.target.value })); setError(""); }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-ui-accent-yellow focus:ring-1 focus:ring-ui-accent-yellow transition-all"
                        />
                        <button 
                            onClick={() => toggle(key)}
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                        >
                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                  )
              })}

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

// --- MAIN PAGE ---
export default function SettingsPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User profile from Firestore
  const [userProfile, setUserProfile] = useState<{
    username: string;
    email: string;
    avatar: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser) {
        setProfileLoading(false);
        return;
      }
      try {
        const profile = await getUserProfile(authUser.uid);
        if (profile) {
          setUserProfile({
            username: profile.username || authUser.displayName || authUser.email?.split("@")[0] || "User",
            email: profile.email || authUser.email || "",
            avatar: profile.avatarName || "avatar_1",
          });
        } else {
          setUserProfile({
            username: authUser.displayName || authUser.email?.split("@")[0] || "User",
            email: authUser.email || "",
            avatar: "avatar_1",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };
    if (!authLoading) fetchProfile();
  }, [authUser, authLoading]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push("/auth/login");
    }
  }, [authUser, authLoading, router]);

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

  // Handlers
  const handleChangePassword = async (oldPass: string, newPass: string) => {
    try {
      await changePassword(oldPass, newPass);
      setShowPasswordModal(false);
      setToastMessage("Password updated successfully");
    } catch (error: any) {
      throw error; // Let modal handle the error display
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

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <div className="flex flex-col h-full min-h-screen w-full bg-ui-background items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ui-accent-yellow" />
        <p className="mt-4 text-sm font-medium text-gray-500">Loading settings...</p>
      </div>
    );
  }

  const user = userProfile || { username: "User", email: "", avatar: "avatar_1" };

  // Check if user signed in with Google (no password provider)
  const isGoogleUser = authUser?.providerData?.some(
    (provider) => provider.providerId === "google.com"
  ) ?? false;
  const hasPasswordProvider = authUser?.providerData?.some(
    (provider) => provider.providerId === "password"
  ) ?? false;
  const canChangePassword = hasPasswordProvider && !isGoogleUser;

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
        <h1 className="text-xl font-bold font-display text-ui-black">Settings</h1>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="p-5 flex flex-col gap-2">

            {/* 1. PROFILE HEADER CARD */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 p-1 mb-4 overflow-hidden">
                    {user.avatar ? (
                        <img src={getAvatarUrl(user.avatar)} className="w-full h-full object-cover rounded-full" alt="Avatar" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <UserIcon className="w-8 h-8" />
                        </div>
                    )}
                </div>
                <h2 className="text-xl font-bold text-ui-black">{user.username}</h2>
                <p className="text-sm text-ui-dark-grey mb-4">{user.email}</p>
                
                <button 
                    onClick={() => router.push("/account/settings")}
                    className="px-6 py-2 bg-ui-accent-yellow rounded-full text-xs font-bold text-ui-black hover:brightness-105 transition-all"
                >
                    Edit Profile
                </button>
            </div>

            {/* 2. GROUP: ACCOUNT */}
            <SettingsGroupContainer title="Account">
                <SettingsItem 
                    icon={<Lock className="w-5 h-5" />}
                    title="Change Password"
                    subtitle={!canChangePassword ? "Signed in with Google" : undefined}
                    onClick={() => setShowPasswordModal(true)}
                    disabled={!canChangePassword}
                />
                <SettingsItem 
                    icon={<Shield className="w-5 h-5" />}
                    title="Privacy & Security"
                    onClick={() => console.log("Privacy")}
                />
                <SettingsItem 
                    icon={<Bell className="w-5 h-5" />}
                    title="Notifications"
                    subtitle="On, Email & Push"
                    onClick={() => console.log("Notifications")}
                />
            </SettingsGroupContainer>

            {/* 3. GROUP: PREFERENCES */}
            <SettingsGroupContainer title="Preferences">
                <SettingsItem 
                    icon={<Globe className="w-5 h-5" />}
                    title="Language"
                    subtitle="English (US)"
                    onClick={() => console.log("Language")}
                />
                <SettingsItem 
                    icon={<Moon className="w-5 h-5" />}
                    title="Theme"
                    subtitle="System Default"
                    onClick={() => console.log("Theme")}
                />
            </SettingsGroupContainer>

            {/* 4. GROUP: SUPPORT */}
            <SettingsGroupContainer title="Support">
                <SettingsItem 
                    icon={<HelpCircle className="w-5 h-5" />}
                    title="Help Center"
                    onClick={() => router.push("/help-support")}
                />
                <SettingsItem 
                    icon={<Info className="w-5 h-5" />}
                    title="About Luca"
                    onClick={() => router.push("/about-us")}
                />
            </SettingsGroupContainer>

            {/* 5. LOGOUT */}
            <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mt-2">
                <SettingsItem 
                    icon={<LogOut className="w-5 h-5" />}
                    title="Log Out"
                    onClick={() => setShowLogoutModal(true)}
                    isDanger={true}
                />
            </div>

            {/* FOOTER VERSION */}
            <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">Version 1.0.0 (Build 102)</p>
            </div>

        </div>
      </div>

      {/* MODALS */}
      <PasswordChangeModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
      />

      {/* LOGOUT CONFIRM MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-ui-accent-yellow/20 text-ui-black">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-ui-black">Log Out?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed px-4">Are you sure you want to log out from this device?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-full font-bold text-sm text-gray-600 transition-colors">Cancel</button>
              <button onClick={handleLogout} className="flex-1 py-3 rounded-full font-bold text-sm text-white bg-ui-black hover:bg-gray-800 shadow-lg shadow-black/30 transition-all">Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS TOAST */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-ui-black text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
            <div className="bg-green-500 rounded-full p-0.5"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg></div>
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

    </div>
  );
}