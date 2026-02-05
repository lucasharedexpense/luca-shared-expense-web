// src/components/ui/FabAddActivity.tsx
"use client";

import { Plus } from "@/components/ui/Icons";

interface FabProps {
  onClick: () => void;
}

export default function FabAdd({ onClick }: FabProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-25 right-5 z-40 w-14 h-14 text-ui-black bg-ui-white rounded-full shadow-lg shadow-ui-black/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
      aria-label="Add Activity"
    >
      <Plus className="w-7 h-7"/>
    </button>
  );
}