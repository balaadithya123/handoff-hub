"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "status" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "secondary", size = "md", loading = false, icon, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60eca8] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const sizeClasses = {
      sm: "h-7 px-2.5 text-xs rounded-md gap-1.5",
      md: "h-9 px-3.5 text-sm rounded-lg gap-2",
      lg: "h-11 px-5 text-base rounded-lg gap-2.5",
    };

    const variantClasses = {
      primary: "bg-[#60eca8] text-[#0a0a0a] hover:bg-[#3ecf8e] active:bg-[#3ecf8e] font-semibold shadow-sm",
      secondary: "bg-[#121212] text-[#ededed] border border-white/8 hover:border-white/16 hover:bg-[#181818]",
      ghost: "bg-transparent text-[#a1a1a1] hover:text-[#ededed] hover:bg-white/5",
      status: "bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/30 hover:bg-[#3ecf8e]/20",
      danger: "bg-[#ff7b7b]/10 text-[#ff7b7b] border border-[#ff7b7b]/30 hover:bg-[#ff7b7b]/20",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" /> : icon ? <span className="shrink-0">{icon}</span> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
