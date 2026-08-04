import crypto from 'node:crypto';

export const hash = (v) => crypto.createHash('sha256').update(v).digest('hex');

export function cookieHeader(name, value, maxAgeSeconds) {
  const parts = [`${name}=${value}`, 'Path=/', `Max-Age=${maxAgeSeconds}`, 'HttpOnly', 'Secure', 'SameSite=Lax'];
  return parts.join('; ');
}

export function clearCookieHeader(name) {
  return cookieHeader(name, '', 0);
}

export function getSessionToken(req) {
  const raw = (req.headers.cookie || '').match(/kaigo_session=([^;]+)/)?.[1];
  return raw ? decodeURIComponent(raw) : null;
}

// Loads authenticated user (full profile incl xp/streak). Returns null if not signed in / expired.
export async function requireUser(sql, req) {
  const raw = getSessionToken(req);
  if (!raw) return null;
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.avatar_seed, u.timezone,
           u.total_xp, u.streak_current, u.streak_longest, u.last_active_date
    FROM app_sessions s
    JOIN app_users u ON u.id = s.user_id
    WHERE s.token_hash = ${hash(raw)} AND s.expires_at > now() AND s.revoked_at IS NULL
  `;
  if (!rows[0]) return null;
  // sliding renewal touch
  await sql`UPDATE app_sessions SET last_seen_at = now() WHERE token_hash = ${hash(raw)}`;
  return rows[0];
}

export const SECTIONS = 13;
export const LEVELS_PER_SECTION = 17;

export function computeXpCandidate({ score, attempts }) {
  const base = 10;
  const bonusAkurasi = score >= 100 ? 10 : score >= 80 ? 5 : 0;
  const bonusFirstTry = attempts === 0 && score >= 80 ? 5 : 0;
  return base + bonusAkurasi + bonusFirstTry;
}

export function computeStars(score) {
  if (score >= 95) return 3;
  if (score >= 80) return 2;
  if (score >= 60) return 1;
  return 0;
}
