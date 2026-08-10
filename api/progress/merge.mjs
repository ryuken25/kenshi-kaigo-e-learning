import { db } from '../_db.mjs';
import { requireUser, computeXpCandidate, computeStars, recomputeAllXp } from '../_auth.mjs';
import { isValidLevel } from '../_sections.mjs';

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
      const totalXp = await recomputeAllXp(sql, user.id);
      return res.status(200).json({ alreadyMerged: true, totalXp, merged: 0, skipped: 0 });
    }

    let merged = 0, skipped = 0;
    for (const e of entries) {
      const sectionId = Number(e.sectionId), levelId = Number(e.levelId), bestScore = Number(e.bestScore), attempts = Number(e.attempts) || 1;
      // isValidLevel: section/level harus benar-benar ada (api/_sections.mjs). Tanpa ini
      // localStorage guest yang diedit bisa menyuntik row di luar range, dan row itu ikut
      // kehitung di gate 80% /api/progress.
      // attempts di-clamp juga: nilainya dari client dan DIJUMLAHKAN ke kolom attempts (+= EXCLUDED),
      // jadi angka absurd/negatif dari payload bikin statistik attempts permanen rusak.
      if (!isValidLevel(sectionId, levelId) || !Number.isFinite(bestScore) || bestScore < 0 || bestScore > 100 || !Number.isInteger(attempts) || attempts < 1 || attempts > 999) {
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

    const totalXp = await recomputeAllXp(sql, user.id);
    await sql`UPDATE app_users SET total_xp = ${totalXp}, updated_at = now() WHERE id = ${user.id}`;

    return res.status(200).json({ merged, skipped, totalXp, alreadyMerged: false });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error', message: 'Merge service unavailable' });
  }
}
