"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Search, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import ConnectionButton from "./ConnectionButton";
import AppMark from "./AppMark";
import { Sheet } from "./ui/Sheet";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import type { ProviderAvailability } from "../../lib/connections";

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

export default function ConnectorDirectory({
  connected,
  names,
  availability = {},
}: {
  connected: string[];
  names: Record<string, string>;
  /** Per-app result of the Hub's pre-flight check. Missing entries are treated as connectable. */
  availability?: Record<string, ProviderAvailability>;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const on = useMemo(() => new Set(connected), [connected]);
  const cats = useMemo(() => ["All", ...Array.from(new Set(APPS.map((a) => a[2])))], []);
  const query = q.trim().toLowerCase();
  const filtered = useMemo(
    () => APPS.filter((a) => (cat === "All" || a[2] === cat) && (a[1] + " " + a[3] + " " + a[2]).toLowerCase().includes(query)),
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
  const selectedApp = useMemo(() => APPS.find(([id]) => id === selectedAppId), [selectedAppId]);
  const selectedIsConnected = selectedAppId ? on.has(selectedAppId) : false;
  const selectedAvailability = selectedAppId ? availability[selectedAppId] : undefined;
  const selectedAccountName = selectedAppId && selectedIsConnected ? names[selectedAppId] : null;
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
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-[#141414]">Apps</h1>
        <p className="text-sm text-[#6f6e68] max-w-xl">
          Sign in with the app itself. Axon stores the token. It never sees your password.
        </p>
      </div>
      <div className="w-full overflow-x-auto pb-1">
        <div className="flex w-max gap-2">
          {cats.map((c) => {
            const active = cat === c;
            const count = c === "All" ? APPS.length : APPS.filter((a) => a[2] === c).length;
            return (
              <button key={c} onClick={() => setCat(c)} aria-pressed={active}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${active ? "bg-[#141414] text-[#f6f5f2]" : "bg-white text-[#6f6e68] border border-[#e7e4dc] hover:text-[#141414] hover:bg-[#efeee9]"}`}>
                {c}<span className={`ml-1.5 text-[11px] font-mono ${active ? "opacity-50" : "opacity-40"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a988f]" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className="pl-10 h-11 rounded-full bg-white border-[#e7e4dc]" />
      </div>
      {cat === "All" && !query && connectedApps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[#141414]">Connected</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {connectedApps.map(([id, name]) => (
              <button key={id} type="button" onClick={() => setSelectedAppId(id)}
                className="flex flex-col items-center gap-3 rounded-2xl border border-[#e7e4dc] bg-white px-3 py-6 text-center hover:border-[#141414]">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-[#efeee9]"><AppMark id={id} size={22} /></span>
                <span className="text-sm font-medium text-[#141414]">{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[#6f6e68]">Nothing matches.</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setQ(""); setCat("All"); }} className="mt-3">Clear filters</Button>
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map(({ title, rows }) => (
            <section key={title} className="space-y-2">
              <h2 className="text-base font-semibold text-[#141414]">{title}</h2>
              <ul className="grid gap-1 md:grid-cols-2 md:gap-x-10">
                {rows.map(([id, name, category, desc, live]) => {
                  const isOn = on.has(id);
                  return (
                    <li key={id}>
                      <div className="flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-[#efeee9]">
                        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSelectedAppId(id)} onKeyDown={openOnKey(id)}>
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#e7e4dc]"><AppMark id={id} size={20} /></span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-[#141414]">{name}</span>
                            <span className="block truncate text-xs text-[#6f6e68]">{desc}</span>
                          </span>
                        </button>
                        <ConnectionButton provider={id} connected={isOn} available={live} state={availability[id]?.state} reason={availability[id]?.reason} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
      <Sheet open={!!selectedApp} onOpenChange={(o) => !o && setSelectedAppId(null)} title={selectedApp ? selectedApp[1] : undefined}>
        {selectedApp && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white border border-[#e7e4dc]"><AppMark id={selectedApp[0]} size={24} /></span>
              <div>
                <span className="text-base font-semibold text-[#141414] block">{selectedApp[1]}</span>
                <span className="text-xs font-mono text-[#9a988f] block">{selectedApp[2]}</span>
              </div>
            </div>
            <p className="text-sm text-[#6f6e68] leading-relaxed">{selectedApp[3]}</p>
            {selectedIsConnected ? (
              <div className="p-3.5 rounded-xl border border-[rgba(47,111,224,0.28)] bg-[#e8f0fc] text-xs text-[#2f6fe0] space-y-1">
                <div className="font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /><span>Connected</span></div>
                {selectedAccountName ? <p className="text-[11px] text-[#6f6e68]">Account: {selectedAccountName}</p> : null}
              </div>
            ) : selectedApp[4] && (selectedAvailability?.state === "needs_app" || selectedAvailability?.state === "unavailable") ? (
              <div className="p-3.5 rounded-xl border border-[#e7e4dc] bg-white text-xs text-[#6f6e68] space-y-2">
                <span className="font-semibold text-[#141414] flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /><span>{selectedAvailability.state === "needs_app" ? "Setup needed" : "Can't be connected yet"}</span></span>
                {selectedAvailability.reason ? <p className="text-[11px] leading-relaxed">{selectedAvailability.reason}</p> : null}
                {selectedAvailability.setup ? (
                  <p className="text-[11px] leading-relaxed">Redirect URI to register: <code className="font-mono text-[#141414] break-all">{selectedAvailability.setup.redirect_uri}</code></p>
                ) : null}
              </div>
            ) : selectedApp[4] ? (
              <div className="p-3.5 rounded-xl border border-[#e7e4dc] bg-white text-xs text-[#6f6e68]">
                <span className="font-semibold text-[#141414]">Not connected yet</span>
                <p className="text-[11px] mt-1">Authorize via official OAuth below.</p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-[#e7e4dc] bg-white text-xs text-[#9a988f]">Coming soon</div>
            )}
            <div className="flex items-center gap-2 text-xs text-[#6f6e68]"><ShieldCheck className="w-4 h-4" /><span>OAuth only. Axon never sees your password.</span></div>
            <ConnectionButton provider={selectedApp[0]} connected={selectedIsConnected} available={selectedApp[4]} state={selectedAvailability?.state} reason={selectedAvailability?.reason} />
          </div>
        )}
      </Sheet>
    </div>
  );
}
