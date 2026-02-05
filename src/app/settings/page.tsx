"use client";

import React, { useState } from "react";
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
  EyeOff
} from "lucide-react";
import { MOCK_DATABASE } from "@/lib/dummy-data";

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
}

const SettingsItem = ({ icon, title, subtitle, onClick, isDanger = false }: SettingsItemProps) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors rounded-xl group text-left"
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
    {!isDanger && (
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-ui-black transition-colors" />
    )}
  </button>
);

// --- COMPONENT: PASSWORD CHANGE MODAL ---
const PasswordChangeModal = ({ isOpen, onClose }: any) => {
    const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });
    
    if (!isOpen) return null;
  
    const toggle = (key: keyof typeof showPass) => setShowPass(p => ({ ...p, [key]: !p[key] }));
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-2">
             <h3 className="font-bold text-xl text-ui-black">Change Password</h3>
             <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <p className="text-sm text-gray-500 mb-6">Enter your current and new password.</p>
  
          <div className="flex flex-col gap-4">
              {['Current Password', 'New Password', 'Confirm New Password'].map((label, idx) => {
                  const key = idx === 0 ? 'old' : idx === 1 ? 'new' : 'confirm';
                  // @ts-ignore
                  const isVisible = showPass[key];
                  return (
                    <div key={key} className="relative">
                        <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">{label}</label>
                        <input 
                            type={isVisible ? "text" : "password"}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-ui-accent-yellow focus:ring-1 focus:ring-ui-accent-yellow transition-all"
                        />
                        <button 
                            onClick={() => toggle(key as any)}
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                        >
                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                  )
              })}
          </div>
  
          <button onClick={onClose} className="w-full mt-6 py-3 bg-ui-accent-yellow rounded-xl font-bold text-sm text-ui-black shadow-lg shadow-ui-accent-yellow/20">
              Update Password
          </button>
        </div>
      </div>
    );
};

// --- MAIN PAGE ---
export default function SettingsPage() {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Mock User Data
  const user = {
      name: MOCK_DATABASE.username,
      email: "user@luca.app", // Dummy email karena di mock db gak ada
      avatar: MOCK_DATABASE.avatarName
  };

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
                <h2 className="text-xl font-bold text-ui-black">{user.name}</h2>
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
                    onClick={() => setShowPasswordModal(true)}
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
                    onClick={() => router.push("/login")}
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
      />

    </div>
  );
}