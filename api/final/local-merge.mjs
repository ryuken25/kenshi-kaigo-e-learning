import { db } from '../_db.mjs';
import { requireUser } from '../_auth.mjs';
import finalData from '../../src/content/final/index.js';
import { PARTS, PER_PART, sanitizeAnswers } from '../_final.mjs';

// POST /api/final/local-merge — angkat progress ujian dari localStorage ke server.
// Dua klien pemanggil:
//  1. FinalHome: sekali setelah login pertama (flag kk_final_merged) untuk data
//     era-guest yang dulu hanya tersimpan di perangkat.
//  2. FinalResult: replay bagian yang tersimpan saat offline (entri saved:false).
// Idempoten by-design: upsert dengan GREATEST + ON CONFLICT tidak menaikkan
// attempts, jadi pemanggilan berulang tidak pernah mendobel statistik.
// XP TIDAK dibayar retroaktif (xp_earned 0) — hanya submit online via POST
// /api/final yang bisa mengubah total_xp, menjaga invariant verify-consistency.
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const sql = db();
    const user = await requireUser(sql, req);
    if (!user) return res.status(401).json({ error: 'Not signed in' });

    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    if (entries.length > 40) return res.status(400).json({ error: 'invalid_input', message: 'too many entries' });
    let merged = 0;
    for (const e of entries) {
      const year = Number(e.year), part = Number(e.part), best = Number(e.best), answered = Number(e.answered);
      const clean = sanitizeAnswers(e.answers, part);
      if (!finalData[year] || !Number.isInteger(part) || part < 1 || part > PARTS ||
          !Number.isInteger(best) || best < 0 || best > PER_PART ||
          !Number.isInteger(answered) || answered < 0 || answered > PER_PART || !clean) continue;
      const mode = e.mode === 'exam' ? 'exam' : 'practice';
      await sql`
        INSERT INTO final_progress(user_id, year, part, mode, correct_count, answered, best_correct, attempts, xp_earned, answers, first_done_at, last_attempt)
        VALUES (${user.id}, ${year}, ${part}, ${mode}, ${best}, ${answered}, ${best}, 1, 0, ${JSON.stringify(clean)}, now(), now())
        ON CONFLICT (user_id, year, part) DO UPDATE SET
          best_correct = GREATEST(final_progress.best_correct, EXCLUDED.best_correct),
          correct_count = GREATEST(final_progress.correct_count, EXCLUDED.correct_count),
          answered = GREATEST(final_progress.answered, EXCLUDED.answered),
          mode = EXCLUDED.mode,
          answers = CASE WHEN EXCLUDED.best_correct > final_progress.best_correct THEN EXCLUDED.answers ELSE final_progress.answers END,
          last_attempt = now()
      `;
      merged++;
    }
    return res.status(200).json({ merged });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error', message: 'Final merge service unavailable' });
  }
}
