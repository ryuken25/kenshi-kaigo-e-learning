import { scriptDb } from '../api/_db.mjs';
const sql = scriptDb();

// Consistency check per 01-DATABASE.md — must return 0 rows.
// Sejak api/final.mjs membayar XP ujian, total_xp = SUM(level_progress.xp_earned)
// + SUM(final_progress.xp_earned); check lama yang cuma menjumlahkan level_progress
// akan melaporkan false positive untuk semua user yang pernah menyetor bagian ujian.
const inconsistent = await sql.query(`
  SELECT u.id, u.total_xp,
         COALESCE(l.lvl,0) + COALESCE(f.fin,0) AS real_xp
  FROM app_users u
  LEFT JOIN (SELECT user_id, SUM(xp_earned) lvl FROM level_progress GROUP BY user_id) l ON l.user_id = u.id
  LEFT JOIN (SELECT user_id, SUM(xp_earned) fin FROM final_progress GROUP BY user_id) f ON f.user_id = u.id
  WHERE u.total_xp <> COALESCE(l.lvl,0) + COALESCE(f.fin,0)
`);
console.log('Inconsistent users (should be empty):', JSON.stringify(inconsistent));

const attemptsCount = await sql`SELECT user_id, section_id, level_id, attempts FROM level_progress ORDER BY section_id, level_id`;
console.log('level_progress rows:', JSON.stringify(attemptsCount));

const levelAttemptsCount = await sql`SELECT count(*)::int AS c FROM level_attempts`;
console.log('level_attempts rows (idempotency cache):', JSON.stringify(levelAttemptsCount));

const finalAttemptsCount = await sql`SELECT count(*)::int AS c FROM final_attempts`;
console.log('final_attempts rows (idempotency cache):', JSON.stringify(finalAttemptsCount));

// postgres.js menahan socket tetap hidup; tanpa end() skrip ini menggantung.
await sql.end();
