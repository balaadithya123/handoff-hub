const baseUrl=()=>{if(process.env.PUBLIC_BASE_URL)return process.env.PUBLIC_BASE_URL.replace(/\/$/,'');if(process.env.VERCEL_PROJECT_PRODUCTION_URL)return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;return 'http://localhost:3000';};
export default function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const base=baseUrl();
  return res.status(200).json({resource:`${base}/api/mcp`,authorization_servers:[base],bearer_methods_supported:['header'],scopes_supported:['hub']});
}
