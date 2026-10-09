"use client";

import { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "green" | "amber" | "red" | "grey";
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ variant = "green", dot = true, pulse = false, className = "", children, ...props }: BadgeProps) {
  const variantClasses = {
    green: "bg-[#3ecf8e]/10 text-[#5be3a6] border-[#3ecf8e]/30",
    amber: "bg-[#f5b14a]/10 text-[#f5b14a] border-[#f5b14a]/30",
    red: "bg-[#ff7b7b]/10 text-[#ff7b7b] border-[#ff7b7b]/30",
    grey: "bg-white/5 text-[#a1a1a1] border-white/10",
  };

  const dotClasses = {
    green: "bg-[#3ecf8e]",
    amber: "bg-[#f5b14a]",
    red: "bg-[#ff7b7b]",
    grey: "bg-[#8a8a8a]",
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
