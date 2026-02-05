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

  const isEditPage = pathname.endsWith("/edit") || pathname.endsWith("/add-activity");

  // A. Kapan Header Global Muncul? 
  // Muncul terus KECUALI di "/new-event" DAN halaman Edit
  const shouldShowHeader = pathname !== "/new-event" && !isEditPage;

  // B. Kapan Navbar Bawah Muncul?
  // Tetap sama: HANYA muncul di 3 halaman utama.
  const shouldShowNavbar = ["/", "/scan", "/contacts"].includes(pathname);

  // C. Background Color Logic
  // Pakai putih kalau di /new-event ATAU di halaman Edit
  const isActivityPage = pathname.includes("/activity/");
  const isWhiteBackground = pathname === "/new-event" || isEditPage || isActivityPage;

  // =========================================
  // 2. LOGIC VARIANT & STATE
  // =========================================

  // Logic Index Navbar (Active State)
  let navIndex = 1; 
  if (pathname === "/scan") navIndex = 0;
  if (pathname === "/contacts") navIndex = 2;

  // Logic Header Variant (Icon Kiri & Kanan)
  let headerVariant: HeaderVariant = "HOME";

  if (pathname.endsWith("/summary")) {
    headerVariant = "SUMMARY";
  } else if (isActivityPage) {
    headerVariant = "ACTIVITY_DETAILS";
  } else if (pathname.startsWith("/event/")) {
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