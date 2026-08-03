import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { db, ensureSchema } from '../_db.mjs';
const hash=(v)=>crypto.createHash('sha256').update(v).digest('hex');
const json=(res,b,s=200)=>res.status(s).setHeader('Cache-Control','no-store').json(b);
const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export default async function handler(req,res){
 if(req.method!=='POST') return json(res,{error:'Method not allowed'},405);
 try{
  const email=String(req.body?.email||'').trim().toLowerCase(); if(!emailRe.test(email)) return json(res,{error:'Valid email required'},400);
  await ensureSchema(); const sql=db(); const raw=crypto.randomBytes(32).toString('base64url');
  await sql`INSERT INTO magic_tokens(token_hash,email,expires_at) VALUES(${hash(raw)},${email},now()+interval '20 minutes')`;
  const base=process.env.APP_URL||`https://${req.headers.host}`; const link=`${base}/api/auth/verify?token=${encodeURIComponent(raw)}`;
  const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
  await transporter.sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:email,subject:'Your Kaigo Kitty sign-in link',text:`Open this link within 20 minutes to sign in: ${link}`,html:`<p>Open this link within 20 minutes to sign in to Kaigo Kitty:</p><p><a href="${link}">Sign in to Kaigo Kitty</a></p>`});
  return json(res,{ok:true,message:'If the address is eligible, a sign-in link has been sent.'});
 }catch(e){console.error(e);return json(res,{error:'Unable to send sign-in link'},500)}
}
