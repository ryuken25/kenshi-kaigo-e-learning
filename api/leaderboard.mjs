import { db } from './_db.mjs';
import { requireUser } from './_auth.mjs';
import { evaluateLeaderboardAchievements } from './_achievements.mjs';

// Papan peringkat mingguan — XP dari daily_activity sejak Senin 00:00 Asia/Tokyo.
// GET /api/leaderboard?scope=friends|global   (friends = default)
//
// Aturan desain penting:
// - Global: top 100, hanya user visibility='public' yang punya handle,
//   respons BOLEH di-cache publik 60 detik (isinya sama untuk semua orang).
// - Friends: per-user, cache private pendek.
// - Pemecah seri DETERMINISTIK (xp → streak → created_at → id). ORDER BY xp
//   saja bikin peringkat orang ber-XP sama lompat-lompat tiap refresh dan
//   terlihat seperti bug.
// - Posisi sendiri (me) selalu dihitung walau di luar top 100 — UI menempelnya.
// - Delta ▲▼ dari leaderboard_seen (peringat terakhir yang dilihat, per minggu).

// Senin 00:00 Asia/Tokyo sebagai 'YYYY-MM-DD'. Dihitung lewat formatToParts
// (bukan aritmetika UTC) supaya tidak salah di tepi hari.
function weekStartTokyo(now = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  const parts = fmt.formatToParts(now);
  const get = (t) => parts.find(p => p.type === t)?.value;
  const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get('weekday')] ?? 1;
  const back = (dow + 6) % 7; // hari sejak Senin
  const monday = new Date(now.getTime() - back * 86400000);
  const p2 = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(monday);
  const g = (t) => p2.find(x => x.type === t)?.value;
  return `${g('year')}-${g('month')}-${g('day')}`;
}

const rowJson = (r, i, myHandle) => ({
  rank: i + 1, handle: r.handle, displayName: r.display_name || r.handle,
  avatarKey: r.avatar_key, avatarFrame: r.avatar_frame, streak: r.streak_current,
  characterId: r.character_id || 'momo',
  weeklyXp: r.xp, isMe: r.handle === myHandle,
});

