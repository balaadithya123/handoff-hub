"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";

const WORKSPACE_ROUTES = ["/overview", "/integrations", "/projects", "/ai", "/tools", "/activity", "/support", "/settings"];

export default function RouteMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const reduce = useReducedMotion();
  const isWorkspace = WORKSPACE_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));
  if (!isWorkspace) return <>{children}</>;
  return (
    <MotionConfig reducedMotion="user">
      <div className="axon-route-shell">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={pathname} className="axon-route-stage"
            initial={reduce ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? {} : { opacity: 0, y: -3 }}
            transition={{ duration: .16, ease: [0.22, 1, 0.36, 1] }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
