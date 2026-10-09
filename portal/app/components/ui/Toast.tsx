"use client";

import { ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastProps {
  kind?: "ok" | "error" | "info";
  message: ReactNode;
  onClose?: () => void;
}

export function Toast({ kind = "info", message, onClose }: ToastProps) {
  const styles = {
    ok: "bg-[#0a0a0a] border-[#3ecf8e]/30 text-[#5be3a6]",
    error: "bg-[#0a0a0a] border-[#ff7b7b]/30 text-[#ff7b7b]",
    info: "bg-[#0a0a0a] border-white/20 text-[#ededed]",
  };

  const icons = {
    ok: <CheckCircle2 className="w-4 h-4 text-[#3ecf8e] shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-[#ff7b7b] shrink-0" />,
    info: <Info className="w-4 h-4 text-[#5eead4] shrink-0" />,
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 ${styles[kind]}`}
    >
      {icons[kind]}
      <span className="text-xs font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 rounded p-0.5 text-[#a1a1a1] hover:text-[#ededed] hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
