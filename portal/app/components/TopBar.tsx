import Link from "next/link";
import Logo from "./Logo";

type NavLink = { label: string; href: string };

/** Floating pill top bar (shared look with the static landing page). */
export default function TopBar({
  links = [],
  cta,
}: {
  links?: NavLink[];
  cta?: NavLink;
}) {
  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl h-12 rounded-full border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex items-center justify-between pl-2 pr-1.5 gap-3">
        <Link href="/" className="flex items-center gap-2 pr-1">
          <Logo size={30} />
          <span className="font-semibold text-[14px] tracking-tight text-[#ededed]">Handoff Hub</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 text-[13px] font-medium text-[#a1a1a1]">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="px-3 py-1.5 rounded-full hover:bg-white/5 hover:text-[#ededed] transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {cta ? (
          <Link href={cta.href} className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-neutral-200 transition-colors">
            {cta.label}
          </Link>
        ) : (
          <span className="w-2" />
        )}
      </div>
    </header>
  );
}
