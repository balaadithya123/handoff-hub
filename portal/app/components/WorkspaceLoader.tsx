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
        <p className="axon-loading-caption">Preparing your workspace</p>
        <div className="axon-loading-track" aria-hidden="true">
          <motion.span className="axon-loading-progress" initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }} />
        </div>
        <div className="axon-loading-dots" aria-hidden="true">
          {[0,1,2].map(index => <motion.span key={index} animate={reduce ? {} : { opacity: [.28,1,.28], scale: [.85,1,.85] }} transition={{ duration: 1.1, repeat: Infinity, delay: index*.16 }} />)}
        </div>
      </div>
      <span className="axon-loading-footnote">SECURE WORKSPACE · LOADING</span>
    </main>
  );
}
