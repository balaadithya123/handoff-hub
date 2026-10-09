"use client";

import { TableHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Table({ className = "", children, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0a]">
      <table className={`w-full text-left text-xs border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[#111] border-b border-white/10 text-[#8a8a8a] font-mono text-[11px] uppercase tracking-wider select-none">
      {children}
    </thead>
  );
}

export function TableRow({ className = "", children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] last:border-0 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className = "", children }: { className?: string; children?: ReactNode }) {
  return <th className={`p-3 font-semibold ${className}`}>{children}</th>;
}

export function TableCell({ className = "", colSpan, children }: { className?: string; colSpan?: number; children?: ReactNode }) {
  return <td className={`p-3 text-[#ededed] align-middle ${className}`} colSpan={colSpan}>{children}</td>;
}
