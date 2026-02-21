/**
 * Summary Page — Client Component
 *
 * Reads the pre-computed settlement that was saved to Firestore by the
 * `generateAndSaveSettlement` server action, and also fetches
 * activities/items to compute fresh consumption details client-side.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculateConsumptionDetails } from "@/lib/smart-split-algorithm";
import type {
  FirestoreActivity,
  FirestoreItem,
  SettlementTransaction,
  ConsumptionDetail,
} from "@/lib/smart-split-algorithm";
import SummaryClientView from "./SummaryClientView";
import type { SummaryPageData, SummaryParticipant } from "./summary-data";

export default function SummaryPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? "");
  const { userId, loading: authLoading } = useAuth();

  const [data, setData] = useState<SummaryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userId || !eventId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        // ── 1. Fetch event doc (has settlementResultJson + participants) ──────
        const eventRef = doc(db, "users", userId, "events", eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
          setError("Event not found.");
          return;
        }

        const eventData = eventSnap.data();
        const eventName: string = eventData.title ?? eventData.name ?? "";
        const participants: SummaryParticipant[] = (
          eventData.participants ?? []
        ).map((p: Record<string, unknown>) => ({
          name: (p.name as string) ?? "",
          avatar: (p.avatar as string) ?? undefined,
          avatarName: (p.avatarName as string) ?? undefined,
        }));

        // ── 2. Parse cached settlements from Firestore ─────────────────────
        let settlements: SettlementTransaction[] = [];
        let calculatedAt: string | null = null;

        try {
          const parsed = JSON.parse(eventData.settlementResultJson || "{}");
          settlements = parsed.settlements ?? [];
          calculatedAt = parsed.calculatedAt ?? null;
        } catch {
          // Fallback: empty settlements
        }

        // ── 3. Fetch activities + items for fresh consumption details ──────
        const activitiesSnap = await getDocs(
          collection(db, "users", userId, "events", eventId, "activities"),
        );

        const activities: FirestoreActivity[] = await Promise.all(
          activitiesSnap.docs.map(async (actDoc) => {
            const d = actDoc.data();

            const itemsSnap = await getDocs(
              collection(
                db,
                "users",
                userId,
                "events",
                eventId,
                "activities",
                actDoc.id,
                "items",
              ),
            );

            const items: FirestoreItem[] = itemsSnap.docs.map((itemDoc) => {
              const id = itemDoc.data();
              return {
                id: itemDoc.id,
                itemName: id.itemName ?? "",
                price: id.price ?? 0,
                quantity: id.quantity ?? 0,
                taxPercentage: id.taxPercentage,
                discountAmount: id.discountAmount,
                memberNames: id.memberNames ?? [],
              };
            });

            return {
              id: actDoc.id,
              payerName: d.payerName ?? "",
              title: d.title ?? "",
              items,
            };
          }),
        );

        // ── 4. Compute consumption details + total expense client-side ─────
        const consumptionDetails: ConsumptionDetail[] =
          calculateConsumptionDetails(activities);

        let totalExpense = 0;
        for (const act of activities) {
          for (const item of act.items) {
            const itemTotal = item.price * item.quantity;
            const afterTax =
              itemTotal * (1 + (item.taxPercentage ?? 0) / 100);
            totalExpense += Math.max(
              0,
              afterTax - (item.discountAmount ?? 0),
            );
          }
        }
        totalExpense = Math.round(totalExpense * 100) / 100;

        setData({
          eventName,
          participants,
          settlements,
          consumptionDetails,
          totalExpense,
          calculatedAt,
        });
      } catch (err) {
        console.error("[SummaryPage] Error loading data:", err);
        setError(err instanceof Error ? err.message : "Failed to load summary.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId, eventId, authLoading]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-ui-background gap-4">
        <div className="w-12 h-12 border-4 border-ui-accent-yellow border-t-transparent rounded-full animate-spin" />
        <p className="text-ui-dark-grey">Loading summary...</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-ui-background gap-4 text-center p-6">
        <p className="text-ui-dark-grey font-bold text-lg">
          {error ?? "Event not found."}
        </p>
      </div>
    );
  }

  return <SummaryClientView data={data} />;
}