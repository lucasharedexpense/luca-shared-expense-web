"use server";

/**
 * Server Action — Generate & Save Settlement, then Redirect
 *
 * 1. Fetches all activities + their items sub-collections using firebase-admin.
 * 2. Runs the Smart Split Bill algorithm (3-step graph optimization).
 * 3. Calculates per-user Consumption Details.
 * 4. Persists the result to the event's `settlementResultJson` field.
 * 5. Redirects the user to the Summary Page.
 *
 * Firestore path structure:
 *   users/{userId}/events/{eventId}
 *     └─ activities/{activityId}
 *          └─ items/{itemId}
 */

import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import {
  smartSplitBill,
  calculateConsumptionDetails,
  type FirestoreActivity,
  type FirestoreItem,
  type SettlementTransaction,
  type ConsumptionDetail,
} from "@/lib/smart-split-algorithm";

// ─── Return type (used when redirect is not desired) ────────────────────────────

export interface SettlementActionResult {
  success: boolean;
  settlements: SettlementTransaction[];
  consumptionDetails: ConsumptionDetail[];
  error?: string;
}

// ─── Internal helper: fetch items sub-collection for one activity ────────────────

async function fetchActivityItems(
  userId: string,
  eventId: string,
  activityId: string,
): Promise<FirestoreItem[]> {
  const itemsSnapshot = await adminDb
    .collection("users")
    .doc(userId)
    .collection("events")
    .doc(eventId)
    .collection("activities")
    .doc(activityId)
    .collection("items")
    .get();

  return itemsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data();
    return {
      id: doc.id,
      itemName: data.itemName ?? "",
      price: data.price ?? 0,
      quantity: data.quantity ?? 0,
      taxPercentage: data.taxPercentage,
      discountAmount: data.discountAmount,
      memberNames: data.memberNames ?? [],
    } satisfies FirestoreItem;
  });
}

// ─── Internal: core logic shared by both actions ────────────────────────────────

async function runSettlementPipeline(
  userId: string,
  eventId: string,
): Promise<SettlementActionResult> {
  // ── 1. Fetch all activities for this event ──────────────────────────────
  const activitiesSnapshot = await adminDb
    .collection("users")
    .doc(userId)
    .collection("events")
    .doc(eventId)
    .collection("activities")
    .get();

  if (activitiesSnapshot.empty) {
    return { success: true, settlements: [], consumptionDetails: [] };
  }

  // ── 2. For each activity, fetch its items sub-collection in parallel ────
  const activities: FirestoreActivity[] = await Promise.all(
    activitiesSnapshot.docs.map(async (actDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = actDoc.data();
      const items = await fetchActivityItems(userId, eventId, actDoc.id);
      return {
        id: actDoc.id,
        payerName: data.payerName ?? "",
        title: data.title ?? "",
        items,
      };
    }),
  );

  // ── 3. Run Smart Split Bill algorithm ───────────────────────────────────
  const settlements: SettlementTransaction[] = smartSplitBill(activities);

  // ── 4. Calculate Consumption Details ────────────────────────────────────
  const consumptionDetails: ConsumptionDetail[] =
    calculateConsumptionDetails(activities);

  // ── 5. Save result to Firestore ─────────────────────────────────────────
  const eventRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("events")
    .doc(eventId);

  await eventRef.update({
    settlementResultJson: JSON.stringify({
      settlements,
      consumptionDetails,
      calculatedAt: new Date().toISOString(),
    }),
  });

  return { success: true, settlements, consumptionDetails };
}

// ─── Server Action 1: Calculate + Save + Redirect ───────────────────────────────

/**
 * Called from the "Summarize" button on the Event Detail page.
 * Calculates settlement, persists to Firestore, and redirects to Summary Page.
 */
export async function generateAndSaveSettlement(
  userId: string,
  eventId: string,
): Promise<never> {
  await runSettlementPipeline(userId, eventId);

  // redirect() throws internally (NEXT_REDIRECT) — it never "returns".
  redirect(`/event/${eventId}/summary`);
}

// ─── Server Action 2: Calculate + Save + Return (for modal/popup usage) ─────────

/**
 * Alternative entry point — same logic but returns the data instead of
 * redirecting.  Useful if you want to show results in a modal/popup.
 */
export async function calculateEventSettlement(
  userId: string,
  eventId: string,
): Promise<SettlementActionResult> {
  try {
    return await runSettlementPipeline(userId, eventId);
  } catch (error) {
    return {
      success: false,
      settlements: [],
      consumptionDetails: [],
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
