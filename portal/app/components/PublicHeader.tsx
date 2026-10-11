import Link from "next/link";
import CommandPalette from "./landing/CommandPalette";
import "./landing/landing.css";

export default function PublicHeader({ cta = true }: { cta?: boolean }) {
  return (
    <header className="glass-bar h-16 px-4 sm:px-8 border-b border-white/[0.08] flex items-center justify-between gap-4 sticky top-0 z-40">
      <div className="flex items-center gap-4 min-w-0">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-[#2a2a2a] border border-white/[0.08] flex items-center justify-center text-[#60eca8] font-semibold text-sm">
            H
          </div>
          <span className="text-[13px] font-medium text-[#e5e2e1]">Handoff Hub</span>
          <span className="hidden sm:inline px-1.5 rounded font-mono text-[10px] bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20 leading-4">
            PORTAL
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-3 sm:gap-5">
        <CommandPalette />
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link href="/connect/setup" className="text-[13px] text-[#a1a1a1] hover:text-[#ededed] transition-colors">
            How it works
          </Link>
          <Link href="/support" className="hidden sm:inline text-[13px] text-[#a1a1a1] hover:text-[#ededed] transition-colors">
            Support
          </Link>
          {cta && (
            <Link
              href="/login"
              className="btn-press px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#eaeaea] text-black text-[13px] font-medium"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