export default async function handler(req, res) {
  try {
    const sql = db();
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
    const scope = req.query?.scope === 'global' ? 'global' : 'friends';
    // Global boleh dilihat GUEST (cache publik); friends butuh login.
    const user = await requireUser(sql, req);
    if (!user && scope !== 'global') return res.status(401).json({ error: 'Not signed in' });
    const weekStart = weekStartTokyo();
    const resetsAt = `${weekStart}T00:00:00+09:00`;

    if (scope === 'global') {
      // Cache publik HANYA untuk tamu. Untuk user login respons ini TIDAK sama
      // bagi semua orang — ada blok `me` (handle, rank, XP mingguan), flag isMe
      // di tiap baris, dan newAchievements. Menandainya `public` mengizinkan
      // cache bersama menyajikan potongan identitas satu user ke user lain.
      res.setHeader('Cache-Control', user ? 'private, max-age=60' : 'public, max-age=60');
      const rows = await sql`
        WITH wk AS (
          SELECT user_id, SUM(xp_gained)::int AS xp FROM daily_activity
          WHERE activity_date >= ${weekStart}::date GROUP BY user_id
        )
        SELECT u.handle, u.display_name, u.avatar_key, u.avatar_frame, u.character_id, u.streak_current, wk.xp
        FROM wk JOIN app_users u ON u.id = wk.user_id
        WHERE u.visibility='public' AND u.handle IS NOT NULL
        ORDER BY wk.xp DESC, u.streak_current DESC, u.created_at ASC, u.id ASC
        LIMIT 100`;

      // Posisi sendiri — hanya kalau login + memenuhi syarat tampil (public + punya handle).
      let me = null, delta = null;
      const eligible = Boolean(user && user.handle) && user.visibility === 'public';
      if (eligible) {
        const my = await sql`SELECT COALESCE(SUM(xp_gained),0)::int xp FROM daily_activity WHERE user_id=${user.id} AND activity_date >= ${weekStart}::date`;
        // ROW_NUMBER di atas CTE dan ORDER BY yang SAMA PERSIS dengan daftar di atas.
        // Rumus lama COUNT(WHERE xp > punyaku) + 1 salah di dua arah:
        //   (a) Senin pagi papan masih kosong -> nol baris di atasku -> rank 1, dan
        //       evaluateLeaderboardAchievements membagikan lb-appear + lb-top50 +
        //       lb-top10 ke user ber-XP 0 yang bahkan tidak ada di papan. Unlock-nya
        //       permanen, dan jendelanya terbuka SETIAP Senin.
        //   (b) 11 orang seri 100 XP: semuanya dapat rank 1 walau daftarnya
        //       mengurutkan mereka 1..11 lewat tiebreak — layar menampilkan saya di
        //       baris #12 sekaligus kartu "Posisimu: #1".
        // rank null = memang belum punya aktivitas minggu ini; klien menampilkannya
        // sebagai "belum masuk papan", dan achievement peringkat TIDAK dievaluasi.
        const rankRows = await sql`
          WITH wk AS (
            SELECT user_id, SUM(xp_gained)::int AS xp FROM daily_activity
            WHERE activity_date >= ${weekStart}::date GROUP BY user_id
          ), peringkat AS (
            SELECT u.id, ROW_NUMBER() OVER (
              ORDER BY wk.xp DESC, u.streak_current DESC, u.created_at ASC, u.id ASC
            )::int AS rn
            FROM wk JOIN app_users u ON u.id = wk.user_id
            WHERE u.visibility='public' AND u.handle IS NOT NULL
          )
          SELECT rn FROM peringkat WHERE id = ${user.id}`;
        const rank = rankRows[0]?.rn ?? null;
        me = { handle: user.handle, weeklyXp: my[0].xp, rank, inTop: rank !== null && rank <= 100 };
        // Hanya dicatat kalau user BENAR-BENAR ada di papan. Menyimpan rank null
        // melanggar NOT NULL last_rank, dan panah delta ▲▼ minggu depan jadi
        // dihitung dari angka yang tidak pernah nyata.
        if (rank !== null) {
          const seen = await sql`SELECT last_rank FROM leaderboard_seen WHERE user_id=${user.id} AND scope='global' AND week_start=${weekStart}::date`;
          delta = seen[0] ? seen[0].last_rank - rank : null; // positif = naik ▲
          await sql`
            INSERT INTO leaderboard_seen(user_id, scope, week_start, last_rank)
            VALUES(${user.id}, 'global', ${weekStart}::date, ${rank})
            ON CONFLICT (user_id, scope, week_start) DO UPDATE SET last_rank=EXCLUDED.last_rank, seen_at=now()`;
        }
      }
      const newAchievements = me ? await evaluateLeaderboardAchievements(sql, user.id, me.rank) : [];
      return res.status(200).json({
        scope, weekStart, resetsAt,
        rows: rows.map((r, i) => rowJson(r, i, user ? user.handle : null)),
        me: me ? { ...me, delta } : null,
        newAchievements,
      });
    }

    // ===== friends =====
    res.setHeader('Cache-Control', 'private, max-age=15');
    // Lingkaran = teman accepted dua arah + diri sendiri, LEFT JOIN XP mingguan
    // (0 kalau belum ada aktivitas minggu ini — teman baru tetap muncul).
    const rows = await sql`
      WITH circle AS (
        SELECT f.friend_id uid FROM friendships f WHERE f.user_id=${user.id} AND f.status='accepted'
        UNION
        SELECT f.user_id uid FROM friendships f WHERE f.friend_id=${user.id} AND f.status='accepted'
        UNION
        SELECT ${user.id}::uuid uid
      )
      SELECT u.handle, u.display_name, u.avatar_key, u.avatar_frame, u.character_id, u.streak_current,
             COALESCE(wk.xp, 0)::int AS xp
      FROM circle c
      JOIN app_users u ON u.id = c.uid
      LEFT JOIN (
        SELECT user_id, SUM(xp_gained)::int xp FROM daily_activity
        WHERE activity_date >= ${weekStart}::date GROUP BY user_id
      ) wk ON wk.user_id = u.id
      ORDER BY xp DESC, u.streak_current DESC, u.created_at ASC, u.id ASC`;
    return res.status(200).json({ scope, weekStart, resetsAt, rows: rows.map((r, i) => rowJson(r, i, user.handle)), me: null, newAchievements: [] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error', message: 'Leaderboard service unavailable' });
  }
}
