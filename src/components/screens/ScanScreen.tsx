"use client";

import { ScanLine, Camera } from "lucide-react";

export default function ScanPage() {
  return (
    <div className="flex flex-col h-full w-full bg-black relative">
      
      {/* Simulation Camera View */}
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-white/50 space-y-4">
        <div className="relative w-64 h-64 border-2 border-white/30 rounded-3xl flex items-center justify-center">
            {/* Animasi Scanning Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-ui-accent-yellow animate-[bounce_2s_infinite]" />
            <Camera className="w-12 h-12 text-white/20" />
        </div>
        <p className="text-sm font-medium text-center">
            Point your camera at a receipt <br/> or QR code
        </p>
      </div>

      {/* Area bawah kosong biar navbar gak nutupin tombol shutter (ceritanya) */}
      <div className="h-32 bg-black/50 backdrop-blur-sm w-full absolute bottom-0 z-0"></div>
    </div>
  );
}