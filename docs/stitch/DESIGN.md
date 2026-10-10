---
name: Obsidian Signal
colors:
  surface: '#0a0a0a'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bbcabe'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#869489'
  outline-variant: '#3d4a41'
  surface-tint: '#51df9c'
  primary: '#60eca8'
  on-primary: '#003822'
  primary-container: '#3ecf8e'
  on-primary-container: '#005434'
  inverse-primary: '#006c45'
  secondary: '#4ddcc6'
  on-secondary: '#003730'
  secondary-container: '#00b4a0'
  on-secondary-container: '#003f37'
  tertiary: '#ffc7ae'
  on-tertiary: '#561f00'
  tertiary-container: '#ffa072'
  on-tertiary-container: '#78350f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#71fcb6'
  primary-fixed-dim: '#51df9c'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#005233'
  secondary-fixed: '#6ef9e2'
  secondary-fixed-dim: '#4ddcc6'
  on-secondary-fixed: '#00201b'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb694'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#76330d'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  canvas: '#000000'
  surface-subtle: '#121212'
  surface-hover: '#181818'
  border-hairline: rgba(255, 255, 255, 0.08)
  border-medium: rgba(255, 255, 255, 0.16)
  text-main: '#ededed'
  text-muted: '#a1a1a1'
  text-soft: '#707070'
  signal-amber: '#f5b14a'
  signal-red: '#ff6b6b'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: -0.04em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.035em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '550'
    lineHeight: 26px
    letterSpacing: -0.025em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '550'
    lineHeight: 22px
    letterSpacing: -0.015em
  body-lead:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

### Personality & Tone
The design system articulates an aura of surgical precision, technical maturity, and focused calm. Built for high-leverage workflows—orchestrating multi-model AI accounts, system claims, and real-time handoffs—it rejects decorative noise in favor of stark functional clarity. It borrows the disciplined restraint of developer-native platforms like Vercel and Resend while integrating the robust data-density and dynamic operational signals of Supabase.

### Aesthetic Movement
The aesthetic combines **Dark Minimalist Utilitarianism** with **Engineered Precision**. Key tenets include:
- **Absolute Canvas Purity**: A true `#000000` ground that lets hardware OLED displays disappear, reserving elevated dark gray tiers (`#0a0a0a` to `#141414`) strictly for interactive containment.
- **Micro-Hairline Boundaries**: Surfaces do not rely on aggressive drop shadows; structure is established through subtle alpha-borders (`rgba(255, 255, 255, 0.08)`) that echo high-end hardware chassis engineering.
- **Monochromatic Restraint with Signal Accents**: The core interface operates in grayscale; chroma is withheld until state demands it. The brand emerald (`#3ecf8e`) and teal gradient partner (`#5eead4`) act purely as operational telemetry—indicating active runtimes, verified handoffs, focus rings, and live sync states.
- **Bento Geometry & Monospaced Rigor**: Workspaces are anchored in modular bento-box configurations, balancing human-readable sans body type with fixed-pitch monospaced metadata for cryptographic hashes, IDs, and numeric metrics.

## Colors

### Palette Philosophy
Color usage enforces strict semantic discipline:

- **Primary Canvas (`#000000`) & Surface (`#0a0a0a`)**: The base environment. Interactive panels, modal surfaces, and bento cards sit at `#0a0a0a`. Nested micro-containers, input fields, and pill backgrounds use `#121212`.
- **Primary Accent (`#3ecf8e`)**: Reserved exclusively for functional states, operational readiness, focus indicators, active pulses, and successful pipeline transitions.
- **Secondary Accent (`#5eead4`)**: Acts as a chromatic highlight companion, applied solely in directional gradients (such as active state highlights or telemetry status sweeps).
- **Primary Buttons (`#ffffff` text on `#ffffff` button surface)**: In line with modern technical tools, high-priority interactive CTAs adopt pure white backgrounds with `#000000` text, ensuring immediate affordance without misrepresenting system status.

### Structural Borders & Dividers
Borders create architectural boundaries without high visual weight:
- `border-hairline`: `rgba(255, 255, 255, 0.08)` for cards, tables, rails, and divider rules.
- `border-medium`: `rgba(255, 255, 255, 0.16)` for hovered elements, focused borders, active tabs, and input strokes.

