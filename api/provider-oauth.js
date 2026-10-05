import {providerAction,providerCallback} from '../src/provider-oauth.js';
export default async function handler(req,res){
  try{
    const q=req.query||{};
    if(q.callback==='1'){
      const p=String(q.provider||''),code=String(q.code||''),state=String(q.state||''),error=String(q.error||'');
      if(error)return res.redirect(302,'https://handoff-portal.vercel.app/api/connect/'+encodeURIComponent(p)+'?connection_error='+encodeURIComponent(error));
      if(!code||!state)return res.status(400).send('Missing OAuth code or state');
      const ticket=await providerCallback(p,code,state);
      return res.redirect(302,'https://handoff-portal.vercel.app/api/connect/'+encodeURIComponent(p)+'?ticket='+encodeURIComponent(ticket));
    }
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    return res.status(200).json(await providerAction(body));
  }catch(e){console.error('Provider OAuth failed:',e);return res.status(400).json({error:e?.message||String(e)})}
}
