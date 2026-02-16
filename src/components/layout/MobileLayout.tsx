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

  // 1. DAFTAR HALAMAN (CONFIG)
  // Halaman utama yang punya Bottom Navbar
  const mainNavPaths = ["/contacts", "/home"]; 
  
  // Halaman yang TIDAK boleh ada Header Global (Fullscreen pages)
  const noHeaderPaths = [
    "/new-event",
    "/report-bug",
    "/settings",
    "/account/settings",
    "/about-us",
    "/help-support",
    "/auth/login",
    "/auth/signup",
    "/auth/fill-profile",
    "/"
  ];

  // 2. LOGIC DETEKSI DINAMIS
  // Cek apakah halaman Edit atau Add Activity (berakhiran tertentu)
  const isEditPage = pathname.endsWith("/edit") || pathname.endsWith("/add-activity");
  
  // Cek apakah halaman Activity Detail (mengandung "/activity/")
  const isActivityPage = pathname.includes("/activity/");

  // Cek apakah halaman Scan (semua route /scan/*)
  const isScanPage = pathname.startsWith("/scan");

  // 3. FINAL BOOLEANS (HASIL)
  // A. Show Header: Muncul jika BUKAN halaman 'noHeader' DAN BUKAN mode edit DAN BUKAN scan pages (scan punya header sendiri)
  const shouldShowHeader = !noHeaderPaths.includes(pathname) && !isEditPage && !isScanPage;

  // B. Show Navbar: Hanya di halaman utama
  const shouldShowNavbar = mainNavPaths.includes(pathname);

  // C. Background White: Khusus page tertentu + edit + activity
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
  } else if (pathname === "/scan") {
    headerVariant = "SCAN";
  } else if (pathname === "/contacts") {
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
              // Kalau mode HOME, buka Sidebar. Kalau mode SCAN, balik ke home. Kalau mode lain (Details), Back.
              if (headerVariant === "HOME") {
                setIsSidebarOpen(true);
              } else if (headerVariant === "SCAN") {
                router.push("/home");
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
          // Tombol Scan mengarah ke halaman Scan (kamera akan terbuka otomatis)
          onScanClick={() => router.push("/scan")}
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