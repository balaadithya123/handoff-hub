"use client";

import { HTMLAttributes, MouseEvent, ReactNode } from "react";
import "../landing/landing.css";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  glow?: boolean;
}

/** Dashboard bento card with the Stitch cursor-tracking spotlight (--mouse-x / --mouse-y). */
export function Card({
  eyebrow,
  title,
  description,
  action,
  glow = false,
  className = "",
  children,
  onMouseMove,
  ...props
}: CardProps) {
  const track = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
    onMouseMove?.(e);
  };

  return (
    <div
      className={`spot-fx relative rounded-xl bg-[#0a0a0a] border border-white/10 p-5 transition-[border-color,box-shadow] duration-200 overflow-hidden ${
        glow ? "hover:border-[#3ecf8e]/40 hover:shadow-[0_0_24px_-4px_rgba(62,207,142,0.15)]" : "hover:border-white/20"
      } ${className}`}
      onMouseMove={track}
      {...props}
    >
      {(eyebrow || title || action) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {eyebrow && (
              <span className="block text-[11px] font-mono uppercase tracking-[0.08em] text-[#8a8a8a] mb-1">
                {eyebrow}
              </span>
            )}
            {title && <h3 className="text-base font-semibold text-[#ededed] tracking-tight">{title}</h3>}
            {description && <p className="text-[13px] leading-5 text-[#a1a1a1] mt-1">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
