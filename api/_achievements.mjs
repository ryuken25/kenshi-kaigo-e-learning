// ============================================================================
// ENGINE ACHIEVEMENT. Definisi di-seed di scripts/007_social_features.sql;
// file ini pegang RULES unlock + evaluator-nya. Dua jalur:
//   1. evaluateAchievements(sql, userId) — murni dari stats server, idempoten.
//      Dipanggil setelah completion resmi (api/progress.mjs), PATCH profile,
//      dan accept pertemanan.
//   2. reportClientAchievements(sql, userId, ids) — unlock ID whitelist yang
//      sumber datanya tidak bisa diverifikasi server penuh (glossary, unlimited
//      practice). Achievement ujian (exam-*) sekarang di-unlock api/final.mjs
//      lewat fungsi ini juga — final_progress terverifikasi server, tapi jalur
//      dedupe + sync bingkainya sama. ID di luar whitelist DITOLAK diam-diam.
//
// XP REWARD BELUM DIBAYAR (sengaja): total_xp selalu direcompute dari
// SUM(level_progress.xp_earned) — menyuntikkan XP dari luar merusak invariant
// scripts/verify-consistency.mjs. Kolom achievements.xp_reward disimpan
// supaya sistemnya bisa dinyalakan nanti tanpa migrasi baru.
// ============================================================================
import { levelsInSection } from './_sections.mjs';

// Bingkai avatar = hadiah achievement yang terlihat orang lain di papan peringkat.
// Diurutkan dari tertinggi; frameForCount() ambil tier pertama yang tercapai.
export const FRAME_TIERS = [
  { frame: 'rainbow', min: 35 },
  { frame: 'sakura',  min: 30 },
  { frame: 'gold',    min: 20 },
  { frame: 'silver',  min: 12 },
  { frame: 'bronze',  min: 5 },
];
export const frameForCount = (n) => FRAME_TIERS.find(t => n >= t.min)?.frame || 'none';

// Yang BOLEH dilaporkan client. Di luar ini = dihitung server, laporan ditolak.
const CLIENT_REPORTABLE = new Set(['exam-first','exam-pass','exam-gold','exam-all-years','perfect-part','unlimited-100','glossary-10','glossary-50','glossary-all']);

async function fetchStats(sql, userId) {
  const u = await sql`SELECT total_xp, streak_longest, handle, display_name, avatar_key, theme, timezone FROM app_users WHERE id=${userId}`;
  if (!u[0]) return null;
  const agg = await sql`
    SELECT COUNT(*) FILTER (WHERE status='completed')::int AS completed,
           COUNT(*) FILTER (WHERE best_score>=100)::int AS perfects
    FROM level_progress WHERE user_id=${userId}`;
  const perSection = await sql`
    SELECT section_id, COUNT(*)::int n FROM level_progress
    WHERE user_id=${userId} AND status='completed' GROUP BY section_id`;
  const friendCount = await sql`
    SELECT COUNT(*)::int n FROM friendships
    WHERE (user_id=${userId} OR friend_id=${userId}) AND status='accepted'`;
  const times = await sql`SELECT first_completed_at t FROM level_progress WHERE user_id=${userId} AND first_completed_at IS NOT NULL`;
  return { u: u[0], agg: agg[0], perSection, friendCount: friendCount[0].n, times };
}

