"use client";

import { motion, useReducedMotion } from "motion/react";
import Logo from "./Logo";

export default function WorkspaceLoader() {
  const reduce = useReducedMotion();
  return (
    <main className="axon-loading-screen" role="status" aria-live="polite" aria-label="Loading Axon workspace">
      <div className="axon-loading-glow" aria-hidden="true" />
      <div className="axon-loading-center">
        <div className="axon-loading-mark">
          {!reduce && <>
            <motion.span className="axon-loading-orbit axon-loading-orbit-one" animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
            <motion.span className="axon-loading-orbit axon-loading-orbit-two" animate={{ rotate: -360 }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} />
          </>}
          <Logo size={38} className="axon-loading-logo" />
        </div>
        <motion.p className="axon-loading-brand" initial={reduce ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>AXON</motion.p>
      </div>
      
    </main>
  );
}
