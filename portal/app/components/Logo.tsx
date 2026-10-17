"use client";

import { motion } from "motion/react";

/**
 * Axon mark — orbital nodes. Central core with dual rings and
 * satellite nodes that can spin when a task is active.
 */
export default function Logo({
  size = 32,
  className = "",
  spinning = false,
}: {
  size?: number;
  className?: string;
  /** Continuous orbit animation (e.g. while a task is being handed off). */
  spinning?: boolean;
}) {
  const duration = spinning ? 2.4 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Axon"
    >
      {/* Dark rounded tile */}
      <rect width="32" height="32" rx="8" fill="#0f0f0f" />

      {/* Outer faint orbital ring */}
      <circle
        cx="16"
        cy="16"
        r="11.5"
        stroke="#f6f5f2"
        strokeWidth="0.75"
        opacity="0.18"
      />

      {/* Mid orbital ring */}
      <circle
        cx="16"
        cy="16"
        r="8"
        stroke="#f6f5f2"
        strokeWidth="1"
        opacity="0.28"
      />

      {/* Core node */}
      <circle cx="16" cy="16" r="3.25" fill="#f6f5f2" />

      {/* Spinning group: two satellite nodes on the mid orbit */}
      <motion.g
        style={{ originX: "16px", originY: "16px", transformBox: "fill-box", transformOrigin: "center" }}
        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
        transition={
          spinning
            ? { duration, repeat: Infinity, ease: "linear" }
            : { duration: 0.4 }
        }
      >
        {/* Primary satellite */}
        <circle cx="16" cy="8" r="2.1" fill="#f6f5f2" />
        {/* Secondary satellite (opposite) */}
        <circle cx="16" cy="24" r="1.55" fill="#f6f5f2" opacity="0.85" />
        {/* Thin connector arcs suggestion */}
        <path
          d="M16 10.1 A5.9 5.9 0 0 1 21.9 16"
          stroke="#f6f5f2"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.45"
          fill="none"
        />
        <path
          d="M16 21.9 A5.9 5.9 0 0 1 10.1 16"
          stroke="#f6f5f2"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.35"
          fill="none"
        />
      </motion.g>

      {/* Static outer satellite (elemental detail, non-spinning) */}
      <circle cx="25.2" cy="11.2" r="1.15" fill="#f6f5f2" opacity="0.55" />
    </svg>
  );
}
