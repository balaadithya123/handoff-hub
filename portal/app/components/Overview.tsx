import { rpc } from "../../lib/portal";
import ActivityLog from "./ActivityLog";

type Res = { accounts?: { clients: unknown[] }[] } | null;

export default async function Overview({ token, connected }: { token: string; connected: number }) {
  let d: Res = null;
  try { d = await rpc<Res>("portal_ai_apps", { p_token: token }); } catch { /* best effort */ }
  const accts = d?.accounts ?? [];
  const apps = accts.reduce((n, a) => n + a.clients.length, 0);
  const steps: ReadonlyArray<readonly [string, boolean, string, string]> = [
    ["Connect your first integration", connected > 0, "/?tab=integrations", "Open integrations"],
    ["Link an AI account", accts.length > 0, "/?tab=ai", "Open AI accounts"]
  ];
  return (
    <>
      <div className="shCards">
        <div className="shCard"><span>Integrations connected</span><b>{connected}</b><a href="/?tab=integrations">Manage \u2192</a></div>
        <div className="shCard"><span>AI accounts linked</span><b>{accts.length}</b><a href="/?tab=ai">Manage \u2192</a></div>
        <div className="shCard"><span>AI apps signed in</span><b>{apps}</b><a href="/?tab=ai">View \u2192</a></div>
      </div>
      <section className="shPanel">
        <div className="shPanelHead"><h2>Get started</h2></div>
        <ul className="shSteps">
          {steps.map(([label, done, href, cta]) => (
            <li key={label} className={done ? "done" : ""}><span className="dot">{done ? "\u2713" : ""}</span>{label}{!done && <a href={href}>{cta}</a>}</li>
          ))}
        </ul>
      </section>
      <section className="shPanel">
        <div className="shPanelHead"><h2>Recent activity</h2><a href="/?tab=activity">View all</a></div>
        <ActivityLog token={token} limit={5} />
      </section>
    </>
  );
}
