"use client";

import { HTMLAttributes } from "react";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/5 border border-white/5 ${className}`}
      {...props}
    />
  );
}
