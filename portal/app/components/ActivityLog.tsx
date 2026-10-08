import { rpc } from "../../lib/portal";
import { ago, human } from "../../lib/format";

type Ev = { at: string; agent?: string; action?: string; text?: string };

export default async function ActivityLog({ token, limit = 30 }: { token: string; limit?: number }) {
  let rows: Ev[] = [];
  let failed = false;
  try {
    rows = (await rpc<Ev[] | null>("portal_hub_events", { p_token: token, p_limit: limit })) ?? [];
  } catch {
    failed = true;
  }
  if (failed) return <div className="shEmpty">Activity is unavailable right now. Try again shortly.</div>;
  if (rows.length === 0) return <div className="shEmpty">No activity yet. Link an AI account and its actions show up here.</div>;
  return (
    <div className="shScroll">
      <table className="shTable">
        <thead>
          <tr>
            <th>When</th>
            <th>Agent</th>
            <th>Event</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e, i) => (
            <tr key={i}>
              <td className="shMuted" style={{ whiteSpace: "nowrap" }}>{ago(e.at)}</td>
              <td><b>{e.agent || "\u2014"}</b></td>
              <td><span className="shTag">{human(e.action || "")}</span></td>
              <td className="shMuted">{e.text || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
