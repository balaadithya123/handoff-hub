"use client";

import { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  glow?: boolean;
}

export function Card({ eyebrow, title, description, action, glow = false, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`relative rounded-xl bg-[#0a0a0a] border border-white/8 p-5 transition-all overflow-hidden ${
        glow ? "hover:border-[#3ecf8e]/40 hover:shadow-[0_0_24px_-4px_rgba(62,207,142,0.15)]" : "hover:border-white/16"
      } ${className}`}
      {...props}
    >
      {(eyebrow || title || action) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {eyebrow && (
              <span className="block text-[11px] font-mono uppercase tracking-[0.08em] text-[#707070] mb-1">
                {eyebrow}
              </span>
            )}
            {title && <h3 className="text-base font-semibold text-[#ededed] tracking-tight">{title}</h3>}
            {description && <p className="text-xs text-[#a1a1a1] mt-1">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
