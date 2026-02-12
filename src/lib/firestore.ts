/**
 * Firestore Utility Functions
 * Handle nested sub-collections with proper typing
 */

import {
  collection,
  getDocs,
  doc,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ==================== HELPERS ====================

/**
 * Format a Date object to DD/MM/YYYY string
 */
function formatDateToDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Parse various date formats into a JS Date
 */
function parseDateSafe(dateInput: any): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput?.toDate === "function") return dateInput.toDate();
  if (typeof dateInput === "object" && "seconds" in dateInput) {
    return new Date(dateInput.seconds * 1000);
  }
  if (typeof dateInput === "string") {
    // Handle DD/MM/YYYY
    const ddmmyyyy = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
    }
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

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
  imageUrl: string;
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
  // Convert date: if it's a Timestamp, convert to DD/MM/YYYY string
  let dateValue = data.date;
  if (dateValue && typeof dateValue?.toDate === "function") {
    dateValue = formatDateToDDMMYYYY(dateValue.toDate());
  } else if (dateValue && typeof dateValue === "object" && "seconds" in dateValue) {
    dateValue = formatDateToDDMMYYYY(new Date(dateValue.seconds * 1000));
  }
  return {
    id: doc.id,
    name: data.title || data.name || "",
    location: data.location || "",
    date: dateValue || "",
    imageUrl: data.imageUrl || "",
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

// ==================== CREATE / UPDATE / DELETE EVENT ====================

export interface CreateEventData {
  title: string;
  location?: string;
  date: Date | string;
  imageUrl?: string;
  participants: { name: string; avatarName: string }[];
}

/**
 * Create a new event under users/{userId}/events
 * Returns the new event ID
 */
export async function createEvent(
  userId: string,
  data: CreateEventData
): Promise<string> {
  try {
    const eventsRef = collection(db, "users", userId, "events");
    const docRef = await addDoc(eventsRef, {
      title: data.title,
      location: data.location || "",
      date: typeof data.date === "string" ? data.date : formatDateToDDMMYYYY(data.date),
      imageUrl: data.imageUrl || "",
      participants: data.participants,
      settlementResultJson: "{}",
    });
    console.log(`✅ Created event: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

/**
 * Update an existing event
 * Path: users/{userId}/events/{eventId}
 */
export async function updateEvent(
  userId: string,
  eventId: string,
  data: Partial<CreateEventData>
): Promise<void> {
  try {
    const eventRef = doc(db, "users", userId, "events", eventId);
    const updateData: Record<string, any> = {};
    
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.location !== undefined) updateData.location = data.location;
    if (data.date !== undefined) {
      updateData.date = typeof data.date === "string" 
        ? data.date 
        : formatDateToDDMMYYYY(data.date);
    }
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.participants !== undefined) updateData.participants = data.participants;

    await updateDoc(eventRef, updateData);
    console.log(`✅ Updated event: ${eventId}`);
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
}

/**
 * Delete an event
 * Path: users/{userId}/events/{eventId}
 */
export async function deleteEvent(
  userId: string,
  eventId: string
): Promise<void> {
  try {
    const eventRef = doc(db, "users", userId, "events", eventId);
    await deleteDoc(eventRef);
    console.log(`✅ Deleted event: ${eventId}`);
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}

/**
 * Delete an activity from an event
 * Path: users/{userId}/events/{eventId}/activities/{activityId}
 */
export async function deleteActivity(
  userId: string,
  eventId: string,
  activityId: string
): Promise<void> {
  try {
    const activityRef = doc(db, "users", userId, "events", eventId, "activities", activityId);
    await deleteDoc(activityRef);
    console.log(`✅ Deleted activity: ${activityId}`);
  } catch (error) {
    console.error("Error deleting activity:", error);
    throw error;
  }
}