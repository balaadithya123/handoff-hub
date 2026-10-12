import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionUser } from "../../lib/portal";
import AuthForm from "./AuthForm";
import TopBar from "../components/TopBar";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const jar = await cookies();
  if (await sessionUser(jar.get(SESSION_COOKIE)?.value)) redirect("/");

  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans antialiased flex flex-col">
      <TopBar
        links={[
          { label: "Home", href: "/" },
          { label: "Documentation", href: "/connect/setup" },
        ]}
      />

      <main
        className="relative flex-1 w-full flex flex-col items-center justify-center px-4 pt-28 pb-12"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 50% at 50% 48%, rgba(62,207,142,0.10), transparent 70%), repeating-linear-gradient(90deg, rgba(62,207,142,0.035) 0 1px, transparent 1px 56px)",
        }}
      >
        <div className="w-full max-w-6xl flex items-center justify-between font-mono text-[11px] text-[#707070] mb-6">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
            SECURE SESSION // TLS
          </span>
          <span>HANDOFF HUB // PORTAL</span>
        </div>

        <AuthForm />
      </main>

      <footer className="px-4 sm:px-10 py-5 border-t border-white/[0.08] bg-[#0a0a0a] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px] text-[#707070]">
        <span>&copy; 2026 Handoff Hub</span>
        <span className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-[#141414] border border-white/[0.08] text-[#a1a1a1]">OAuth 2.0 PKCE</span>
          <span className="px-2.5 py-1 rounded-full bg-[#141414] border border-white/[0.08] text-[#a1a1a1]">TLS in transit</span>
        </span>
      </footer>
    </div>
  );
}
