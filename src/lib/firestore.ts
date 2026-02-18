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

// ==================== TYPE DEFINITIONS ====================

export interface ActivityItem {
  itemName: string;
  price: number;
  quantity: number;
  memberNames: string[];
  discountAmount?: number;
  taxPercentage?: number;
  timestamp?: number;
}

export interface ActivityParticipant {
  name: string;
  avatarName?: string;
}

export interface Activity {
  id: string;
  title: string;
  category: string;
  payerName: string;
  total: number;
  categoryColorHex?: string;
  items?: ActivityItem[];
  participants?: ActivityParticipant[];
}

export interface Participant {
  name: string;
  avatar?: string;
  avatarName?: string;
  userId?: string;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  date: Timestamp | string | Date;
  imageUrl: string;
  settlementResultJson: string;
  createdAt?: number;
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

    // Step 3: Wait for all parallel fetches to complete, sorted by createdAt descending
    const eventsWithActivities = (await Promise.all(eventsWithActivitiesPromises)).sort((a, b) => {
      const aCreated = a.createdAt ?? 0;
      const bCreated = b.createdAt ?? 0;
      return bCreated - aCreated;
    });

    console.log(
      `✅ Fetched ${eventsWithActivities.length} events with activities`
    );
    return eventsWithActivities;
  } catch (error) {
    console.error("Error fetching events with activities:", error);
    return [];
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
  participants: { name: string; avatarName?: string }[];
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
      createdAt: Date.now(),
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
    const updateData: Partial<{
      title: string;
      location: string;
      date: string;
      imageUrl: string;
      participants: { name: string; avatarName?: string }[];
    }> = {};

    if (data.title !== undefined) updateData.title = data.title;
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
 * Create a new activity under users/{userId}/events/{eventId}/activities
 * Path: users/{userId}/events/{eventId}/activities/{activityId}
 * Returns the new activity ID
 */
export async function createActivity(
  userId: string,
  eventId: string,
  data: {
    title: string;
    amount: number;
    category: string;
    categoryColorHex?: string;
    paidBy: { name: string; avatarName: string };
    participants: { name: string; avatarName: string }[];
    payerName: string;
  }
): Promise<string> {
  try {
    const activitiesRef = collection(db, "users", userId, "events", eventId, "activities");
    
    const docRef = await addDoc(activitiesRef, {
      title: data.title,
      amount: data.amount,
      category: data.category,
      categoryColorHex: data.categoryColorHex || "",
      eventId: eventId,
      paidBy: data.paidBy,
      participants: data.participants,
      payerName: data.payerName,
    });
    
    console.log(`✅ Created activity: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("Error creating activity:", error);
    throw error;
  }
}

/**
 * Update an existing activity
 * Path: users/{userId}/events/{eventId}/activities/{activityId}
 */
export async function updateActivity(
  userId: string,
  eventId: string,
  activityId: string,
  data: Partial<{
    title: string;
    amount: number;
    category: string;
    categoryColorHex: string;
    paidBy: { name: string; avatarName: string };
    participants: { name: string; avatarName: string }[];
    payerName: string;
  }>
): Promise<void> {
  try {
    const activityRef = doc(db, "users", userId, "events", eventId, "activities", activityId);
    await updateDoc(activityRef, data);
    console.log(`✅ Updated activity: ${activityId}`);
  } catch (error) {
    console.error("Error updating activity:", error);
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

// ==================== CREATE / UPDATE / DELETE ITEM ====================

/**
 * Create a new item under users/{userId}/events/{eventId}/activities/{activityId}/items
 * Path: users/{userId}/events/{eventId}/activities/{activityId}/items/{itemId}
 * Returns the new item ID
 */
export async function createItem(
  userId: string,
  eventId: string,
  activityId: string,
  data: {
    itemName: string;
    price: number;
    quantity: number;
    memberNames: string[];
    discountAmount?: number;
    taxPercentage?: number;
  }
): Promise<string> {
  try {
    const itemsRef = collection(
      db,
      "users",
      userId,
      "events",
      eventId,
      "activities",
      activityId,
      "items"
    );

    const docRef = await addDoc(itemsRef, {
      itemName: data.itemName,
      price: data.price,
      quantity: data.quantity,
      memberNames: data.memberNames,
      discountAmount: data.discountAmount || 0,
      taxPercentage: data.taxPercentage || 0,
      timestamp: Date.now(),
    });

    console.log(`✅ Created item: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("Error creating item:", error);
    throw error;
  }
}

/**
 * Update an existing item
 * Path: users/{userId}/events/{eventId}/activities/{activityId}/items/{itemId}
 */
export async function updateItem(
  userId: string,
  eventId: string,
  activityId: string,
  itemId: string,
  data: Partial<{
    itemName: string;
    price: number;
    quantity: number;
    memberNames: string[];
    discountAmount: number;
    taxPercentage: number;
  }>
): Promise<void> {
  try {
    const itemRef = doc(
      db,
      "users",
      userId,
      "events",
      eventId,
      "activities",
      activityId,
      "items",
      itemId
    );
    await updateDoc(itemRef, data);
    console.log(`✅ Updated item: ${itemId}`);
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
}

/**
 * Delete an item from an activity
 * Path: users/{userId}/events/{eventId}/activities/{activityId}/items/{itemId}
 */
export async function deleteItem(
  userId: string,
  eventId: string,
  activityId: string,
  itemId: string
): Promise<void> {
  try {
    const itemRef = doc(
      db,
      "users",
      userId,
      "events",
      eventId,
      "activities",
      activityId,
      "items",
      itemId
    );
    await deleteDoc(itemRef);
    console.log(`✅ Deleted item: ${itemId}`);
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
}