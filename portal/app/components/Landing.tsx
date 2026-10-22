import { redirect } from "next/navigation";

// Serve the complete improved landing page (all original sections + 2D animations).
// User uploaded it as landing-improved-full.html.
export default function Landing(): null {
  redirect("/landing-improved-full.html");
}
