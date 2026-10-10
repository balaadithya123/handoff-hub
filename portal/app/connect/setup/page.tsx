import Link from "next/link";
import { ArrowLeft, Plug, ShieldCheck } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

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
    <main className="min-h-screen bg-[#000000] text-[#ededed] font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link
            href="/integrations"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#a1a1a1] hover:text-[#60eca8] transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>PORTAL // RETURN TO INTEGRATIONS</span>
          </Link>
          <div className="border-b border-white/8 pb-6">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#707070] block mb-1">
              DEVELOPER // OAUTH SETUP
            </span>
            <h1 className="text-3xl font-semibold text-[#ededed] tracking-tight">Provider OAuth Setup</h1>
            <p className="text-xs text-[#a1a1a1] mt-1 max-w-2xl">
              OAuth client credentials and user tokens are stored server-side. Users authorize via provider-hosted login screens.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {providers.map((p) => (
            <Card key={p.name} eyebrow="OAUTH 2.0 PKCE" title={p.name}>
              <div className="space-y-3 mt-2">
                <p className="text-xs text-[#a1a1a1]">
                  Register an OAuth app in your developer console and set this callback URL:
                </p>
                <div className="p-3 rounded-lg bg-[#121212] border border-white/8 font-mono text-xs text-[#60eca8] select-all break-all">
                  {p.callback}
                </div>
                <div className="text-[11px] font-mono text-[#707070]">
                  Required Vercel env vars: <span className="text-[#a1a1a1]">{p.vars}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card eyebrow="CUSTOM DOMAINS" title="Vercel & OAuth Production Hostnames">
          <p className="text-xs text-[#a1a1a1] leading-relaxed mt-2">
            The canonical production host <code className="text-[#60eca8]">https://handoff-portal.vercel.app</code> and backend host <code className="text-[#60eca8]">https://handoff-mcp.vercel.app</code> are pre-configured. Custom domains do not require changes to the internal token router.
          </p>
        </Card>
      </div>
    </main>
  );
}
