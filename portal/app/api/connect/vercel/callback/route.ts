import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const u = new URL(req.url);
  const error = u.searchParams.get("error");
  return NextResponse.redirect(new URL(error ? "/?connection_error=" + encodeURIComponent(error) : "/?connected=vercel", req.url));
}
