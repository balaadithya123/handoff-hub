import Link from "next/link";

const providers = [
  {
    name: "GitHub",
    vars: "GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET",
    callback: "https://handoff-mcp.vercel.app/api/provider-oauth?callback=1&provider=github",
  },
  {
    name: "Canva",
    vars: "CANVA_CLIENT_ID / CANVA_CLIENT_SECRET",
    callback: "https://handoff-mcp.vercel.app/api/provider-oauth?callback=1&provider=canva",
  },
  {
    name: "Vercel",
    vars: "VERCEL_CLIENT_ID / VERCEL_CLIENT_SECRET",
    callback: "https://handoff-mcp.vercel.app/api/provider-oauth?callback=1&provider=vercel",
  },
];

export default function ConnectSetup() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px" }}>
      <Link href="/" style={{ color: "var(--orange)", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
        &larr; Back to connections
      </Link>
      <h1 style={{ fontSize: 32, letterSpacing: "-0.03em", margin: "20px 0 8px", fontWeight: 700, color: "var(--text-main)" }}>
        Provider setup
      </h1>
      <p style={{ color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 760, fontSize: 14 }}>
        Users never enter provider credentials. Handoff Hub keeps OAuth client credentials and user tokens server-side and performs the provider authorization and token exchange.
      </p>
      <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
        {providers.map((p) => (
          <section
            key={p.name}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 20,
              background: "var(--bg-surface)",
            }}
          >
            <b style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>{p.name}</b>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "8px 0 12px" }}>
              One-time app-owner setup: register the OAuth app and add its client ID/secret to Handoff Hub production environment.
            </p>
            <code
              style={{
                display: "block",
                padding: "8px 12px",
                borderRadius: 4,
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                color: "var(--text-main)",
                fontSize: 12,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                wordBreak: "break-all",
                marginBottom: 12,
              }}
            >
              {p.callback}
            </code>
            <p style={{ color: "var(--text-soft)", fontSize: 12, marginBottom: 0 }}>
              Server variables: {p.vars}
            </p>
          </section>
        ))}
      </div>
      <section
        style={{
          marginTop: 24,
          padding: 20,
          border: "1px solid var(--border)",
          borderRadius: 6,
          background: "var(--bg-surface)",
        }}
      >
        <b style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>Custom domain: optional</b>
        <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, margin: "8px 0 0" }}>
          The HTTPS Vercel production hostname can be used as the callback. A custom domain is not inherently required, although each provider&apos;s app/review policies still apply.
        </p>
      </section>
    </main>
  );
}
