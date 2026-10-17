import "./globals.css";
import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import Fx from "./components/Fx";

export const metadata: Metadata = {
  title: "Axon",
  description: "Connect your tools once. Every AI keeps the same context.",
};

export const viewport: Viewport = {
  themeColor: "#f6f5f2",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <Fx />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
