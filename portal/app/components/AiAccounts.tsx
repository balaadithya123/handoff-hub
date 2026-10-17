import { Bot, Sparkles } from "lucide-react";
import { getAiApps } from "../../lib/data";
import { ago } from "../../lib/format";
import LinkCodeButton from "./LinkCodeButton";
import UnlinkButton from "./UnlinkButton";
import AccountName from "./AccountName";
import AiClientCard from "./AiClientCard";

const MCP_URL = (process.env.NEXT_PUBLIC_HUB_URL || "https://handoff-mcp.vercel.app").replace(/\/$/, "") + "/mcp";
const DAY = 24 * 60 * 60 * 1000;

export default async function AiAccounts({ token }: { token: string }) {
  const d = await getAiApps(token).catch(() => null);
  const accts = d?.accounts ?? [];
  const now = Date.now();
  const appCount = accts.reduce((n, a) => n + a.clients.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e7e4dc] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#e8f0fc] text-[#2f6fe0] border-[rgba(47,111,224,0.28)]">
              {appCount} AI CLIENT{appCount === 1 ? "" : "S"} ACTIVE
            </span>
            <span className="text-xs font-mono text-[#9a988f]">{accts.length} Hub account{accts.length === 1 ? "" : "s"}</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#141414] tracking-tight">AI Accounts</h1>
          <p className="text-sm text-[#6f6e68] mt-1 max-w-2xl">
            Manage AI apps (Claude Desktop, ChatGPT, Claude Code) authorized to use your memory pools and integrations.
          </p>
        </div>
      </div>

      {accts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e7e4dc] bg-white p-10 text-center">
          <Bot className="w-8 h-8 text-[#9a988f] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#141414]">No AI account linked yet</h3>
          <p className="text-xs text-[#6f6e68] max-w-md mx-auto mt-1">
            Connect Claude, ChatGPT, or Cursor using the MCP endpoint below.
          </p>
        </div>
      ) : (
        accts.map((a) => (
          <div key={a.id} className="rounded-2xl border border-[#e7e4dc] bg-white p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e7e4dc]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#e8f0fc] border border-[rgba(47,111,224,0.28)] flex items-center justify-center text-[#2f6fe0]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#141414]">{a.nickname || a.label}</h2>
                  <span className="text-xs text-[#9a988f]">Hub account · Linked {ago(a.linked_at)}</span>
                </div>
              </div>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#e8f0fc] text-[#2f6fe0] border-[rgba(47,111,224,0.28)]">
                {a.clients.length} {a.clients.length === 1 ? "AI client" : "AI clients"}
              </span>
            </div>

            {a.clients.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#f6f5f2] text-xs text-[#6f6e68] text-center">
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
                    <div key={i} className="p-3 rounded-xl bg-[#f6f5f2] border border-[#e7e4dc] text-xs text-[#141414]">
                      {c.name}
                    </div>
                  )
                )}
              </div>
            )}

            <div className="pt-3 border-t border-[#e7e4dc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f6f5f2]/70 p-3 rounded-xl">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono text-[#9a988f]">Account settings</span>
                <AccountName id={a.id} label={a.label} nickname={a.nickname ?? null} />
              </div>
              <UnlinkButton id={a.id} name={a.nickname || a.label} />
            </div>
          </div>
        ))
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="rounded-2xl border border-[#e7e4dc] bg-white p-5 space-y-3">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f]">Step 1</p>
          <h3 className="text-sm font-semibold text-[#141414]">Connect an AI app</h3>
          <p className="text-xs text-[#6f6e68]">Add this MCP server endpoint to your AI client.</p>
          <div className="p-2.5 rounded-lg bg-[#f6f5f2] border border-[#e7e4dc] font-mono text-xs text-[#141414] select-all break-all">
            {MCP_URL}
          </div>
          <div className="space-y-2 text-xs text-[#6f6e68] pt-1">
            <div className="p-2.5 rounded-lg bg-[#f6f5f2]/80 border border-[#e7e4dc]">
              <strong className="text-[#141414] block mb-0.5">Claude Desktop / Web</strong>
              Settings → Custom Connectors → Add endpoint
            </div>
            <div className="p-2.5 rounded-lg bg-[#f6f5f2]/80 border border-[#e7e4dc]">
              <strong className="text-[#141414] block mb-0.5">Claude Code CLI</strong>
              <code className="text-[11px] font-mono text-[#2f6fe0] block mt-0.5">
                claude mcp add --transport http handoff {MCP_URL}
              </code>
            </div>
            <div className="p-2.5 rounded-lg bg-[#f6f5f2]/80 border border-[#e7e4dc]">
              <strong className="text-[#141414] block mb-0.5">ChatGPT Custom GPT</strong>
              Settings → Connectors → Developer mode → Add endpoint
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e7e4dc] bg-white p-5 space-y-3">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f]">Step 2</p>
          <h3 className="text-sm font-semibold text-[#141414]">Link to Portal</h3>
          <p className="text-xs text-[#6f6e68]">
            {d?.needs_unlock
              ? "Linking an additional Hub account requires an unlock code."
              : "Generate a link code and enter it during AI assistant sign-in."}
          </p>
          <div className="p-3.5 rounded-xl bg-[#f6f5f2] border border-[#e7e4dc] text-xs text-[#6f6e68] space-y-2">
            <div className="flex items-center gap-2 text-[#2f6fe0]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="font-semibold text-[#141414]">One-time authorization code</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Codes expire after 10 minutes and bind the AI client to your portal account.
            </p>
          </div>
          <div className="pt-1">
            <LinkCodeButton linked={Boolean(d?.linked)} needsUnlock={Boolean(d?.needs_unlock)} />
          </div>
        </div>
      </div>
    </div>
  );
}
