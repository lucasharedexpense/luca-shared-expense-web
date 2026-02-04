"use client";

import React from "react";

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ label, checked, onChange, disabled = false }: ToggleProps) {
  return (
    <div 
      className={`flex flex-col items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      {/* Label (Optional) */}
      {label && (
        <span className="text-[10px] font-bold text-ui-black mb-1 select-none">
          {label}
        </span>
      )}

      {/* Switch Track */}
      <div 
        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
          checked ? 'bg-ui-accent-yellow' : 'bg-gray-200'
        }`}
      >
        {/* Switch Thumb (Bulatannya) */}
        <div 
          className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  );
}