// Semua rule yang bisa dihitung server: id -> bool.
function computeUnlocks(st) {
  const { u, agg, perSection, friendCount, times } = st;
  const secDone = (sid) => (perSection.find(r => r.section_id === sid)?.n || 0) >= levelsInSection(sid);
  // early-bird / night-owl: jam completion dalam timezone user.
  // Dihitung di JS (bukan AT TIME ZONE di SQL) supaya nama timezone yang
  // tidak dikenal tidak meledakkan query — cukup dilewati.
  let early = false, night = false;
  for (const r of times) {
    try {
      const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: u.timezone || 'Asia/Tokyo' }).format(new Date(r.t)));
      if (h < 8) early = true;
      if (h >= 21) night = true;
    } catch { /* timezone tidak valid — skip */ }
  }
  return {
    'first-steps': agg.completed >= 1,
    'level-10': agg.completed >= 10,
    'level-25': agg.completed >= 25,
    'level-50': agg.completed >= 50,
    'level-75': agg.completed >= 75,
    'all-152': agg.completed >= 152,
    'section-1': secDone(1),
    'perfect-score': agg.perfects >= 1,
    'streak-3': u.streak_longest >= 3,
    'streak-7': u.streak_longest >= 7,
    'streak-30': u.streak_longest >= 30,
    'early-bird': early,
    'night-owl': night,
    'xp-100': u.total_xp >= 100,
    'xp-500': u.total_xp >= 500,
    'xp-1000': u.total_xp >= 1000,
    'handle-set': Boolean(u.handle),
    'profile-setup': Boolean(u.display_name) && u.avatar_key !== 'kitty-1',
    'avatar-pick': u.avatar_key !== 'kitty-1',
    'theme-switch': u.theme !== 'kitty',
    'first-friend': friendCount >= 1,
    'friend-5': friendCount >= 5,
    'friend-10': friendCount >= 10,
  };
}

// Insert unlock idempoten; kembalikan HANYA yang baru (RETURNING cuma berisi
// baris yang benar-benar ter-insert). Submit berulang tidak pernah mendobel.
async function unlock(sql, userId, ids) {
  if (!ids.length) return [];
  const rows = await sql`
    INSERT INTO user_achievements(user_id, achievement_id)
    SELECT ${userId}, id FROM achievements WHERE id = ANY(${ids})
    ON CONFLICT (user_id, achievement_id) DO NOTHING
    RETURNING achievement_id`;
  if (!rows.length) return [];
  const newIds = rows.map(r => r.achievement_id);
  return sql`SELECT id, name_id, desc_id, category, icon, xp_reward, tier FROM achievements WHERE id = ANY(${newIds}) ORDER BY category, tier`;
}

// Samakan avatar_frame dengan tier tertinggi yang tercapai. Frame HANYA NAIK
// lewat jalur ini; penurunan terjadi via reset progress (bukan di sini).
async function syncAvatarFrame(sql, userId) {
  const c = await sql`SELECT COUNT(*)::int n FROM user_achievements WHERE user_id=${userId}`;
  const frame = frameForCount(c[0].n);
  if (frame !== 'none') await sql`UPDATE app_users SET avatar_frame=${frame}, updated_at=now() WHERE id=${userId}`;
}

// Evaluator utama. Kembalikan daftar achievement yang BARU terbuka (lengkap
// dengan nama/deskripsi/icon) supaya caller bisa langsung tampilin toast.
export async function evaluateAchievements(sql, userId) {
  const st = await fetchStats(sql, userId);
  if (!st) return [];
  const already = new Set((await sql`SELECT achievement_id FROM user_achievements WHERE user_id=${userId}`).map(r => r.achievement_id));
  const unlockedNow = Object.entries(computeUnlocks(st)).filter(([id, ok]) => ok && !already.has(id)).map(([id]) => id);
  const fresh = await unlock(sql, userId, unlockedNow);
  await syncAvatarFrame(sql, userId);
  return fresh;
}

// Achievement leaderboard dievaluasi terpisah: hitung peringkat mingguan itu
// query terberat di app, jadi hanya dijalankan saat user benar-benar membuka
// papan global (api/leaderboard.mjs), bukan tiap submit progress.
export async function evaluateLeaderboardAchievements(sql, userId, rank) {
  if (!rank) return [];
  const ids = ['lb-appear'];
  if (rank <= 50) ids.push('lb-top50');
  if (rank <= 10) ids.push('lb-top10');
  const already = new Set((await sql`SELECT achievement_id FROM user_achievements WHERE user_id=${userId} AND achievement_id = ANY(${ids})`).map(r => r.achievement_id));
  return unlock(sql, userId, ids.filter(id => !already.has(id)));
}

// Jalur client-report: hanya whitelist, dedupe, max 10 per request.
export async function reportClientAchievements(sql, userId, rawIds) {
  const ids = [...new Set((Array.isArray(rawIds) ? rawIds : []).map(String).filter(id => CLIENT_REPORTABLE.has(id)))].slice(0, 10);
  const fresh = await unlock(sql, userId, ids);
  if (fresh.length) await syncAvatarFrame(sql, userId);
  return fresh;
}
