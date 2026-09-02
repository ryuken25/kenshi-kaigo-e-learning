import { db } from '../_db.mjs';
import { requireUser, rejectCrossSite } from '../_auth.mjs';
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
    // Mutasi lintas situs ditolak (lapis kedua di luar cookie SameSite=Lax).
    if (req.method !== 'GET' && rejectCrossSite(req, res)) return;

    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    if (entries.length > 40) return res.status(400).json({ error: 'invalid_input', message: 'too many entries' });
    let merged = 0;
    for (const e of entries) {
      const year = Number(e.year), part = Number(e.part), best = Number(e.best), answered = Number(e.answered);
      const clean = sanitizeAnswers(e.answers, part);
      if (!finalData[year] || !Number.isInteger(part) || part < 1 || part > PARTS ||
          !Number.isInteger(best) || best < 0 || best > PER_PART ||
          !Number.isInteger(answered) || answered < 0 || answered > PER_PART || !clean) continue;
      // best_correct DIHITUNG ULANG dari jawaban, tidak pernah dipercaya dari klien.
      // Bahannya sudah ada di sini — `clean` dan bank soal deterministik — persis yang
      // dipakai POST /api/final. Tanpa ini, satu request berisi answers:{} dan best:25
      // menulis best_correct=25 tanpa satu jawaban benar; submit berikutnya membaca
      // GREATEST(25,...) lalu membuka 'perfect-part' dan menampilkan hasil 100%.
      // (`!clean` tidak menyaring apa pun: sanitizeAnswers mengembalikan {} untuk objek
      // kosong, dan {} itu truthy.)
      const qsMerge = finalData[year].questions.slice((part - 1) * PER_PART, part * PER_PART);
      let benar = 0;
      for (const q of qsMerge) if (clean[String(q.no)] === q.answer) benar++;
      const terjawab = Object.keys(clean).length;
      const mode = e.mode === 'exam' ? 'exam' : 'practice';
      await sql`
        INSERT INTO final_progress(user_id, year, part, mode, correct_count, answered, best_correct, attempts, xp_earned, answers, first_done_at, last_attempt)
        VALUES (${user.id}, ${year}, ${part}, ${mode}, ${benar}, ${terjawab}, ${benar}, 1, 0, ${JSON.stringify(clean)}, now(), now())
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
