import { ArrowUpRight, Bot, CheckCircle2, CircleHelp, KeyRound, Link2, PlugZap, ShieldCheck, Sparkles, Users } from "lucide-react";
import { getAiApps } from "../../lib/data";
import { ago } from "../../lib/format";
import LinkCodeButton from "./LinkCodeButton";
import UnlinkButton from "./UnlinkButton";
import AccountName from "./AccountName";
import AiClientCard from "./AiClientCard";

const MCP_URL = (process.env.NEXT_PUBLIC_HUB_URL || "https://handoff-mcp.vercel.app").replace(/\/$/, "") + "/mcp";
const DAY = 24 * 60 * 60 * 1000;

export default async function AiAccounts({ token }: { token: string }) {
  const data = await getAiApps(token).catch(() => null);
  const accounts = data?.accounts ?? [];
  const clients = accounts.flatMap(account => account.clients ?? []);
  const activeCount = clients.filter(client => {
    const timestamp = Date.parse(client.last_active);
    return Number.isFinite(timestamp) && Date.now() - timestamp < DAY;
  }).length;

  return (
    <div className="axon-page axon-ai-page">
      <section className="axon-page-heading">
        <div>
          <p className="axon-eyebrow">WORKSPACE / AI ACCOUNTS</p>
          <h1>AI Accounts</h1>
          <p>Manage the AI clients connected to your Axon workspace and control how they access your shared context.</p>
        </div>
        <div className="axon-heading-mark"><Bot size={21} /></div>
      </section>

      <section className="axon-stat-grid" aria-label="AI account summary">
        <div className="axon-stat-card">
          <span className="axon-stat-icon"><Users size={17} /></span>
          <span className="axon-stat-copy"><strong>{accounts.length}</strong><small>Linked Hub accounts</small></span>
        </div>
        <div className="axon-stat-card">
          <span className="axon-stat-icon"><PlugZap size={17} /></span>
          <span className="axon-stat-copy"><strong>{clients.length}</strong><small>Connected AI clients</small></span>
        </div>
        <div className="axon-stat-card">
          <span className="axon-stat-icon"><CheckCircle2 size={17} /></span>
          <span className="axon-stat-copy"><strong>{activeCount}</strong><small>Active in last 24 hours</small></span>
        </div>
      </section>

      <section className="axon-content-section">
        <div className="axon-content-heading">
          <div><h2>Connected accounts</h2><p>Each Hub account has its own connected AI clients and project pools.</p></div>
          <span className="axon-count-label">{accounts.length} {accounts.length === 1 ? "account" : "accounts"}</span>
        </div>

        {accounts.length === 0 ? (
          <div className="axon-empty-state compact">
            <Bot size={27} />
            <h3>No AI accounts linked</h3>
            <p>Connect ChatGPT, Claude or another MCP-compatible AI client using the setup details below.</p>
          </div>
        ) : (
          <div className="axon-ai-account-list">
            {accounts.map(account => {
              const accountActive = account.clients.filter(client => {
                const timestamp = Date.parse(client.last_active);
                return Number.isFinite(timestamp) && Date.now() - timestamp < DAY;
              }).length;
              return (
                <article className="axon-ai-account" key={account.id}>
                  <header className="axon-ai-account-header">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="axon-ai-account-icon"><Bot size={19} /></span>
                      <div className="min-w-0">
                        <h3>{account.nickname || account.label}</h3>
                        <p>{account.nickname ? account.label + " · " : ""}Linked {ago(account.linked_at)}</p>
                      </div>
                    </div>
                    <div className="axon-ai-account-status">
                      <span className="axon-status-chip success"><span />{account.clients.length} {account.clients.length === 1 ? "client" : "clients"}</span>
                      <span className="axon-status-chip neutral">{accountActive} recently active</span>
                    </div>
                  </header>

                  <div className="axon-ai-account-body">
                    <div className="axon-ai-clients-heading">
                      <span>Connected clients</span>
                      <small>{account.clients.length} total</small>
                    </div>
                    {account.clients.length === 0 ? (
                      <div className="axon-inline-empty">
                        <CircleHelp size={17} />
                        <span><strong>No clients connected to this account</strong><small>Create a link code below and use it from your AI client.</small></span>
                      </div>
                    ) : (
                      <div className="axon-ai-client-grid">
                        {account.clients.map((client, index) => (
                          client.client_id ? (
                            <AiClientCard
                              key={client.client_id}
                              hub={account.id}
                              clientId={client.client_id}
                              name={client.name}
                              nickname={client.nickname ?? null}
                              active={Date.now() - Date.parse(client.last_active) < DAY}
                              lastText={ago(client.last_active)}
                              connectedText={client.connected_at ? ago(client.connected_at) : "—"}
                            />
                          ) : (
                            <div className="axon-ai-legacy-client" key={index}>
                              <span className="axon-ai-client-initial">{client.name.charAt(0).toUpperCase()}</span>
                              <span><strong>{client.name}</strong><small>Connected AI client</small></span>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>

                  <footer className="axon-ai-account-footer">
                    <div className="axon-ai-account-rename">
                      <span className="axon-footer-label">Account label</span>
                      <AccountName id={account.id} label={account.label} nickname={account.nickname ?? null} />
                    </div>
                    <UnlinkButton id={account.id} name={account.nickname || account.label} />
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="axon-connect-guide">
        <div className="axon-content-heading">
          <div><h2>Connect another AI client</h2><p>Use the Axon MCP endpoint to give another AI app access to your workspace.</p></div>
          <span className="axon-guide-icon"><Link2 size={18} /></span>
        </div>
        <div className="axon-endpoint-row">
          <div><span className="axon-field-label">MCP endpoint</span><code>{MCP_URL}</code></div>
          <span className="axon-secure-note"><ShieldCheck size={14} />Secure connection</span>
        </div>
        <div className="axon-guide-steps">
          <div className="axon-guide-step">
            <span className="axon-step-number">01</span>
            <div><strong>Add the connector</strong><p>Paste the endpoint into your AI app’s custom connector or MCP settings.</p></div>
          </div>
          <div className="axon-guide-step">
            <span className="axon-step-number">02</span>
            <div><strong>Create a one-time code</strong><p>Generate a link code below. It expires after 10 minutes and can only be used once.</p></div>
          </div>
          <div className="axon-guide-step">
            <span className="axon-step-number">03</span>
            <div><strong>Link your account</strong><p>In the new AI chat, ask it to call <code>link_portal_account</code> with your code.</p></div>
          </div>
        </div>
        <div className="axon-link-code-area">
          <div><span className="axon-field-label">One-time authorization</span><p>Generate a code, then share it only with the AI client you are connecting.</p></div>
          <LinkCodeButton linked={Boolean(data?.linked)} needsUnlock={Boolean(data?.needs_unlock)} />
        </div>
        <details className="axon-client-help">
          <summary>Where do I add the endpoint?</summary>
          <div className="axon-client-help-grid">
            <p><strong>Claude Desktop / Web</strong><span>Settings → Connectors → Add custom connector</span></p>
            <p><strong>Claude Code</strong><code>claude mcp add --transport http handoff {MCP_URL}</code></p>
            <p><strong>ChatGPT</strong><span>Settings → Apps &amp; Connectors → Developer mode</span></p>
          </div>
        </details>
      </section>

      <p className="axon-page-footnote"><Sparkles size={13} />Each AI client can be renamed or unlinked independently. Removing one client does not disconnect the others.</p>
    </div>
  );
}
