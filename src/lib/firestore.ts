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
  getDoc,
  where,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ==================== HELPERS ====================

/**
 * Get the Firestore document ID for a user by their auth UID
 * This is CRITICAL: Auth UID ≠ Firestore Document ID
 */
async function getUserDocId(uid: string): Promise<string> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error(`User document not found for UID: ${uid}`);
    }
    const userDocId = querySnapshot.docs[0].id;
    console.log("[Firestore] Resolved UID", uid, "to Document ID:", userDocId);
    return userDocId;
  } catch (error) {
    console.error("[Firestore] Error resolving user document ID:", error);
    throw error;
  }
}

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
  isSplitEqual?: boolean;
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
  isFinish?: number; // 0 = ongoing, 1 = finished
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
    isSplitEqual: data.isSplitEqual ?? false,
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
    createdAt: data.createdAt || 0,
  };
}

/**
 * Fetch all activities for a specific event, including their items sub-collection
 * Path: users/{userId}/events/{eventId}/activities
 *       users/{userId}/events/{eventId}/activities/{activityId}/items
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

    // For each activity, also fetch its items sub-collection
    const activities = await Promise.all(
      activitiesSnapshot.docs.map(async (actDoc) => {
        const activity = docToActivity(actDoc);

        // Fetch items sub-collection for this activity
        const itemsRef = collection(
          db,
          "users",
          userId,
          "events",
          eventId,
          "activities",
          actDoc.id,
          "items"
        );
        const itemsSnapshot = await getDocs(itemsRef);

        const items: ActivityItem[] = itemsSnapshot.docs.map((itemDoc) => {
          const d = itemDoc.data();
          return {
            itemName: d.itemName ?? "",
            price: d.price ?? 0,
            quantity: d.quantity ?? 0,
            memberNames: d.memberNames ?? [],
            discountAmount: d.discountAmount,
            taxPercentage: d.taxPercentage,
            timestamp: d.timestamp,
          };
        });

        return { ...activity, items };
      })
    );

    return activities;
  } catch (error) {
    return []; // Return empty array if error
  }
}

/**
 * Fetch all events with their activities for a user
 * Path: users/{userDocId}/events → users/{userDocId}/events/{eventId}/activities
 * 
 * @param userId - The Firebase Auth UID (will be resolved to Firestore document ID)
 * @returns Promise<EventWithActivities[]> - Array of events with nested activities
 */
