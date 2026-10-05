import "./activity.css";
import { rpc } from "../../lib/portal";

type HubEvent = { at: string; agent?: string | null; action?: string | null; text?: string | null };
type Conn = { provider: string; provider_account_name: string | null; updated_at: string };
type Item = { at: string; who: string; title: string; text: string; kind: "connect" | "agent" };

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

const pretty = (s?: string | null) => (s || "update").replace(/_/g, " ");

export default async function ActivityFeed({ token, connections }: { token: string; connections: Conn[] }) {
  let events: HubEvent[] = [];
  try {
    events = (await rpc<HubEvent[] | null>("portal_hub_events", { p_token: token, p_limit: 12 })) ?? [];
  } catch {
    /* feed is best-effort */
  }

  const items: Item[] = [
    ...connections.map((c): Item => ({
      at: c.updated_at,
      who: "you",
      title: "Connected " + c.provider,
      text: c.provider_account_name ? "Signed in as " + c.provider_account_name + "." : "Authorized through " + c.provider + ".",
      kind: "connect",
    })),
    ...events.map((e): Item => ({
      at: e.at,
      who: e.agent || "hub",
      title: pretty(e.action),
      text: e.text || "",
      kind: "agent",
    })),
  ]
    .filter((i) => i.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);

  return (
    <section className="feed">
      <div className="feedHead">
        <h2>Recent activity</h2>
        <span>Latest changes from you and your AI agents</span>
      </div>
      {items.length === 0 ? (
        <p className="feedEmpty">Nothing yet. Connections and agent updates will show up here.</p>
      ) : (
        <ol className="feedList">
          {items.map((i, n) => (
            <li key={n} className={"feedItem " + i.kind}>
              <span className="feedDot" />
              <div className="feedBody">
                <div className="feedTop">
                  <b>{i.title}</b>
                  <span className="feedWho">{i.who}</span>
                  <time>{ago(i.at)}</time>
                </div>
                {i.text && <p>{i.text}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
