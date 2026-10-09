import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE, sessionUser } from "../../lib/portal";
import AuthForm from "./AuthForm";
import { Badge } from "../components/ui/Badge";

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
    <div className="min-h-screen bg-[#000000] text-[#ededed] font-sans flex flex-col justify-between">
      <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white text-black font-extrabold flex items-center justify-center text-sm shadow-sm">
            H
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#ededed]">Handoff Hub</span>
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          <div className="lg:col-span-6 space-y-6">
            <Badge variant="green" pulse>
              INTEGRATION PORTAL SIGN-IN
            </Badge>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#ededed]">
              One account.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#3ecf8e] to-[#5eead4]">
                Every connection.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-[#a1a1a1] leading-relaxed">
              Link your development, design, and deployment tools to Handoff Hub in a few clicks.
            </p>

            <ul className="space-y-3 pt-2">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-xs text-[#ededed]">
                  <span className="w-4 h-4 rounded-full bg-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6">
            <AuthForm />
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-white/10 text-center text-xs text-[#8a8a8a]">
        Handoff Hub &middot; Integration Portal
      </footer>
    </div>
  );
}
