import { db } from './_db.mjs';
import { requireUser, recomputeAllXp } from './_auth.mjs';
import { reportClientAchievements } from './_achievements.mjs';
import finalData from '../src/content/final/index.js';
import { PARTS, PER_PART, UUID_RE, sanitizeAnswers, finalXpFor } from './_final.mjs';

// GET  /api/final              — progress ujian semua tahun {progress, prefMode}.
// POST /api/final              — submit satu bagian (25 soal).
// POST /api/final/local-merge  — angkat data lama / offline (final/local-merge.mjs).
// PATCH /api/final             — simpan preferensi mode ke app_users.pref_final_mode.
//
// KEAMANAN (pola sama dengan api/progress.mjs):
// - correct TIDAK dipercaya dari client — server menghitung ulang dari bank soal
//   deterministik (PRNG FNV-1a+mulberry32, tanpa Math.random), jadi kunci jawaban
//   bisa direkonstruksi identik di server. Jawaban yang tidak cocok kunci diabaikan.
// - attemptId wajib UUID; idempotensi per attempt_id+user via final_attempts
//   (replay mengembalikan response cache, tidak pernah mendobel attempts/XP).
// - XP ujian disimpan di final_progress.xp_earned; total_xp direcompute gabungan
//   (recomputeAllXp) dan dicatat ke app_users supaya leaderboard konsisten.
const YEARS = Object.keys(finalData).map(Number);

// Achievement ujian dihitung server sekarang (final_progress bisa diverifikasi).
// Kelimanya ada di whitelist CLIENT_REPORTABLE, jadi unlock lewat jalur yang sama
// dengan POST /api/achievements (dedupe + sync bingkai sudah termasuk).
async function unlockExamAchievements(sql, userId, { correct }) {
  const ids = ['exam-first'];
  if (correct === PER_PART) ids.push('perfect-part');
  const doneYears = await sql`SELECT year FROM final_progress WHERE user_id = ${userId} GROUP BY year HAVING COUNT(*) = ${PER_PART}`;
  if (doneYears.length >= 1) ids.push('exam-pass');
  if (doneYears.length >= YEARS.length) ids.push('exam-all-years');
  const partsDone = await sql`SELECT COUNT(*)::int n FROM final_progress WHERE user_id = ${userId}`;
  if (partsDone[0].n >= 30) ids.push('exam-gold'); // >=60% dari 50 bagian
  return reportClientAchievements(sql, userId, ids);
}

async function syncTotalXp(sql, userId) {
  const totalXp = await recomputeAllXp(sql, userId);
  await sql`UPDATE app_users SET total_xp = ${totalXp}, updated_at = now() WHERE id = ${userId}`;
  return totalXp;
}

