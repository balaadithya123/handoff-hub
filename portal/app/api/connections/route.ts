import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../lib/portal";
import { connectionStatus } from "../../../lib/connections";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ connections: await connectionStatus(token) });
}