import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DbInitializer } from "@/components/db-initializer";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Dastar - Personal Assistant",
  description: "A personal assistant PWA app with markdown-based note management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dastar",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DbInitializer />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
