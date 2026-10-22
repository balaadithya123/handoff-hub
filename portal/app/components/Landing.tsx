import { redirect } from "next/navigation";

// Fallback for a stale/invalid session cookie: show the same static Stitch landing page.
export default function Landing(): null {
  redirect("/landing.html");
}
