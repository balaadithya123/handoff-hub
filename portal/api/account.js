import crypto from "node:crypto";
const cookie="hh_portal";
function hash(password,salt){return crypto.scryptSync(password,salt,64).toString("hex")+":"+salt}
function verify(password,stored){const [digest,salt]=String(stored).split(":");if(!digest||!salt)return false;const actual=crypto.scryptSync(password,salt,64).toString("hex");return crypto.timingSafeEqual(Buffer.from(actual),Buffer.from(digest))}
async function db(method,path,body){const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!u||!k)throw Error("Account database is not configured");return fetch(u+"/rest/v1/"+path,{method,headers:{apikey:k,Authorization:"Bearer "+k,"Content-Type":"application/json",Prefer:"return=representation"},body:body?JSON.stringify(body):undefined})}
function parse(req){return req.body&&typeof req.body==="object"?req.body:{}}
function setCookie(res,v,max=86400){res.setHeader("Set-Cookie",cookie+"="+encodeURIComponent(v)+"; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age="+max)}
function clear(res){res.setHeader("Set-Cookie",cookie+"=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0")}
function session(email){return crypto.createHmac("sha256",process.env.PORTAL_SESSION_SECRET||process.env.SUPABASE_SERVICE_ROLE_KEY).update(email).digest("hex")+"."+Buffer.from(email).toString("base64url")}
function emailFrom(req){const raw=req.headers.cookie||"";const m=raw.split(";").map(x=>x.trim()).find(x=>x.startsWith(cookie+"="));if(!m)return null;const v=decodeURIComponent(m.slice(cookie.length+1));const [sig,b64]=v.split(".");if(!sig||!b64)return null;const email=Buffer.from(b64,"base64url").toString();const expected=crypto.createHmac("sha256",process.env.PORTAL_SESSION_SECRET||process.env.SUPABASE_SERVICE_ROLE_KEY).update(email).digest("hex");return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))?email:null}
export default async function handler(req,res){
 try{
  if(req.method==="GET"){const email=emailFrom(req);return res.status(200).json(email?{user:{email}}:{user:null})}
  if(req.method==="DELETE"){clear(res);return res.status(200).json({ok:true})}
  if(req.method!=="POST")return res.status(405).end();
  const b=parse(req),email=String(b.email||"").trim().toLowerCase(),password=String(b.password||""),action=b.action==="signup"?"signup":"login";
  if(!email||!password)return res.status(400).json({error:"Email and password are required."});
  if(password.length<6)return res.status(400).json({error:"Password must be at least 6 characters."});
  const existing=await db("GET","portal_accounts?email=eq."+encodeURIComponent(email)+"&select=id,email,password_hash&limit=1");
  const rows=await existing.json();
  if(action==="signup"){if(rows.length)return res.status(409).json({error:"An account with this email already exists."});const salt=crypto.randomBytes(16).toString("hex");const created=await db("POST","portal_accounts",{email,password_hash:hash(password,salt)});if(!created.ok)return res.status(500).json({error:"Could not create the account."})}
  else {if(!rows.length||!verify(password,rows[0].password_hash))return res.status(401).json({error:"Incorrect email or password."})}
  setCookie(res,session(email));return res.status(200).json({user:{email}});
 }catch(e){return res.status(500).json({error:e.message||"Account service error."})}
}