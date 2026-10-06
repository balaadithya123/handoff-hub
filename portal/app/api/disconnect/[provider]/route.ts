import {NextRequest,NextResponse} from "next/server";
import {SESSION_COOKIE,sessionUser} from "../../../../lib/portal";
import {deleteConnection,Provider} from "../../../../lib/connections";
const providers:Provider[]=["github","canva","vercel","supabase"];
export async function POST(req:NextRequest,{params}:{params:Promise<{provider:string}>}){const {provider}=await params;if(!providers.includes(provider as Provider))return NextResponse.json({error:"Unsupported provider"},{status:404});const token=req.cookies.get(SESSION_COOKIE)?.value;if(!token||!(await sessionUser(token)))return NextResponse.json({error:"Not signed in."},{status:401});try{return NextResponse.json(await deleteConnection(token,provider as Provider))}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Could not disconnect provider"},{status:502})}}
