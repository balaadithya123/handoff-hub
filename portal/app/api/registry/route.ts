import {NextResponse} from "next/server";

const REGISTRY="https://registry.modelcontextprotocol.io/v0.1/servers";

const CHATGPT_APPS:Record<string,string[]> = {
  "github":["github"],"gitlab":["gitlab"],"google drive":["google drive","googledrive"],"slack":["slack"],
  "notion":["notion"],"linear":["linear"],"hubspot":["hubspot"],"box":["box"],"dropbox":["dropbox"],
  "gmail":["gmail"],"google calendar":["google calendar","googlecalendar"],"microsoft teams":["microsoft teams","teams"],
  "sharepoint":["sharepoint"],"onenote":["onenote"],"zendesk":["zendesk"]
};

function canonicalName(name:string){
  const n=name.toLowerCase().replace(/[._/-]+/g," ").replace(/\s+/g," ").trim();
  for(const [canonical,aliases] of Object.entries(CHATGPT_APPS)){
    if(aliases.some(a=>n===a || n.endsWith(" "+a) || n.startsWith(a+" "))) return canonical;
  }
  return "";
}

export async function GET(req:Request){
  const {searchParams}=new URL(req.url);
  const search=(searchParams.get("search")||"").trim();
  const limit=Math.min(Math.max(Number(searchParams.get("limit")||50),1),50);
  const u=new URL(REGISTRY);
  u.searchParams.set("limit",String(limit));
  u.searchParams.set("version","latest");
  if(search)u.searchParams.set("search",search);
  try{
    const r=await fetch(u,{headers:{Accept:"application/json"},cache:"no-store"});
    const raw=await r.text();
    if(!r.ok)return NextResponse.json({error:"Registry unavailable"},{status:502});
    const d=JSON.parse(raw);
    const seen=new Set<string>();
    const servers=Array.isArray(d?.servers)
      ? d.servers.map((entry:any)=>entry?.server??entry).filter(Boolean).filter((s:any)=>{
          const canonical=canonicalName(String(s.title||s.name||""));
          const remote=Array.isArray(s.remotes)&&s.remotes.some((x:any)=>typeof x?.url==="string"&&/^https?:\/\//i.test(x.url));
          if(!canonical||!remote||seen.has(canonical)) return false;
          seen.add(canonical); return true;
        })
      : [];
    return NextResponse.json({...d,servers},{headers:{"Cache-Control":"public, max-age=300, s-maxage=300"}});
  }catch{
    return NextResponse.json({error:"Registry unavailable"},{status:502});
  }
}
