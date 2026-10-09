/**
 * JavaScript mirror of app/styles/tokens.css. The CSS file is the source of
 * truth for styling; import this only where a value is needed in code
 * (motion springs, SVG strokes, chart colours).
 */
export const colors = {
  canvas: "#000000",
  surface: "#0a0a0a",
  surface2: "#111111",
  surface3: "#161616",
  hover: "#1a1a1a",
  text: "#ededed",
  text2: "#a1a1a1",
  text3: "#8a8a8a",
  accent: "#3ecf8e",
  accent2: "#5eead4",
  warn: "#f5b14a",
  bad: "#ff7b7b",
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;

export const radius = { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, pill: 999 } as const;

export const type = {
  size: { "2xs": 11, xs: 12, sm: 13, md: 14, lg: 16, xl: 20, "2xl": 24, "3xl": 32, "4xl": 48, "5xl": 64 },
  tracking: { tight: "-0.02em", tighter: "-0.035em", display: "-0.045em", eyebrow: "0.08em" },
} as const;

export const layout = { sidebar: 240, sidebarMin: 56, topbar: 52, pageMax: 1200 } as const;

/** Spring presets used by hover, press, sidebar and indicator animations. */
export const spring = {
  press: { type: "spring", stiffness: 520, damping: 34, mass: 0.6 },
  layout: { type: "spring", stiffness: 420, damping: 36, mass: 0.8 },
  soft: { type: "spring", stiffness: 260, damping: 30 },
} as const;

export const ease = [0.22, 1, 0.36, 1] as const;
