"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  Flag, 
  Info, 
  HelpCircle, 
  ArrowLeft, 
  LogOut, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LucaLogo } from "./Icons"; // Pake icon yang tadi kita bikin

// --- PROPS DEFINITION ---
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // Callback Actions
  onDashboardClick?: () => void;
  onAccountSettingsClick?: () => void;
  onLogoutClick?: () => void;
  onSettingsClick?: () => void;
  onReportBugClick?: () => void;
  onAboutUsClick?: () => void;
  onHelpSupportClick?: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  onDashboardClick,
  onAccountSettingsClick,
  onLogoutClick,
  onSettingsClick,
  onReportBugClick,
  onAboutUsClick,
  onHelpSupportClick,
}: SidebarProps) {
  
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [expandAccountMenu, setExpandAccountMenu] = useState(false);

  return (
    <>
      {/* 1. OVERLAY (Background Gelap) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* 2. SIDEBAR DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] bg-ui-white z-50 shadow-2xl flex flex-col p-6"
          >
            {/* HEADER */}
            <div className="flex items-center mb-10">
              <div className="w-7.5 h-7.5 rounded-full overflow-hidden shrink-0">
                 {/* Pake Logo Luca yang udah lu bikin */}
                 <LucaLogo className="w-full h-full" />
              </div>
              <span className="ml-3 text-2xl font-bold text-ui-black font-display">
                Luca
              </span>
              <div className="flex-1" />
              <button onClick={onClose} className="p-1">
                <ArrowLeft className="w-7 h-7 text-ui-black" />
              </button>
            </div>

            {/* MENU ITEMS */}
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2">
              <SidebarMenuItem 
                icon={<LayoutDashboard className="w-6.5" />} 
                text="Dashboard" 
                onClick={onDashboardClick} 
              />

              {/* ACCOUNT EXPANDABLE */}
              <SidebarMenuItemExpandable
                icon={<User className="w-6.5" />}
                text="Account"
                isExpanded={expandAccountMenu}
                onClick={() => setExpandAccountMenu(!expandAccountMenu)}
              >
                {/* SUB MENU */}
                <SidebarSubMenuItem 
                   text="Account Settings" 
                   onClick={() => {
                     // Tutup sidebar opsional, atau biarin kebuka
                     onAccountSettingsClick?.(); 
                   }} 
                />
                <SidebarSubMenuItem 
                   text="Logout" 
                   onClick={() => setShowLogoutDialog(true)} 
                />
              </SidebarMenuItemExpandable>

              <SidebarMenuItem 
                icon={<Settings className="w-6.5" />} 
                text="Settings" 
                onClick={onSettingsClick} 
              />
              <SidebarMenuItem 
                icon={<Flag className="w-6.5" />} 
                text="Report Bugs" 
                onClick={onReportBugClick} 
              />
              <SidebarMenuItem 
                icon={<Info className="w-6.5" />} 
                text="About Us" 
                onClick={onAboutUsClick} 
              />
            </div>

            {/* FOOTER */}
            <div className="mt-auto pt-6">
              <div className="h-px w-full bg-ui-grey mb-6" /> {/* Divider */}
              <SidebarMenuItem 
                icon={<HelpCircle className="w-6.5" />} 
                text="Help & Support" 
                onClick={onHelpSupportClick} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. LOGOUT DIALOG (Custom Alert) */}
      <AnimatePresence>
        {showLogoutDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            {/* Overlay Dialog */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLogoutDialog(false)}
            />
            
            {/* Dialog Box */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-ui-white w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl"
            >
              {/* Icon Circle */}
              <div className="flex justify-center mb-4">
                <div className="w-18 h-18 rounded-full bg-ui-accent-yellow/15 flex items-center justify-center">
                  <LogOut className="w-8 h-8 text-ui-accent-yellow ml-1" />
                </div>
              </div>

              {/* Text */}
              <h2 className="text-xl font-bold text-ui-black text-center mb-2 font-display">
                Keluar Akun?
              </h2>
              <p className="text-sm text-ui-dark-grey text-center leading-relaxed mb-6">
                Kamu harus login ulang untuk mengakses data Luca.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutDialog(false)}
                  className="flex-1 h-12 rounded-full bg-ui-grey text-ui-black font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutDialog(false);
                    onLogoutClick?.();
                  }}
                  className="flex-1 h-12 rounded-full bg-ui-accent-yellow text-ui-black font-bold text-sm hover:brightness-105 transition-all shadow-md active:scale-95"
                >
                  Ya
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- SUB COMPONENTS ---

function SidebarMenuItem({ icon, text, onClick }: { icon: React.ReactNode, text: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center py-3 px-1 active:bg-gray-50 rounded-xl transition-colors text-left"
    >
      <div className="text-ui-black">{icon}</div>
      <span className="ml-4 text-[18px] font-medium text-ui-black font-display">{text}</span>
    </button>
  );
}

function SidebarSubMenuItem({ text, onClick }: { text: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center py-2 pr-2 pl-10.5 active:bg-gray-50 rounded-lg transition-colors text-left"
    >
      <span className="text-[16px] font-medium text-ui-black">{text}</span>
    </button>
  );
}

function SidebarMenuItemExpandable({ 
  icon, text, isExpanded, onClick, children 
}: { 
  icon: React.ReactNode, text: string, isExpanded: boolean, onClick: () => void, children: React.ReactNode 
}) {
  return (
    <div className="flex flex-col">
      <button 
        onClick={onClick}
        className="w-full flex items-center py-3 px-1 active:bg-gray-50 rounded-xl transition-colors text-left"
      >
        <div className="text-ui-black">{icon}</div>
        <span className="ml-4 text-[18px] font-medium text-ui-black font-display flex-1">{text}</span>
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-ui-dark-grey" />
        ) : (
          <ChevronDown className="w-6 h-6 text-ui-dark-grey" />
        )}
      </button>

      {/* Animation Expand/Collapse */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}