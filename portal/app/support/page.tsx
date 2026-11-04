import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionUser } from "../../lib/portal";
import Shell from "../components/Shell";
import SupportForm from "../components/SupportForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Help & Support · Axon" };

export default async function SupportPage() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const user = await sessionUser(token).catch(() => null);
  if (!user || !token) redirect("/login");

  return (
    <Shell email={user.email} name={user.name || user.email} tab="overview" title="Help & Support" sub="Get help with your Axon workspace" notice={null}>
      <div className="mx-auto w-full max-w-5xl space-y-7">
        <section className="rounded-2xl border border-white/[.09] bg-[#101012] p-5 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-500">AXON / SUPPORT</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">How can we help?</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Send a message to the Axon team. Your request stays inside the workspace and you can receive a reply at your account email.</p>
        </section>
        <SupportForm email={user.email}/>
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[.08] bg-[#101012] p-4"><h2 className="text-sm font-semibold text-white">Account & connections</h2><p className="mt-2 text-xs leading-5 text-zinc-400">Include the app name and what happened when connecting or reconnecting.</p></div>
          <div className="rounded-xl border border-white/[.08] bg-[#101012] p-4"><h2 className="text-sm font-semibold text-white">Report a bug</h2><p className="mt-2 text-xs leading-5 text-zinc-400">Describe the page, action and result you expected. Avoid sending passwords or access tokens.</p></div>
          <div className="rounded-xl border border-white/[.08] bg-[#101012] p-4"><h2 className="text-sm font-semibold text-white">Feature ideas</h2><p className="mt-2 text-xs leading-5 text-zinc-400">Tell us what workflow you want to make easier and why it matters.</p></div>
        </section>
      </div>
    </Shell>
  );
}
