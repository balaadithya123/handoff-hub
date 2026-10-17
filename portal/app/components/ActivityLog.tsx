import Link from "next/link";
import { Filter, Activity } from "lucide-react";
import { rpc } from "../../lib/portal";
import { ago, human } from "../../lib/format";
import ActivityExplorer from "./ActivityExplorer";

type Ev = { at: string; agent?: string; action?: string; text?: string; project?: string; project_name?: string };
type Acct = { projects?: { id: string; name: string }[] };
type ProjRes = { ok?: boolean; accounts?: Acct[] } | null;

export default async function ActivityLog({
  token,
  limit = 30,
  project = "",
  filters = false,
}: {
  token: string;
  limit?: number;
  project?: string;
  filters?: boolean;
}) {
  let rows: Ev[] = [];
  let failed = false;
  try {
    rows =
      (await rpc<Ev[] | null>("portal_hub_events", {
        p_token: token,
        p_limit: filters ? Math.max(limit, 100) : limit,
        p_project: project || null,
      })) ?? [];
  } catch {
    failed = true;
  }

  let chips: { id: string; name: string }[] = [];
  if (filters) {
    try {
      const d = await rpc<ProjRes>("portal_projects", { p_token: token });
      const seen = new Set<string>();
      for (const a of d?.accounts ?? []) {
        for (const p of a.projects ?? []) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            chips.push({ id: p.id, name: p.name });
          }
        }
      }
    } catch {
      chips = [];
    }
  }

  const agents = new Set(rows.map((r) => r.agent || "unknown")).size;
  const actions = new Set(rows.map((r) => r.action || "event")).size;
  const last = rows[0] ? ago(rows[0].at) : "—";

  return (
    <div className="space-y-8">
      {filters && (
        <div className="space-y-1">
          <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-[#141414]">Activity</h1>
          <p className="text-sm text-[#6f6e68] max-w-xl">
            What your AI accounts did through Axon. Newest first.
          </p>
        </div>
      )}

      {filters && !failed && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Events", value: String(rows.length) },
            { label: "Agents", value: String(agents) },
            { label: "Actions", value: String(actions) },
            { label: "Latest", value: last },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl border border-[#e7e4dc] bg-white px-4 py-4"
            >
              <p className="text-xs text-[#9a988f]">{k.label}</p>
              <p className="mt-1.5 text-xl font-semibold tracking-tight text-[#141414] tabular-nums">
                {k.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {filters && chips.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-[#9a988f] flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Project
          </span>
          <Link
            href="/activity"
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              project === ""
                ? "bg-[#141414] text-[#f6f5f2]"
                : "bg-white text-[#6f6e68] border border-[#e7e4dc] hover:text-[#141414]"
            }`}
          >
            All
          </Link>
          {chips.map((c) => (
            <Link
              key={c.id}
              href={"/activity?project=" + encodeURIComponent(c.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                project === c.id
                  ? "bg-[#141414] text-[#f6f5f2]"
                  : "bg-white text-[#6f6e68] border border-[#e7e4dc] hover:text-[#141414]"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {failed ? (
        <div className="rounded-2xl border border-[#e7e4dc] bg-white px-6 py-16 text-center">
          <Activity className="mx-auto mb-3 h-8 w-8 text-[#9a988f]" />
          <p className="text-sm font-medium text-[#141414]">Couldn’t load activity</p>
          <p className="mt-1 text-xs text-[#6f6e68]">Try again in a moment.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-[#e7e4dc] bg-white px-6 py-16 text-center">
          <Activity className="mx-auto mb-3 h-8 w-8 text-[#9a988f]" />
          <p className="text-sm font-medium text-[#141414]">No events yet</p>
          <p className="mt-1 text-xs text-[#6f6e68]">
            When an AI uses Axon, each action is recorded here.
          </p>
        </div>
      ) : (
        <ActivityExplorer rows={rows} />
      )}
    </div>
  );
}
