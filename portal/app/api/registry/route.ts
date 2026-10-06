import {NextResponse} from "next/server";

const REGISTRY="https://registry.modelcontextprotocol.io/v0.1/servers";

export async function GET(req:Request){
  const {searchParams}=new URL(req.url);
  const search=(searchParams.get("search")||"").trim();
  const limit=Math.min(Math.max(Number(searchParams.get("limit")||24),1),100);
  const u=new URL(REGISTRY);
  u.searchParams.set("limit",String(limit));
  u.searchParams.set("version","latest");
  if(search)u.searchParams.set("search",search);
  try{
    const r=await fetch(u,{headers:{Accept:"application/json"},cache:"no-store"});
    const text=await r.text();
    if(!r.ok)return NextResponse.json({error:"Registry unavailable"}, {status:502});
    const d=JSON.parse(text);
    return NextResponse.json(d,{headers:{"Cache-Control":"public, max-age=300, s-maxage=300"}});
  }catch{
    return NextResponse.json({error:"Registry unavailable"},{status:502});
  }
}
