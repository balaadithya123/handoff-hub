/**
 * Simple 2D monochrome marks for integration cards.
 * Geometric / letter-based only — no brand trademarks, no decorative color.
 */

const stroke = "currentColor";

const marks: Record<string, React.ReactNode> = {
  github: (
    <>
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.5" fill="none" />
      <path d="M9 18c0-2 1.5-3 3-3s3 1 3 3" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="9.5" cy="11" r="1" fill={stroke} />
      <circle cx="14.5" cy="11" r="1" fill={stroke} />
    </>
  ),
  gitlab: (
    <path
      d="M12 20L4 8l2.5-5L9 10h6l2.5-7L20 8l-8 12z"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  vercel: (
    <path d="M12 5l9 15H3L12 5z" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
  ),
  sentry: (
    <>
      <path d="M12 4l8 14H4L12 4z" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="1.5" fill={stroke} />
    </>
  ),
  bitbucket: (
    <path
      d="M5 7h14l-1.5 10a2 2 0 01-2 1.8H8.5a2 2 0 01-2-1.8L5 7zM9 11h6"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  notion: (
    <path
      d="M7 5h8l2 2v12H9l-2-2V5zM10 9h4M10 13h4M10 17h2"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  "google-drive": (
    <path
      d="M8 18h8l3-5-4-7H9L5 13l3 5z"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  "google-calendar": (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2" stroke={stroke} strokeWidth="1.5" fill="none" />
      <path d="M4 10h16M8 4v4M16 4v4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  sharepoint: (
    <>
      <circle cx="12" cy="9" r="3" stroke={stroke} strokeWidth="1.5" fill="none" />
      <circle cx="8" cy="15" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="15" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none" />
    </>
  ),
  onenote: (
    <path
      d="M6 4h9l3 3v13H6V4zM10 9h4M10 13h4M10 17h2"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  box: (
    <rect x="5" y="5" width="14" height="14" rx="2" stroke={stroke} strokeWidth="1.5" fill="none" />
  ),
  dropbox: (
    <path
      d="M7 8l5 3 5-3-5-3-5 3zm0 6l5 3 5-3M7 14l5-3 5 3"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  slack: (
    <>
      <path d="M8 14v3a1.5 1.5 0 11-3 0v-3h3zM10 8h3a1.5 1.5 0 100-3h-3v3z" stroke={stroke} strokeWidth="1.5" fill="none" />
      <path d="M14 10v3a1.5 1.5 0 103 0v-3h-3zM10 14H7a1.5 1.5 0 100 3h3v-3z" stroke={stroke} strokeWidth="1.5" fill="none" />
      <rect x="8" y="8" width="6" height="6" stroke={stroke} strokeWidth="1.5" fill="none" />
    </>
  ),
  "microsoft-teams": (
    <>
      <rect x="4" y="8" width="10" height="10" rx="1.5" stroke={stroke} strokeWidth="1.5" fill="none" />
      <path d="M14 10h4a2 2 0 012 2v4a2 2 0 01-2 2h-4" stroke={stroke} strokeWidth="1.5" fill="none" />
      <circle cx="18" cy="7" r="2" stroke={stroke} strokeWidth="1.5" fill="none" />
    </>
  ),
  gmail: (
    <path
      d="M4 7l8 6 8-6v10a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  discord: (
    <path
      d="M7 17c-1-1.5-1.5-4-1.5-6 0-3 1.5-5 1.5-5s1.5-1 5-1 5 1 5 1 1.5 2 1.5 5c0 2-.5 4.5-1.5 6l-2-1s.5-1 .5-2c-2 1-4 1-6 0 0 1 .5 2 .5 2l-2 1zM10 12.5h.01M14 12.5h.01"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ),
  linear: (
    <path d="M5 16L16 5M8 19l11-11" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
  ),
  jira: (
    <path
      d="M12 4l6 8-6 8-6-8 6-8z"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  asana: (
    <>
      <circle cx="12" cy="8" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none" />
      <circle cx="8" cy="15" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="15" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none" />
    </>
  ),
  clickup: (
    <path d="M5 13l7-7 7 7M8 17l4-4 4 4" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  monday: (
    <path d="M5 18V8l3.5 6L12 8l3.5 6L19 8v10" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  hubspot: (
    <>
      <circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth="1.5" fill="none" />
      <path d="M12 5v2M12 17v2M5 12h2M17 12h2M7.5 7.5l1.4 1.4M15.1 15.1l1.4 1.4M7.5 16.5l1.4-1.4M15.1 8.9l1.4-1.4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  zendesk: (
    <path d="M5 8c3 0 5 3 7 3s4-3 7-3M5 16c3 0 5-3 7-3s4 3 7 3" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinecap="round" />
  ),
  salesforce: (
    <path
      d="M9 14c-2 0-3.5-1.5-3.5-3.5S7 7 9 7c.5-1.5 2-2.5 3.5-2.5 1.8 0 3.2 1.2 3.5 2.8 1.5.2 2.5 1.4 2.5 3S17 14 15.5 14H9z"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  intercom: (
    <path
      d="M5 8a7 7 0 0114 0v6a3 3 0 01-3 3H8a3 3 0 01-3-3V8zM9 12v2M12 11v3M15 12v2"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
  ),
  supabase: (
    <path d="M12 4v9h7L12 20V11H5L12 4z" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
  ),
  postgresql: (
    <path
      d="M8 6c0-1 2-2 4-2s4 1 4 2v10c0 1.5-1.5 3-4 3s-4-1.5-4-3V6zM8 10h8M8 14h8"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  snowflake: (
    <path
      d="M12 4v16M6 7l12 10M18 7L6 17M5 12h14"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  ),
  bigquery: (
    <path
      d="M12 4l8 4.5v7L12 20l-8-4.5v-7L12 4zM12 12l8-4.5M12 12v8M12 12L4 7.5"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  "google-analytics": (
    <path d="M6 18V12M12 18V8M18 18V5" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
  ),
  canva: (
    <path
      d="M7 17c2-6 4-10 5-10s3 4 5 10M9 13h6"
      stroke={stroke}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
  ),
  figma: (
    <>
      <circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth="1.5" fill="none" />
      <path d="M9 6h3a3 3 0 010 6H9V6zM9 12h3a3 3 0 010 6H9v-6zM9 6a3 3 0 100 6M15 9a3 3 0 100 6" stroke={stroke} strokeWidth="1.5" fill="none" />
    </>
  ),
  zapier: (
    <path d="M13 4l-2 7h5l-7 9 2-7H6l7-9z" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
  ),
};

const fallback = (
  <path d="M8 8h8v8H8z" stroke={stroke} strokeWidth="1.5" fill="none" />
);

export default function AppMark({
  id,
  size = 20,
  className = "",
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {marks[id] ?? fallback}
    </svg>
  );
}
