// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import MainLayout from "@/components/layout/MainLayout"; // <--- GANTI IMPORT INI

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
      <body className="bg-ui-background"> 
        {/* Bungkus children dengan MainLayout */}
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}