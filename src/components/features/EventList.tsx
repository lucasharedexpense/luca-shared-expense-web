"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, Plus, CalendarClock, Edit2, Trash2 } from "lucide-react";
import NewEventModal from "./NewEventModal";
import AvatarStack from "@/components/ui/AvatarStack";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { createEvent, updateEvent, deleteEvent } from "@/lib/firestore";
import { getContacts, updateContact } from "@/lib/firebase-contacts";
import type { EventWithActivities, ActivityItem } from "@/lib/firestore";
import { getUserProfile } from "@/lib/firebase-auth";

// ─── TYPES ────────────────────────────────────────────────────────────────────

/** Shape expected by NewEventModal's initialData prop */
interface EditableEvent {
  id: string;
  title: string;
  date: string;
  location?: string;
  imageUrl?: string;
  participants: { name: string; avatarName: string }[];
}

interface EventListProps {
  onEventClick: (eventId: string) => void;
  activeId?: string | null;
  events?: EventWithActivities[];
  onRefresh?: () => void;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getEventTotal = (event: EventWithActivities): number => {
  return event.activities.reduce((acc, act) => {
    const actTotal = (act.items ?? []).reduce(
      (s: number, i: ActivityItem) => s + i.price * i.quantity,
      0
    );
    return acc + actTotal;
  }, 0);
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function EventList({ onEventClick, activeId, events: providedEvents, onRefresh }: EventListProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<EventWithActivities[]>(providedEvents ?? []);

  // Sync events when parent re-fetches
  useEffect(() => {
    const source = providedEvents ?? [];
    const sorted = [...source].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    setEvents(sorted);
  }, [providedEvents]);

  // --- STATE UNTUK EDIT ---
  // Menyimpan data event yang sedang diedit, atau null jika create baru
  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventWithActivities | null>(null);

  const filteredEvents = events.filter(e => 
    e.title?.toLowerCase().includes(search.toLowerCase())
  );

  // HANDLER: Buka Modal Create
  const openCreateModal = () => {
    setEditingEvent(null); // Reset edit state
    setShowNewEventModal(true);
  };

  // HANDLER: Buka Modal Edit
  const openEditModal = (e: React.MouseEvent, event: EventWithActivities) => {
    e.stopPropagation();
    // Map EventWithActivities to the shape NewEventModal expects
    const editable: EditableEvent = {
      id: event.id,
      title: event.title ?? event.name,
      date: typeof event.date === "string"
        ? event.date
        : event.date instanceof Date
          ? event.date.toLocaleDateString("en-GB")
          : new Date((event.date as { toDate(): Date }).toDate()).toLocaleDateString("en-GB"),
      location: event.location,
      imageUrl: event.imageUrl,
      participants: (event.participants ?? []).map((p) => ({
        name: p.name,
        avatarName: p.avatar ?? p.name,
      })),
    };
    setEditingEvent(editable);
    setShowNewEventModal(true);
  };

  // HANDLER: Delete Event
  const handleDeleteEvent = (e: React.MouseEvent, event: EventWithActivities) => {
    e.stopPropagation();
    setEventToDelete(event);
  };

  const confirmDeleteEvent = useCallback(async () => {
    if (!user?.uid || !eventToDelete) return;
    try {
      const allContacts = await getContacts(user.uid);
      let eventCreatedAt: number = 0;
      const createdAtData = eventToDelete.createdAt ?? 0;
      
      if (typeof createdAtData === 'object' && createdAtData !== null && 'toMillis' in createdAtData) {
        eventCreatedAt = (createdAtData as { toMillis(): number }).toMillis();
      } else if (typeof createdAtData === 'object' && createdAtData !== null && 'seconds' in createdAtData) {
        eventCreatedAt = (createdAtData as { seconds: number }).seconds * 1000;
      } else if (typeof createdAtData === 'number') {
        eventCreatedAt = createdAtData;
      }

      const participantNames = (eventToDelete.participants ?? []).map(p => p.name);

      if (participantNames.length > 0) {
        const eventCreatedAtStr = String(eventCreatedAt);
        const updatePromises = allContacts
          .filter(contact => participantNames.includes(contact.name))
          .map(contact => {
            const updatedIsEvent = contact.isEvent.filter(event => 
              String(event.eventCreatedAt) !== eventCreatedAtStr
            );
            return updateContact(user.uid, contact.id, { isEvent: updatedIsEvent });
          });
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
      }

      await deleteEvent(user.uid, eventToDelete.id);
      onRefresh?.();
    } catch {
      alert("Failed to delete event.");
    } finally {
      setEventToDelete(null);
    }
  }, [user?.uid, eventToDelete, onRefresh]);

  // HANDLER: Save (Create / Update) - Firebase
  const handleSaveEvent = useCallback(async (data: {
    title: string;
    date: Date;
    location: string;
    imageUrl: string;
    participants: { name: string; avatarName: string }[];
  }) => {
    if (!user?.uid) return;
    setIsLoading(true);

    try {
      // Fetch current user's profile from Firestore
      const userProfile = await getUserProfile(user.uid);
      const currentUserParticipant = userProfile
        ? {
            name: userProfile.username ?? user.displayName ?? "You",
            avatarName: userProfile.avatarName ?? userProfile.username ?? user.displayName ?? "You",
          }
        : {
            name: user.displayName ?? "You",
            avatarName: user.displayName ?? "You",
          };

      // Always include current user as first participant
      const allParticipants = [
        currentUserParticipant,
        ...data.participants,
      ];

      const eventPayload = {
        title: data.title,
        date: data.date,
        location: data.location,
        imageUrl: data.imageUrl,
        participants: allParticipants,
      };

      if (editingEvent) {
        // --- UPDATE EXISTING EVENT ---
        // Get the full event data from events array to get createdAt
        const fullEventData = events.find(e => e.id === editingEvent.id);
        let eventCreatedAt: number = 0;
        const createdAtData = fullEventData?.createdAt ?? 0;
        
        // Convert Firestore Timestamp to number if needed
        if (typeof createdAtData === 'object' && createdAtData !== null && 'toMillis' in createdAtData) {
          eventCreatedAt = (createdAtData as { toMillis(): number }).toMillis();
        } else if (typeof createdAtData === 'object' && createdAtData !== null && 'seconds' in createdAtData) {
          eventCreatedAt = (createdAtData as { seconds: number }).seconds * 1000;
        } else if (typeof createdAtData === 'number') {
          eventCreatedAt = createdAtData;
        }

        // Get old participants from existing event data
        const oldParticipantNames = (fullEventData?.participants ?? []).map(p => p.name);
        const newParticipantNames = allParticipants.map(p => p.name);

        // Find removed and added participants
        const removedParticipants = oldParticipantNames.filter(name => !newParticipantNames.includes(name));
        const addedParticipants = newParticipantNames.filter(name => !oldParticipantNames.includes(name));

        // Update contacts' isEvent array
        if (removedParticipants.length > 0 || addedParticipants.length > 0) {
          try {
            // Fetch fresh contact data to ensure we have the latest isEvent array
            const latestContacts = await getContacts(user.uid);
            const updatePromises: Promise<void>[] = [];

            // For removed participants: remove from isEvent array
            removedParticipants.forEach(name => {
              const contact = latestContacts.find(c => c.name === name);
              if (contact) {
                const updatedIsEvent = contact.isEvent.filter((event: { eventCreatedAt: number; stillEvent: 0 | 1; }) => event.eventCreatedAt !== eventCreatedAt);
                updatePromises.push(updateContact(user.uid, contact.id, { isEvent: updatedIsEvent }));
              }
            });

            // For added participants: add new entry to isEvent
            addedParticipants.forEach(name => {
              const contact = latestContacts.find(c => c.name === name);
              if (contact) {
                const updatedIsEvent = [
                  ...contact.isEvent,
                  { eventCreatedAt, stillEvent: 1 as const },
                ];
                updatePromises.push(updateContact(user.uid, contact.id, { isEvent: updatedIsEvent }));
              }
            });

            if (updatePromises.length > 0) {
              await Promise.all(updatePromises);
            }
          } catch {
            // Failed to update participant isEvent — non-critical
          }
        }

        await updateEvent(user.uid, editingEvent.id, eventPayload);
      } else {
        // --- CREATE NEW EVENT ---
        const eventCreatedAt = Date.now();
        
        // Create the event first
        const newId = await createEvent(user.uid, eventPayload);

        // Then update all non-current participants' isEvent array
        const participantNames = data.participants.map(p => p.name);
        if (participantNames.length > 0) {
          try {
            // Fetch fresh contact data to ensure we have the latest isEvent array
            const latestContacts = await getContacts(user.uid);
            
            const updatePromises = participantNames.map((name) => {
              const contact = latestContacts.find((c) => c.name === name);
              if (!contact) return Promise.resolve();

              const updatedIsEvent = [
                ...contact.isEvent,
                { eventCreatedAt, stillEvent: 1 as const },
              ];
              return updateContact(user.uid, contact.id, { isEvent: updatedIsEvent });
            });
            await Promise.all(updatePromises);
          } catch {
            // Failed to update participant isEvent — non-critical
          }
        }

        onEventClick(newId);
      }

      // Refresh data from parent
      onRefresh?.();
    } catch {
      alert("Failed to save event. Please try again.");
    } finally {
      setIsLoading(false);
      setShowNewEventModal(false);
      setEditingEvent(null);
    }
  }, [user?.uid, user?.displayName, editingEvent, onEventClick, onRefresh, events]);

  return (
    <>
        <div className="flex flex-col h-full">
            {/* SEARCH BAR */}
            <div className="mb-4 sticky top-0 bg-white z-10 py-2">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-ui-black transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoComplete="off"
                        suppressHydrationWarning
                        className="w-full h-12 pl-11 pr-4 rounded-full bg-gray-100 border-none outline-none focus:bg-white focus:ring-2 focus:ring-ui-accent-yellow transition-all text-sm font-medium placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* LIST CONTENT */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-20 pr-1">
                
                {/* Button Add New */}
                <button 
                    onClick={openCreateModal}
                    className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-wide hover:border-ui-accent-yellow hover:text-ui-black hover:bg-ui-accent-yellow/5 transition-all group"
                >
                    <div className="p-1 rounded-full bg-gray-100 group-hover:bg-ui-accent-yellow transition-colors">
                        <Plus className="w-4 h-4 text-gray-500 group-hover:text-ui-black" />
                    </div>
                    Create New Event
                </button>

                {filteredEvents.map((event) => {
                    const isActive = activeId === event.id;
                    return (
                        <div 
                            key={event.id}
                            onClick={() => onEventClick(event.id)}
                            className={`
                                relative rounded-2xl border transition-all cursor-pointer group overflow-hidden
                                hover:shadow-md hover:-translate-y-0.5
                                ${isActive 
                                    ? "bg-ui-accent-yellow/5 border-ui-accent-yellow ring-1 ring-ui-accent-yellow shadow-sm" 
                                    : "bg-white border-gray-100 hover:border-gray-200"
                                }
                            `}
                        >
                            {/* Event Image Thumbnail */}
                            {event.imageUrl && (
                                <div className="w-full aspect-video overflow-hidden relative">
                                    <Image
                                        src={event.imageUrl}
                                        alt={event.title ?? event.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 400px"
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            )}

                            <div className="p-4">
                            {/* Active Indicator */}
                            {isActive && <div className="absolute left-0 top-4 bottom-4 w-1 bg-ui-accent-yellow rounded-r-full" />}

                            {/* Header Card */}
                            <div className="flex justify-between items-start mb-2 pl-2">
                                <div>
                                    <h3 className={`font-bold text-sm line-clamp-1 mb-1 ${isActive ? "text-ui-black" : "text-gray-700"}`}>
                                        {event.title}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                                        <CalendarClock className="w-3 h-3" />
                                        <span>{typeof event.date === 'string' ? event.date : (event.date instanceof Date ? event.date : event.date.toDate()).toLocaleDateString("en-GB")}</span>
                                    </div>
                                </div>
                                
                                {/* TOMBOL EDIT & DELETE (Hanya muncul saat hover card) */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button 
                                        onClick={(e) => openEditModal(e, event)}
                                        className={"p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-ui-accent-yellow hover:text-ui-black transition-all"}
                                        title="Edit Event"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteEvent(e, event)}
                                        className={"p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-500 hover:text-white transition-all"}
                                        title="Delete Event"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Footer Card */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 pl-2">
                                <AvatarStack
                                    avatars={
                                      event.participants?.map((p) => {
                                        // If avatarName is a URL, use it directly
                                        if (p.avatarName && typeof p.avatarName === "string" && p.avatarName.startsWith("http")) {
                                          return p.avatarName;
                                        }
                                        // Otherwise, generate Dicebear avatar from avatarName or fallback to name
                                        const seed = p.avatarName || p.name || "user";
                                        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
                                      }) || []
                                    }
                                    size={24}
                                    overlap={-8}
                                    limit={3}
                                />

                                <span className="text-sm font-bold text-ui-black">
                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(getEventTotal(event))}
                                </span>
                            </div>
                            </div>{/* end p-4 wrapper */}
                        </div>
                    )
                })}
            </div>
        </div>

        {/* --- MODAL (CREATE / EDIT) --- */}
        <NewEventModal 
            isOpen={showNewEventModal}
            onClose={() => setShowNewEventModal(false)}
            onSubmit={handleSaveEvent}
            isLoading={isLoading}
            initialData={editingEvent}
        />

        {/* --- MODAL DELETE EVENT --- */}
        <DeleteConfirmModal
            isOpen={!!eventToDelete}
            onClose={() => setEventToDelete(null)}
            onConfirm={confirmDeleteEvent}
            title="Delete Event?"
            name={eventToDelete?.title || "this event"}
        />
    </>
  );
}