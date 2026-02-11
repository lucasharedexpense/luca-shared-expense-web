/**
 * ActivityItem Component
 * Displays activity information with payer and amount
 * Design: Icon + Title + "Paid by X" on left, Amount (red, bold) on right
 */

import React from "react";
import { Receipt } from "lucide-react";

// ==================== TYPE DEFINITIONS ====================

interface ActivityItemProps {
  activity: {
    id: string;
    title: string;
    category: string;
    payerName: string;
    total: number;
  };
  onClick?: (id: string) => void;
}

// ==================== ACTIVITY ITEM COMPONENT ====================

export default function ActivityItem({ activity, onClick }: ActivityItemProps) {
  // Format currency as IDR (no decimals)
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(activity.total);

  return (
    <div 
      onClick={() => onClick?.(activity.id)}
      className={`flex items-center justify-between py-2.5 px-3 bg-ui-grey/30 rounded-xl hover:bg-ui-grey/50 transition-colors ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      }`}
    >
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

      {/* Right Side: Amount (Red, Bold) */}
      <div className="flex-shrink-0 ml-3">
        <span className="text-sm font-bold text-red-500">
          {formattedAmount}
        </span>
      </div>
    </div>
  );
}

// ==================== CATEGORY ICON MAPPER (Optional Enhancement) ====================

/**
 * Optional: Map category to different icons
 * Usage: getCategoryIcon(activity.category)
 */
export function getCategoryIcon(category: string) {
  const icons: Record<string, React.ReactNode> = {
    Food: <Receipt className="w-5 h-5" />,
    Transport: <Receipt className="w-5 h-5" />,
    Shopping: <Receipt className="w-5 h-5" />,
    Entertainment: <Receipt className="w-5 h-5" />,
    // Add more categories as needed
  };

  return icons[category] || <Receipt className="w-5 h-5" />;
}
