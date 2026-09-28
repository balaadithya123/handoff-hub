import { startCanvaOAuth } from '../../../src/canva.js';
import { authenticate } from '../../../src/auth.js';
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try { const userId=await authenticate(req); if(!userId) return res.status(401).json({error:'Authentication required'}); return res.status(200).json(await startCanvaOAuth(userId)); }
  catch(error){ console.error('Canva OAuth start failed:',error); return res.status(500).json({error:error.message}); }
}
