"use client";

import React from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
// Render SidebarDesktop only on the client to avoid SSR/CSR markup mismatch
const SidebarDesktop = dynamic(() => import("@/components/ui/SidebarDesktop"), { ssr: false });
import MobileLayout from "@/components/layout/MobileLayout"; // Layout lama kamu (untuk mobile)

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Daftar halaman yang "Fullscreen" (tidak butuh sidebar di desktop)
  // Contoh: Login, Register, Greeting, Scan pages
  const isFullscreenPage = [
    "/", 
    "/auth/login", 
    "/auth/signup", 
    "/auth/fill-profile", 
    "/auth/verify-email",
    "/scan",
    "/scan/camera",
    "/scan/upload",
    "/scan/result"
  ].includes(pathname);



  // Jika halaman Login/Register/Scan, render children langsung (tanpa sidebar)
  if (isFullscreenPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* --- A. DESKTOP VIEW --- */}
      {/* Sidebar hanya muncul di layar md (medium/tablet) ke atas */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50">
         <SidebarDesktop />
      </div>

      {/* Main Content Desktop */}
      {/* ml-64 memberi margin kiri selebar sidebar supaya konten tidak ketutupan */}
      <main className="hidden md:block flex-1 ml-64 p-8 w-full">
         <div className="max-w-5xl mx-auto">
            {children}
         </div>
      </main>


      {/* --- B. MOBILE VIEW --- */}
      {/* Di layar kecil (hp), kita pakai MobileLayout lama kamu */}
      <div className="md:hidden w-full">
         <MobileLayout>
            {children}
         </MobileLayout>
      </div>

    </div>
  );
}