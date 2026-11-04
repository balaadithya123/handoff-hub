import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionUser } from "../../../lib/portal";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sign in to send a support request." }, { status: 401 });
  const user = await sessionUser(token).catch(() => null);
  if (!user?.email) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const category = typeof body?.category === "string" ? body.category.slice(0, 80) : "General question";
  const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 120) : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 5000) : "";
  if (subject.length < 3 || message.length < 10) return NextResponse.json({ error: "Add a subject and a message of at least 10 characters." }, { status: 400 });
  const endpoint = process.env.AXON_APPS_SCRIPT_URL;
  const secret = process.env.AXON_SUPPORT_SECRET;
  if (!endpoint || !secret) return NextResponse.json({ error: "Support delivery is being configured. Please try again later." }, { status: 503 });
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ secret, senderEmail: user.email, category, subject, message }) }).catch(() => null);
  if (!response?.ok) return NextResponse.json({ error: "The message could not be delivered. Please try again shortly." }, { status: 502 });
  const result = await response.json().catch(() => null);
  if (!result?.ok) return NextResponse.json({ error: "The message could not be delivered. Please try again shortly." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