### Semantic Telemetry
- **Active / Connected**: Foreground `#3ecf8e`, fill `rgba(62, 207, 142, 0.08)`, border `rgba(62, 207, 142, 0.25)`.
- **Pending / In Review**: Foreground `#f5b14a`, fill `rgba(245, 177, 74, 0.08)`, border `rgba(245, 177, 74, 0.25)`.
- **Fault / Blocked**: Foreground `#ff6b6b`, fill `rgba(255, 107, 107, 0.08)`, border `rgba(255, 107, 107, 0.25)`.
- **Neutral / Dormant**: Foreground `#a1a1a1`, fill `rgba(255, 255, 255, 0.04)`, border `rgba(255, 255, 255, 0.08)`.

## Typography

### Structural Pairings
- **Primary Interface**: **Geist** delivers a compact, geometric rhythm tailored for high-density SaaS views. Negative letter-spacing scales progressively tighter as font size increases (`-0.01em` on body up to `-0.04em` on display headlines).
- **Machine Readouts**: **JetBrains Mono** handles all technical identifiers, SHA hashes, latency values, timestamps, and status metrics. This stark separation immediately indicates system-generated data to the user.

### Rules of Usage
- **Display Headings**: Never use uppercase for section headings or titles. Maintain natural title case or sentence case to sustain an editorial feel.
- **Eyebrows & Micro-Tokens**: Use `label-sm` with slight uppercase tracking (`0.06em` to `0.1em`) for overline metadata (e.g., `WORKSPACE // ENGINE`, `LIVE REPL`).
- **Tabular Figures**: Always enable `font-variant-numeric: tabular-nums` across both sans and mono stacks within table cells, bento metrics, and counters to prevent jitter during real-time layout updates.

## Layout & Spacing

### Layout Architecture
The portal operates on an asymmetrical master-detail and Bento grid layout system across three breakpoints:

1. **Desktop (> 1024px)**:
   - **Collapsible Navigation Rail**: Left sidebar anchored at 240px width (collapsible into a 56px icon-only rail).
   - **Global Canvas**: Full viewport height with interior content scrolling. Bento views leverage a 12-column variable grid with `1rem` (16px) gutters and `2rem` (32px) margins.
   - **Bento Hierarchy**: Standard cards span 4, 6, 8, or 12 columns. High-priority feeds (e.g., Live Agent Feed, Workspace Memory) dominate 8 columns, flanked by 4-column companion modules.

2. **Tablet (768px – 1024px)**:
   - Rail automatically collapses into the compact 56px icon mode with hover tooltips.
   - Bento grids collapse from 12 columns to an 8-column system with `1rem` gutters.
   - Secondary detail drawers switch to an overlay model instead of split-screen side-by-side positioning.

3. **Mobile (< 768px)**:
   - Navigation rail transforms into a floating bottom sheet or full-screen command drawer invoked via the top bar.
   - Layout switches to a single-column stack with `0.75rem` (12px) gutters and `1rem` (16px) canvas margins.

### Spacing Cadence
Component internals follow a disciplined scale:
- `space-xs` (4px): Micro gaps between status dots and label text, tight pill padding.
- `space-sm` (8px): Icon-to-label gaps, list item vertical paddings, compact button padding.
- `space-md` (16px): Standard form gap, card inner padding for compact metrics, command bar items.
- `space-lg` (24px): Bento container internal padding, section header gaps.
- `space-xl` (40px): Inter-module structural vertical whitespace.

## Elevation & Depth

### The Physics of Black Space
In an absolute black canvas (`#000000`), traditional downward drop-shadows with dark opacities are visually imperceptible. Elevation is instead established through **ambient luminosity, structural boundaries, and layer tonal shifts**:

1. **Surface Layers (Tonal Stacking)**:
   - **Floor**: `#000000` (Canvas foundation).
   - **Level 1 (Panels / Bento Cards)**: `#0a0a0a` bordered with `rgba(255, 255, 255, 0.08)`.
   - **Level 2 (Active Controls / Flyout Menus)**: `#121212` bordered with `rgba(255, 255, 255, 0.14)`.
   - **Level 3 (Command Palette / Dialogs)**: `#161616` bordered with `rgba(255, 255, 255, 0.18)` plus backdrop glass blur.

2. **Ambient Luminescence (Glows over Shadows)**:
   - Elevated dialogs (e.g., Command Bar, Modal Overlays) use diffuse ambient color bleeds:
     `0 24px 64px -16px rgba(0, 0, 0, 0.9), 0 0 1px 1px rgba(255, 255, 255, 0.12)`.
   - Active interactive cards (Hovered Bento nodes) present a cursor-tracking spot illumination or subtle static rim highlight:
     `box-shadow: 0 0 0 1px rgba(62, 207, 142, 0.3), 0 8px 32px -8px rgba(62, 207, 142, 0.12)`.

