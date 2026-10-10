import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#000000] text-[#ededed] font-sans antialiased flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-xl bg-[#0a0a0a] border border-white/8 text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-[#121212] border border-white/8 flex items-center justify-center text-[#60eca8] mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#707070] block">
            404 // PAGE NOT FOUND
          </span>
          <h1 className="text-2xl font-semibold text-[#ededed] tracking-tight">
            Lost in translation
          </h1>
          <p className="text-xs text-[#a1a1a1] leading-relaxed">
            The page or route you are looking for does not exist or has moved to another address.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/overview"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#60eca8] hover:bg-[#3ecf8e] text-[#0a0a0a] text-xs font-semibold transition-colors"
          >
            Open Overview
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#121212] hover:bg-[#181818] border border-white/8 text-[#ededed] text-xs font-medium transition-colors"
          >
            Landing Page
          </Link>
        </div>
      </div>
    </main>
  );
}
