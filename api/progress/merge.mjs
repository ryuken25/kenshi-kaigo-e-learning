import { db } from '../_db.mjs';
import { requireUser, computeXpCandidate, computeStars } from '../_auth.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const sql = db();
    const user = await requireUser(sql, req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });

    const clientId = String(req.body?.clientId || '');
    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    if (!clientId) return res.status(400).json({ error: 'invalid_input', message: 'clientId required' });
    if (entries.length > 300) return res.status(400).json({ error: 'invalid_input', message: 'too many entries' });

    const already = await sql`SELECT 1 FROM progress_merges WHERE client_id = ${clientId}`;
    if (already[0]) {
      const totalXpRows = await sql`SELECT COALESCE(SUM(xp_earned),0)::int AS total FROM level_progress WHERE user_id = ${user.id}`;
      return res.status(200).json({ alreadyMerged: true, totalXp: totalXpRows[0].total, merged: 0, skipped: 0 });
    }

    let merged = 0, skipped = 0;
    for (const e of entries) {
      const sectionId = Number(e.sectionId), levelId = Number(e.levelId), bestScore = Number(e.bestScore), attempts = Number(e.attempts) || 1;
      if (!Number.isInteger(sectionId) || !Number.isInteger(levelId) || !Number.isFinite(bestScore) || bestScore < 0 || bestScore > 100) {
        skipped++;
        continue;
      }
      const isCompleted = bestScore >= 60;
      const stars = computeStars(bestScore);
      const xpCandidate = isCompleted ? computeXpCandidate({ score: bestScore, attempts: 0 }) : 0;

      await sql`
        INSERT INTO level_progress(user_id, section_id, level_id, status, best_score, last_score, stars, attempts, xp_earned, first_completed_at, last_attempt_at)
        VALUES (${user.id}, ${sectionId}, ${levelId}, ${isCompleted ? 'completed' : 'in_progress'}, ${bestScore}, ${bestScore}, ${stars}, ${attempts}, ${xpCandidate},
                ${isCompleted ? sql`now()` : null}, now())
        ON CONFLICT (user_id, section_id, level_id) DO UPDATE SET
          status = CASE WHEN level_progress.status = 'completed' OR EXCLUDED.status = 'completed' THEN 'completed' ELSE level_progress.status END,
          best_score = GREATEST(level_progress.best_score, EXCLUDED.best_score),
          stars = GREATEST(level_progress.stars, EXCLUDED.stars),
          attempts = level_progress.attempts + EXCLUDED.attempts,
          xp_earned = GREATEST(level_progress.xp_earned, EXCLUDED.xp_earned),
          first_completed_at = COALESCE(level_progress.first_completed_at, EXCLUDED.first_completed_at)
      `;
      merged++;
    }

    await sql`INSERT INTO progress_merges(client_id, user_id, entries_count) VALUES (${clientId}, ${user.id}, ${merged})`;

    const totalXpRows = await sql`SELECT COALESCE(SUM(xp_earned),0)::int AS total FROM level_progress WHERE user_id = ${user.id}`;
    const totalXp = totalXpRows[0].total;
    await sql`UPDATE app_users SET total_xp = ${totalXp}, updated_at = now() WHERE id = ${user.id}`;

    return res.status(200).json({ merged, skipped, totalXp, alreadyMerged: false });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error', message: 'Merge service unavailable' });
  }
}
