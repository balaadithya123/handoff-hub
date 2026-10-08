import { mutate, project, opsProject } from './store.js';
import { vercelGetLatestDeployment } from './integrations.js';
import { purgeOAuthData } from './oauth-store.js';
import { isOwner } from './owner.js';

function vercelProjectId(){return(process.env.VERCEL_ALLOWED_PROJECTS||'').split(',').map(x=>x.trim()).filter(Boolean)[0]||null;}
function selfBaseUrl(){const host=process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL;return host?`https://${host}`:null;}

async function checkVercel(userId){
  try{
    if(!isOwner(userId))return{ok:null,note:'Vercel deployment check is owner-only'};
    const projectId=vercelProjectId();
    if(!projectId)return{ok:null,note:'VERCEL_ALLOWED_PROJECTS is not configured'};
    const dep=await vercelGetLatestDeployment({projectId,target:'production'});
    return{ok:dep.deployment?.state==='READY',deployment:dep.deployment};
  }catch(error){return{ok:false,error:error.message};}
}

async function checkMcpEndpoint(){
  try{
    const base=selfBaseUrl();
    if(!base)return{ok:null,note:'No Vercel URL available in this runtime'};
    const r=await fetch(`${base}/api/mcp?deep=1`,{method:'GET'});
    const body=await r.json().catch(()=>({}));
    const blocked=r.status===401||r.status===403;
    return blocked
      ?{ok:null,status_code:r.status,note:'Endpoint blocked by deployment protection; inconclusive'}
      :{ok:r.ok&&body.status==='ok',status_code:r.status,version:body.version,status:body.status,tools:body.tools,...(r.ok?{}:{error:body.error||`HTTP ${r.status}`})};
  }catch(error){return{ok:false,error:error.message};}
}

async function checkRoutes(){
  try{
    const base=selfBaseUrl();
    if(!base)return{ok:null,note:'No Vercel URL available in this runtime'};
    const probes=[['/api/canva/oauth/callback',[400]],['/.well-known/oauth-protected-resource/api/mcp',[200]]];
    const results=await Promise.all(probes.map(async([path,expected])=>{
      const r=await fetch(`${base}${path}`,{method:'GET',redirect:'manual'});
      return{path,status_code:r.status,ok:r.status===401||r.status===403?null:expected.includes(r.status)};
    }));
    const bad=results.filter(x=>x.ok===false);
    return bad.length
      ?{ok:false,results,error:`unexpected status on ${bad.map(x=>`${x.path} (${x.status_code})`).join(', ')}`}
      :{ok:results.every(x=>x.ok===true)?true:null,results};
  }catch(error){return{ok:false,error:error.message};}
}

async function checkOAuthCleanup(){
  try{
    const purge=await purgeOAuthData();
    return{ok:true,...purge};
  }catch(error){return{ok:false,error:error.message,oauth_codes:0,oauth_tokens:0,oauth_clients:0};}
}

// project_id omitted: the health check is Hub operations data, so it goes to the portal project (state.meta.ops_project), which is the normal pool unless a project was designated.
export async function runHealthCheck(userId,{agent='worker',project_id}={}){
  // Four independent, read-only probes — run them concurrently instead of one after
  // another so a full health check costs roughly one round trip, not four.
  const[vercel,mcp_endpoint,routes,oauth_cleanup]=await Promise.all([
    checkVercel(userId),checkMcpEndpoint(),checkRoutes(),checkOAuthCleanup()
  ]);
  const checks={vercel,mcp_endpoint,routes,oauth_cleanup};
  const purge={oauth_codes:oauth_cleanup.oauth_codes||0,oauth_tokens:oauth_cleanup.oauth_tokens||0,oauth_clients:oauth_cleanup.oauth_clients||0};
  const anomalies=Object.entries(checks).filter(([,v])=>v.ok===false).map(([key,v])=>`${key}: ${v.error||'check failed'}`);
  const state=key=>(checks[key].ok===true?'ok':checks[key].ok===null?'inconclusive':'FAILED');
  const summary=anomalies.length
    ?`Autonomous health check found issues: ${anomalies.join('; ')}`
    :`Autonomous health check: Vercel ${state('vercel')}, MCP endpoint ${state('mcp_endpoint')}, routes ${state('routes')}, OAuth cleanup removed ${purge.oauth_codes} code(s), ${purge.oauth_tokens} token(s), ${purge.oauth_clients} client(s).`;
  const entry=await mutate(userId,current=>{const p=project(current,project_id??opsProject(current));const record={id:crypto.randomUUID(),at:new Date().toISOString(),agent,checks,anomalies};p.health_checks=p.health_checks||[];p.health_checks.unshift(record);p.health_checks=p.health_checks.slice(0,50);p.blockers=(p.blockers||[]).filter(b=>!b.startsWith('[auto]'));if(anomalies.length)p.blockers.push(`[auto] ${summary}`);p.events.unshift({type:'health_check',agent,summary,at:record.at});p.events=p.events.slice(0,100);return record;});
  return{summary,checks,anomalies,at:entry.at};
}
