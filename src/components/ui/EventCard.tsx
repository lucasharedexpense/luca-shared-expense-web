// components/ui/EventCard.tsx
import React from "react";
import { MapPin, Calendar, Receipt } from "lucide-react";
import AvatarStack from "./AvatarStack";

// ==================== TYPE DEFINITIONS ====================

interface Participant {
  name: string;
  avatar?: string;
}

interface Activity {
  id: string;
  title: string;
  category: string;
  payerName: string;
  total: number;
}

interface EventCardProps {
  data: {
    id: string;
    name: string;
    location: string;
    date: any; // Firestore Timestamp or Date or serialized
    imageUrl?: string;
    participants?: Participant[];
    activities?: Activity[];
  };
  onClick?: (id: string) => void;
}

// ==================== SAFE DATE UTILITY ====================

/**
 * Safely convert various date formats to JS Date object
 * Handles: Firestore Timestamp, JS Date, string, number, serialized Timestamp
 */
function getSafeDate(dateInput: any): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput.toDate === "function") return dateInput.toDate();
  
  if (
    typeof dateInput === "object" &&
    "seconds" in dateInput &&
    "nanoseconds" in dateInput
  ) {
    return new Date(dateInput.seconds * 1000 + dateInput.nanoseconds / 1000000);
  }
  
  if (typeof dateInput === "string") {
    // Handle DD/MM/YYYY format
    const ddmmyyyy = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
    }
    const parsedDate = new Date(dateInput);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
  }
  
  if (typeof dateInput === "number") {
    const parsedDate = new Date(dateInput);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
  }
  
  return new Date();
}

export default function EventCard({ data, onClick }: EventCardProps) {
  // Safely convert date to JS Date object and format as DD/MM/YYYY
  const eventDate = getSafeDate(data.date);
  const formattedDate = eventDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Prepare avatar names for AvatarStack (extract first letter if no avatar)
  const participantAvatars = data.participants?.map((p) => 
    p.avatar || p.name.charAt(0).toUpperCase()
  ) || [];

  return (
    <div 
      onClick={() => onClick?.(data.id)}
      className="relative group w-full bg-ui-white rounded-3xl shadow-xl border border-ui-grey/40 flex flex-col transition-all active:scale-[0.99] active:bg-gray-50 cursor-pointer overflow-hidden hover:shadow-md"
    >
      
      {/* EVENT IMAGE BANNER */}
      {data.imageUrl && (
        <div className="w-full aspect-video relative overflow-hidden">
          <img 
            src={data.imageUrl} 
            alt={data.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      <div className="p-5 flex flex-col gap-4">
      {/* HEADER: Event Name & Participants Avatar */}
      <div className="flex justify-between items-start gap-3">
        <h3 className="font-bold text-ui-black text-[19px] leading-snug flex-1">
          {data.name}
        </h3>
        
        {/* Participants Avatar Stack */}
        {participantAvatars.length > 0 && (
          <AvatarStack 
            avatars={participantAvatars} 
            size={32}
            overlap={-10}
            limit={3} 
          />
        )}
      </div>

      {/* BODY: Location & Date */}
      <div className="flex flex-col gap-1.5">
        {/* Location */}
        <div className="flex items-center gap-2 text-ui-dark-grey">
          <MapPin className="w-4 h-4 shrink-0 text-ui-accent-yellow" />
          <span className="text-sm font-medium truncate">
            {data.location || "No location set"}
          </span>
        </div>

        {/* Date - Formatted as DD/MM/YYYY */}
        <div className="flex items-center gap-2 text-ui-dark-grey">
          <Calendar className="w-4 h-4 shrink-0 text-ui-accent-yellow" />
          <span className="text-sm font-medium">
            {formattedDate}
          </span>
        </div>
      </div>
      </div>{/* end p-5 wrapper */}
    </div>
  );
}

// ==================== ACTIVITY PREVIEW (Compact) ====================

interface ActivityPreviewProps {
  activity: {
    id: string;
    title: string;
    payerName: string;
    total: number;
  };
}

function ActivityPreview({ activity }: ActivityPreviewProps) {
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(activity.total);

  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Receipt className="w-3.5 h-3.5 text-ui-dark-grey flex-shrink-0" />
        <span className="text-ui-black font-medium truncate">{activity.title}</span>
      </div>
      <span className="text-red-500 font-bold ml-2 flex-shrink-0">
        {formattedAmount}
      </span>
    </div>
  );
}