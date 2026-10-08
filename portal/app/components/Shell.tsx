import SignOutButton from "./SignOutButton";
import "./shell.css";
import "./topbar.css";

export type Tab = "overview" | "integrations" | "ai" | "tools" | "activity";

const ICON: Record<Tab, React.ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.6" /><rect x="14" y="3" width="7" height="7" rx="1.6" /><rect x="3" y="14" width="7" height="7" rx="1.6" /><rect x="14" y="14" width="7" height="7" rx="1.6" /></>,
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
      <aside className="shRail">
        <a className="shBrand" href="/">
          <span className="shLogo">H</span>
          <span className="shBrandText"><b>Handoff Hub</b><em>Command center</em></span>
        </a>
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
        <div className="shRailUser">
          <span className="shAvatar" aria-hidden="true">{initial}</span>
          <span className="shEmail" title={email}>{email}</span>
          <SignOutButton />
        </div>
      </aside>

      <div className="shStage">
        <header className="shBar">
          <a className="shBarBrand" href="/"><span className="shLogo">H</span><b>Handoff Hub</b></a>
          <div className="shCrumbs"><span>Workspace</span><i>/</i><b>{title}</b></div>
          <div className="shBarRight">
            <span className="shLive"><i />Live</span>
            <span className="shBarSignOut"><SignOutButton /></span>
          </div>
        </header>
        <main className="shMain">
          <header className="shHead">
            <span className="shEyebrow">{title}</span>
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
