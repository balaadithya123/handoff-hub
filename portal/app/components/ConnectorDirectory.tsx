"use client";

import { useMemo, useState } from "react";
import { Search, Plug, CheckCircle2, ShieldCheck, ChevronRight, ExternalLink } from "lucide-react";
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
  expiredMap = {},
}: {
  connected: string[];
  names: Record<string, string>;
  expiredMap?: Record<string, boolean>;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const on = useMemo(() => new Set(connected), [connected]);
  const cats = useMemo(() => ["All", ...Array.from(new Set(APPS.map((a) => a[2])))], []);

  const rows = APPS.filter(
    (a) =>
      (cat === "All" || a[2] === cat) &&
      (a[1] + " " + a[3] + " " + a[2]).toLowerCase().includes(q.trim().toLowerCase())
  );

  const connectedApps = useMemo(
    () => APPS.filter(([id]) => on.has(id)),
    [on]
  );

  const selectedApp = useMemo(
    () => APPS.find(([id]) => id === selectedAppId),
    [selectedAppId]
  );

  const selectedIsConnected = selectedAppId ? on.has(selectedAppId) : false;
  const selectedAccountName = selectedAppId && selectedIsConnected ? names[selectedAppId] : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="green" dot>
              {connected.length} CONNECTED
            </Badge>
            <span className="text-xs text-[#8a8a8a]">•</span>
            <span className="text-xs font-mono text-[#8a8a8a]">{APPS.length} Total Directory</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#ededed] tracking-tight">Integrations</h1>
          <p className="text-xs text-[#a1a1a1] mt-0.5 max-w-2xl">
            Authorize your external tools via OAuth. Handoff Hub stores access tokens securely and never receives your provider passwords.
          </p>
        </div>
      </div>

      {/* Connected Integrations Banner (if any) */}
      {connectedApps.length > 0 && (
        <div className="rounded-xl border border-[#3ecf8e]/30 bg-[#3ecf8e]/5 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5be3a6]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3ecf8e]" />
              <span>ACTIVE CONNECTIONS ({connectedApps.length})</span>
            </div>
            <span className="text-[11px] font-mono text-[#8a8a8a]">Ready for AI Workflows</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {connectedApps.map(([id, name, group]) => (
              <div
                key={id}
                onClick={() => setSelectedAppId(id)}
                className="p-3 rounded-lg bg-[#0a0a0a] border border-white/10 hover:border-[#3ecf8e]/40 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-[#ededed]">
                    {initials(name)}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#ededed] group-hover:text-[#3ecf8e] transition-colors">
                      {name}
                    </span>
                    <span className="block text-[10px] text-[#8a8a8a]">
                      {names[id] ? "As " + names[id] : group}
                    </span>
                  </div>
                </div>
                <Badge variant="green">Active</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Directory Controls: Category Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                cat === c
                  ? "bg-[#60eca8] text-[#0a0a0a] font-semibold shadow-sm"
                  : "bg-[#121212] text-[#a1a1a1] hover:text-[#ededed] hover:bg-[#181818] border border-white/8"
              }`}
            >
              <span>{c}</span>
              <span className="ml-1.5 text-[10px] font-mono opacity-70">
                {c === "All" ? APPS.length : APPS.filter((a) => a[2] === c).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-64 shrink-0">
          <Input
            icon={<Search className="w-3.5 h-3.5 text-[#8a8a8a]" />}
            placeholder="Search integrations..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Integrations Grid */}
      {rows.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-white/10 bg-[#0a0a0a]">
          <p className="text-sm text-[#a1a1a1]">No integrations found matching &ldquo;{q}&rdquo;.</p>
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setCat("All"); }} className="mt-3">
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(([id, name, group, desc, live]) => {
            const isConnected = on.has(id);
            const accountName = isConnected && names[id] ? names[id] : null;

            return (
              <div
                key={id}
                onClick={() => setSelectedAppId(id)}
                className={`p-4 rounded-xl bg-[#0a0a0a] border transition-all flex flex-col justify-between gap-4 cursor-pointer group ${
                  isConnected
                    ? "border-[#3ecf8e]/30 hover:border-[#3ecf8e]/60 bg-[#3ecf8e]/[0.02]"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center font-bold text-xs text-[#ededed] group-hover:scale-105 transition-transform">
                        {initials(name)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#ededed] group-hover:text-[#3ecf8e] transition-colors">
                          {name}
                        </h3>
                        <span className="text-[10px] font-mono text-[#8a8a8a]">{group}</span>
                      </div>
                    </div>
                    <div>
                      {isConnected ? (
                        <Badge variant="green">Connected</Badge>
                      ) : live ? (
                        <Badge variant="grey">Not connected</Badge>
                      ) : (
                        <Badge variant="grey" dot={false}>Coming soon</Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#a1a1a1] line-clamp-2 leading-relaxed">
                    {accountName ? "Connected as " + accountName : desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <ConnectionButton provider={id} connected={isConnected} available={live} expired={Boolean(expiredMap[id])} />
                  <span className="text-[11px] text-[#8a8a8a] flex items-center gap-0.5 group-hover:text-[#ededed] transition-colors">
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Integration Detail Side-Sheet Drawer */}
      <Sheet
        open={Boolean(selectedApp)}
        onOpenChange={(open) => { if (!open) setSelectedAppId(null); }}
        title={
          selectedApp ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center font-bold text-sm text-[#ededed]">
                {initials(selectedApp[1])}
              </div>
              <div>
                <span className="text-base font-semibold text-[#ededed] block">{selectedApp[1]}</span>
                <span className="text-xs font-mono text-[#8a8a8a] block">{selectedApp[2]}</span>
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
                      <span>Genuinely Connected</span>
                    </div>
                    {selectedAccountName && (
                      <p className="text-[11px] text-[#a1a1a1]">Account: {selectedAccountName}</p>
                    )}
                  </div>
                ) : selectedApp[4] ? (
                  <div className="p-3.5 rounded-xl border border-white/10 bg-[#111] text-xs text-[#a1a1a1] space-y-1">
                    <span className="font-semibold text-[#ededed]">Not connected yet</span>
                    <p className="text-[11px]">Click below to authorize via official OAuth.</p>
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
                OAuth Security Policy
              </span>
              <div className="p-3 rounded-lg bg-[#111] border border-white/10 text-xs text-[#a1a1a1] space-y-2">
                <div className="flex items-center gap-2 text-[#3ecf8e]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="font-medium text-[#ededed]">Server-side OAuth 2.0 PKCE</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Tokens are stored with encrypted storage at rest and automatically refreshed. Your account password is never exposed.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <ConnectionButton provider={selectedApp[0]} connected={selectedIsConnected} available={selectedApp[4]} expired={Boolean(expiredMap[selectedApp[0]])} />
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
