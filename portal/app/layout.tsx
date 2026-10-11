import "./globals.css";
import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import Fx from "./components/Fx";

export const metadata: Metadata = {
  title: "Handoff Hub Mesh 2.0 | Multi-Agent Context Exchange",
  description: "Seamlessly exchange context, memories, and tool authorizations across Claude, ChatGPT, and AI agents with zero password exposure.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
        />
      </head>
      <body className="bg-canvas text-text-heading antialiased selection:bg-primary/30 selection:text-primary">
        <Suspense fallback={null}>
          <Fx />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
