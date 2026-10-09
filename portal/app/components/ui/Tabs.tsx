"use client";

import { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: ReactNode;
  count?: number;
  icon?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className = "" }: TabsProps) {
  return (
    <div className={`flex items-center gap-1 border-b border-white/10 overflow-x-auto no-scrollbar ${className}`}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
              isActive
                ? "border-[#3ecf8e] text-[#ededed] bg-white/[0.03]"
                : "border-transparent text-[#a1a1a1] hover:text-[#ededed] hover:bg-white/[0.02]"
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isActive ? "bg-[#3ecf8e]/20 text-[#3ecf8e]" : "bg-white/10 text-[#8a8a8a]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
