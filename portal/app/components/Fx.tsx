"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Elements that get the cursor-following spotlight (they read --x / --y).
const SPOT = ".shCard,.shPanel,.aiCard,.cfCard,.authCard,.heroVisual,.stats > div";

/**
 * Global polish: a top loading bar that starts the moment an internal link is
 * clicked and finishes when the URL changes, a soft glow that trails the
 * cursor, and the spotlight position for cards.
 */
export default function Fx() {
  const path = usePathname();
  const params = useSearchParams();
  const key = path + "?" + params.toString();
  const [phase, setPhase] = useState<"idle" | "run" | "done">("run");
  const glow = useRef<HTMLDivElement>(null);

  // Finish the bar whenever the route or query changes (also runs once on first load).
  useEffect(() => {
    setPhase("done");
    const t = setTimeout(() => setPhase("idle"), 800);
    return () => clearTimeout(t);
  }, [key]);

  useEffect(() => {
    let guard: ReturnType<typeof setTimeout> | undefined;

    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a") as HTMLAnchorElement | null;
      if (!a || !a.href || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      let u: URL;
      try { u = new URL(a.href, location.href); } catch { return; }
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.search === location.search) return;
      setPhase("run");
      if (guard) clearTimeout(guard);
      guard = setTimeout(() => setPhase("idle"), 10000); // never leave the bar hanging
    };

    const move = (e: PointerEvent) => {
      const g = glow.current;
      if (g) {
        g.style.opacity = "1";
        g.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0) translate(-50%,-50%)";
      }
      const el = (e.target as Element | null)?.closest?.(SPOT) as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--x", e.clientX - r.left + "px");
      el.style.setProperty("--y", e.clientY - r.top + "px");
    };

    const leave = () => { if (glow.current) glow.current.style.opacity = "0"; };

    document.addEventListener("click", click);
    document.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      if (guard) clearTimeout(guard);
      document.removeEventListener("click", click);
      document.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <>
      <div className={"fxBar " + phase} aria-hidden="true" />
      <div className="fxGlow" ref={glow} aria-hidden="true" />
    </>
  );
}
