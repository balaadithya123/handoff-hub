import Link from "next/link";

export default function PublicHeader({
  cta = true,
  signedIn = false,
}: {
  cta?: boolean;
  signedIn?: boolean;
}) {
  return (
    <header className="h-16 px-4 sm:px-8 border-b border-white/[0.08] flex items-center justify-between bg-black/80 backdrop-blur-xl sticky top-0 z-40">
      <Link href={signedIn ? "/overview" : "/"} className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-[#2a2a2a] border border-white/[0.08] flex items-center justify-center text-[#60eca8] font-semibold text-sm">
          H
        </div>
        <span className="text-[13px] font-medium text-[#e5e2e1]">Handoff Hub</span>
        <span className="hidden sm:inline px-1.5 rounded font-mono text-[10px] bg-[#60eca8]/10 text-[#60eca8] border border-[#60eca8]/20 leading-4">
          PORTAL
        </span>
      </Link>
      <nav className="flex items-center gap-3 sm:gap-5">
        <Link href="/connect/setup" className="text-[13px] text-[#a1a1a1] hover:text-[#ededed] transition-colors">
          How it works
        </Link>
        <Link href="/support" className="hidden sm:inline text-[13px] text-[#a1a1a1] hover:text-[#ededed] transition-colors">
          Support
        </Link>
        {cta && (
          <Link
            href={signedIn ? "/overview" : "/login"}
            className="px-3.5 py-1.5 rounded-lg bg-[#60eca8] hover:bg-[#3ecf8e] text-[#0a0a0a] text-[13px] font-medium transition-all"
          >
            {signedIn ? "Open dashboard" : "Sign in"}
          </Link>
        )}
      </nav>
    </header>
  );
}
