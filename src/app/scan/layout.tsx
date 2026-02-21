"use client";

import { ScanProvider } from "./scan-context";

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScanProvider>
      {children}
    </ScanProvider>
  );
}
