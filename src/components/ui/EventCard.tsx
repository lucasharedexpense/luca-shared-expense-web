"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MapPin, Calendar, Receipt } from "lucide-react";
import AvatarStack from "./AvatarStack";
import { getContacts, ContactData } from "@/lib/firebase-contacts";
import { useAuth } from "@/lib/auth-context";

// ==================== TYPES ====================

interface Participant {
  id: string;
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
    date: any;
    imageUrl?: string;
    participants?: Participant[];
    activities?: Activity[];
  };
  onClick?: (id: string) => void;
}

// ==================== SAFE DATE ====================

function getSafeDate(dateInput: any): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput?.toDate === "function") return dateInput.toDate();

  if (
    typeof dateInput === "object" &&
    "seconds" in dateInput &&
    "nanoseconds" in dateInput
  ) {
    return new Date(
      dateInput.seconds * 1000 + dateInput.nanoseconds / 1000000
    );
  }

  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) return parsed;

  return new Date();
}

// ==================== COMPONENT ====================

export default function EventCard({ data, onClick }: EventCardProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactData[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    getContacts(user.uid).then(setContacts);
  }, [user?.uid]);

  // Format Date
  const eventDate = getSafeDate(data.date);
  const formattedDate = eventDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // 🔥 ALWAYS resolve avatar from contacts
  const participantAvatars = useMemo(() => {
    if (!data.participants?.length) return [];

    return data.participants
      .map((p) => contacts.find((c) => c.id === p.id))
      .filter(Boolean)
      .map((contact) => {
        if (!contact) return null;

        // If avatarName is full URL
        if (contact.avatarName?.startsWith("http")) {
          return contact.avatarName;
        }

        // Stable avatar seed using contact ID
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`;
      })
      .filter(Boolean) as string[];
  }, [data.participants, contacts]);

  return (
    <div
      onClick={() => onClick?.(data.id)}
      className="relative group w-full bg-ui-white rounded-3xl shadow-xl border border-ui-grey/40 flex flex-col transition-all active:scale-[0.99] active:bg-gray-50 cursor-pointer overflow-hidden hover:shadow-md"
    >
      {/* IMAGE */}
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
        {/* HEADER */}
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-bold text-ui-black text-[19px] leading-snug flex-1">
            {data.name}
          </h3>

          {participantAvatars.length > 0 && (
            <AvatarStack
              avatars={participantAvatars}
              size={32}
              overlap={-10}
              limit={3}
            />
          )}
        </div>

        {/* LOCATION & DATE */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-ui-dark-grey">
            <MapPin className="w-4 h-4 shrink-0 text-ui-accent-yellow" />
            <span className="text-sm font-medium truncate">
              {data.location || "No location set"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-ui-dark-grey">
            <Calendar className="w-4 h-4 shrink-0 text-ui-accent-yellow" />
            <span className="text-sm font-medium">{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
