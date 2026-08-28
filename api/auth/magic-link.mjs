import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { db } from '../_db.mjs';
import { hash } from '../_auth.mjs';

const json = (res, b, s = 200) => res.status(s).setHeader('Cache-Control', 'no-store').json(b);
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate-limit in-memory per email + per IP: tanpa ini endpoint bisa dipakai untuk
// email-bombing satu alamat. Instanceless (tiap serverless instance punya Map sendiri),
// jadi limit efektif = batas × jumlah instance aktif — tetap memotong bulk abuse.
const rlMap = new Map();
// Pembersihan HARUS di dalam rlTake. Dulu barisnya berdiri di lingkup MODUL, jadi
// dievaluasi tepat sekali saat cold start — waktu rlMap masih kosong — dan tidak
// pernah lagi sesudahnya. Komentarnya menjanjikan pembersihan yang tidak pernah
// terjadi: pada instance warm yang dihujani email/IP berbeda, map-nya tumbuh
// monoton sampai kehabisan memori, dan entri yang jendelanya sudah lewat pun
// tidak pernah dilepas.
const RL_MAX_ENTRIES = 10000;
const rlTake = (key, max, windowMs) => {
  const now = Date.now();
  if (rlMap.size > RL_MAX_ENTRIES) {
    // Buang yang jendelanya sudah lewat dulu; kalau masih sesak juga, kosongkan
    // total. Mengosongkan total memang melonggarkan limit sesaat, tapi itu jauh
    // lebih baik daripada instance mati kehabisan memori.
    for (const [k, v] of rlMap) if (now - v.start > windowMs) rlMap.delete(k);
    if (rlMap.size > RL_MAX_ENTRIES) rlMap.clear();
  }
  const e = rlMap.get(key);
  if (!e || now - e.start > windowMs) { rlMap.set(key, { start: now, n: 1 }); return true; }
  if (e.n >= max) return false;
  e.n += 1; return true;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!emailRe.test(email)) return json(res, { error: 'Valid email required' }, 400);

    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() || 'unknown';
    if (!rlTake(`e:${email}`, 3, 10 * 60 * 1000) || !rlTake(`i:${ip}`, 20, 10 * 60 * 1000)) {
      return json(res, { error: 'Too many sign-in requests. Try again in a few minutes.' }, 429);
    }

    // v8: tujuan asal (dari /login?next=...) dibawa lewat link. Hanya terima path
    // relatif internal — tolak apapun yang bisa jadi open redirect (//host, skema).
    let next = String(req.body?.next || '');
    if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) next = '';

    const sql = db();
    const raw = crypto.randomBytes(32).toString('base64url');
    await sql`INSERT INTO magic_tokens(email, token_hash, expires_at) VALUES(${email}, ${hash(raw)}, now() + interval '20 minutes')`;

    const base = process.env.APP_URL || `https://${req.headers.host}`;
    const link = `${base}/api/auth/verify?token=${encodeURIComponent(raw)}${next ? `&next=${encodeURIComponent(next)}` : ''}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your Kenshi Kaigo E-Learning sign-in link',
      text: `Open this link within 20 minutes to sign in: ${link}`,
      html: `<p>Open this link within 20 minutes to sign in to Kenshi Kaigo E-Learning:</p><p><a href="${link}">Sign in to Kenshi Kaigo E-Learning</a></p>`,
    });

    return json(res, { ok: true, message: 'If the address is eligible, a sign-in link has been sent.' });
  } catch (e) {
    console.error(e);
    return json(res, { error: 'Unable to send sign-in link' }, 500);
  }
}
