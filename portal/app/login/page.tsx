import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE, sessionUser } from "../../lib/portal";
import AuthForm from "./AuthForm";
import PublicHeader from "../components/PublicHeader";

export const dynamic = "force-dynamic";

const points = [
  "Sign in once, connect every tool you use",
  "Authorize on each provider's own OAuth page",
  "We never ask for third-party passwords or API keys",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const jar = await cookies();
  const params = await searchParams;
  if (await sessionUser(jar.get(SESSION_COOKIE)?.value)) {
    redirect(params?.next || "/overview");
  }

  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans antialiased flex flex-col">
      <PublicHeader cta={false} />

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-12 flex-1 flex items-center justify-center w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0a0a0a] border border-white/[0.08] font-mono text-[11px] text-[#bbcabe]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60eca8] animate-pulse" />
              <span>PORTAL // SIGN-IN</span>
            </div>

            <h1 className="text-[34px] sm:text-[42px] leading-[1.08] font-semibold tracking-[-0.035em] text-[#ededed]">
              One account.
              <br />
              <span className="text-[#60eca8]">Every connection.</span>
            </h1>

            <p className="text-[15px] text-[#a1a1a1] leading-relaxed">
              Link your development, design, and deployment tools to Handoff Hub in a few clicks.
            </p>

            <ul className="space-y-3 pt-2">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[13px] text-[#ededed]">
                  <span className="w-4 h-4 rounded-full bg-[#60eca8]/15 text-[#60eca8] border border-[#60eca8]/30 flex items-center justify-center font-bold text-[10px]">
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

      <footer className="px-4 sm:px-8 py-6 border-t border-white/[0.08] text-center font-mono text-[11px] text-[#707070]">
        Handoff Hub &middot; Integration Portal
      </footer>
    </div>
  );
}
