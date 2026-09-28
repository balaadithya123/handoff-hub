import { completeCanvaOAuth } from '../../../src/canva.js';
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try { const userId=await completeCanvaOAuth(req.query?.code,req.query?.state); return res.status(200).send('<html><body><h2>Canva connected to Handoff Hub</h2><p>You can close this window and return to your Handoff Hub session.</p></body></html>'); }
  catch(error){ console.error('Canva OAuth callback failed:',error); return res.status(400).send(`<html><body><h2>Canva connection failed</h2><p>${String(error.message||error).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]))}</p></body></html>`); }
}
