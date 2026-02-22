/**
 * Server-side data fetching utilities for the Summary Page.
 *
 * Uses firebase-admin to read Firestore, so this module is
 * only importable from Server Components / Server Actions.
 */

import { adminDb } from "@/lib/firebase-admin";
import {
  calculateConsumptionDetails,
  type FirestoreActivity,
  type FirestoreItem,
  type SettlementTransaction,
  type ConsumptionDetail,
} from "@/lib/smart-split-algorithm";

// ─── Shared types re-exported for convenience ───────────────────────────────────

export type { SettlementTransaction, ConsumptionDetail };

export interface SummaryParticipant {
  name: string;
  avatar?: string;
  avatarName?: string;
}

export interface SummaryPageData {
  eventName: string;
  participants: SummaryParticipant[];
  settlements: SettlementTransaction[];
  consumptionDetails: ConsumptionDetail[];
  totalExpense: number;
  calculatedAt: string | null;
}

// ─── Data fetcher ───────────────────────────────────────────────────────────────

/**
 * Fetch everything the Summary Page needs in a single call.
 *
 * 1. Reads the event document for `settlementResultJson`, name, participants.
 * 2. Reads activities → items sub-collections, runs `calculateConsumptionDetails`
 *    on the fly for fresh consumption data.
 * 3. Returns a plain-object `SummaryPageData` safe for serialisation to the client.
 */
export async function fetchSummaryPageData(
  userId: string,
  eventId: string,
): Promise<SummaryPageData | null> {
  // ── 1. Fetch event document ───────────────────────────────────────────────
  const eventDoc = await adminDb
    .collection("users")
    .doc(userId)
    .collection("events")
    .doc(eventId)
    .get();

  if (!eventDoc.exists) return null;

  const eventData = eventDoc.data()!;
  const eventName: string = eventData.title ?? eventData.name ?? "";
  const participants: SummaryParticipant[] = (eventData.participants ?? []).map(
    (p: Record<string, unknown>) => ({
      name: (p.name as string) ?? "",
      avatar: (p.avatar as string) ?? undefined,
      avatarName: (p.avatarName as string) ?? undefined,
    }),
  );

  // Parse cached settlement result
  let settlements: SettlementTransaction[] = [];
  let calculatedAt: string | null = null;

  try {
    const parsed = JSON.parse(eventData.settlementResultJson || "{}");
    settlements = parsed.settlements ?? [];
    calculatedAt = parsed.calculatedAt ?? null;
  } catch {
    // If JSON is malformed, we just show empty settlements
  }

  // ── 2. Fetch activities + items (for fresh consumption details) ───────────
  const activitiesSnapshot = await adminDb
    .collection("users")
    .doc(userId)
    .collection("events")
    .doc(eventId)
    .collection("activities")
    .get();

  const activities: FirestoreActivity[] = await Promise.all(
    activitiesSnapshot.docs.map(async (actDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = actDoc.data();

      const itemsSnapshot = await adminDb
        .collection("users")
        .doc(userId)
        .collection("events")
        .doc(eventId)
        .collection("activities")
        .doc(actDoc.id)
        .collection("items")
        .get();

      const items: FirestoreItem[] = itemsSnapshot.docs.map((itemDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const d = itemDoc.data();
        return {
          id: itemDoc.id,
          itemName: d.itemName ?? "",
          price: d.price ?? 0,
          quantity: d.quantity ?? 0,
          taxPercentage: d.taxPercentage,
          discountAmount: d.discountAmount,
          memberNames: d.memberNames ?? [],
        };
      });

      return {
        id: actDoc.id,
        payerName: data.payerName ?? "",
        title: data.title ?? "",
        items,
      };
    }),
  );

  // ── 3. Compute consumption details on the fly ─────────────────────────────
  const consumptionDetails = calculateConsumptionDetails(activities);

  // ── 4. Compute total expense ──────────────────────────────────────────────
  let totalExpense = 0;
  for (const act of activities) {
    for (const item of act.items) {
      const itemTotal = item.price * item.quantity;
      const afterTax = itemTotal * (1 + (item.taxPercentage ?? 0) / 100);
      totalExpense += Math.max(0, afterTax - (item.discountAmount ?? 0));
    }
  }
  totalExpense = Math.round(totalExpense * 100) / 100;

  return {
    eventName,
    participants,
    settlements,
    consumptionDetails,
    totalExpense,
    calculatedAt,
  };
}
