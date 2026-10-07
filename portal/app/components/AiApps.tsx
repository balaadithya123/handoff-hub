import "./ai-apps.css";
import { rpc } from "../../lib/portal";
import LinkCodeButton from "./LinkCodeButton";

type Client = { name: string; last_active: string };
type Res = { ok?: boolean; linked?: boolean; clients?: Client[] } | null;

const MCP_URL = (process.env.NEXT_PUBLIC_HUB_URL || "https://handoff-mcp.vercel.app").replace(/\/$/, "") + "/mcp";

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  return h < 24 ? h + "h ago" : Math.floor(h / 24) + "d ago";
}

export default async function AiApps({ token }: { token: string }) {
  let d: Res = null;
  try {
    d = await rpc<Res>("portal_ai_apps", { p_token: token });
  } catch {
    /* best effort */
  }
  const linked = Boolean(d?.linked);
  const clients = d?.clients ?? [];
  return (
    <section className="feed aiApps">
      <div className="feedHead">
        <h2>AI apps</h2>
        <span className={linked ? "status-pill status-pill-green" : "status-pill status-pill-grey"}>
          <i className="status-dot" aria-hidden="true" />
          {linked ? "Linked to your Handoff Hub account" : "Not linked yet"}
        </span>
      </div>

      {clients.length > 0 && (
        <ul className="aiList">
          {clients.map((c, i) => (
            <li key={i}>
              <span className="feedDot" />
              <b>{c.name}</b>
              <time>{ago(c.last_active)}</time>
            </li>
          ))}
        </ul>
      )}

      <div className="aiGrid">
        <div>
          <h3>1 &middot; Connect an AI app</h3>
          <p>Add this server URL as a connector (sign-in opens in the AI app):</p>
          <code>{MCP_URL}</code>
          <ul className="aiSteps">
            <li><b>Claude:</b> Settings &rarr; Connectors &rarr; Add custom connector</li>
            <li><b>ChatGPT:</b> Settings &rarr; Connectors &rarr; Developer mode &rarr; add MCP server</li>
            <li><b>Claude Code:</b> <code>claude mcp add --transport http handoff {MCP_URL}</code></li>
            <li><b>Codex:</b> <code>codex mcp add handoff --url {MCP_URL}</code></li>
          </ul>
        </div>
        <div>
          <h3>2 &middot; Link it to this portal</h3>
          <p>{linked ? "Already linked. Your AI apps can use the apps you connected above." : "Linking lets your AI apps use Supabase, Vercel and Canva through your connections here."}</p>
          <LinkCodeButton linked={linked} />
        </div>
      </div>
    </section>
  );
}
