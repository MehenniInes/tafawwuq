import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import QuickActions from "@/components/QuickActions";

export const metadata: Metadata = {
  title: "تفوق",
  description: "Center management",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1668b3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#f4f7fb",
          color: "#12203f",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            height: 5,
            background:
              "linear-gradient(90deg, #1668b3 25%, #ef6c35 25% 50%, #f4a823 50% 75%, #2e9e55 75%)",
          }}
        />
        {children}
        <Suspense fallback={null}>
          <BottomNav />
          <QuickActions />
        </Suspense>
      </body>
    </html>
  );
}