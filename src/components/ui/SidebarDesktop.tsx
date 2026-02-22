"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/lib/firebase-auth";
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  Flag, 
  Info, 
  HelpCircle, 
  LogOut,
  Users,       // Icon untuk Contacts
  ScanLine    // Icon untuk Scan/New
} from "lucide-react";
import { LucaLogo } from "./Icons";

export default function SidebarDesktop() {
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    document.cookie = "luca_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    await logout();
    setShowLogoutDialog(false);
    router.replace("/");
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col sticky top-0 left-0 overflow-y-auto">
      
      {/* HEADER LOGO */}
      <div className="p-6 flex items-center gap-3">
         <div className="w-8 h-8 cursor-pointer" onClick={() => router.push("/home")}>
            <LucaLogo className="w-full h-full" />
         </div>
         <span className="text-xl font-bold font-display text-ui-black cursor-pointer" onClick={() => router.push("/home")}>
            Luca
         </span>
      </div>

      {/* --- BAGIAN BARU: CTA BUTTON (Pengganti tombol Scan tengah di Mobile) --- */}
      <div className="px-4 mb-6">
        <button 
            onClick={() => router.push("/scan/camera")} // Langsung ke camera page (otomatis detect desktop/mobile)
            className="w-full py-3 bg-ui-accent-yellow rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            aria-label="Scan receipt"
        >
            <ScanLine className="w-5 h-5 text-ui-black" strokeWidth={2.5} />
            {/* Kalau di desktop mungkin lebih cocok "New Event" daripada Scan, tapi biar konsisten fungsinya kita arahin sama */}
            <span className="font-bold text-ui-black">Scan</span>
        </button>
      </div>

      {/* MENU LIST */}
      <div className="flex-1 px-4 flex flex-col gap-1">
         
         <NavItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            text="Dashboard" 
            active={isActive("/home")}
            onClick={() => router.push("/home")} 
         />

         {/* --- BAGIAN BARU: CONTACTS (Dari Navbar Mobile) --- */}
         <NavItem 
            icon={<Users className="w-5 h-5" />} 
            text="Contacts" 
            active={isActive("/contacts")}
            onClick={() => router.push("/contacts")} 
         />

         {/* --- ACCOUNT SECTION --- */}
         <div className="flex flex-col mt-4 pt-4 border-t border-gray-50">
            <p className="px-3 text-xs font-bold text-gray-400 mb-2 uppercase">Account</p>
            
            <NavItem 
                icon={<User className="w-5 h-5" />} 
                text="Account Settings" 
                active={isActive("/account/settings")}
                onClick={() => router.push("/account/settings")} 
            />
            
            {/* Sisanya sama kayak sebelumnya... */}
            <NavItem 
                icon={<Settings className="w-5 h-5" />} 
                text="Preferences" 
                active={isActive("/settings")}
                onClick={() => router.push("/settings")} 
            />
         </div>

         {/* --- APP INFO SECTION --- */}
         <div className="flex flex-col mt-4 pt-4 border-t border-gray-50">
            <p className="px-3 text-xs font-bold text-gray-400 mb-2 uppercase">App Info</p>
            <NavItem 
                icon={<Flag className="w-5 h-5" />} 
                text="Report Bugs" 
                active={isActive("/report-bug")}
                onClick={() => router.push("/report-bug")} 
            />
            <NavItem 
                icon={<Info className="w-5 h-5" />} 
                text="About Us" 
                active={isActive("/about-us")}
                onClick={() => router.push("/about-us")} 
            />
         </div>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-100 mt-auto bg-gray-50/50">
         <NavItem 
            icon={<HelpCircle className="w-5 h-5" />} 
            text="Help & Support" 
            active={isActive("/help-support")}
            onClick={() => router.push("/help-support")} 
         />
         <div 
            className="mt-2 w-full flex items-center px-3 py-3 rounded-xl transition-all text-sm font-bold text-red-500 hover:bg-red-50 cursor-pointer" 
            onClick={() => setShowLogoutDialog(true)}
         >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Logout</span>
         </div>
      </div>

      {/* LOGOUT CONFIRMATION DIALOG */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogoutDialog(false)}
          />
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="w-18 h-18 rounded-full bg-red-50 flex items-center justify-center p-4">
                <LogOut className="w-8 h-8 text-red-500 ml-1" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-ui-black text-center mb-2">Log Out?</h2>
            <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
              You will need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 h-12 rounded-full bg-gray-100 text-ui-black font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 h-12 rounded-full bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all shadow-md active:scale-95"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Komponen NavItem (Biar rapi)
interface NavItemProps {
    icon: React.ReactNode;
    text: string;
    onClick: () => void;
    active: boolean;
}
function NavItem({ icon, text, onClick, active }: NavItemProps) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all text-sm font-bold mb-0.5 ${
                active 
                ? "bg-ui-accent-yellow/20 text-ui-black shadow-none border border-ui-accent-yellow/50" 
                : "text-gray-500 hover:bg-gray-100 hover:text-ui-black border border-transparent"
            }`}
        >
            <div className={active ? "text-ui-black" : "text-gray-400"}>{icon}</div>
            <span className="ml-3">{text}</span>
        </button>
    )
}