"use client";

import React from "react";
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  MapPin, 
  Calendar, 
  ShoppingCart,
  LucideIcon // Import tipe LucideIcon buat InfoChip
} from "lucide-react";
import AvatarStack from "@/components/ui/AvatarStack";
import { Event } from "@/lib/dummy-data"; 

interface EventHeaderCardProps {
  event: Event;
  onBackClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

// Tambahkan ': React.JSX.Element' di sini
export default function EventHeaderCard({
  event,
  onBackClick,
  onEditClick,
  onDeleteClick
}: EventHeaderCardProps): React.JSX.Element {

  // PREVENT ERROR: Mapping dulu dari Object -> String[] buat AvatarStack
  const participantAvatars = event.participants?.map((p) => p.avatarName) || [];

  return (
    <div className="relative w-full h-60 bg-ui-accent-yellow rounded-3xl overflow-hidden shadow-sm shrink-0">
      
      {/* --- 1. WATERMARK BACKGROUND --- */}
      <ShoppingCart 
        className="absolute -bottom-6 -right-6 w-48 h-48 text-white/20 rotate-[-10deg] z-0 pointer-events-none" 
        strokeWidth={1.5}
      />

      {/* --- 2. TOP BAR (Buttons) --- */}
      <div className="relative z-10 flex justify-between items-center p-5">
        <CircleButton onClick={onBackClick}>
          <ArrowLeft className="w-5 h-5 text-ui-black" />
        </CircleButton>

        <div className="flex gap-2">
          <CircleButton onClick={onEditClick}>
            <Edit2 className="w-4 h-4 text-ui-black" />
          </CircleButton>
          <CircleButton onClick={onDeleteClick}>
            <Trash2 className="w-4 h-4 text-ui-accent-red" />
          </CircleButton>
        </div>
      </div>

      {/* --- 3. MAIN CONTENT (Bottom) --- */}
      <div className="absolute bottom-0 left-0 w-full p-5 z-10 flex flex-col items-start">
        
        {/* Title Besar */}
        <h1 className="text-2xl font-bold font-display text-ui-black leading-tight mb-3 line-clamp-2 drop-shadow-sm">
          {event.title}
        </h1>

        {/* Chips Row (Location & Date) */}
        <div className="flex flex-wrap gap-2 mb-4">
          <InfoChip icon={MapPin} text={event.location} />
          <InfoChip icon={Calendar} text={event.date} />
        </div>

        {/* Avatar Stack */}
        <div className="pl-1">
             <AvatarStack 
                avatars={participantAvatars} 
                size={32} 
                limit={4}
                overlap={-10}
            />
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

// Tambahkan ': React.JSX.Element' di sini
function CircleButton({ 
  children, 
  onClick 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
}): React.JSX.Element {
  return (
    <button 
      onClick={onClick}
      className="w-10 h-10 rounded-full bg-ui-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-105 active:scale-90 transition-transform"
    >
      {children}
    </button>
  );
}

// Tambahkan ': React.JSX.Element' di sini juga
function InfoChip({ 
  icon: Icon, 
  text 
}: { 
  icon: LucideIcon; 
  text: string; 
}): React.JSX.Element {
  return (
    <div className="bg-ui-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
      <Icon className="w-3.5 h-3.5 text-ui-dark-grey" />
      <span className="text-xs font-bold text-ui-black font-display tracking-wide">
        {text}
      </span>
    </div>
  );
}