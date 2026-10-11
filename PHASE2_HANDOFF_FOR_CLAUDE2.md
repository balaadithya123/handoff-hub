# Handoff Hub: Stitch UI rebuild, Phase 2 (for Claude 2)

Repo: balaadithya123/handoff-hub (Next.js + Tailwind v4, app in `portal/`). Design source: `stitch_handoff_hub_saas_dashboard.zip` (DESIGN.md "Obsidian Signal" + Activity screen).

## Phase 1 (done by Claude 1, committed to main)
`portal/app/components/`: `Landing.tsx`, `PublicHeader.tsx`, `landing/{landing.css,Spot,CountUp,HeroTrace,LiveConsole,CommandPalette}.tsx`.
Reusable pieces for Phase 2: `Spot` (cursor spotlight card), `landing.css` (.spot, .btn-press, .glass-bar, .row-in, .step-in, .sweep, .palette-in), `CommandPalette` (⌘K).

## Phase 2 scope
1. /login and /connect/setup, /support, /terms, /privacy: Stitch surfaces (#000 canvas, #0a0a0a cards, 12px radius, hairline borders), white primary buttons (.btn-press), 40px inputs with green 1px focus ring.
2. Dashboard (Shell + Overview, Integrations, Projects, AI Accounts, Hub Tools): bento cards using `Spot`, 56px collapsed rail (tablet) and bottom-sheet/drawer nav (<768px), ⌘K palette inside the dashboard, tabular figures, status chips with beacon dots.
3. MCP-host pages not yet restyled: `api/oauth.js` (consent + email OTP) and `api/login.js` on handoff-mcp.vercel.app.
4. Cleanup: delete dead `portal/api/account.js` (shadowed by `app/api/account/route.ts`).
5. Respect `prefers-reduced-motion`; keep one orchestrated motion moment per page.

## Constraints
- Do not change MCP tools or the /mcp, /oauth/*, /.well-known/* routes. No tool-list change means no connector reconnect needed on the ChatGPT side; if tools do change, bump the version and note that both Claude and ChatGPT connectors must be disconnected and reconnected.
- Landing KPI "Hub tools: 45" is hard-coded; update if the tool count changes.
- Console rows on the landing are labelled sample data; do not present them as live telemetry.
