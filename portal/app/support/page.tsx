import Legal from "../components/Legal";
export const metadata = { title: "Support · Handoff Hub" };
const CONTACT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

export default function Support() {
  return (
    <Legal title="Support" updated="7 October 2026">
      <p>{CONTACT ? <>Questions or problems? Email <a href={"mailto:" + CONTACT}>{CONTACT}</a>.</> : <>Questions or problems? Sign in to the portal and use the contact details on your account page.</>}</p>
      <h2>Common fixes</h2>
      <ul>
        <li><b>Connect says the app cannot register:</b> some providers only allow approved apps. The portal shows the provider’s exact message.</li>
        <li><b>An AI app lost access:</b> reconnect the Handoff Hub connector in that app, then sign in again.</li>
        <li><b>Adding a second account of the same AI app:</b> the Hub sign-in page asks for an unlock code. If you are only reconnecting the same account, choose to replace the old connection instead.</li>
      </ul>
      <p><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a></p>
    </Legal>
  );
}
