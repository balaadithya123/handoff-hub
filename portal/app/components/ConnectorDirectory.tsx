"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Search, CheckCircle2, ShieldCheck } from "lucide-react";
import ConnectionButton from "./ConnectionButton";
import AppMark from "./AppMark";
import { Sheet } from "./ui/Sheet";
import { Badge } from "./ui/Badge";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

// [id, name, category, description, live]
const APPS: ReadonlyArray<readonly [string, string, string, string, boolean]> = [
  ["github", "GitHub", "Developer", "Repositories, issues, pull requests and actions.", true],
  ["gitlab", "GitLab", "Developer", "Source control, merge requests and CI/CD pipelines.", true],
  ["vercel", "Vercel", "Developer", "Projects, deployments, environment variables and domains.", true],
  ["sentry", "Sentry", "Developer", "Error tracking, releases and performance metrics.", true],
  ["bitbucket", "Bitbucket", "Developer", "Code hosting for teams and Bitbucket Pipelines.", false],
  ["notion", "Notion", "Productivity", "Docs, wikis, project databases and team knowledge.", true],
  ["google-drive", "Google Drive", "Productivity", "Files, documents, spreadsheets and shared drives.", true],
  ["google-calendar", "Google Calendar", "Productivity", "Calendars, events and scheduling availability.", true],
  ["sharepoint", "SharePoint", "Productivity", "Microsoft team sites and document libraries.", true],
  ["onenote", "OneNote", "Productivity", "Digital notebooks and structured team notes.", true],
  ["box", "Box", "Storage", "Secure enterprise content and document management.", true],
  ["dropbox", "Dropbox", "Storage", "Cloud files and team file sync.", true],
  ["slack", "Slack", "Communication", "Team channels, direct messages and huddles.", true],
  ["microsoft-teams", "Microsoft Teams", "Communication", "Team chat, meetings and channel updates.", true],
  ["gmail", "Gmail", "Communication", "Email threads, mailbox workflows and drafts.", true],
  ["discord", "Discord", "Communication", "Community servers and team voice/text channels.", false],
  ["linear", "Linear", "Project Management", "Product roadmaps, engineering issues and cycles.", true],
  ["jira", "Jira", "Project Management", "Issues, sprints, backlog and project tracking.", true],
  ["asana", "Asana", "Project Management", "Tasks, projects and cross-team workflows.", true],
  ["clickup", "ClickUp", "Project Management", "Tasks, docs, goals and team productivity.", false],
  ["monday", "Monday.com", "Project Management", "Work OS and team project tracking.", false],
  ["hubspot", "HubSpot", "CRM & Support", "Contacts, deals, marketing and sales pipelines.", true],
  ["zendesk", "Zendesk", "CRM & Support", "Customer support tickets and help center.", true],
  ["salesforce", "Salesforce", "CRM & Support", "CRM records, opportunities and leads.", false],
  ["intercom", "Intercom", "CRM & Support", "Customer messaging and live support.", false],
  ["supabase", "Supabase", "Data", "PostgreSQL databases, auth, storage and edge functions.", true],
  ["postgresql", "PostgreSQL", "Data", "Direct SQL database access and migrations.", false],
  ["snowflake", "Snowflake", "Data", "Cloud data warehouse and analytical queries.", false],
  ["bigquery", "BigQuery", "Data", "Google Cloud analytics data warehouse.", false],
  ["google-analytics", "Google Analytics", "Data", "Web and product usage analytics.", false],
  ["canva", "Canva", "Design", "Visual designs, brand assets and presentations.", true],
  ["figma", "Figma", "Design", "Design files, components and prototypes.", true],
  ["zapier", "Zapier", "Automation", "Automated workflows across thousands of web apps.", false],
];

function MarkBox({ id, size = 40 }: { id: string; size?: number }) {
  const icon = Math.round(size * 0.5);
  return (
    <div
      className="rounded-xl bg-[#161616] border border-white/[0.08] flex items-center justify-center text-[#e5e5e5] shrink-0"
      style={{ width: size, height: size }}
    >
      <AppMark id={id} size={icon} />
    </div>
  );
}