export async function getEventsWithActivities(
  userId: string
): Promise<EventWithActivities[]> {
  try {
    console.log("[Firestore] Fetching events for user UID:", userId);
    
    // Convert Auth UID to Firestore Document ID
    const userDocId = await getUserDocId(userId);
    
    // Step 1: Fetch all events for this user
    const eventsRef = collection(db, "users", userDocId, "events");
    const eventsSnapshot = await getDocs(eventsRef);

    if (eventsSnapshot.empty) {
      console.log("[Firestore] No events found for user");
      return [];
    }

    console.log("[Firestore] Found", eventsSnapshot.size, "events");

    // Step 2: For each event, fetch its activities in parallel
    const eventsWithActivitiesPromises = eventsSnapshot.docs.map(
      async (eventDoc) => {
        const event = docToEvent(eventDoc);
        // Fetch activities for this event (nested sub-collection)
        const activities = await getActivitiesForEvent(userDocId, event.id);
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

    return eventsWithActivities;
  } catch (error) {
    console.error("[Firestore] Error fetching events:", error);
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
    console.log("[Firestore] Fetching event", eventId, "for user UID:", userId);
    
    // Convert Auth UID to Firestore Document ID
    const userDocId = await getUserDocId(userId);
    
    const activitiesRef = collection(
      db,
      "users",
      userDocId,
      "events",
      eventId,
      "activities"
    );

    // Fetch event document and activities in parallel
    const [eventSnapshot, activitiesSnapshot] = await Promise.all([
      getDocs(query(collection(db, "users", userDocId, "events"))),
      getDocs(activitiesRef),
    ]);

    // Find the specific event
    const eventDoc = eventSnapshot.docs.find((doc) => doc.id === eventId);
    if (!eventDoc) {
      console.warn("[Firestore] Event not found:", eventId);
      return null;
    }

    const event = docToEvent(eventDoc);
    const activities = activitiesSnapshot.docs.map(docToActivity);

    return {
      ...event,
      activities,
    };
  } catch (error) {
    console.error("[Firestore] Error fetching event:", error);
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
  isFinish?: number;
}

/**
 * Create a new event under users/{userDocId}/events
 * IMPORTANT: Uses Firestore document ID (not Auth UID)
 * Returns the new event ID
 */
export async function createEvent(
  userId: string,
  data: CreateEventData
): Promise<string> {
  try {
    console.log("[Firestore] Creating event for user UID:", userId);
    
    // Convert Auth UID to Firestore Document ID
    const userDocId = await getUserDocId(userId);
    
    const eventsRef = collection(db, "users", userDocId, "events");
    console.log("[Firestore] Events collection reference path: users/" + userDocId + "/events");
    
    const eventDoc = {
      title: data.title,
      location: data.location || "",
      date: typeof data.date === "string" ? data.date : formatDateToDDMMYYYY(data.date),
      imageUrl: data.imageUrl || "",
      participants: data.participants,
      settlementResultJson: "{}",
      createdAt: Date.now(),
      isFinish: 0,
    };
    
    console.log("[Firestore] Document to save:", eventDoc);
    
    const docRef = await addDoc(eventsRef, eventDoc);
    console.log("[Firestore] ✅ Event created successfully with ID:", docRef.id);
    
    // Verify the event was actually written by immediately reading it back
    console.log("[Firestore] Verifying event was written to database...");
    try {
      const eventRef = doc(db, "users", userDocId, "events", docRef.id);
      const verifySnap = await getDoc(eventRef);
      
      if (verifySnap.exists()) {
        console.log("[Firestore] ✅✅ Verification SUCCESS - Event exists in database:", verifySnap.data());
      } else {
        console.error("[Firestore] ❌ Verification FAILED - Event does NOT exist in database after creation!");
      }
    } catch (verifyError) {
      console.error("[Firestore] Verification check failed:", verifyError);
    }
    
    return docRef.id;
  } catch (error) {
    console.error("[Firestore] ❌ Error creating event:", error);
    throw error;
  }
}

/**
 * Update an existing event
 * Path: users/{userDocId}/events/{eventId}
 */
export async function updateEvent(
  userId: string,
  eventId: string,
  data: Partial<CreateEventData>
): Promise<void> {
  try {
    console.log("[Firestore] Updating event", eventId, "for user UID:", userId);
    
    // Convert Auth UID to Firestore Document ID
    const userDocId = await getUserDocId(userId);
    
    const eventRef = doc(db, "users", userDocId, "events", eventId);
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
    console.log("[Firestore] Event updated successfully");
  } catch (error) {
    console.error("[Firestore] Error updating event:", error);
    throw error;
  }
}

/**
 * Delete an event
 * Path: users/{userDocId}/events/{eventId}
 */
export async function deleteEvent(
  userId: string,
  eventId: string
): Promise<void> {
  try {
    console.log("[Firestore] Deleting event", eventId, "for user UID:", userId);
    
    // Convert Auth UID to Firestore Document ID
    const userDocId = await getUserDocId(userId);
    
    const eventRef = doc(db, "users", userDocId, "events", eventId);
    await deleteDoc(eventRef);
    console.log("[Firestore] Event deleted successfully");
  } catch (error) {
    console.error("[Firestore] Error deleting event:", error);
    throw error;
  }
}

/**
 * Create a new activity under users/{userDocId}/events/{eventId}/activities
 * Path: users/{userDocId}/events/{eventId}/activities/{activityId}
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
    console.log("[Firestore] Creating activity for event", eventId, "user UID:", userId);
    
    // Convert Auth UID to Firestore Document ID
    const userDocId = await getUserDocId(userId);
    
    const activitiesRef = collection(db, "users", userDocId, "events", eventId, "activities");
    
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
    
    console.log("[Firestore] Activity created successfully", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[Firestore] Error creating activity:", error);
    throw error;
  }
}

/**
 * Update an existing activity
 * Path: users/{userDocId}/events/{eventId}/activities/{activityId}
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
    console.log("[Firestore] Updating activity", activityId, "for user UID:", userId);
    
    // Convert Auth UID to Firestore Document ID
    const userDocId = await getUserDocId(userId);
    
    const activityRef = doc(db, "users", userDocId, "events", eventId, "activities", activityId);
    await updateDoc(activityRef, data);
    console.log("[Firestore] Activity updated successfully");
  } catch (error) {
    console.error("[Firestore] Error updating activity:", error);
    throw error;
  }
}

/**
 * Delete an activity from an event
 * Path: users/{userDocId}/events/{eventId}/activities/{activityId}
 */
export async function deleteActivity(
  userId: string,
  eventId: string,
  activityId: string
): Promise<void> {
  try {
    console.log("[Firestore] Deleting activity", activityId, "for user UID:", userId);
    
    // Convert Auth UID to Firestore Document ID
    const userDocId = await getUserDocId(userId);
    
    const activityRef = doc(db, "users", userDocId, "events", eventId, "activities", activityId);
    await deleteDoc(activityRef);
    console.log("[Firestore] Activity deleted successfully");
  } catch (error) {
    console.error("[Firestore] Error deleting activity:", error);
    throw error;
  }
}

// ==================== CREATE / UPDATE / DELETE ITEM ====================

/**
 * Create a new item under users/{userDocId}/events/{eventId}/activities/{activityId}/items
 * Path: users/{userDocId}/events/{eventId}/activities/{activityId}/items/{itemId}
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
    console.log("[Firestore] Creating item for activity", activityId, "user UID:", userId);
    
    // Convert Auth UID to Firestore Document ID
    const userDocId = await getUserDocId(userId);
    
    const itemsRef = collection(
      db,
      "users",
      userDocId,
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

    console.log("[Firestore] Item created successfully", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[Firestore] Error creating item:", error);
    throw error;
  }
}

/**
 * Update an existing item
 * Path: users/{userDocId}/events/{eventId}/activities/{activityId}/items/{itemId}
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
    console.log("[Firestore] Updating item", itemId, "for user UID:", userId);
    
    // Convert Auth UID to Firestore Document ID
    const userDocId = await getUserDocId(userId);
    
    const itemRef = doc(
      db,
      "users",
      userDocId,
      "events",
      eventId,
      "activities",
      activityId,
      "items",
      itemId
    );
    await updateDoc(itemRef, data);
    console.log("[Firestore] Item updated successfully");
  } catch (error) {
    console.error("[Firestore] Error updating item:", error);
    throw error;
  }
}

/**
 * Delete an item from an activity
 * Path: users/{userDocId}/events/{eventId}/activities/{activityId}/items/{itemId}
 */
export async function deleteItem(
  userId: string,
  eventId: string,
  activityId: string,
  itemId: string
): Promise<void> {
  try {
    console.log("[Firestore] Deleting item", itemId, "for user UID:", userId);
    
    // Convert Auth UID to Firestore Document ID
    const userDocId = await getUserDocId(userId);
    
    const itemRef = doc(
      db,
      "users",
      userDocId,
      "events",
      eventId,
      "activities",
      activityId,
      "items",
      itemId
    );
    await deleteDoc(itemRef);
    console.log("[Firestore] Item deleted successfully");
  } catch (error) {
    console.error("[Firestore] Error deleting item:", error);
    throw error;
  }
}

/**
 * Diagnostic function to check Firestore connectivity and database status
 * This helps troubleshoot why events aren't being written
 */
export async function diagnosticCheckFirestore(): Promise<void> {
  try {
    console.log("\n=== FIRESTORE DIAGNOSTIC CHECK ===");
    
    // Check database instance
    console.log("[DIAGNOSTIC] Database instance:", db);
    console.log("[DIAGNOSTIC] Database project ID:", (db as any)?.projectId || "unknown");
    
    // Try reading from users collection to verify connectivity
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(query(usersRef));
    console.log("[DIAGNOSTIC] ✅ Firestore connectivity OK - Found", usersSnapshot.size, "users in database");
    
    // Check Firestore settings
    console.log("[DIAGNOSTIC] Firestore configured and responsive");
    console.log("[DIAGNOSTIC] If events still don't appear:");
    console.log("   1. Go to Firebase Console > Firestore Database");
    console.log("   2. Check the Project ID matches:", (db as any)?.projectId);
    console.log("   3. Verify Security Rules allow writes to users/{uid}/events");
    console.log("   4. Check Network tab in DevTools for failed requests");
    
  } catch (error) {
    console.error("[DIAGNOSTIC] ❌ FIRESTORE ERROR:", error);
    console.error("[DIAGNOSTIC] This indicates Firestore is not accessible");
    throw error;
  }
}
