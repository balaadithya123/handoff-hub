"use client";

import { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "green" | "amber" | "red" | "grey";
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ variant = "green", dot = true, pulse = false, className = "", children, ...props }: BadgeProps) {
  const variantClasses = {
    green: "bg-[rgba(107,158,255,0.12)] text-[#93b4ff] border-[rgba(107,158,255,0.28)]",
    amber: "bg-[rgba(212,165,116,0.1)] text-[#d4a574] border-[rgba(212,165,116,0.28)]",
    red: "bg-[rgba(224,112,112,0.1)] text-[#e07070] border-[rgba(224,112,112,0.28)]",
    grey: "bg-white/5 text-[#a3a3a3] border-white/10",
  };

  const dotClasses = {
    green: "bg-[#6b9eff]",
    amber: "bg-[#d4a574]",
    red: "bg-[#e07070]",
    grey: "bg-[#737373]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotClasses[variant]}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClasses[variant]}`} />
        </span>
      )}
      {children}
    </span>
  );
}
