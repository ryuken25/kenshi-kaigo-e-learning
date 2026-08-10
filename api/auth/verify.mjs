import crypto from 'node:crypto';
import { db } from '../_db.mjs';
import { hash, cookieHeader } from '../_auth.mjs';

export default async function handler(req, res) {
  try {
    const token = String(req.query?.token || '');
    if (!token) return res.status(400).send('Missing sign-in token');

    const sql = db();
    // Single-use atomik: satu UPDATE ... RETURNING menandai token terpakai SEKALIGUS
    // mengambil email. Pola lama (SELECT lalu UPDATE terpisah) membiarkan dua verify
    // paralel sama-sama lolos. UPDATE hanya match baris used_at IS NULL & belum expired.
    const rows = await sql`
      UPDATE magic_tokens SET used_at = now()
      WHERE token_hash = ${hash(token)} AND used_at IS NULL AND expires_at > now()
      RETURNING email
    `;
    if (!rows[0]) return res.status(400).send('This sign-in link is invalid or expired. Request a new one.');

    const email = rows[0].email;
    const users = await sql`
      INSERT INTO app_users(email, name)
      VALUES(${email}, ${email.split('@')[0]})
      ON CONFLICT (lower(email)) DO UPDATE SET updated_at = now()
      RETURNING id
    `;
    const userId = users[0].id;

    const session = crypto.randomBytes(32).toString('base64url');
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 255);
    const ipHash = hash(String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''));
    await sql`
      INSERT INTO app_sessions(user_id, token_hash, expires_at, user_agent, ip_hash)
      VALUES(${userId}, ${hash(session)}, now() + interval '30 days', ${userAgent}, ${ipHash})
    `;

    // v8: kembalikan user ke tujuan asal (?next=). Tanpa next tetap /profile —
    // itu titik yang memicu onboarding wizard untuk user baru.
    // Sanitisasi sama seperti magic-link: hanya path relatif internal.
    let next = String(req.query?.next || '');
    if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) next = '/profile';

    res.setHeader('Set-Cookie', cookieHeader('kaigo_session', session, 60 * 60 * 24 * 30));
    res.setHeader('Location', process.env.APP_URL ? `${process.env.APP_URL}${next}` : next);
    return res.status(302).send('Signed in. Redirecting…');
  } catch (e) {
    console.error(e);
    return res.status(500).send('Auth service unavailable');
  }
}
