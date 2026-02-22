"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  MapPin, 
  Calendar, 
  ShoppingCart,
  LucideIcon 
} from "lucide-react";
import AvatarStack from "@/components/ui/AvatarStack";

interface EventHeaderData {
  title: string;
  location: string;
  date: string;
  imageUrl: string;
  participants?: { name: string; avatarName?: string }[];
}

interface EventHeaderCardProps {
  event: EventHeaderData;
  // onBackClick udah dihapus karena di-handle langsung di bawah
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export default function EventHeaderCard({
  event,
  onEditClick,
  onDeleteClick
}: EventHeaderCardProps): React.JSX.Element {
  
  const router = useRouter();

  // PREVENT ERROR: Mapping dulu dari Object -> String[] buat AvatarStack
  const participantAvatars = event.participants?.map((p) => p.avatarName) || [];

  // Check if event has an imageUrl
  const hasImage = !!event.imageUrl;

  return (
    <div className="relative w-full h-60 rounded-3xl overflow-hidden shadow-sm shrink-0">
      
      {/* --- 1. BACKGROUND (Image or Yellow) --- */}
      {hasImage ? (
        <>
          <Image 
            src={event.imageUrl} 
            alt={event.title} 
            fill
            className="absolute inset-0 object-cover z-0"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10 z-0" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-ui-accent-yellow z-0" />
          <ShoppingCart 
            className="absolute -bottom-6 -right-6 w-48 h-48 text-white/20 rotate-[-10deg] z-0 pointer-events-none" 
            strokeWidth={1.5}
          />
        </>
      )}

      {/* --- 2. TOP BAR (Buttons) --- */}
      <div className="relative z-10 flex justify-between items-center p-5">
        <CircleButton onClick={() => router.push('/home')}>
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
      <div className="absolute bottom-0 left-0 w-full px-5 pb-5 z-10 flex flex-row items-end justify-between gap-3">

        {/* LEFT: Title pill + Location */}
        <div className="flex flex-col items-start gap-1.5 flex-1 min-w-0">
          {/* Title inside white rounded pill */}
          <div className="bg-ui-white/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-sm max-w-full">
            <h1 className="text-lg font-bold font-display leading-tight text-ui-black line-clamp-2">
              {event.title}
            </h1>
          </div>

          {/* Location */}
          <div className="bg-ui-white/95 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow-sm flex items-center gap-1.5 max-w-full">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-ui-accent-yellow" />
            <span className="text-xs font-semibold truncate text-ui-black">
              {event.location}
            </span>
          </div>
        </div>

        {/* RIGHT: Avatars + Date */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <AvatarStack
            avatars={participantAvatars}
            size={32}
            limit={3}
            overlap={-10}
          />
          <div className="bg-ui-white/95 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-ui-black">
              {event.date}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

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
