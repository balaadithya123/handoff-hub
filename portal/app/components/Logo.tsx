import { useId } from "react";

/**
 * Handoff Hub mark: an "H" built from two bars (the two AIs) joined by a bridge
 * that carries a single node (the handed-off context). Left bar is an outline,
 * right bar is solid, so the context visibly moves from one side to the other.
 */
export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Handoff Hub"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14241c" />
          <stop offset="1" stopColor="#070707" />
        </linearGradient>
        <linearGradient id={`${id}-fill`} x1="24" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7af0bd" />
          <stop offset="1" stopColor="#3ecf8e" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="39" height="39" rx="11" fill={`url(#${id}-bg)`} stroke="#ffffff" strokeOpacity="0.14" />
      {/* source bar (outline) */}
      <rect x="9" y="9" width="7" height="22" rx="3.5" stroke="#5eead4" strokeWidth="2" />
      {/* target bar (solid) */}
      <rect x="24" y="9" width="7" height="22" rx="3.5" fill={`url(#${id}-fill)`} />
      {/* bridge + handoff node */}
      <path d="M16 20h8" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="2.6" fill="#ffffff" />
    </svg>
  );
}
