import crypto from 'node:crypto';
import { db, ensureSchema } from './_db.mjs';

const hash=(v)=>crypto.createHash('sha256').update(v).digest('hex');
const cookie=(name,value,maxAge)=>`${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
const json=(body,status=200,headers={})=>({status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers},body:JSON.stringify(body)});

export default async function handler(req,res){
 try{
  await ensureSchema(); const sql=db();
  if(req.method==='GET'){
   const raw=(req.headers.cookie||'').match(/kaigo_session=([^;]+)/)?.[1];
   if(!raw) return res.status(200).json({user:null});
   const rows=await sql`SELECT u.id,u.email,u.name,u.avatar_url,u.total_xp,u.streak FROM app_sessions s JOIN app_users u ON u.id=s.user_id WHERE s.token_hash=${hash(raw)} AND s.expires_at>now()`;
   return res.status(200).json({user:rows[0]||null});
  }
  if(req.method==='DELETE'){
   const raw=(req.headers.cookie||'').match(/kaigo_session=([^;]+)/)?.[1]; if(raw) await sql`DELETE FROM app_sessions WHERE token_hash=${hash(raw)}`;
   res.setHeader('Set-Cookie',cookie('kaigo_session','',0)); return res.status(200).json({ok:true});
  }
  return res.status(405).json({error:'Method not allowed'});
 }catch(e){console.error(e);return res.status(500).json({error:'Auth service unavailable'});}
}