export default async function handler(req, res) {
  try {
    const sql = db();
    const user = await requireUser(sql, req);
    if (!user) return res.status(401).json({ error: 'Not signed in' });

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'private, no-store');
      const rows = await sql`SELECT year, part, mode, correct_count, answered, best_correct, attempts, xp_earned, last_attempt FROM final_progress WHERE user_id = ${user.id}`;
      const progress = {};
      for (const r of rows) {
        (progress[r.year] ||= {})[r.part] = {
          best: r.best_correct, answered: r.answered, attempts: r.attempts,
          mode: r.mode, xp: r.xp_earned, lastAttempt: r.last_attempt,
        };
      }
      return res.status(200).json({ progress, prefMode: user.pref_final_mode === 'exam' ? 'exam' : 'practice' });
    }

    if (req.method === 'PATCH') {
      const mode = req.body?.mode;
      if (mode !== 'practice' && mode !== 'exam')
        return res.status(400).json({ error: 'invalid_input', message: 'mode must be practice|exam' });
      await sql`UPDATE app_users SET pref_final_mode = ${mode}, updated_at = now() WHERE id = ${user.id}`;
      return res.status(200).json({ ok: true, prefMode: mode });
    }

    if (req.method === 'POST') {
      // ===== SUBMIT SATU BAGIAN =====
      const body = req.body || {};
      const year = Number(body.year), part = Number(body.part);
      const attemptId = String(body.attemptId || '');
      if (!finalData[year])
        return res.status(400).json({ error: 'invalid_input', message: 'year not available' });
      if (!Number.isInteger(part) || part < 1 || part > PARTS)
        return res.status(400).json({ error: 'invalid_input', message: 'part out of range' });
      if (!attemptId) return res.status(400).json({ error: 'invalid_input', message: 'attemptId required' });
      if (!UUID_RE.test(attemptId))
        return res.status(400).json({ error: 'invalid_input', message: 'attemptId must be a UUID' });

      const clean = sanitizeAnswers(body.answers, part);
      if (!clean) return res.status(400).json({ error: 'invalid_input', message: 'answers object required' });

      const mode = body.mode === 'exam' ? 'exam' : body.mode === 'practice' ? 'practice' : null;
      let durationMs = Number(body.durationMs);
      if (!Number.isFinite(durationMs) || durationMs < 0 || durationMs > 3600000) durationMs = 0;

      // Idempotensi di-scope ke user (pola progress.mjs): tanpa AND user_id, replay
      // attemptId user lain membocorkan response mereka.
      const existingAttempt = await sql`SELECT response FROM final_attempts WHERE attempt_id = ${attemptId} AND user_id = ${user.id}`;
      if (existingAttempt[0]) return res.status(200).json(existingAttempt[0].response);

      // Hitung ulang jawaban benar dari bank soal — klaim client tidak dipakai.
      const qs = finalData[year].questions.slice((part - 1) * PER_PART, part * PER_PART);
      let correct = 0;
      for (const x of qs) if (clean[String(x.no)] === x.answer) correct++;
      const answered = Object.keys(clean).length;

      const existing = await sql`SELECT * FROM final_progress WHERE user_id = ${user.id} AND year = ${year} AND part = ${part}`;
      const prevXp = existing[0]?.xp_earned || 0;
      const wasAttempted = Boolean(existing[0]);
      const xpCandidate = finalXpFor({ correct, isRepeat: wasAttempted });
      const row = (await sql`
        INSERT INTO final_progress(user_id, year, part, mode, correct_count, answered, best_correct, attempts, xp_earned, duration_ms, answers, first_done_at, last_attempt)
        VALUES (${user.id}, ${year}, ${part}, ${mode || existing[0]?.mode || 'practice'}, ${correct}, ${answered}, ${correct}, 1,
                ${xpCandidate}, ${durationMs}, ${JSON.stringify(clean)}, now(), now())
        ON CONFLICT (user_id, year, part) DO UPDATE SET
          mode = EXCLUDED.mode,
          correct_count = EXCLUDED.correct_count,
          answered = EXCLUDED.answered,
          best_correct = GREATEST(final_progress.best_correct, EXCLUDED.best_correct),
          attempts = final_progress.attempts + 1,
          xp_earned = GREATEST(final_progress.xp_earned, EXCLUDED.xp_earned),
          duration_ms = EXCLUDED.duration_ms,
          answers = CASE WHEN EXCLUDED.best_correct > final_progress.best_correct THEN EXCLUDED.answers ELSE final_progress.answers END,
          last_attempt = now()
        RETURNING *
      `)[0];

      const xpDelta = Math.max(0, row.xp_earned - prevXp);
      const totalXp = xpDelta > 0 ? await syncTotalXp(sql, user.id) : await recomputeAllXp(sql, user.id);
      const newAchievements = await unlockExamAchievements(sql, user.id, { correct: row.best_correct });

      const responseBody = {
        ok: true, year, part, correct, answered,
        best: row.best_correct, attempts: row.attempts, mode: row.mode,
        score: Math.round((row.best_correct / PER_PART) * 100),
        xpDelta, totalXp, newAchievements, saved: true,
      };
      await sql`INSERT INTO final_attempts(attempt_id, user_id, year, part, response) VALUES (${attemptId}, ${user.id}, ${year}, ${part}, ${JSON.stringify(responseBody)})`;
      return res.status(200).json(responseBody);
    }

    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error', message: 'Final exam service unavailable' });
  }
}
