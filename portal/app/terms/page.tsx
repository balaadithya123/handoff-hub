import Legal from "../components/Legal";
export const metadata = { title: "Terms of Service · Handoff Hub" };

export default function Terms() {
  return (
    <Legal title="Terms of Service" updated="7 October 2026">
      <p>By using Handoff Hub you agree to these terms.</p>
      <h2>The service</h2>
      <p>Handoff Hub stores context you save, links your AI accounts, and relays requests from your AI apps to the integrations you connected. It is provided as is, and features may change.</p>
      <h2>Your responsibilities</h2>
      <ul>
        <li>You may only connect accounts you are allowed to use, and you are responsible for what your AI apps do with them.</li>
        <li>AI apps can take actions in connected services, including changes and deletions. Review what you authorize.</li>
        <li>Do not use the Hub to break the law, abuse a provider’s terms, or attack the service.</li>
      </ul>
      <h2>Your content</h2>
      <p>You keep ownership of everything you save. You allow us to store and process it only to provide the service.</p>
      <h2>Extra AI accounts</h2>
      <p>One account per AI app is included. Additional accounts of the same AI app need an unlock code, and pricing for that may be introduced later.</p>
      <h2>Availability and liability</h2>
      <p>We do not guarantee uninterrupted service. To the extent the law allows, we are not liable for indirect losses or for actions taken by AI apps or connected services.</p>
      <h2>Ending use</h2>
      <p>You can stop at any time by disconnecting your integrations and unlinking your AI accounts. We may suspend accounts that abuse the service.</p>
      <p>See also the <a href="/privacy">Privacy Policy</a>.</p>
    </Legal>
  );
}
