"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header, { HeaderVariant } from "@/components/ui/Header";
import FloatingNavbar from "@/components/ui/FloatingNavbar";
import Sidebar from "@/components/ui/Sidebar"; 

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // =========================================
  // 1. LOGIC VISIBILITY (PISAH HEADER & NAVBAR)
  // =========================================

  // A. Kapan Header Global Muncul? 
  // Muncul terus KECUALI di "/new-event" (karena dia punya header manual sendiri)
  const shouldShowHeader = pathname !== "/new-event";

  // B. Kapan Navbar Bawah Muncul?
  // HANYA muncul di 3 halaman utama.
  // Otomatis HILANG di "/event/..." dan "/new-event"
  const shouldShowNavbar = ["/", "/scan", "/contacts"].includes(pathname);

  // C. Background Color Logic
  // Kalau di /new-event pakai putih biar clean. Sisanya kuning (biar nyatu sama Header Global)
  const isWhiteBackground = pathname === "/new-event";

  // =========================================
  // 2. LOGIC VARIANT & STATE
  // =========================================

  // Logic Index Navbar (Active State)
  let navIndex = 1; 
  if (pathname === "/scan") navIndex = 0;
  if (pathname === "/contacts") navIndex = 2;

  // Logic Header Variant (Icon Kiri & Kanan)
  let headerVariant: HeaderVariant = "HOME";

  if (pathname.startsWith("/event/")) {
    // Kalau URL depannya "/event/", berarti masuk halaman detail -> Pakai tombol Back
    // Pastikan di Header.tsx kamu handle variant "DETAILS" atau "EVENT_DETAILS" buat nampilin panah back
    headerVariant = "EVENT_DETAILS"; 
  } else if (pathname === "/profile") {
    headerVariant = "ACCOUNT_SETTINGS";
  } else if (pathname === "/scan" || pathname === "/contacts") {
    headerVariant = "HOME";
  }

  // Handle Navigasi dari Navbar Bawah
  const handleNavSelect = (index: number) => {
    if (index === 0) router.push("/scan");
    if (index === 1) router.push("/");
    if (index === 2) router.push("/contacts");
  };

  return (
    // Container Utama
    <div className={`flex flex-col h-dvh w-full relative overflow-hidden ${isWhiteBackground ? 'bg-ui-white' : 'bg-ui-accent-yellow'}`}>
      
      {/* GLOBAL HEADER (Dikontrol oleh shouldShowHeader) */}
      {shouldShowHeader && (
        <div className="shrink-0 z-10">
          <Header 
            variant={headerVariant} 
            onLeftIconClick={() => {
              // Kalau mode HOME, buka Sidebar. Kalau mode lain (Details), Back.
              if (headerVariant === "HOME") {
                setIsSidebarOpen(true);
              } else {
                router.back();
              }
            }}
          />
        </div>
      )}

      {/* PAGE CONTENT */}
      {/* min-h-0 sangat penting biar scrollbar di child component jalan normal */}
      <main className="flex-1 w-full flex flex-col relative z-0 overflow-hidden min-h-0">
         {children}
      </main>

      {/* GLOBAL NAVBAR (Dikontrol oleh shouldShowNavbar) */}
      {shouldShowNavbar && (
        <FloatingNavbar
          selectedIndex={navIndex}
          onItemSelected={handleNavSelect}
          // Tombol Plus di Navbar mengarah ke halaman Add Event
          onAddClick={() => router.push("/new-event")}
        />
      )}

      {/* SIDEBAR */}
      <Sidebar 
         isOpen={isSidebarOpen}
         onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}