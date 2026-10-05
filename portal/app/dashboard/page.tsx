import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionUser } from "../lib/portal";
import SignOutButton from "../components/SignOutButton";

export const dynamic = "force-dynamic";

const apps = [
  { id: "github", name: "GitHub", tag: "Development", icon: "GH", description: "Repositories, branches and commits." },
  { id: "canva", name: "Canva", tag: "Design", icon: "Ca", description: "Designs and your creative workspace." },
  { id: "vercel", name: "Vercel", tag: "Deployments", icon: "▲", description: "Projects, deployments and hosting." },
];

export default async function Dashboard() {
  const jar = await cookies();
  const user = await sessionUser(jar.get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");

  return (
    <div className="page">
      <header className="top">
        <a className="brand" href="/">
          <span className="logo">H</span>
          <span>Handoff Hub</span>
        </a>
        <div className="userChip">
          <span className="avatar">{user.email[0].toUpperCase()}</span>
          <span className="userEmail">{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="wrap">
        <section className="dash">
          <span className="eyebrow">Signed in</span>
          <h1>Connect your apps</h1>
          <p className="lead">App connections are being enabled one at a time. None are connected yet.</p>
          <div className="grid">
            {apps.map((a) => (
              <article className="card dim" key={a.id}>
                <div className="cardTop">
                  <div className="appIcon">{a.icon}</div>
                  <span className="pill soon">Coming soon</span>
                </div>
                <div className="tag">{a.tag}</div>
                <h3>{a.name}</h3>
                <p>{a.description}</p>
                <button className="connect" disabled>Coming soon</button>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="foot">
        <span className="shield">✓</span>
        Access is granted on each service's own authorization page. Your third-party passwords stay with their provider.
      </footer>
    </div>
  );
}
