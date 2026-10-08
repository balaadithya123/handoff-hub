import SignOutButton from "./SignOutButton";
import "./shell.css";
import "./topbar.css";

export type Tab = "overview" | "integrations" | "ai" | "tools" | "activity";
const NAV: ReadonlyArray<readonly [Tab, string, string]> = [
  ["overview", "Overview", "\u25A6"],
  ["integrations", "Integrations", "\u2B21"],
  ["ai", "AI accounts", "\u25CE"],
  ["tools", "Hub tools", "\u2699"],
  ["activity", "Activity", "\u2261"]
];

export default function Shell({ email, tab, title, sub, notice, children }: { email: string; tab: Tab; title: string; sub: string; notice: { kind: "error" | "ok"; text: string } | null; children: React.ReactNode }) {
  return (
    <div className="sh">
      <header className="shTop">
        <a className="shBrand" href="/">
          <span className="shLogo">H</span>
          <span className="shBrandName">Handoff Hub</span>
        </a>
        <div className="shUser">
          <span className="shEmail" title={email}>{email}</span>
          <SignOutButton />
        </div>
      </header>
      <div className="shBody">
        <nav className="shSide" aria-label="Main Navigation">
          <div className="shSideGroup">
            <h5 className="shSideHeader">Workspace</h5>
            {NAV.map(([id, label, icon]) => (
              <a
                key={id}
                href={"/?tab=" + id}
                aria-current={tab === id ? "page" : undefined}
                className={"shSideLink" + (tab === id ? " active" : "")}
              >
                <i className="shIcon" aria-hidden="true">{icon}</i>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </nav>
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
