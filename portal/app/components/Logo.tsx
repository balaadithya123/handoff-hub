"use client";

import { motion } from "motion/react";

/**
 * Axon mark — signal beam between two nodes.
 * Represents context handoff. When `active`, the beam pulses.
 * Not an orbit; a directed transfer mark.
 */
export default function Logo({
  size = 32,
  className = "",
  active = false,
}: {
  size?: number;
  className?: string;
  /** Pulse the beam while a task is in flight. */
  active?: boolean;
}) {
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
      <rect width="32" height="32" rx="8" fill="#0f0f0f" />

      {/* Left node — angular chip */}
      <path
        d="M6.5 11.5 L11.5 8.5 L11.5 23.5 L6.5 20.5 Z"
        fill="#f6f5f2"
      />
      {/* Right node — angular chip mirrored */}
      <path
        d="M25.5 11.5 L20.5 8.5 L20.5 23.5 L25.5 20.5 Z"
        fill="#f6f5f2"
      />

      {/* Static beam base */}
      <path
        d="M12.5 16 H19.5"
        stroke="#f6f5f2"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* Animated energy packet on the beam */}
      <motion.rect
        x="12.5"
        y="14.6"
        width="4"
        height="2.8"
        rx="1.4"
        fill="#f6f5f2"
        animate={
          active
            ? { x: [12.5, 15.5, 12.5], opacity: [0.55, 1, 0.55] }
            : { x: 14, opacity: 0.9 }
        }
        transition={
          active
            ? { duration: 1.35, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.35 }
        }
      />

      {/* Small tick marks suggesting data packets */}
      <path d="M13.2 12.2 H14.6" stroke="#f6f5f2" strokeWidth="1.1" strokeLinecap="round" opacity="0.4" />
      <path d="M17.4 19.8 H18.8" stroke="#f6f5f2" strokeWidth="1.1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
