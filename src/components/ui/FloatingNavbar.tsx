"use client";

import React from "react";
import { Plus, Home, Contacts, Scan } from "./Icons";
import { ScanLine, Users } from "lucide-react";
import { motion } from "framer-motion";

interface FloatingNavbarProps {
  selectedIndex: number; // 0, 1, or 2
  onItemSelected: (index: number) => void;
  onAddClick?: () => void;
  onContactsClick?: () => void;
  onHomeClick?: () => void;
}

export default function FloatingNavbar({
  selectedIndex = 1,
  onItemSelected,
  onAddClick,
  onContactsClick,
  onHomeClick,
}: FloatingNavbarProps) {
  
  // Posisi X untuk indicator putih (sesuai offset dp di Kotlin: 12, 83, 154)
  // Kita asumsikan 1dp ≈ 1px untuk styling ini, atau disesuaikan skalanya.
  const indicatorPositions = [12, 83, 154];

  // Logic Icon Tengah: Kalau selectedIndex == 1 (Home), jadi tombol Add.
  const isHomeActive = selectedIndex === 1;

  return (
    // Container Luar (Posisi Fixed di layar bawah)
    <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
      
      {/* Navbar Body (Pointer events auto biar bisa diklik) */}
      <div className="pointer-events-auto w-56.25 h-18.75 bg-ui-accent-yellow rounded-full shadow-xl relative flex items-center">
        
        {/* --- 1. ANIMATED INDICATOR (Background Putih) --- */}
        <motion.div
          initial={false}
          animate={{ x: indicatorPositions[selectedIndex] }}
          transition={{
            type: "spring",
            stiffness: 400, // StiffnessLow
            damping: 25,    // LowBouncy
          }}
          className="absolute top-2 left-0 w-14.75 h-14.75 bg-ui-white rounded-full shadow-sm z-0"
        />

        {/* --- 2. ICON BUTTONS ROW --- */}
        <div className="w-full h-full flex justify-evenly items-center z-10">
          
          {/* BUTTON 1: SCAN (Index 0) */}
          <NavIconButton
            icon={<Scan className="w-6 h-6" />}
            isSelected={selectedIndex === 0}
            onClick={() => onItemSelected(0)}
          />

          {/* BUTTON 2: HOME / ADD (Index 1) */}
          <NavIconButton
            icon={
              isHomeActive ? (
                <Plus className="w-8 h-8 text-ui-black" />
              ) : (
                <Home className="w-6 h-6 text-ui-black" />
              )
            }
            isSelected={selectedIndex === 1}
            onClick={() => {
              if (isHomeActive) {
                // Kalau sudah di Home, tombol ini jadi "Add Event"
                onAddClick?.();
              } else {
                // Kalau dari menu lain, balik ke Home
                onItemSelected(1);
                onHomeClick?.();
              }
            }}
          />

          {/* BUTTON 3: CONTACTS (Index 2) */}
          <NavIconButton
            icon={<Contacts className="w-6 h-6" />}
            isSelected={selectedIndex === 2}
            onClick={() => {
              onItemSelected(2);
              onContactsClick?.();
            }}
          />
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Nav Button ---
function NavIconButton({
  icon,
  isSelected,
  onClick,
}: {
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-14.75 h-14.75 rounded-full flex items-center justify-center transition-transform active:scale-90 outline-none
        ${isSelected ? "text-ui-black" : "text-ui-black/60 hover:text-ui-black"}
      `}
    >
      {icon}
    </button>
  );
}