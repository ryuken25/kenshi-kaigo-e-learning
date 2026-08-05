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

// Jumlah section & level per section ada di ./_sections.mjs (SECTION_LEVELS).
// LEVELS_PER_SECTION lama dihapus: nilainya hardcoded 17 padahal cuma section 11
// yang punya 17 level, jadi 11 dari 13 section tidak pernah bisa lolos gate 80%.
export { SECTION_COUNT as SECTIONS, levelsInSection, meetsSectionGate, sectionPercent } from './_sections.mjs';

// isRepeat: true kalau level ini SUDAH pernah berstatus 'completed' sebelumnya (grinding ulang).
// Completion pertama kali dapat XP penuh; replay cuma dapat 20% (minimum 2 XP).
export function computeXpCandidate({ score, attempts, isRepeat = false }) {
  const base = 10;
  const bonusAkurasi = score >= 100 ? 10 : score >= 80 ? 5 : 0;
  const bonusFirstTry = attempts === 0 && score >= 80 ? 5 : 0;
  const full = base + bonusAkurasi + bonusFirstTry;
  if (!isRepeat) return full;
  return Math.max(2, Math.round(full * 0.2));
}

// XP kecil untuk preview attempt (level/section yang belum resmi terbuka) — insentif eksplorasi.
export const PREVIEW_XP_FLAT = 3;
// XP flat untuk practice/unlimited mode — tidak memengaruhi unlock/progress resmi.
export const PRACTICE_XP_FLAT = 1;

export function computeStars(score) {
  if (score >= 95) return 3;
  if (score >= 80) return 2;
  if (score >= 60) return 1;
  return 0;
}
