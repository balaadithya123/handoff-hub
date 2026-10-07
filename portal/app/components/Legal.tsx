import "./legal.css";

export default function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="legal">
      <a href="/">← Handoff Hub</a>
      <h1>{title}</h1>
      <p className="lu">Last updated {updated}</p>
      {children}
    </main>
  );
}
