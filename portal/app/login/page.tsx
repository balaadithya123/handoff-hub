import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionUser } from "../../lib/portal";
import AuthForm from "./AuthForm";

export const dynamic = "force-dynamic";

const points = [
  "Sign in once, connect every tool you use",
  "Authorize on each provider's own OAuth page",
  "We never ask for third-party passwords or API keys",
];

export default async function LoginPage() {
  const jar = await cookies();
  if (await sessionUser(jar.get(SESSION_COOKIE)?.value)) redirect("/");

  return (
    <div className="page">
      <header className="top">
        <a className="brand" href="/">
          <span className="logo">H</span>
          <span>Handoff Hub</span>
        </a>
      </header>
      <main className="wrap">
        <section className="hero">
          <div className="heroText">
            <span className="eyebrow">Integration portal</span>
            <h1>
              One account.<br />
              <span>Every connection.</span>
            </h1>
            <p>Link your development, design, and deployment tools to Handoff Hub in a few clicks.</p>
            <ul className="points">
              {points.map((p) => (
                <li key={p}><span className="tick">✓</span>{p}</li>
              ))}
            </ul>
          </div>
          <AuthForm />
        </section>
      </main>
    </div>
  );
}
