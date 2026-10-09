"use client";

import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  shortcut?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", icon, shortcut, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && <div className="absolute left-3 text-[#a1a1a1] pointer-events-none shrink-0">{icon}</div>}
        <input
          ref={ref}
          className={`w-full h-9 bg-[#0a0a0a] text-[#ededed] placeholder-[#707070] text-xs rounded-lg border border-white/10 transition-colors focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e] ${
            icon ? "pl-9" : "pl-3"
          } ${shortcut ? "pr-12" : "pr-3"} ${className}`}
          {...props}
        />
        {shortcut && (
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-[#8a8a8a] bg-white/5 border border-white/10 rounded">
            {shortcut}
          </kbd>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
