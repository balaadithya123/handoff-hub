"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";

const ITEMS = [
  { group: "Navigation", label: "Sign in", href: "/login" },
  { group: "Navigation", label: "How it works", href: "/connect/setup" },
  { group: "Navigation", label: "Support", href: "/support" },
  { group: "Legal", label: "Terms", href: "/terms" },
  { group: "Legal", label: "Privacy", href: "/privacy" },
];

/** Header search pill + Stitch command bar (⌘K / Ctrl K). */
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const list = ITEMS.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase()));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex relative items-center h-9 w-56 pl-9 pr-12 rounded-lg bg-[#0a0a0a] border border-white/[0.08] hover:border-white/[0.16] text-left text-[13px] text-[#707070] transition-colors"
        aria-label="Open command bar"
      >
        <Search className="absolute left-3 w-3.5 h-3.5" />
        Search or jump to...
        <kbd className="absolute right-2 font-mono text-[11px] text-[#707070] bg-[#201f1f] px-1.5 py-0.5 rounded border border-white/[0.08]">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh] px-4 bg-black/60 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Command bar"
        >
          <div
            className="palette-in w-full max-w-[640px] rounded-xl border border-white/[0.18] overflow-hidden"
            style={{
              background: "rgba(14,14,14,0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 24px 64px -16px rgba(0,0,0,0.9), 0 0 1px 1px rgba(255,255,255,0.12)",
            }}
          >
            <div className="flex items-center gap-2.5 px-4 h-12 border-b border-white/[0.08]">
              <Search className="w-4 h-4 text-[#707070]" />
              <input
                ref={input}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setIdx((i) => Math.min(i + 1, Math.max(list.length - 1, 0)));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setIdx((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && list[idx]) go(list[idx].href);
                }}
                placeholder="Search or jump to..."
                className="flex-1 bg-transparent outline-none text-[14px] text-[#ededed] placeholder:text-[#707070]"
              />
              <kbd className="font-mono text-[10px] text-[#707070] bg-white/[0.06] px-1.5 py-0.5 rounded">ESC</kbd>
            </div>
            <div className="p-1.5 max-h-[320px] overflow-y-auto">
              {list.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-[#707070]">No matches.</p>}
              {list.map((it, i) => (
                <div key={it.href}>
                  {(i === 0 || list[i - 1].group !== it.group) && (
                    <div className="px-3 pt-2 pb-1 font-mono text-[10px] text-[#707070] uppercase tracking-wider">{it.group}</div>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => go(it.href)}
                    className={`w-full flex items-center justify-between px-3 h-9 rounded-md text-[13px] text-left transition-colors ${
                      i === idx ? "bg-[#1c1c1c] text-white" : "text-[#a1a1a1]"
                    }`}
                  >
                    <span>{it.label}</span>
                    {i === idx && <CornerDownLeft className="w-3.5 h-3.5 text-[#707070]" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
