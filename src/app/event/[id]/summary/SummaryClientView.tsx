"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Share2,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Flag,
  Loader2,
} from "lucide-react";
import { updateEvent, removeEventFromContactsIsEvent } from "@/lib/firestore";
import type {
  SummaryPageData,
  SummaryParticipant,
  SettlementTransaction,
  ConsumptionDetail,
} from "./summary-data";

// ─── HELPERS ────────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const getAvatarByName = (name: string, participants: SummaryParticipant[]) => {
  const p = participants.find((pt) => pt.name === name);
  const avatar = p?.avatar;
  if (avatar && avatar.startsWith("http")) return avatar;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
};

// ─── Sub-Components ─────────────────────────────────────────────────────────────

interface SettlementWithPaid extends SettlementTransaction {
  isPaid: boolean;
}

function SummaryTabSwitcher({
  currentTab,
  onTabChange,
}: {
  currentTab: "SETTLEMENT" | "DETAILS";
  onTabChange: (t: "SETTLEMENT" | "DETAILS") => void;
}) {
  return (
    <div className="mx-6 h-12 bg-white rounded-full border border-gray-100 p-1 flex relative">
      <button
        onClick={() => onTabChange("SETTLEMENT")}
        className={`flex-1 rounded-full text-sm font-bold z-10 transition-colors ${
          currentTab === "SETTLEMENT" ? "text-ui-black" : "text-ui-dark-grey"
        }`}
      >
        Settlement
      </button>
      <button
        onClick={() => onTabChange("DETAILS")}
        className={`flex-1 rounded-full text-sm font-bold z-10 transition-colors ${
          currentTab === "DETAILS" ? "text-ui-black" : "text-ui-dark-grey"
        }`}
      >
        Details
      </button>

      {/* Animated Background Pill */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-ui-accent-yellow rounded-full transition-all duration-300 ease-in-out ${
          currentTab === "SETTLEMENT" ? "left-1" : "left-[calc(50%+4px)]"
        }`}
      />
    </div>
  );
}

function SettlementCard({
  item,
  participants,
}: {
  item: SettlementWithPaid;
  participants: SummaryParticipant[];
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
        item.isPaid
          ? "bg-gray-50 border-transparent opacity-80"
          : "bg-white border-ui-accent-yellow/50 shadow-sm"
      }`}
    >
      {/* Avatars Flow */}
      <div className="flex items-center gap-2 flex-1">
        <div className="relative">
          <Image
            src={getAvatarByName(item.fromName, participants)}
            alt={item.fromName}
            width={40}
            height={40}
            className="rounded-full object-cover bg-gray-200 border border-white"
            unoptimized
          />
          <div className="absolute -bottom-1 -right-1 bg-red-100 text-[8px] font-bold px-1 rounded text-red-600 border border-white">
            PAY
          </div>
        </div>

        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowRight className="w-3 h-3 text-gray-400" />
        </div>

        <div className="relative">
          <Image
            src={getAvatarByName(item.toName, participants)}
            alt={item.toName}
            width={40}
            height={40}
            className="rounded-full object-cover bg-gray-200 border border-white"
            unoptimized
          />
          <div className="absolute -bottom-1 -right-1 bg-green-100 text-[8px] font-bold px-1 rounded text-green-600 border border-white">
            GET
          </div>
        </div>
      </div>

      {/* Names */}
      <div className="flex-1 px-3 min-w-0">
        <p className="text-xs text-ui-dark-grey truncate">
          <span className="font-bold text-ui-black">{item.fromName}</span>
          {" pays "}
          <span className="font-bold text-ui-black">{item.toName}</span>
        </p>
      </div>

      {/* Amount & Status */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span
            className={`font-bold ${
              item.isPaid ? "line-through text-gray-400" : "text-ui-black"
            }`}
          >
            {formatCurrency(item.amount)}
          </span>
        </div>
      </div>
    </div>
  );
}

function UserConsumptionCard({
  detail,
  participants,
}: {
  detail: ConsumptionDetail;
  participants: SummaryParticipant[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={getAvatarByName(detail.userName, participants)}
            alt={detail.userName}
            width={40}
            height={40}
            className="rounded-full object-cover bg-gray-200"
            unoptimized
          />
          <span className="font-bold text-sm text-ui-black">
            {detail.userName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-ui-black">
            {formatCurrency(detail.totalConsumption)}
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded List */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-gray-400 mb-1">
            {detail.items.length} items consumed
          </p>
          {detail.items.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-2 rounded-lg bg-ui-accent-yellow/10"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-ui-black">
                  {item.itemName}
                </span>
                <span className="text-[10px] text-gray-500">
                  {item.activityTitle}
                </span>
              </div>
              <span className="text-xs font-bold">
                {formatCurrency(item.splitAmount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Client Component ──────────────────────────────────────────────────────

export default function SummaryClientView({
  data,
  userId,
}: {
  data: SummaryPageData;
  userId: string;
}) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<"SETTLEMENT" | "DETAILS">(
    "SETTLEMENT",
  );
  const [paidSettlementIds, setPaidSettlementIds] = useState<string[]>([]);
  const [finishingEvent, setFinishingEvent] = useState(false);

  const togglePaid = (id: string) => {
    setPaidSettlementIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const handleFinishEvent = async () => {
    try {
      setFinishingEvent(true);
      // Remove event from all contacts' isEvent arrays
      await removeEventFromContactsIsEvent(userId, data.eventId);
      // Mark event as finished
      await updateEvent(userId, data.eventId, { isFinish: 1 });
      // Redirect to home page after finishing event
      router.push("/home");
    } catch (_error) {
      console.error("Error finishing event:", _error);
      alert("Failed to finish event. Please try again.");
    } finally {
      setFinishingEvent(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-ui-accent-yellow">
      <div className="w-full h-4" />

      {/* White Container (Rounded Top) */}
      <div className="flex-1 bg-ui-background rounded-t-[30px] overflow-hidden flex flex-col relative shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
          {/* Header */}
          <div className="pt-6 px-6 flex items-center gap-3">
            <h2 className="text-xl font-bold text-ui-black">
              {data.eventName}
            </h2>
          </div>

          {/* Tab Switcher */}
          <div className="mt-6">
            <SummaryTabSwitcher
              currentTab={currentTab}
              onTabChange={setCurrentTab}
            />
          </div>

          {/* Tab Content */}
          <div className="mt-6 px-5 flex flex-col gap-4">
            {/* Total Expense Card (Always Visible) */}
            <div className="bg-ui-accent-yellow/20 p-4 rounded-xl flex justify-between items-center border border-ui-accent-yellow/50">
              <span className="font-semibold text-sm text-ui-black">
                Total Expense
              </span>
              <span className="font-bold text-lg text-ui-black">
                {formatCurrency(data.totalExpense)}
              </span>
            </div>

            {currentTab === "SETTLEMENT" ? (
              // ─── Settlement View ────────────────────────────────────────
              <>
                <h3 className="font-bold text-lg mt-2">
                  Settlements ({data.settlements.length})
                </h3>
                {data.settlements.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    No settlements needed. <br /> Everyone is settled up! 🎉
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {data.settlements.map((item) => {
                      const isPaid = paidSettlementIds.includes(item.id);
                      return (
                        <SettlementCard
                          key={item.id}
                          item={{ ...item, isPaid }}
                          participants={data.participants}
                        />
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-400 text-center mt-4 px-4">
                  All calculations are optimized to minimize the number of
                  transactions.
                </p>
              </>
            ) : (
              // ─── Details View ───────────────────────────────────────────
              <>
                <h3 className="font-bold text-lg mt-2">Consumption by User</h3>
                <div className="flex flex-col gap-3">
                  {data.consumptionDetails.map((detail, idx) => (
                    <UserConsumptionCard
                      key={idx}
                      detail={detail}
                      participants={data.participants}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center mt-4 px-4">
                  This shows what each person consumed, not who paid.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Bottom Buttons */}
        {currentTab === "SETTLEMENT" && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-white via-white to-transparent pt-10 flex flex-col gap-3">
            {data.isFinish !== 1 && (
              <button
                onClick={handleFinishEvent}
                disabled={finishingEvent}
                className="w-full h-14 bg-ui-accent-yellow text-ui-black rounded-full shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all font-bold text-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {finishingEvent ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="mt-0.5">Finishing...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-5 h-5" />
                    <span className="mt-0.5">Finish Event</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
