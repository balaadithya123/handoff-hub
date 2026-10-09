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
      <body>
        <Suspense fallback={null}>
          <Fx />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
