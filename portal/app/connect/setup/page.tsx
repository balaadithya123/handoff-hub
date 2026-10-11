import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import PublicHeader from "../../components/PublicHeader";
import Spot from "../../components/landing/Spot";

export const metadata = { title: "Provider setup · Handoff Hub" };

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
    <div className="min-h-screen bg-black text-[#ededed] antialiased flex flex-col">
      <PublicHeader />
      <main className="w-full max-w-[880px] mx-auto px-4 sm:px-8 pt-12 pb-20 flex-1">
        <Link href="/" className="font-mono text-[12px] text-[#5be3a6] hover:underline">
          &larr; Back to connections
        </Link>

        <div className="mt-5 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0a0a0a] border border-white/[0.08] font-mono text-[11px] text-[#bbcabe]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#60eca8] animate-pulse" />
          <span>PORTAL // PROVIDER SETUP</span>
        </div>

        <h1 className="mt-4 text-[34px] sm:text-[42px] leading-[1.08] font-semibold tracking-[-0.035em]">Provider setup</h1>
        <p className="mt-3 max-w-[640px] text-[15px] text-[#a1a1a1] leading-relaxed">
          Users never enter provider credentials. Handoff Hub keeps OAuth client credentials and user tokens server-side and
          performs the provider authorization and token exchange.
        </p>

        <div className="mt-8 grid gap-4">
          {providers.map((p) => (
            <Spot key={p.name} rim className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold tracking-tight">{p.name}</h2>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#a1a1a1]">
                  OAUTH APP
                </span>
              </div>
              <p className="mt-2 text-[13px] text-[#a1a1a1] leading-relaxed">
                One-time app-owner setup: register the OAuth app and add its client ID/secret to the Handoff Hub production
                environment.
              </p>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[#707070]">Callback URL</div>
              <code className="mt-1.5 block px-3 py-2 rounded-lg bg-black border border-white/[0.08] text-[12px] text-[#ededed] break-all">
                {p.callback}
              </code>
              <p className="mt-3 mb-0 font-mono text-[11px] text-[#8a8a8a]">Server variables: {p.vars}</p>
            </Spot>
          ))}
        </div>

        <Spot className="mt-4 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3ecf8e]" />
            <h2 className="text-[15px] font-semibold tracking-tight">Custom domain: optional</h2>
          </div>
          <p className="mt-2 text-[13px] text-[#a1a1a1] leading-relaxed">
            The HTTPS Vercel production hostname can be used as the callback. A custom domain is not inherently required,
            although each provider&apos;s app/review policies still apply.
          </p>
        </Spot>
      </main>
    </div>
  );
}
