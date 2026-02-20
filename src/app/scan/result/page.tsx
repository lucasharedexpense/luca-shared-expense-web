"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import Header from "@/components/ui/Header";
import { useScan } from "../scan-context";

export default function ResultPage() {
  const router = useRouter();
  const { receiptData, reset } = useScan();

  // Handle redirect when no receipt data is available
  useEffect(() => {
    if (!receiptData) {
      router.push("/scan/camera");
    }
  }, [receiptData, router]);

  const formatCurrency = (value: string | null): string => {
    if (!value) return "-";
    return `Rp ${value}`;
  };

  // Show loading state while redirecting
  if (!receiptData) {
    return null;
  }

  const handleScanAnother = () => {
    reset();
    router.push("/scan/camera");
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-ui-background">
      <Header variant="SCAN" onLeftIconClick={() => router.push("/home")} />

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6">
        <div className="max-w-2xl mx-auto">
          {/* SUCCESS MESSAGE */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-green-700">Receipt scanned successfully!</p>
          </div>

          {/* TOTAL AMOUNT - PROMINENT */}
          <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100 text-center">
            <p className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest mb-2">Total Amount</p>
            <p className="text-5xl font-bold text-ui-black font-mono">
              {formatCurrency(receiptData.total)}
            </p>
          </div>

          {/* ITEMS TABLE */}
          {receiptData.items && receiptData.items.length > 0 && (
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-ui-black mb-4 text-sm uppercase tracking-widest text-ui-dark-grey">
                Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-ui-dark-grey">Item</th>
                      <th className="text-center py-3 px-2 font-semibold text-ui-dark-grey">Qty</th>
                      <th className="text-right py-3 px-2 font-semibold text-ui-dark-grey">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 text-ui-black font-medium">{item.name || "-"}</td>
                        <td className="py-3 px-2 text-center text-ui-dark-grey">{item.qty || "-"}</td>
                        <td className="py-3 px-2 text-right text-ui-black font-semibold">
                          {item.price ? `Rp ${item.price}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUMMARY SECTION */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-ui-black mb-4 text-sm uppercase tracking-widest text-ui-dark-grey">
              Summary
            </h2>
            <div className="space-y-3">
              {/* Subtotal */}
              {receiptData.subtotal && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-ui-dark-grey">Subtotal</span>
                  <span className="text-sm font-semibold text-ui-black">{formatCurrency(receiptData.subtotal)}</span>
                </div>
              )}

              {/* Tax */}
              {receiptData.tax && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-ui-dark-grey">Tax (PB1)</span>
                  <span className="text-sm font-semibold text-ui-black">{formatCurrency(receiptData.tax)}</span>
                </div>
              )}

              {/* Service Charge */}
              {receiptData.service_charge && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-ui-dark-grey">Service Charge</span>
                  <span className="text-sm font-semibold text-ui-black">
                    {formatCurrency(receiptData.service_charge)}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center py-3 mt-4">
                <span className="font-bold text-ui-black">Total</span>
                <span className="text-lg font-bold text-ui-accent-yellow">{formatCurrency(receiptData.total)}</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={handleScanAnother}
              className="flex-1 py-3 bg-gray-100 text-ui-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Scan Another
            </button>
            <button className="flex-1 py-3 bg-ui-accent-yellow text-ui-black font-bold rounded-xl hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-yellow-500/20">
              Add to Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
