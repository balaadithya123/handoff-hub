"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Portal error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#000000] text-[#ededed] font-sans antialiased flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-xl bg-[#0a0a0a] border border-[#ff7b7b]/30 text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-[#ff7b7b]/10 border border-[#ff7b7b]/30 flex items-center justify-center text-[#ff7b7b] mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#ff7b7b] block">
            500 // APPLICATION ERROR
          </span>
          <h1 className="text-2xl font-semibold text-[#ededed] tracking-tight">
            Something went wrong
          </h1>
          <p className="text-xs text-[#a1a1a1] leading-relaxed break-words">
            {error.message || "An unexpected error occurred while rendering this page."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#60eca8] hover:bg-[#3ecf8e] text-[#0a0a0a] text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/overview"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#121212] hover:bg-[#181818] border border-white/8 text-[#ededed] text-xs font-medium transition-colors"
          >
            Overview
          </Link>
        </div>
      </div>
    </main>
  );
}
