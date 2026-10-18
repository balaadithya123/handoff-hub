export type Provider=string;
const HUB=(process.env.NEXT_PUBLIC_HUB_URL||"https://handoff-mcp.vercel.app").replace(/\/$/,"");
async function call(body:Record<string,unknown>){const r=await fetch(HUB+"/api/provider-oauth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});const t=await r.text();let d:any={};try{d=t?JSON.parse(t):{};}catch{}if(!r.ok)throw new Error(d.error||"Handoff Hub OAuth request failed");return d}
export async function connectionStatus(session:string){return (await call({action:"status",portal_session:session})).connections as Array<{provider:Provider;provider_account_name:string|null;scope:string|null;updated_at:string}>}
/** Whether the Hub can really start a sign-in for an app: ready, needs an OAuth app set up, or not connectable. "unknown" = the check timed out. */
export type ProviderAvailability={provider:Provider;state:"ready"|"needs_app"|"unavailable"|"unknown";reason:string|null;setup:{env:string[];redirect_uri:string}|null};
export type ConnectionRow={provider:Provider;provider_account_name:string|null;scope:string|null;updated_at:string};
/** Connections plus per-app availability, for the Integrations directory. Slower than connectionStatus (it checks each provider), so only ask for it where it is shown. */
export async function providerStatus(session:string){const d=await call({action:"status",portal_session:session,include_providers:true});return {connections:(d.connections||[]) as ConnectionRow[],providers:(d.providers||[]) as ProviderAvailability[]}}
export async function startProviderOAuth(session:string,provider:Provider){return (await call({action:"start",portal_session:session,provider})).authorization_url as string}
export async function consumeProviderOAuth(session:string,provider:Provider,ticket:string){return (await call({action:"consume",portal_session:session,provider,ticket})).ok as boolean}
export async function deleteConnection(session:string,provider:Provider){return call({action:"disconnect",portal_session:session,provider})}
