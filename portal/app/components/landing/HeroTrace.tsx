"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Decision saved to project memory",
  "Task handed to ChatGPT",
  "Context brief picked up by the next session",
];

const PAYLOAD = [
  ["{", "p"],
  ['  "action": ', "k", '"hand_off_task"', "v", ",", "p"],
  ['  "agent": ', "k", '"claude"', "v", ",", "p"],
  ['  "to_agent": ', "k", '"chatgpt"', "v", "", "p"],
  ["}", "p"],
] as const;

/** Hero inspector card: the trace plays step by step, then loops. */
export default function HeroTrace() {
  const [n, setN] = useState(3);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const play = () => {
      setN(0);
      timers = [
        setTimeout(() => setN(1), 700),
        setTimeout(() => setN(2), 1700),
        setTimeout(() => setN(3), 2700),
        setTimeout(play, 9000),
      ];
    };
    play();
    return () => timers.forEach(clearTimeout);
  }, []);

  const done = n >= 3;

  return (
    <div className="spot overflow-hidden">
      <div className="relative px-4 py-3 border-b border-white/[0.08] bg-[#121212] flex items-center justify-between sweep">
        <div className="flex items-center gap-2">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#3ecf8e] opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-[#3ecf8e]" />
          </span>
          <span className="font-mono text-[12px] font-semibold text-[#ededed]">Event // task.handed_off</span>
        </div>
        <span className="px-1.5 rounded font-mono text-[10px] bg-white/5 text-[#a1a1a1] border border-white/[0.08] leading-4">
          sample
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-white/[0.08] border-b border-white/[0.08]">
        <div className="p-3">
          <span className="block font-mono text-[10px] text-[#707070] uppercase tracking-wider">From</span>
          <span className="block text-[13px] text-[#ededed] mt-0.5">Claude</span>
        </div>
        <div className="p-3">
          <span className="block font-mono text-[10px] text-[#707070] uppercase tracking-wider">To</span>
          <span className="block text-[13px] text-[#ededed] mt-0.5">ChatGPT</span>
        </div>
      </div>

      <div className="p-3.5 border-b border-white/[0.08]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-mono text-[10px] text-[#707070] uppercase tracking-wider">Trace</span>
          <span className="font-mono text-[10px] text-[#3ecf8e]">{Math.min(n, 3)} / 3 stages ok</span>
        </div>
        <div className="flex flex-col gap-2.5 min-h-[84px]">
          {STEPS.map((s, i) =>
            i < n ? (
              <div key={s} className="step-in flex items-start gap-2.5 text-[13px] text-[#ededed]">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3ecf8e] shrink-0" />
                <span>{s}</span>
              </div>
            ) : i === n ? (
              <div key={s} className="flex items-start gap-2.5 text-[13px] text-[#707070]">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#f5b14a] animate-pulse shrink-0" />
                <span>{s}</span>
              </div>
            ) : (
              <div key={s} className="flex items-start gap-2.5 text-[13px] text-[#3d3d3d]">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/10 shrink-0" />
                <span>{s}</span>
              </div>
            )
          )}
        </div>
      </div>

      <div className="bg-[#050505]">
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#121212]/80 border-b border-white/[0.08]">
          <span className="font-mono text-[10px] text-[#707070] uppercase tracking-wider">Payload snapshot</span>
          <span className="font-mono text-[10px] text-[#707070]">read-only</span>
        </div>
        <pre
          className={`m-0 p-3.5 font-mono text-[12px] leading-relaxed overflow-x-auto min-h-[112px] ${
            done ? "fade-in" : "opacity-25"
          }`}
        >
          {PAYLOAD.map((row, i) => (
            <span key={i} className="block">
              {row.map((part, j) =>
                j % 2 === 1 ? null : (
                  <span
                    key={j}
                    className={
                      row[j + 1] === "k" ? "text-[#4ddcc6]" : row[j + 1] === "v" ? "text-[#60eca8]" : "text-[#707070]"
                    }
                  >
                    {part}
                  </span>
                )
              )}
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}