3. **Optical Glassmorphism**:
   - Sticky headers, command bars, and floating controls utilize a semi-transparent surface: `background: rgba(10, 10, 10, 0.75)` with `backdrop-filter: blur(16px) saturate(180%)`.

## Shapes

### Corner Curvature Discipline
The system adopts **Level 1 (Soft)** geometry. Interfaces in high-density SaaS environments retain precision by avoiding overly bulbous, toy-like rounds:

- **Base Radius (`0.25rem` / 4px)**: Checkboxes, status badges, micro metric pills, code block chips.
- **Component Radius (`0.5rem` / 8px)**: Standard buttons, text inputs, dropdown menus, sidebar navigation items.
- **Card & Bento Radius (`0.75rem` / 12px)**: Bento cards, system panels, dialog overlays, command menu viewports.
- **Strict Exception (Pill Full-Round `9999px`)**: Dedicated live status indicators and telemetry ping tags.

## Components

### Buttons
- **Primary CTA**: Clean inversion. Background `#ffffff`, text `#000000`, weight 550, radius 8px. Hover shifts slightly to `#eaeaea` with transform scale `0.99`. Active state scales to `0.97`.
- **Secondary / Action**: Background `#121212`, border hairline `rgba(255, 255, 255, 0.08)`, text `#ededed`. On hover, border strengthens to `rgba(255, 255, 255, 0.2)` and background to `#181818`.
- **Ghost / Utility**: No initial border or background, text `#a1a1a1`. On hover, background `rgba(255, 255, 255, 0.06)`, text `#ededed`.
- **Status Active (Connection Ready)**: Subtle accent ring with fill `rgba(62, 207, 142, 0.1)`, text `#3ecf8e`, border `rgba(62, 207, 142, 0.25)`.

### Bento Cards
- Constructed with `#0a0a0a` background and `rgba(255, 255, 255, 0.08)` border.
- Features micro-header with uppercase `label-sm` eyebrow tracking and inline mono status token.
- Subtle inner gradient hover effect: a gentle radial gradient centered near the top edge (`radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 0), rgba(255,255,255,0.03), transparent 60%)`).

### Input Fields & Controls
- **Height & Bounds**: 40px standard height. Background `#0a0a0a`, border `rgba(255, 255, 255, 0.12)`, radius 8px. Font is `body-md` with placeholder text in `#707070`.
- **Focus Mechanism**: Border transitions immediately to `#3ecf8e`, supported by a clean 1px outer ring `0 0 0 1px #3ecf8e`. No heavy multi-pixel fuzzy halo.
- **Inline Action / Shortcut**: Inputs reserve a trailing slot for fixed mono keys (e.g., `⌘K`) rendered in `code-sm` over `rgba(255, 255, 255, 0.06)`.

### Chips & Telemetry Badges
- Strict 20px–24px container heights.
- Always include an operational beacon dot: a 6px circular element with an optional sub-harmonic CSS pulse animation when representing live socket connections.
- Monospaced numerical values displayed within badges use `code-sm`.

### Command Palette (Command Bar)
- Center-pinned floating viewport, width 640px, radius 12px.
- Background `rgba(14, 14, 14, 0.85)` with `backdrop-filter: blur(20px)`.
- Divided into immediate search bar with `0.08` opacity hairline divider separating categorized command groups (Navigation, Projects, AI Model Operations).
- Active cursor selection indicated by a solid `#1c1c1c` fill and pure white typography.

### Checkboxes & Selection Controls
- 16px square with 4px border radius.
- Background `#121212`, border `rgba(255, 255, 255, 0.2)`.
- Checked state: Background `#3ecf8e`, border `#3ecf8e`, checkmark rendered in pure black `#000000` for crisp optical contrast.

### Navigation Sidebar (Collapsible Rail)
- Bordered on the right by a continuous 1px hairline stroke (`rgba(255, 255, 255, 0.08)`).
- Nav link items: 36px height, rounded 6px, incorporating 18px SVG stroke icons (1.5px stroke width).
- Inactive items rest at `#a1a1a1`, shifting to `#ededed` on hover. Active item features background `rgba(255, 255, 255, 0.06)` with an inset left indicator or pure white text contrast.