import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Handoff Integrations",
  description: "Connect your apps to Handoff Hub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
