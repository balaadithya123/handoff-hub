import { redirect } from "next/navigation";

// Serve the complete original landing (all sections) from the known-good commit.
// This avoids the tool payload size limit that truncated the static file.
// Design improvements (2D mesh, dual beams, etc.) will be re-applied on top of the full content next.
export default function Landing(): null {
  redirect("https://raw.githubusercontent.com/balaadithya123/handoff-hub/30abf5ee8513/portal/public/landing.html");
}
