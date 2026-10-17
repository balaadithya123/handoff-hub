/**
 * Real brand marks for integration cards (Simple Icons paths via CDN).
 * Site branding stays separate — this is only for third-party apps.
 */

const SLUG: Record<string, string> = {
  github: "github/181717",
  gitlab: "gitlab/FC6D26",
  vercel: "vercel/000000",
  sentry: "sentry/362D59",
  bitbucket: "bitbucket/0052CC",
  notion: "notion/000000",
  "google-drive": "googledrive/4285F4",
  "google-calendar": "googlecalendar/4285F4",
  sharepoint: "microsoftsharepoint/038387",
  onenote: "microsoftonenote/7719AA",
  box: "box/0061D5",
  dropbox: "dropbox/0061FF",
  slack: "slack/4A154B",
  "microsoft-teams": "microsoftteams/6264A7",
  gmail: "gmail/EA4335",
  discord: "discord/5865F2",
  linear: "linear/5E6AD2",
  jira: "jira/2684FF",
  asana: "asana/F06A6A",
  clickup: "clickup/7B68EE",
  monday: "mondaydotcom/FF3D57",
  hubspot: "hubspot/FF7A59",
  zendesk: "zendesk/03363D",
  salesforce: "salesforce/00A1E0",
  intercom: "intercom/1F8DED",
  supabase: "supabase/3ECF8E",
  postgresql: "postgresql/4169E1",
  snowflake: "snowflake/29B5E8",
  bigquery: "googlebigquery/669DF6",
  "google-analytics": "googleanalytics/E37400",
  figma: "figma/F24E1E",
  canva: "canva/00C4CC",
  zapier: "zapier/FF4A00",
};

export default function AppMark({
  id,
  size = 22,
  className = "",
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const slug = SLUG[id];
  if (slug) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://cdn.simpleicons.org/${slug}`}
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }
  const letter = (id?.[0] || "?").toUpperCase();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6" fill="#efeee9" />
      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="600" fill="#141414">
        {letter}
      </text>
    </svg>
  );
}
