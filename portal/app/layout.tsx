import "./globals.css";
import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import Fx from "./components/Fx";

export const metadata: Metadata = {
  title: "Handoff Integrations",
  description: "Connect your apps to Handoff Hub",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
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
