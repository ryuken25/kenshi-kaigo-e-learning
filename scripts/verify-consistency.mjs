import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Consistency check per 01-DATABASE.md — must return 0 rows.
const inconsistent = await sql.query(`
  SELECT u.id, u.total_xp, COALESCE(SUM(p.xp_earned),0) AS real_xp
  FROM app_users u
  LEFT JOIN level_progress p ON p.user_id = u.id
  GROUP BY u.id, u.total_xp
  HAVING u.total_xp <> COALESCE(SUM(p.xp_earned),0)
`);
console.log('Inconsistent users (should be empty):', JSON.stringify(inconsistent));

const attemptsCount = await sql`SELECT user_id, section_id, level_id, attempts FROM level_progress ORDER BY section_id, level_id`;
console.log('level_progress rows:', JSON.stringify(attemptsCount));

const levelAttemptsCount = await sql`SELECT count(*)::int AS c FROM level_attempts`;
console.log('level_attempts rows (idempotency cache):', JSON.stringify(levelAttemptsCount));
