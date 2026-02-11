/**
 * Firestore Utility Functions
 * Handle nested sub-collections with proper typing
 */

import {
  collection,
  getDocs,
  doc,
  query,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ==================== TYPE DEFINITIONS ====================

export interface Activity {
  id: string;
  title: string;
  category: string;
  payerName: string;
  total: number;
  categoryColorHex?: string;
  items?: any[];
  participants?: any[];
}

export interface Participant {
  name: string;
  avatar?: string;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  date: Timestamp | string | Date;
  settlementResultJson: string;
  participants?: Participant[];
  title?: string; // Alias for name
}

export interface EventWithActivities extends Event {
  activities: Activity[];
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Convert Firestore document snapshot to Activity object
 */
function docToActivity(doc: QueryDocumentSnapshot<DocumentData>): Activity {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || "",
    category: data.category || "",
    payerName: data.payerName || "",
    total: data.total || 0,
    categoryColorHex: data.categoryColorHex,
    items: data.items || [],
    participants: data.participants || [],
  };
}

/**
 * Convert Firestore document snapshot to Event object
 */
function docToEvent(doc: QueryDocumentSnapshot<DocumentData>): Event {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || data.title || "",
    location: data.location || "",
    date: data.date || Timestamp.now(),
    settlementResultJson: data.settlementResultJson || "{}",
    participants: data.participants || [],
  };
}

/**
 * Fetch all activities for a specific event
 * Path: users/{userId}/events/{eventId}/activities
 */
async function getActivitiesForEvent(
  userId: string,
  eventId: string
): Promise<Activity[]> {
  try {
    // Reference to activities sub-collection
    const activitiesRef = collection(
      db,
      "users",
      userId,
      "events",
      eventId,
      "activities"
    );

    const activitiesSnapshot = await getDocs(activitiesRef);

    // Convert snapshots to Activity objects
    const activities = activitiesSnapshot.docs.map(docToActivity);

    return activities;
  } catch (error) {
    console.error(
      `Error fetching activities for event ${eventId}:`,
      error
    );
    return []; // Return empty array if error
  }
}

/**
 * Fetch all events with their activities for a user
 * Path: users/{userId}/events → users/{userId}/events/{eventId}/activities
 * 
 * @param userId - The user ID to fetch events for
 * @returns Promise<EventWithActivities[]> - Array of events with nested activities
 */
export async function getEventsWithActivities(
  userId: string
): Promise<EventWithActivities[]> {
  try {
    // Step 1: Fetch all events for this user
    const eventsRef = collection(db, "users", userId, "events");
    const eventsSnapshot = await getDocs(eventsRef);

    if (eventsSnapshot.empty) {
      console.log("No events found for user:", userId);
      return [];
    }

    // Step 2: For each event, fetch its activities in parallel
    const eventsWithActivitiesPromises = eventsSnapshot.docs.map(
      async (eventDoc) => {
        const event = docToEvent(eventDoc);

        // Fetch activities for this event (nested sub-collection)
        const activities = await getActivitiesForEvent(userId, event.id);

        // Combine event with its activities and add title field for component compatibility
        return {
          ...event,
          title: event.name, // Add title field as alias for components
          activities,
        };
      }
    );

    // Step 3: Wait for all parallel fetches to complete
    const eventsWithActivities = await Promise.all(
      eventsWithActivitiesPromises
    );

    console.log(
      `✅ Fetched ${eventsWithActivities.length} events with activities`
    );
    return eventsWithActivities;
  } catch (error) {
    console.error("Error fetching events with activities:", error);
    throw error;
  }
}

/**
 * Get single event with activities
 */
export async function getEventWithActivities(
  userId: string,
  eventId: string
): Promise<EventWithActivities | null> {
  try {
    const eventDocRef = doc(db, "users", userId, "events", eventId);
    const activitiesRef = collection(
      db,
      "users",
      userId,
      "events",
      eventId,
      "activities"
    );

    // Fetch event document and activities in parallel
    const [eventSnapshot, activitiesSnapshot] = await Promise.all([
      getDocs(query(collection(db, "users", userId, "events"))),
      getDocs(activitiesRef),
    ]);

    // Find the specific event
    const eventDoc = eventSnapshot.docs.find((doc) => doc.id === eventId);
    if (!eventDoc) {
      return null;
    }

    const event = docToEvent(eventDoc);
    const activities = activitiesSnapshot.docs.map(docToActivity);

    return {
      ...event,
      activities,
    };
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    return null;
  }
}
