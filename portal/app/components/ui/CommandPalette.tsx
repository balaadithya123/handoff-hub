"use client";

import { useEffect, useState } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { NAV, NavItem } from "../../../lib/nav";

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customActions?: Array<{ id: string; label: string; group?: string; onSelect: () => void }>;
}

export function CommandPalette({ open, onOpenChange, customActions = [] }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const filteredNav = NAV.filter(
    (item: NavItem) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.hint.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = customActions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectNav = (item: NavItem) => {
    onOpenChange(false);
    router.push(item.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative w-full max-w-xl rounded-xl bg-[#0e0e0e] border border-white/15 shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-white/10 gap-3">
          <Search className="w-4 h-4 text-[#a1a1a1] shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages, or tools... (⌘K)"
            className="w-full bg-transparent text-sm text-[#ededed] placeholder-[#707070] outline-none"
          />
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 text-[#a1a1a1] hover:text-[#ededed] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Navigation group */}
          <div>
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#8a8a8a]">
              Navigation
            </div>
            {filteredNav.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#707070]">No navigation results</div>
            ) : (
              filteredNav.map((item: NavItem) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#a1a1a1] hover:text-[#ededed] hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-[#8a8a8a] group-hover:text-[#3ecf8e]" />
                      <span className="font-medium">{item.label}</span>
                      <span className="text-[10px] text-[#707070]">{item.hint}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#3ecf8e] transition-opacity" />
                  </button>
                );
              })
            )}
          </div>

          {/* Custom actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#8a8a8a]">
                Actions
              </div>
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.onSelect();
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#a1a1a1] hover:text-[#ededed] hover:bg-white/10 transition-colors group"
                >
                  <span className="font-medium">{action.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#3ecf8e] transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
