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
  ChevronDown, 
  ChevronUp,
  Users,       // Icon untuk Contacts
  ScanLine,    // Icon untuk Scan/New
  Plus         // Icon alternatif untuk New Event
} from "lucide-react";
import { LucaLogo } from "./Icons";

export default function SidebarDesktop() {
  const router = useRouter();
  const pathname = usePathname();
  const [expandAccount, setExpandAccount] = useState(false);

  const isActive = (path: string) => pathname === path;

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
            onClick={() => router.push("/scan")} // Atau ke /new-event langsung
            className="w-full py-3 bg-ui-accent-yellow rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
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
            onClick={async () => {
              document.cookie = "luca_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              await logout();
              router.replace("/");
            }}
         >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Logout</span>
         </div>
      </div>
    </div>
  );
}

// Komponen NavItem (Biar rapi)
function NavItem({ icon, text, onClick, active }: any) {
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