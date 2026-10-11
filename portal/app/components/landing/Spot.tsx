"use client";

import type { ReactNode } from "react";

/** Bento card with the Stitch cursor-tracking spotlight (--mouse-x / --mouse-y). */
export default function Spot({
  className = "",
  rim = false,
  children,
}: {
  className?: string;
  rim?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`spot ${rim ? "spot-rim" : ""} ${className}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
