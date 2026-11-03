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
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={pathname} className="axon-route-stage"
          initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduce ? {} : { opacity: 0, y: -4, filter: "blur(1px)" }}
          transition={{ duration: .2, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
