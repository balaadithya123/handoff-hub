"use client";

import { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-white/10 bg-[#0a0a0a]/50 ${className}`}>
      {icon && <div className="p-3 rounded-full bg-white/5 border border-white/10 text-[#8a8a8a] mb-3">{icon}</div>}
      <h3 className="text-sm font-semibold text-[#ededed]">{title}</h3>
      {description && <p className="text-xs text-[#a1a1a1] max-w-sm mt-1 mb-4">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
