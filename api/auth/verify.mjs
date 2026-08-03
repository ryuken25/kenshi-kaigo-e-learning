import crypto from 'node:crypto';
import { db, ensureSchema } from '../_db.mjs';
const hash=(v)=>crypto.createHash('sha256').update(v).digest('hex');
const cookie=(name,value,maxAge)=>`${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
export default async function handler(req,res){
 try{
  const token=String(req.query?.token||''); if(!token) return res.status(400).send('Missing sign-in token');
  await ensureSchema(); const sql=db();
  const rows=await sql`SELECT token_hash,email FROM magic_tokens WHERE token_hash=${hash(token)} AND used_at IS NULL AND expires_at>now()`;
  if(!rows[0]) return res.status(400).send('This sign-in link is invalid or expired. Request a new one.');
  const email=rows[0].email;
  const users=await sql`INSERT INTO app_users(email,name) VALUES(${email},${email.split('@')[0]}) ON CONFLICT(email) DO UPDATE SET updated_at=now() RETURNING id,email,name,avatar_url,total_xp,streak`;
  const session=crypto.randomBytes(32).toString('base64url');
  await sql`UPDATE magic_tokens SET used_at=now() WHERE token_hash=${hash(token)}`;
  await sql`INSERT INTO app_sessions(token_hash,user_id,expires_at) VALUES(${hash(session)},${users[0].id},now()+interval '30 days')`;
  res.setHeader('Set-Cookie',cookie('kaigo_session',session,60*60*24*30));
  res.setHeader('Location',process.env.APP_URL||'/profile'); return res.status(302).send('Signed in. Redirecting…');
 }catch(e){console.error(e);return res.status(500).send('Auth service unavailable')}
}
