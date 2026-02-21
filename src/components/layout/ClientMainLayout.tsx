"use client";

import dynamic from "next/dynamic";

// Dynamically import MainLayout with ssr: false to prevent hydration mismatch
const MainLayout = dynamic(() => import("@/components/layout/MainLayout"), { ssr: false });

export default function ClientMainLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
