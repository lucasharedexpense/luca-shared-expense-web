// components/ui/EventCard.tsx
import React from "react";
import { MapPin, Calendar } from "lucide-react"; // Pastikan install lucide-react
import AvatarStack from "./AvatarStack";

interface EventCardProps {
  data: {
    id: string;
    title: string;
    location?: string; // Optional field
    date: string;
    participants: {
      name: string;
      avatarName: string;
    }[];
  };
  onClick: (id: string) => void;
}

export default function EventCard({ data, onClick }: EventCardProps) {

  const participantAvatars = data.participants?.map((p) => p.avatarName) || [];

  return (
    <div 
      onClick={() => onClick(data.id)}
      className="relative group w-full bg-ui-white p-5 rounded-3xl shadow-xl border border-ui-grey/40 flex flex-col gap-4 transition-all active:scale-[0.99] active:bg-gray-50 cursor-pointer overflow-hidden hover:shadow-md"
    >
      
      {/* HEADER: Judul & Icon (Opsional) */}
      <div className="flex justify-between items-start">
        {/* Judul dapet porsi lebar paling gede */}
        <h3 className="font-bold text-ui-black text-[19px] leading-snug w-full pr-2">
          {data.title}
        </h3>
      </div>

      {/* BODY: Informasi Lokasi & Tanggal */}
      <div className="flex flex-col gap-1">
        
        {/* Lokasi */}
        <div className="flex items-center gap-2 text-ui-dark-grey">
          <MapPin className="w-4 h-4 shrink-0 text-ui-accent-yellow" />
          <span className="text-sm font-medium truncate">
            {data.location || "No location set"}
          </span>
        </div>

        {/* Tanggal */}
        <div className="flex items-center gap-2 text-ui-dark-grey">
          <Calendar className="w-4 h-4 shrink-0 text-ui-accent-yellow" />
          <span className="text-sm">
            {data.date}
          </span>
        </div>

      </div>

      {/* FOOTER: Garis Tipis & Avatar */}
      <div className="border-t border-ui-grey/30 flex justify-end items-center mt-1">
        {/* Avatar Stack di Kanan Bawah */}
        <AvatarStack 
            avatars={participantAvatars} 
            size={28}
            overlap={-10}
            limit={4} 
        />
      </div>
      
    </div>
  );
}