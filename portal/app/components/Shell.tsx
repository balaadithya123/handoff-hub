import SignOutButton from "./SignOutButton";
import "./shell.css";
import "./topbar.css";

export type Tab = "overview" | "integrations" | "ai" | "tools" | "activity";

const ICON: Record<Tab, React.ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  integrations: <path d="M9 3v4M15 3v4M7 7h10v4a5 5 0 0 1-10 0V7zM12 16v5" />,
  ai: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />,
  tools: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />
};

const GROUPS: ReadonlyArray<readonly [string, ReadonlyArray<readonly [Tab, string]>]> = [
  ["Workspace", [["overview", "Overview"], ["integrations", "Integrations"]]],
  ["AI", [["ai", "AI accounts"], ["tools", "Hub tools"]]],
  ["Monitor", [["activity", "Activity"]]]
];

function Icon({ tab }: { tab: Tab }) {
  return <svg className="shSvg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON[tab]}</svg>;
}

export default function Shell({ email, tab, title, sub, notice, children }: { email: string; tab: Tab; title: string; sub: string; notice: { kind: "error" | "ok"; text: string } | null; children: React.ReactNode }) {
  const initial = (email || "?").charAt(0).toUpperCase();
  return (
    <div className="sh">
      <header className="shBar">
        <a className="shBarBrand" href="/">
          <span className="shLogo" aria-hidden="true">H</span>
          <b>Handoff Hub</b>
        </a>
        <details className="shAccount">
          <summary className="shAccountBtn" aria-label="Account menu">
            <span className="shAvatar" aria-hidden="true">{initial}</span>
            <span className="shEmail" title={email}>{email}</span>
            <svg className="shChev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </summary>
          <div className="shMenu">
            <div className="shMenuHead">
              <span>Signed in as</span>
              <b title={email}>{email}</b>
            </div>
            <SignOutButton />
          </div>
        </details>
      </header>

      <div className="shBody">
        <aside className="shRail">
          <nav className="shNav" aria-label="Main Navigation">
            {GROUPS.map(([group, items]) => (
              <div className="shNavGroup" key={group}>
                <h5 className="shNavHeader">{group}</h5>
                {items.map(([id, label]) => (
                  <a key={id} href={"/?tab=" + id} aria-current={tab === id ? "page" : undefined} className={"shNavLink" + (tab === id ? " active" : "")}>
                    <Icon tab={id} />
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="shMain">
          <header className="shHead">
            <h1>{title}</h1>
            <p>{sub}</p>
          </header>
          {notice && (
            <div className={"shNotice " + notice.kind} role="status">
              {notice.text}
            </div>
          )}
          <div className="shContent">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
