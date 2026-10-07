import { rpc } from "../../lib/portal";
import { ago } from "../../lib/format";
import LinkCodeButton from "./LinkCodeButton";
import UnlinkButton from "./UnlinkButton";

type Client = { name: string; last_active: string };
type Acct = { id: string; label: string; linked_at: string; clients: Client[] };
type Res = { ok?: boolean; linked?: boolean; needs_unlock?: boolean; accounts?: Acct[] } | null;

const MCP_URL = (process.env.NEXT_PUBLIC_HUB_URL || "https://handoff-mcp.vercel.app").replace(/\/$/, "") + "/mcp";

export default async function AiAccounts({ token }: { token: string }) {
  let d: Res = null;
  try { d = await rpc<Res>("portal_ai_apps", { p_token: token }); } catch { /* best effort */ }
  const accts = d?.accounts ?? [];
  return (
    <>
      <section className="shPanel">
        <div className="shPanelHead"><h2>Linked AI accounts</h2><span className="shMuted">{accts.length} linked</span></div>
        {accts.length === 0 ? (
          <div className="shEmpty">No AI account linked yet. Add the server URL below to an AI app, then create a link code.</div>
        ) : (
          <div className="shScroll">
            <table className="shTable">
              <thead><tr><th>Account</th><th>AI apps</th><th>Linked</th><th /></tr></thead>
              <tbody>
                {accts.map(a => (
                  <tr key={a.id}>
                    <td><b>{a.label}</b></td>
                    <td>{a.clients.length === 0 ? <span className="shMuted">Signed out</span> : a.clients.map((c, i) => <span className="shTag" key={i}>{c.name} \u00B7 {ago(c.last_active)}</span>)}</td>
                    <td className="shMuted">{ago(a.linked_at)}</td>
                    <td><UnlinkButton id={a.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="shCards" style={{ alignItems: "start" }}>
        <section className="shPanel" style={{ margin: 0 }}>
          <div className="shPanelHead"><h2>1 \u00B7 Connect an AI app</h2></div>
          <div className="shPad">
            <p>Add this server URL as a connector. Sign-in opens inside the AI app.</p>
            <code className="shCode">{MCP_URL}</code>
            <p className="shMuted"><b>Claude:</b> Settings \u2192 Connectors \u2192 Add custom connector<br /><b>ChatGPT:</b> Settings \u2192 Connectors \u2192 Developer mode<br /><b>Claude Code:</b> claude mcp add --transport http handoff {MCP_URL}</p>
          </div>
        </section>
        <section className="shPanel" style={{ margin: 0 }}>
          <div className="shPanelHead"><h2>2 \u00B7 Link it to this portal</h2></div>
          <div className="shPad">
            <p>{d?.needs_unlock ? "Your first AI account is free. Adding another one (for example a second Claude account) needs an unlock code." : "Your first AI account is free. Create a code and give it to the AI account."}</p>
            <LinkCodeButton linked={Boolean(d?.linked)} needsUnlock={Boolean(d?.needs_unlock)} />
          </div>
        </section>
      </div>
    </>
  );
}
