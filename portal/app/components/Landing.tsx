import { redirect } from "next/navigation";

// Fallback for a stale/invalid session cookie: show the same static Stitch landing page.
// Explicit `null` return type: a `never`-returning component fails the JSX type check at build time.
export default function Landing(): null {
  redirect("/landing.html");
}
