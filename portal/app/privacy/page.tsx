import Legal from "../components/Legal";
export const metadata = { title: "Privacy Policy \u00B7 Handoff Hub" };
const CONTACT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

export default function Privacy() {
  return (
    <Legal title="Privacy Policy" updated="7 October 2026">
      <p>Handoff Hub lets you connect your own apps and AI accounts so that context and tool access can follow you between them. This page explains what we store and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account:</b> the email address you sign in to the portal with.</li>
        <li><b>Content you or your AI apps save:</b> memories, events, project state and handoff tasks written through the Hub tools. Each account only sees its own. The most recent 500 memories and 100 events per project are kept.</li>
        <li><b>Connection tokens:</b> when you connect an integration (for example GitHub, Notion or Canva), the provider gives us an access token and sometimes a refresh token. They are encrypted on our server and used only to act for you when you or your linked AI account asks.</li>
        <li><b>AI app sessions:</b> which AI apps you have signed in to the Hub, and when they were last active.</li>
      </ul>
      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell your data, show ads, or use your content to train AI models.</li>
        <li>We never receive your passwords for connected apps; sign-in happens on the provider\u2019s own page.</li>
      </ul>
      <h2>How data is used</h2>
      <p>Data is used only to run the features you use: signing you in, linking AI accounts, calling the integrations you connected, and showing your activity history. When an AI app calls a tool, the request and result pass through our server to the provider you chose.</p>
      <h2>Who processes it</h2>
      <p>We host on Vercel and store data in Supabase. Each integration you connect (GitHub, Notion, Slack and so on) receives only the requests you or your AI account make to it and is governed by its own privacy policy.</p>
      <h2>Your controls</h2>
      <ul>
        <li>Disconnect any integration from the Integrations page.</li>
        <li>Unlink any AI account from the AI accounts page, and revoke AI app access with the <code>revoke_oauth_sessions</code> tool.</li>
        <li>To delete your account and all stored content, contact us{CONTACT ? <> at <a href={"mailto:" + CONTACT}>{CONTACT}</a></> : null}.</li>
      </ul>
      <h2>Security</h2>
      <p>Tokens are encrypted at rest, sessions are server-side, and access is limited to your own account. No online service can promise perfect security.</p>
      <h2>Changes</h2>
      <p>If this policy changes, the date above changes with it.</p>
    </Legal>
  );
}
