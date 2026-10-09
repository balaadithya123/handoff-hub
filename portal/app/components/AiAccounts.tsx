import { Bot, Sparkles, Terminal, ShieldAlert, CheckCircle2, ChevronRight, Copy } from "lucide-react";
import { getAiApps } from "../../lib/data";
import { ago } from "../../lib/format";
import LinkCodeButton from "./LinkCodeButton";
import UnlinkButton from "./UnlinkButton";
import AccountName from "./AccountName";
import AiClientCard from "./AiClientCard";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

const MCP_URL = (process.env.NEXT_PUBLIC_HUB_URL || "https://handoff-mcp.vercel.app").replace(/\/$/, "") + "/mcp";
const DAY = 24 * 60 * 60 * 1000;

export default async function AiAccounts({ token }: { token: string }) {
  const d = await getAiApps(token).catch(() => null);
  const accts = d?.accounts ?? [];
  const now = Date.now();
  const appCount = accts.reduce((n, a) => n + a.clients.length, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="green" pulse>
              {appCount} AI CLIENTS ACTIVE
            </Badge>
            <span className="text-xs text-[#8a8a8a]">•</span>
            <span className="text-xs font-mono text-[#8a8a8a]">{accts.length} Hub Accounts</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#ededed] tracking-tight">AI Accounts</h1>
          <p className="text-xs text-[#a1a1a1] mt-0.5 max-w-2xl">
            Manage AI applications (Claude Desktop, ChatGPT Custom GPTs, Claude Code CLI) authorized to access your Handoff Hub memory pools and integrations.
          </p>
        </div>
      </div>

      {/* Account Cards */}
      {accts.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Bot className="w-8 h-8 text-[#8a8a8a] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#ededed]">No AI Account Linked Yet</h3>
          <p className="text-xs text-[#a1a1a1] max-w-md mx-auto mt-1 mb-4">
            Connect your AI assistant (Claude, ChatGPT, or Cursor) to Handoff Hub using the server endpoint below.
          </p>
        </Card>
      ) : (
        accts.map((a) => (
          <Card key={a.id} className="space-y-4">
            {/* Account Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 flex items-center justify-center text-[#3ecf8e]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#ededed]">{a.nickname || a.label}</h2>
                  <span className="text-xs text-[#8a8a8a]">
                    Hub account • Linked {ago(a.linked_at)}
                  </span>
                </div>
              </div>
              <Badge variant="green">
                {a.clients.length} {a.clients.length === 1 ? "AI client" : "AI clients"} connected
              </Badge>
            </div>

            {/* Clients Grid */}
            {a.clients.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#111] text-xs text-[#8a8a8a] text-center">
                No AI client currently signed in under this Hub account.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {a.clients.map((c, i) =>
                  c.client_id ? (
                    <AiClientCard
                      key={c.client_id}
                      hub={a.id}
                      clientId={c.client_id}
                      name={c.name}
                      nickname={c.nickname ?? null}
                      active={now - Date.parse(c.last_active) < DAY}
                      lastText={ago(c.last_active)}
                      connectedText={c.connected_at ? ago(c.connected_at) : "—"}
                    />
                  ) : (
                    <div key={i} className="p-3 rounded-lg bg-[#111] border border-white/10 text-xs text-[#ededed]">
                      {c.name}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Hub Account Settings Footer */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111]/50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#8a8a8a]">Account Settings:</span>
                <AccountName id={a.id} label={a.label} nickname={a.nickname ?? null} />
              </div>
              <UnlinkButton id={a.id} name={a.nickname || a.label} />
            </div>
          </Card>
        ))
      )}

      {/* Setup Guide Bento Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Step 1 Card */}
        <Card
          eyebrow="STEP 1"
          title="Connect an AI app"
          description="Add this MCP server endpoint to your AI client configuration."
        >
          <div className="space-y-3 mt-2">
            <div className="p-2.5 rounded-lg bg-[#111] border border-white/10 font-mono text-xs text-[#3ecf8e] flex items-center justify-between select-all">
              <span>{MCP_URL}</span>
            </div>

            <div className="space-y-2 text-xs text-[#a1a1a1] pt-1">
              <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                <strong className="text-[#ededed] block">Claude Desktop / Web:</strong>
                <span>Settings → Custom Connectors → Add {MCP_URL}</span>
              </div>
              <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                <strong className="text-[#ededed] block">Claude Code CLI:</strong>
                <code className="text-[11px] font-mono text-[#5eead4] block mt-0.5">
                  claude mcp add --transport http handoff {MCP_URL}
                </code>
              </div>
              <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                <strong className="text-[#ededed] block">ChatGPT Custom GPT:</strong>
                <span>Settings → Connectors → Developer mode → Add endpoint</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Step 2 Card */}
        <Card
          eyebrow="STEP 2"
          title="Link to Portal"
          description={
            d?.needs_unlock
              ? "Linking an additional Hub account requires an unlock code."
              : "Generate a link code and enter it during AI assistant sign-in."
          }
        >
          <div className="space-y-4 mt-2">
            <div className="p-3.5 rounded-xl bg-[#111] border border-white/10 text-xs text-[#a1a1a1] space-y-2">
              <div className="flex items-center gap-2 text-[#3ecf8e]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-[#ededed]">One-time Authorization Code</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Codes expire after 10 minutes and bind the AI client directly to your portal account.
              </p>
            </div>

            <div className="pt-2">
              <LinkCodeButton linked={Boolean(d?.linked)} needsUnlock={Boolean(d?.needs_unlock)} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
