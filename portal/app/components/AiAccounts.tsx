import { rpc } from "../../lib/portal";
import { ago } from "../../lib/format";
import LinkCodeButton from "./LinkCodeButton";
import UnlinkButton from "./UnlinkButton";
import AccountName from "./AccountName";
import AiClientCard from "./AiClientCard";

type Client = { client_id?: string; name: string; nickname?: string | null; last_active: string; connected_at?: string | null };
type Acct = { id: string; label: string; nickname?: string | null; linked_at: string; clients: Client[] };
type Res = { ok?: boolean; linked?: boolean; needs_unlock?: boolean; accounts?: Acct[] } | null;

const MCP_URL = (process.env.NEXT_PUBLIC_HUB_URL || "https://handoff-mcp.vercel.app").replace(/\/$/, "") + "/mcp";
const DAY = 24 * 60 * 60 * 1000;

export default async function AiAccounts({ token }: { token: string }) {
  let d: Res = null;
  try { d = await rpc<Res>("portal_ai_apps", { p_token: token }); } catch { /* best effort */ }
  const accts = d?.accounts ?? [];
  const now = Date.now();
  const appCount = accts.reduce((n, a) => n + a.clients.length, 0);
  return (
    <>
      <div className="aiIntro">
        <div><b>{appCount}</b><span>AI apps connected</span></div>
        <div><b>{accts.length}</b><span>Hub accounts</span></div>
        <p>Every AI app below (Claude, ChatGPT, \u2026) has its own nickname and its own Unlink. Unlinking one signs out only that app.</p>
      </div>

      {accts.length === 0 ? (
        <section className="shPanel"><div className="shEmpty">No AI account linked yet. Add the server URL below to an AI app, then create a link code.</div></section>
      ) : accts.map(a => (
        <section className="shPanel aiHub" key={a.id}>
          <div className="shPanelHead">
            <div>
              <h2>{a.nickname || a.label}</h2>
              <span className="shMuted">Hub account \u00b7 linked {ago(a.linked_at)}</span>
            </div>
            <span className="shMuted">{a.clients.length} AI app{a.clients.length === 1 ? "" : "s"}</span>
          </div>
          {a.clients.length === 0 ? (
            <div className="shEmpty">No AI app is signed in to this account.</div>
          ) : (
            <div className="aiGrid">
              {a.clients.map((c, i) => c.client_id ? (
                <AiClientCard
                  key={c.client_id}
                  hub={a.id}
                  clientId={c.client_id}
                  name={c.name}
                  nickname={c.nickname ?? null}
                  active={now - Date.parse(c.last_active) < DAY}
                  lastText={ago(c.last_active)}
                  connectedText={c.connected_at ? ago(c.connected_at) : "\u2014"}
                />
              ) : <span className="shTag" key={i}>{c.name}</span>)}
            </div>
          )}
          <div className="aiHubFoot">
            <div className="aiHubFootLabel">Hub account settings</div>
            <AccountName id={a.id} label={a.label} nickname={a.nickname ?? null} />
            <UnlinkButton id={a.id} name={a.nickname || a.label} />
          </div>
        </section>
      ))}

      <div className="shCols">
        <section className="shPanel">
          <div className="shPanelHead"><h2>1 \u00b7 Connect an AI app</h2></div>
          <div className="shPad">
            <p>Add this server URL as a connector. Sign-in opens inside the AI app.</p>
            <code className="shCode">{MCP_URL}</code>
            <p className="shMuted"><b>Claude:</b> Settings \u2192 Connectors \u2192 Add custom connector<br /><b>ChatGPT:</b> Settings \u2192 Connectors \u2192 Developer mode<br /><b>Claude Code:</b> claude mcp add --transport http handoff {MCP_URL}</p>
            <p className="shMuted">A second account of the same AI app (for example another Claude account) asks for the unlock code on the Hub sign-in page.</p>
          </div>
        </section>
        <section className="shPanel">
          <div className="shPanelHead"><h2>2 \u00b7 Link it to this portal</h2></div>
          <div className="shPad">
            <p>{d?.needs_unlock ? "Your first AI account is free. Linking another Hub account needs an unlock code." : "Your first AI account is free. Create a code and give it to the AI account."}</p>
            <LinkCodeButton linked={Boolean(d?.linked)} needsUnlock={Boolean(d?.needs_unlock)} />
          </div>
        </section>
      </div>
    </>
  );
}
