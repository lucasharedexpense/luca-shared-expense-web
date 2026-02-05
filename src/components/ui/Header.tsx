"use client";

import React from "react";
import { LucaLogo, SidebarLogo, ArrowLeft } from "./Icons";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// --- 1. DEFINISI STATE (Mirip Enum Class Kotlin) ---
export type HeaderVariant = 
  | "HOME" 
  | "EVENT_DETAILS"
  | "NEW_EVENT" 
  | "EDIT_EVENT" 
  | "NEW_ACTIVITY" 
  | "ACTIVITY_DETAILS"
  | "EDIT_ACTIVITY" 
  | "ACCOUNT_SETTINGS" 
  | "SUMMARY";

interface HeaderConfig {
  title: string;
  showLeftIconAsBack: boolean;
  showRightLogo: boolean;
}

// Config Map (Mirip property di Enum Kotlin)
const HEADER_CONFIG: Record<HeaderVariant, HeaderConfig> = {
  HOME:             { title: "Luca",             showLeftIconAsBack: false, showRightLogo: true },
  EVENT_DETAILS:    { title: "Event Details",    showLeftIconAsBack: true,  showRightLogo: false },
  NEW_EVENT:        { title: "New Event",        showLeftIconAsBack: true,  showRightLogo: false },
  EDIT_EVENT:       { title: "Editing Event",    showLeftIconAsBack: true,  showRightLogo: false },
  NEW_ACTIVITY:     { title: "New Activity",     showLeftIconAsBack: true,  showRightLogo: false },
  ACTIVITY_DETAILS: { title: "Activity Details", showLeftIconAsBack: true,  showRightLogo: false },
  EDIT_ACTIVITY:    { title: "Edit Activity",    showLeftIconAsBack: true,  showRightLogo: false },
  ACCOUNT_SETTINGS: { title: "Account Settings", showLeftIconAsBack: true,  showRightLogo: false },
  SUMMARY:          { title: "Summary",          showLeftIconAsBack: true,  showRightLogo: false },
};

// --- 2. COMPONENT UTAMA ---
interface HeaderProps {
  variant?: HeaderVariant; // Default HOME
  onLeftIconClick?: () => void;
  onTitleClick?: () => void; // Buat debug
}

export default function Header({ 
  variant = "HOME", 
  onLeftIconClick, 
  onTitleClick 
}: HeaderProps) {
  
  const config = HEADER_CONFIG[variant];
  const router = useRouter();

  return (
    // Surface Container
    <header className="w-full bg-ui-white z-50 sticky top-0 border-b border-ui-grey/50">
      <div className="h-15 px-2 flex items-center justify-between max-w-md mx-auto w-full">
        
        {/* KIRI: Icon Area (Crossfade Logic) */}
        <div className="h-full w-12.5 flex items-center justify-center">
          <button 
            onClick={onLeftIconClick} 
            className="p-2 rounded-full hover:bg-ui-grey transition-colors"
          >
            <AnimatePresence mode="wait">
              {config.showLeftIconAsBack ? (
                <motion.div
                  key="back"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowLeft className="w-6 h-6 text-ui-black" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <SidebarLogo className="w-6 h-6 text-ui-black" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* TENGAH: Title (AnimatedContent Logic) */}
        <div 
          onClick={onTitleClick}
          className="flex-1 text-center cursor-pointer select-none"
        >
          <AnimatePresence mode="wait">
            <motion.h1
              key={config.title} // Key berubah trigger animasi
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-ui-black font-bold text-[22px] font-display"
            >
              {config.title}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* KANAN: Logo (AnimatedVisibility Logic) */}
        <div 
          className="h-full w-12.5 flex items-center justify-center"
          onClick={() => router.push("/")}
        >
          <AnimatePresence>
            {config.showRightLogo && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <LucaLogo className="w-8 h-8" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}