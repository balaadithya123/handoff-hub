export type App = {
  id: string;
  name: string;
  category: string;
  description: string;
  /** true = the Hub can start a real sign-in for this app today. Others are listed honestly as coming soon. */
  live: boolean;
};

const A = (id: string, name: string, category: string, description: string, live: boolean): App => ({ id, name, category, description, live });

export const APPS: App[] = [
  A("github", "GitHub", "Developer", "Repositories, issues and pull requests.", true),
  A("gitlab", "GitLab", "Developer", "Source control and CI/CD pipelines.", true),
  A("vercel", "Vercel", "Developer", "Projects, deployments and domains.", true),
  A("sentry", "Sentry", "Developer", "Errors, releases and performance.", true),
  A("bitbucket", "Bitbucket", "Developer", "Code hosting for teams.", false),
  A("notion", "Notion", "Productivity", "Docs, wikis and team knowledge.", true),
  A("google-drive", "Google Drive", "Productivity", "Files, documents and shared drives.", true),
  A("google-calendar", "Google Calendar", "Productivity", "Calendars, events and scheduling.", true),
  A("sharepoint", "SharePoint", "Productivity", "Microsoft team sites and files.", true),
  A("onenote", "OneNote", "Productivity", "Notes and notebooks.", true),
  A("box", "Box", "Storage", "Secure enterprise content.", true),
  A("dropbox", "Dropbox", "Storage", "Cloud files and team storage.", true),
  A("slack", "Slack", "Communication", "Team messages and channels.", true),
  A("microsoft-teams", "Microsoft Teams", "Communication", "Team chat and meetings.", true),
  A("gmail", "Gmail", "Communication", "Email and mailbox workflows.", true),
  A("discord", "Discord", "Communication", "Community and team chat.", false),
  A("linear", "Linear", "Project Management", "Product and engineering issues.", true),
  A("jira", "Jira", "Project Management", "Issues, sprints and planning.", true),
  A("asana", "Asana", "Project Management", "Tasks, projects and team plans.", true),
  A("clickup", "ClickUp", "Project Management", "Tasks, docs and workflows.", false),
  A("monday", "Monday.com", "Project Management", "Work management for teams.", false),
  A("hubspot", "HubSpot", "CRM & Support", "Contacts, deals and marketing.", true),
  A("zendesk", "Zendesk", "CRM & Support", "Tickets and customer support.", true),
  A("salesforce", "Salesforce", "CRM & Support", "CRM records and pipelines.", false),
  A("intercom", "Intercom", "CRM & Support", "Customer messaging.", false),
  A("supabase", "Supabase", "Data", "Projects, databases and edge functions.", true),
  A("postgresql", "PostgreSQL", "Data", "Direct database access.", false),
  A("snowflake", "Snowflake", "Data", "Cloud data warehouse.", false),
  A("bigquery", "BigQuery", "Data", "Analytics data warehouse.", false),
  A("google-analytics", "Google Analytics", "Data", "Web and product analytics.", false),
  A("canva", "Canva", "Design", "Designs and team assets.", true),
  A("figma", "Figma", "Design", "Design files and components.", true),
  A("zapier", "Zapier", "Automation", "Automations across apps.", false),
];

export const CATEGORIES: string[] = Array.from(new Set(APPS.map((a) => a.category)));

export const APP_BY_ID = new Map<string, App>(APPS.map((a) => [a.id, a]));

/** What an AI can do once an app in this category is connected. Shown in the integration drawer. */
export const CATEGORY_CAPABILITIES: Record<string, string[]> = {
  Developer: ["Read code, issues, deployments or errors on request", "Act only on resources the Hub allowlist permits", "Every action is logged in Activity"],
  Productivity: ["Find and read documents and notes you point it at", "Save summaries back where you choose", "Scoped to the account you sign in with"],
  Storage: ["Locate and read files you share with it", "Works with the permissions of the account you connect"],
  Communication: ["Read channels or threads you grant", "Draft replies for you to review", "Uses the provider's own permission screen"],
  "Project Management": ["Read and update issues and tasks", "Link work to the project the AI is handing off", "Scoped to the workspace you authorise"],
  "CRM & Support": ["Look up records and tickets", "Summarise customer history for a handoff"],
  Data: ["Inspect schemas and run reads you allow", "Credentials stay on the server, never in the AI app"],
  Design: ["List and open designs you have access to", "Create new designs on request"],
  Automation: ["Trigger workflows you have set up"],
};

export const initials = (name: string): string =>
  name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
