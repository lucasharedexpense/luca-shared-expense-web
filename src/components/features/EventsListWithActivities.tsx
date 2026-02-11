"use client";

import React, { useEffect, useState } from "react";
import { getEventsWithActivities, EventWithActivities } from "@/lib/firestore";
import { Calendar, MapPin, Loader2, AlertCircle, Receipt } from "lucide-react";

interface EventsListProps {
  userId: string;
}

// ==================== SAFE DATE UTILITY ====================

/**
 * Safely convert various date formats to JS Date object
 * Handles: Firestore Timestamp, JS Date, string, number, serialized Timestamp
 */
function getSafeDate(dateInput: any): Date {
  // Case 1: Null or undefined
  if (!dateInput) {
    return new Date();
  }

  // Case 2: Already a JS Date object
  if (dateInput instanceof Date) {
    return dateInput;
  }

  // Case 3: Firestore Timestamp with .toDate() method
  if (typeof dateInput.toDate === "function") {
    return dateInput.toDate();
  }

  // Case 4: Serialized Firestore Timestamp (has seconds and nanoseconds)
  if (
    typeof dateInput === "object" &&
    "seconds" in dateInput &&
    "nanoseconds" in dateInput
  ) {
    // Convert Firestore Timestamp format to JS Date
    return new Date(dateInput.seconds * 1000 + dateInput.nanoseconds / 1000000);
  }

  // Case 5: String or number timestamp
  if (typeof dateInput === "string" || typeof dateInput === "number") {
    const parsedDate = new Date(dateInput);
    // Check if valid date
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  // Fallback: return current date if unable to parse
  console.warn("Unable to parse date:", dateInput);
  return new Date();
}

/**
 * Component to display Events with their Activities
 * Fetches nested Firestore data: users/{userId}/events/{eventId}/activities
 */
export default function EventsListWithActivities({ userId }: EventsListProps) {
  const [events, setEvents] = useState<EventWithActivities[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch events when component mounts or userId changes
    const fetchEvents = async () => {
      if (!userId) {
        setError("User ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const data = await getEventsWithActivities(userId);
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setError("Failed to load events. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [userId]);

  // ==================== LOADING STATE ====================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-ui-accent-yellow" />
        <p className="text-sm text-ui-dark-grey font-medium">
          Loading events...
        </p>
      </div>
    );
  }

  // ==================== ERROR STATE ====================
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-ui-accent-yellow font-semibold hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // ==================== EMPTY STATE ====================
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-12 h-12 rounded-full bg-ui-grey flex items-center justify-center">
          <Receipt className="w-6 h-6 text-ui-dark-grey" />
        </div>
        <p className="text-sm text-ui-dark-grey font-medium">
          No events found
        </p>
        <p className="text-xs text-ui-dark-grey/60">
          Create your first event to get started
        </p>
      </div>
    );
  }

  // ==================== EVENTS LIST ====================
  return (
    <div className="flex flex-col gap-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

// ==================== EVENT CARD COMPONENT ====================

interface EventCardProps {
  event: EventWithActivities;
}

function EventCard({ event }: EventCardProps) {
  // Safely convert date to JS Date object (handles Timestamp, Date, string, serialized)
  const eventDate = getSafeDate(event.date);
  
  // Format date as DD/MM/YYYY
  const formattedDate = eventDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-ui-grey/30 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Event Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-ui-black mb-2">
            {event.name}
          </h3>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-sm text-ui-dark-grey">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ui-dark-grey">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Participants Avatar Stack */}
        {event.participants && event.participants.length > 0 && (
          <ParticipantsAvatarStack participants={event.participants} />
        )}
      </div>

      {/* Activities Section */}
      <div className="pt-4 border-t border-ui-grey/20">
        <p className="text-xs font-semibold text-ui-dark-grey mb-3">
          Activities ({event.activities.length})
        </p>

        {event.activities.length === 0 ? (
          <p className="text-xs text-ui-dark-grey/60 italic">
            No activities yet
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {event.activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== PARTICIPANTS AVATAR STACK ====================

interface ParticipantsAvatarStackProps {
  participants: { name: string; avatar?: string }[];
  maxVisible?: number;
}

function ParticipantsAvatarStack({ 
  participants, 
  maxVisible = 3 
}: ParticipantsAvatarStackProps) {
  const visibleParticipants = participants.slice(0, maxVisible);
  const remainingCount = participants.length - maxVisible;

  return (
    <div className="flex items-center -space-x-2">
      {visibleParticipants.map((participant, index) => (
        <div
          key={index}
          className="w-8 h-8 rounded-full border-2 border-white bg-ui-accent-yellow/20 flex items-center justify-center overflow-hidden"
          title={participant.name}
        >
          {participant.avatar ? (
            <img
              src={participant.avatar}
              alt={participant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-ui-black">
              {participant.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className="w-8 h-8 rounded-full border-2 border-white bg-ui-dark-grey/20 flex items-center justify-center">
          <span className="text-xs font-bold text-ui-black">
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
}

// ==================== ACTIVITY ITEM COMPONENT ====================

interface ActivityItemProps {
  activity: {
    id: string;
    title: string;
    category: string;
    payerName: string;
    total: number;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  // Format currency as IDR
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(activity.total);

  return (
    <div className="flex items-center justify-between py-2.5 px-3 bg-ui-grey/30 rounded-xl hover:bg-ui-grey/50 transition-colors">
      {/* Left Side: Icon + Title + Payer */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Category Icon */}
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
          <Receipt className="w-5 h-5 text-ui-black" />
        </div>
        
        {/* Title and Payer Info */}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-ui-black truncate">
            {activity.title}
          </span>
          <span className="text-xs text-ui-dark-grey">
            Paid by {activity.payerName}
          </span>
        </div>
      </div>

      {/* Right Side: Amount */}
      <div className="flex-shrink-0 ml-3">
        <span className="text-sm font-bold text-red-500">
          {formattedAmount}
        </span>
      </div>
    </div>
  );
}
