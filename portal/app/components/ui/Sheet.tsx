"use client";

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function Sheet({ open, onOpenChange, title, description, children, footer }: SheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet panel */}
      <div className="relative w-full max-w-md h-full bg-[#0a0a0a] border-l border-white/10 p-6 flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            {title && <h2 className="text-lg font-semibold text-[#ededed] tracking-tight">{title}</h2>}
            {description && <p className="text-xs text-[#a1a1a1] mt-1">{description}</p>}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-[#a1a1a1] hover:text-[#ededed] hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">{children}</div>

        {footer && <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
