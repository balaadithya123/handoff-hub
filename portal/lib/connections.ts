export type Provider=string;
const HUB=(process.env.NEXT_PUBLIC_HUB_URL||"https://handoff-mcp.vercel.app").replace(/\/$/,"");
async function call(body:Record<string,unknown>){const r=await fetch(HUB+"/api/provider-oauth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});const t=await r.text();let d:any={};try{d=t?JSON.parse(t):{};}catch{}if(!r.ok)throw new Error(d.error||"Axon OAuth request failed");return d}
export async function connectionStatus(session:string){return (await call({action:"status",portal_session:session})).connections as Array<{provider:Provider;provider_account_name:string|null;scope:string|null;updated_at:string}>}
/** Whether the Hub can really start a sign-in for an app: ready, needs an OAuth app set up, or not connectable. "unknown" = the check timed out. */
export type ProviderAvailability={provider:Provider;state:"ready"|"needs_app"|"unavailable"|"unknown";reason:string|null;setup:{env:string[];redirect_uri:string}|null};
export type ConnectionRow={provider:Provider;provider_account_name:string|null;scope:string|null;updated_at:string};
/** Connections plus per-app availability, for the Integrations directory. Slower than connectionStatus (it checks each provider), so only ask for it where it is shown. */
export async function providerStatus(session:string){const d=await call({action:"status",portal_session:session,include_providers:true});return {connections:(d.connections||[]) as ConnectionRow[],providers:(d.providers||[]) as ProviderAvailability[]}}
export async function startProviderOAuth(session:string,provider:Provider){return (await call({action:"start",portal_session:session,provider})).authorization_url as string}
export async function consumeProviderOAuth(session:string,provider:Provider,ticket:string){return (await call({action:"consume",portal_session:session,provider,ticket})).ok as boolean}
export async function deleteConnection(session:string,provider:Provider){return call({action:"disconnect",portal_session:session,provider})}
export async function exportProject(session:string,hubUser:string,project:string){return (await call({action:"export_project",portal_session:session,hub_user:hubUser,project})) as {ok:boolean;filename:string;markdown:string}}

export type LibraryFile={id:string;name:string;size_bytes:number;content_type:string;uploaded_by:string|null;note:string|null;created_at:string};
export type FileLibrary={ok:boolean;used_bytes:number;limit_bytes:number;max_file_bytes:number;files:LibraryFile[]};
export async function filesList(session:string,hubUser:string){return (await call({action:"files_list",portal_session:session,hub_user:hubUser})) as FileLibrary}
export async function filesDownloadUrl(session:string,hubUser:string,fileId:string){return (await call({action:"files_download",portal_session:session,hub_user:hubUser,file_id:fileId})) as {ok:boolean;url:string;name:string}}
export async function filesDelete(session:string,hubUser:string,fileId:string){return (await call({action:"files_delete",portal_session:session,hub_user:hubUser,file_id:fileId})) as {ok:boolean;deleted:boolean;name:string}}
export async function filesPutText(session:string,hubUser:string,name:string,text:string,note?:string){return (await call({action:"files_put_text",portal_session:session,hub_user:hubUser,name,text,note})) as {ok:boolean;file_id?:string;name?:string}}
