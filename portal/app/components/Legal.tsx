import Link from "next/link";
import PublicHeader from "./PublicHeader";
import "./legal.css";

const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/support", label: "Support" },
];

export default function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-[#ededed] antialiased flex flex-col">
      <PublicHeader />
      <main className="legal flex-1 w-full">
        <div className="legal-eyebrow">
          <span className="legal-dot" />
          <span>LEGAL // {title.toUpperCase()}</span>
        </div>
        <h1>{title}</h1>
        <p className="lu">Last updated {updated}</p>
        <article className="legal-body">{children}</article>
      </main>
      <footer className="px-4 sm:px-8 py-6 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] text-[#707070]">
        <span>Handoff Hub &middot; Integration Portal</span>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-[#ededed] transition-colors">
            {l.label}
          </Link>
        ))}
      </footer>
    </div>
  );
}
