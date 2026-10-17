"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Search, CheckCircle2, ShieldCheck, ChevronRight } from "lucide-react";
import ConnectionButton from "./ConnectionButton";
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

/** Stable color per app id so avatars feel intentional, not random on every render. */
const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#a855f7",
  "#f43f5e", "#84cc16", "#0ea5e9", "#d946ef", "#10b981",
];

function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const initials = (n: string) =>
  n
    .split(/[\s.]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

  /** Group filtered rows by category for Grok-style section lists. */
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
      {/* Title — Grok marketplace style */}
      <div className="space-y-1">
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-[#ededed]">
          Integrations
        </h1>
        <p className="text-sm text-[#a1a1a1] max-w-xl">
          Connect tools via OAuth. Handoff Hub stores tokens securely and never sees your passwords.
        </p>
      </div>

      {/* Category pills — solid active like Grok */}
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
                  : "bg-[#141414] text-[#a1a1a1] border border-white/10 hover:text-[#ededed] hover:bg-[#1a1a1a]"
              }`}
            >
              {c}
              <span className={`ml-1.5 text-[11px] font-mono ${active ? "opacity-60" : "opacity-50"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="max-w-2xl">
        <Input
          icon={<Search className="w-4 h-4 text-[#707070]" />}
          placeholder="Search by name or category…"
          aria-label="Search integrations"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-11 rounded-full bg-[#111] border-white/10 text-sm pl-10"
        />
      </div>

      {/* Featured — connected apps as large icon cards */}
      {connectedApps.length > 0 && cat === "All" && !query && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#ededed]">Connected</h2>
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
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-[#0f0f0f] border border-white/[0.08] hover:border-[#3ecf8e]/40 transition-all text-center"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-lg"
                  style={{ backgroundColor: avatarColor(id) }}
                >
                  {initials(name)}
                </div>
                <div className="min-w-0 w-full">
                  <span className="block text-sm font-semibold text-[#ededed] truncate group-hover:text-[#3ecf8e] transition-colors">
                    {name}
                  </span>
                  <span className="block text-[11px] text-[#707070] truncate mt-0.5">
                    {names[id] ? `as ${names[id]}` : group}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Category sections — Grok list rows, two columns */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-[#0a0a0a]">
          <p className="text-sm text-[#a1a1a1]">No integrations match “{q}”.</p>
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
                <h2 className="text-base font-semibold text-[#ededed]">{title}</h2>
                {cat === "All" && (
                  <button
                    type="button"
                    onClick={() => setCat(title)}
                    className="text-xs text-[#707070] hover:text-[#ededed] transition-colors"
                  >
                    View all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-1">
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
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: avatarColor(id) }}
                      >
                        {initials(name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#ededed] truncate group-hover:text-[#3ecf8e] transition-colors">
                            {name}
                          </span>
                          {isConnected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#3ecf8e] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[#707070] line-clamp-1 mt-0.5">
                          {accountName ? `Connected as ${accountName}` : desc}
                        </p>
                      </div>

                      <div
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isConnected ? (
                          <ConnectionButton provider={id} connected available={live} />
                        ) : live ? (
                          <a
                            href={`/api/connect/${id}`}
                            className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-medium bg-[#1a1a1a] border border-white/10 text-[#ededed] hover:bg-white hover:text-black transition-colors"
                          >
                            Add
                          </a>
                        ) : (
                          <span className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-medium text-[#555] border border-white/5">
                            Soon
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Detail side sheet */}
      <Sheet
        open={Boolean(selectedApp)}
        onOpenChange={(open) => {
          if (!open) setSelectedAppId(null);
        }}
        title={
          selectedApp ? (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: avatarColor(selectedApp[0]) }}
              >
                {initials(selectedApp[1])}
              </div>
              <div>
                <span className="text-base font-semibold text-[#ededed] block">
                  {selectedApp[1]}
                </span>
                <span className="text-xs font-mono text-[#8a8a8a] block">
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
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a8a8a]">
                Connection Status
              </span>
              <div>
                {selectedIsConnected ? (
                  <div className="p-3.5 rounded-xl border border-[#3ecf8e]/30 bg-[#3ecf8e]/10 text-xs text-[#5be3a6] space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#3ecf8e]" />
                      <span>Connected</span>
                    </div>
                    {selectedAccountName && (
                      <p className="text-[11px] text-[#a1a1a1]">
                        Account: {selectedAccountName}
                      </p>
                    )}
                  </div>
                ) : selectedApp[4] ? (
                  <div className="p-3.5 rounded-xl border border-white/10 bg-[#111] text-xs text-[#a1a1a1] space-y-1">
                    <span className="font-semibold text-[#ededed]">Not connected yet</span>
                    <p className="text-[11px]">Authorize via official OAuth below.</p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-white/10 bg-[#111] text-xs text-[#8a8a8a]">
                    <span>Integration coming soon.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a8a8a]">
                Description
              </span>
              <p className="text-xs text-[#a1a1a1] leading-relaxed">{selectedApp[3]}</p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a8a8a]">
                OAuth Security
              </span>
              <div className="p-3 rounded-lg bg-[#111] border border-white/10 text-xs text-[#a1a1a1] space-y-2">
                <div className="flex items-center gap-2 text-[#3ecf8e]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="font-medium text-[#ededed]">Server-side OAuth 2.0 PKCE</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Tokens are encrypted at rest and refreshed automatically. Your provider password is never exposed.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
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
