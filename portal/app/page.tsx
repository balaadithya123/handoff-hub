import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="page">
      <header className="top">
        <a className="brand" href="/">
          <span className="logo">H</span>
          <span>Handoff Hub</span>
        </a>
        <Link className="navButton" href="/login">Sign in</Link>
      </header>
      <main className="wrap">
        <section className="landingHero">
          <div className="landingCopy">
            <span className="eyebrow">Handoff Hub</span>
            <h1>One place to <span>connect your tools.</span></h1>
            <p>Move between AI workflows without losing context. Sign in once, then manage your supported integrations from one secure portal.</p>
            <div className="actions">
              <Link className="primaryLink" href="/login">Get started</Link>
              <Link className="secondaryLink" href="/login">Open portal</Link>
            </div>
          </div>
          <div className="landingPanel">
            <div className="panelHeader"><span>Integration portal</span><span className="statusDot">Ready</span></div>
            <div className="miniCard"><strong>GitHub</strong><span>Development</span></div>
            <div className="miniCard"><strong>Canva</strong><span>Design</span></div>
            <div className="miniCard"><strong>Vercel</strong><span>Deployments</span></div>
            <p>Provider authorization happens on each service's own page. No third-party passwords or API keys are requested here.</p>
          </div>
        </section>
        <section className="featureRow">
          <article><b>Secure sign-in</b><span>Email + password with a private session.</span></article>
          <article><b>One dashboard</b><span>Manage supported connections from one place.</span></article>
          <article><b>Real authorization</b><span>Connect through the provider's official flow.</span></article>
        </section>
      </main>
      <footer className="foot"><span>Handoff Hub</span><span>Secure context handoff for AI workflows</span></footer>
    </div>
  );
}
