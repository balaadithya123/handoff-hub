import SignOutButton from "./SignOutButton";
import "./shell.css";

export type Tab = "overview" | "integrations" | "ai" | "activity";
const NAV: ReadonlyArray<readonly [Tab, string, string]> = [
  ["overview", "Overview", "\u25A6"],
  ["integrations", "Integrations", "\u2B21"],
  ["ai", "AI accounts", "\u25CE"],
  ["activity", "Activity", "\u2261"]
];

export default function Shell({ email, tab, title, sub, notice, children }: { email: string; tab: Tab; title: string; sub: string; notice: { kind: "error" | "ok"; text: string } | null; children: React.ReactNode }) {
  return (
    <div className="sh">
      <header className="shTop">
        <a className="shBrand" href="/"><span className="shLogo">H</span>Handoff Hub</a>
        <div className="shUser"><span>{email}</span><SignOutButton /></div>
      </header>
      <div className="shBody">
        <nav className="shSide" aria-label="Main">
          <h5>Workspace</h5>
          {NAV.map(([id, label, icon]) => (
            <a key={id} href={"/?tab=" + id} aria-current={tab === id ? "page" : undefined}><i>{icon}</i>{label}</a>
          ))}
        </nav>
        <main className="shMain">
          <div className="shHead"><h1>{title}</h1><p>{sub}</p></div>
          {notice && <div className={"shNotice " + notice.kind}>{notice.text}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