export default function ConnectorDirectory({
  connected,
  names,
}: {
  connected: string[];
  names: Record<string, string>;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const on = useMemo(() => new Set(connected), [connected]);
  const cats = useMemo(() => ["All", ...Array.from(new Set(APPS.map((a) => a[2])))], []);

  const query = q.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      APPS.filter(
        (a) =>
          (cat === "All" || a[2] === cat) &&
          (a[1] + " " + a[3] + " " + a[2]).toLowerCase().includes(query)
      ),
    [cat, query]
  );

  const connectedApps = useMemo(() => APPS.filter(([id]) => on.has(id)), [on]);

  const sections = useMemo(() => {
    if (cat !== "All") return [{ title: cat, rows: filtered }];
    const map = new Map<string, typeof filtered>();
    for (const row of filtered) {
      const list = map.get(row[2]) ?? [];
      list.push(row);
      map.set(row[2], list);
    }
    return Array.from(map.entries()).map(([title, rows]) => ({ title, rows }));
  }, [cat, filtered]);

  const selectedApp = useMemo(
    () => APPS.find(([id]) => id === selectedAppId),
    [selectedAppId]
  );
  const selectedIsConnected = selectedAppId ? on.has(selectedAppId) : false;
  const selectedAccountName =
    selectedAppId && selectedIsConnected ? names[selectedAppId] : null;

  const openOnKey = (id: string) => (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedAppId(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-[#f5f5f5]">
          Integrations
        </h1>
        <p className="text-sm text-[#a3a3a3] max-w-xl">
          Connect tools via OAuth. Handoff Hub stores tokens securely and never sees your passwords.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {cats.map((c) => {
          const active = cat === c;
          const count = c === "All" ? APPS.length : APPS.filter((a) => a[2] === c).length;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              aria-pressed={active}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                active
                  ? "bg-white text-black"
                  : "bg-[#161616] text-[#a3a3a3] border border-white/[0.08] hover:text-[#f5f5f5] hover:bg-[#1c1c1c]"
              }`}
            >
              {c}
              <span className={`ml-1.5 text-[11px] font-mono ${active ? "opacity-50" : "opacity-40"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="max-w-2xl">
        <Input
          icon={<Search className="w-4 h-4 text-[#737373]" />}
          placeholder="Search by name or category…"
          aria-label="Search integrations"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-11 rounded-full bg-[#161616] border-white/[0.08] text-sm pl-10"
        />
      </div>

      {connectedApps.length > 0 && cat === "All" && !query && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#f5f5f5]">Connected</h2>
            <Badge variant="green" dot>
              {connectedApps.length} active
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {connectedApps.map(([id, name, group]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedAppId(id)}
                onKeyDown={openOnKey(id)}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-[#111] border border-white/[0.08] hover:border-white/[0.16] transition-all text-center"
              >
                <MarkBox id={id} size={56} />
                <div className="min-w-0 w-full">
                  <span className="block text-sm font-semibold text-[#f5f5f5] truncate">
                    {name}
                  </span>
                  <span className="block text-[11px] text-[#737373] truncate mt-0.5">
                    {names[id] ? `as ${names[id]}` : group}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-white/[0.08] bg-[#111]">
          <p className="text-sm text-[#a3a3a3]">No integrations match “{q}”.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setCat("All");
            }}
            className="mt-3"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map(({ title, rows }) => (
            <section key={title} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#f5f5f5]">{title}</h2>
                {cat === "All" && (
                  <button
                    type="button"
                    onClick={() => setCat(title)}
                    className="text-xs text-[#737373] hover:text-[#f5f5f5] transition-colors"
                  >
                    View all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0.5">
                {rows.map(([id, name, , desc, live]) => {
                  const isConnected = on.has(id);
                  const accountName = isConnected && names[id] ? names[id] : null;

                  return (
                    <div
                      key={id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${name} details`}
                      onClick={() => setSelectedAppId(id)}
                      onKeyDown={openOnKey(id)}
                      className="group flex items-center gap-3 py-3.5 px-2 -mx-2 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <MarkBox id={id} size={40} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#f5f5f5] truncate">
                            {name}
                          </span>
                          {isConnected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#93b4ff] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[#737373] line-clamp-1 mt-0.5">
                          {accountName ? `Connected as ${accountName}` : desc}
                        </p>
                      </div>

                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <ConnectionButton provider={id} connected={isConnected} available={live} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Sheet
        open={Boolean(selectedApp)}
        onOpenChange={(open) => {
          if (!open) setSelectedAppId(null);
        }}
        title={
          selectedApp ? (
            <div className="flex items-center gap-3">
              <MarkBox id={selectedApp[0]} size={40} />
              <div>
                <span className="text-base font-semibold text-[#f5f5f5] block">
                  {selectedApp[1]}
                </span>
                <span className="text-xs font-mono text-[#737373] block">
                  {selectedApp[2]}
                </span>
              </div>
            </div>
          ) : null
        }
      >
        {selectedApp && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#737373]">
                Connection Status
              </span>
              <div>
                {selectedIsConnected ? (
                  <div className="p-3.5 rounded-xl border border-[rgba(107,158,255,0.28)] bg-[rgba(107,158,255,0.12)] text-xs text-[#93b4ff] space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Connected</span>
                    </div>
                    {selectedAccountName && (
                      <p className="text-[11px] text-[#a3a3a3]">Account: {selectedAccountName}</p>
                    )}
                  </div>
                ) : selectedApp[4] ? (
                  <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#161616] text-xs text-[#a3a3a3] space-y-1">
                    <span className="font-semibold text-[#f5f5f5]">Not connected yet</span>
                    <p className="text-[11px]">Authorize via official OAuth below.</p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#161616] text-xs text-[#737373]">
                    <span>Integration coming soon.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#737373]">
                Description
              </span>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">{selectedApp[3]}</p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#737373]">
                OAuth Security
              </span>
              <div className="p-3 rounded-lg bg-[#161616] border border-white/[0.08] text-xs text-[#a3a3a3] space-y-2">
                <div className="flex items-center gap-2 text-[#f5f5f5]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="font-medium">Server-side OAuth 2.0 PKCE</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Tokens are encrypted at rest and refreshed automatically. Your provider password is never exposed.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08]">
              <ConnectionButton
                provider={selectedApp[0]}
                connected={selectedIsConnected}
                available={selectedApp[4]}
              />
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
