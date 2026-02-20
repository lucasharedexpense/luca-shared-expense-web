import type { Metadata } from "next";
import "./globals.css";
import ClientMainLayout from "@/components/layout/ClientMainLayout";
import { AuthProvider } from "@/lib/auth-context";

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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-ui-background" suppressHydrationWarning>
        <AuthProvider>
          <ClientMainLayout>
            {children}
          </ClientMainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}