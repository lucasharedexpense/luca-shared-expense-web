"use client";
import DesktopDashboard from "./DesktopDashboard"; // Import yang baru dibuat
import HomeScreen from "@/components/screens/HomeScreen";

// --- MAIN PAGE ---
export default function HomePage() {
  return (
    <>
        {/* TAMPILAN MOBILE (Hidden di md keatas) */}
        <div className="md:hidden">
            <HomeScreen />
        </div>

        {/* TAMPILAN DESKTOP (Hidden di layar kecil) */}
        <div className="hidden md:block w-full h-full">
            <DesktopDashboard />
        </div>
    </>
  );
}