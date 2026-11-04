"use client";

import { useState } from "react";
import { Send, CheckCircle2, MessageSquare, Bug, Lightbulb, HelpCircle } from "lucide-react";

export default function SupportForm({ email }: { email: string }) {
  const [category, setCategory] = useState("General question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setSent(false);
    try {
      const response = await fetch("/api/support-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) setError(data.error || "Your request could not be sent.");
      else { setSent(true); setSubject(""); setMessage(""); }
    } catch {
      setError("Could not reach Axon. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <section className="rounded-2xl border border-white/[.09] bg-[#101012]">
      <div className="flex items-start gap-3 border-b border-white/[.07] px-5 py-4 sm:px-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-zinc-200"><MessageSquare size={18}/></span>
        <div><h2 className="text-[15px] font-semibold text-white">Send us a message</h2><p className="mt-1 text-[12px] leading-5 text-zinc-400">Describe what you need help with. Your request will be sent securely from Axon.</p></div>
      </div>
      <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-[12px] font-medium text-zinc-300">Request type</span>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-[#09090b] px-3 text-[13px] text-zinc-100 outline-none focus:border-white/30">
              <option>General question</option><option>Report a bug</option><option>Feature request</option><option>Account or linking issue</option>
            </select>
          </label>
          <div className="block"><span className="mb-2 block text-[12px] font-medium text-zinc-300">Reply address</span><div className="flex h-11 items-center rounded-lg border border-white/[.07] bg-white/[.025] px-3 text-[13px] text-zinc-400">{email}</div></div>
        </div>
        <label className="block"><span className="mb-2 block text-[12px] font-medium text-zinc-300">Subject</span><input required maxLength={120} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="A short summary" className="h-11 w-full rounded-lg border border-white/10 bg-[#09090b] px-3 text-[13px] text-white outline-none placeholder:text-zinc-600 focus:border-white/30"/></label>
        <label className="block"><span className="mb-2 block text-[12px] font-medium text-zinc-300">Message</span><textarea required minLength={10} maxLength={5000} rows={6} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Tell us what happened or what you need…" className="w-full resize-y rounded-lg border border-white/10 bg-[#09090b] px-3 py-3 text-[13px] leading-5 text-white outline-none placeholder:text-zinc-600 focus:border-white/30"/></label>
        {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/[.06] px-3 py-2 text-[12px] text-red-300">{error}</p>}
        {sent && <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[.06] px-3 py-2 text-[12px] text-emerald-300"><CheckCircle2 size={15}/>Your request was sent successfully.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-zinc-500">Your account email is included so support can reply.</p><button disabled={busy} type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-[12px] font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"><Send size={14}/>{busy ? "Sending…" : "Send request"}</button></div>
      </form>
    </section>
  );
}
