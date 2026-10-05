import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionUser } from "../../../../lib/portal";
import { deleteConnection, providerConfig } from "../../../../lib/connections";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!providerConfig(provider)) return NextResponse.json({ error: "Unsupported provider" }, { status: 404 });
  const user = await sessionUser(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  await deleteConnection(token, provider as "github" | "canva" | "vercel");
  return NextResponse.json({ ok: true });
}
