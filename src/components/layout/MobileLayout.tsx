"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header, { HeaderVariant } from "@/components/ui/Header";
import FloatingNavbar from "@/components/ui/FloatingNavbar";
import Sidebar from "@/components/ui/Sidebar"; // Import Sidebar yang tadi

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- 1. LOGIC NAVBAR (Tentuin Index berdasarkan URL) ---
  // Kalau URL-nya "/", index = 1 (Home)
  // Kalau URL-nya "/scan", index = 0
  // Kalau URL-nya "/contacts", index = 2
  let navIndex = 1; 
  if (pathname === "/scan") navIndex = 0;
  if (pathname === "/contacts") navIndex = 2;

  // --- 2. LOGIC HEADER (Mapping URL ke Header Variant) ---
  // Default variant
  let headerVariant: HeaderVariant = "HOME";

  // Override berdasarkan path
  if (pathname === "/new-event") headerVariant = "NEW_EVENT";
  else if (pathname.startsWith("/event/")) headerVariant = "DETAILS";
  else if (pathname === "/profile") headerVariant = "ACCOUNT_SETTINGS";
  else if (pathname === "/scan") headerVariant = "HOME"; // Atau bikin variant SCAN
  else if (pathname === "/contacts") headerVariant = "HOME"; 

  // --- 3. HANDLE NAVIGATION ---
  const handleNavSelect = (index: number) => {
    if (index === 0) router.push("/scan");
    if (index === 1) router.push("/");
    if (index === 2) router.push("/contacts");
  };

  return (
    <div className="flex flex-col h-dvh w-full bg-ui-accent-yellow relative overflow-hidden">
      
      {/* GLOBAL HEADER */}
      <div className="shrink-0 z-10">
        <Header 
          variant={headerVariant} 
          onLeftIconClick={() => {
            // Kalau variant HOME, buka sidebar. Kalau bukan, Back.
            if (headerVariant === "HOME") {
              setIsSidebarOpen(true);
            } else {
              router.back();
            }
          }}
        />
        {/* Note: SearchBar biasanya spesifik Home, jadi taro di page Home aja */}
      </div>

      {/* PAGE CONTENT (Ini isi file page.tsx lu) */}
      {/* Kita kasih flex-1 biar dia ngisi ruang kosong di tengah */}
      <main className="flex-1 w-full flex flex-col">
         {children}
      </main>

      {/* GLOBAL FLOATING NAVBAR */}
      <FloatingNavbar
        selectedIndex={navIndex}
        onItemSelected={handleNavSelect}
        onAddClick={() => router.push("/new-event")}
        onContactsClick={() => router.push("/contacts")}
        onHomeClick={() => router.push("/")}
      />

      {/* GLOBAL SIDEBAR */}
      <Sidebar 
         isOpen={isSidebarOpen}
         onClose={() => setIsSidebarOpen(false)}
         onDashboardClick={() => { setIsSidebarOpen(false); router.push("/"); }}
         onAccountSettingsClick={() => { setIsSidebarOpen(false); router.push("/profile"); }}
         onLogoutClick={() => { setIsSidebarOpen(false); console.log("Logout..."); }}
         // ... props lain
      />
    </div>
  );
}