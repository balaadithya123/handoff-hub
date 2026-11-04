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
  if (subject.length < 3 || message.length < 10) {
    return NextResponse.json({ error: "Add a subject and a message of at least 10 characters." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AXON_SUPPORT_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json({ error: "Support email delivery is not configured yet. Please try again later." }, { status: 503 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: ["msg2balaa@gmail.com"],
      reply_to: user.email,
      subject: `[Axon Support] ${category}: ${subject}`,
      text: `From: ${user.email}\nCategory: ${category}\nSubject: ${subject}\n\n${message}`,
    }),
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json({ error: "The email could not be delivered. Please try again shortly." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
