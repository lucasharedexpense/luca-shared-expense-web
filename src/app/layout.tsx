// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import MobileLayout from "@/components/layout/MobileLayout"; // Import layout tadi

export const metadata: Metadata = {
  title: "Luca App",
  description: "Split bill made easy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Bungkus children di sini */}
        <MobileLayout>
          {children}
        </MobileLayout>
      </body>
    </html>
  );
}