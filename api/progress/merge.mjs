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

    // Idempotensi di-scope ke USER, bukan cuma client_id. Dua alasan, dua-duanya nyata:
    //
    // 1. KEBOCORAN LINTAS-AKUN. client_id itu kaigoKittyClientId di localStorage —
    //    per-PERAMBAN, bukan per-akun, dan tidak pernah dihapus. Satu laptop berdua:
    //    A login & merge sukses; B belajar sebagai tamu lalu login -> baris client_id
    //    sudah ada -> B dijawab alreadyMerged. Klien hanya menghapus GUEST_KEY kalau
    //    !alreadyMerged, jadi data B ditolak lagi di SETIAP login berikutnya, selamanya,
    //    tanpa satu pun galat. Sekarang B dinilai lewat user_id miliknya sendiri.
    //
    // 2. KLAIM TANPA BATAS. Endpoint ini memang tidak bisa memverifikasi data tamu —
    //    itu sifat merge. Yang tidak boleh adalah mengulanginya: dengan client_id acak
    //    baru, siapa pun bisa mengirim 152 level bernilai 100 berkali-kali. Dibatasi
    //    SEKALI PER USER, permukaan klaimnya jadi terbatas dan sekali seumur akun.
    //
    // client_id itu PRIMARY KEY (001_init.sql:175), jadi memfilter dengan
    // `OR client_id = ...` TETAP memblokir user kedua — barisnya cuma bisa dimiliki
    // satu orang. Karena itu kuncinya murni user_id, dan barisnya disimpan per
    // PASANGAN (klien, user) lewat client_id gabungan di bawah. Baris lama yang
    // client_id-nya masih mentah tetap melindungi pemiliknya lewat user_id.
    const already = await sql`SELECT 1 FROM progress_merges WHERE user_id = ${user.id}`;
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
                CASE WHEN ${isCompleted} THEN now() ELSE NULL END, now())
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

    // client_id gabungan "<klien>::<user>": PK-nya per-baris, jadi dua akun yang
    // memakai peramban yang sama masing-masing bisa punya catatan merge sendiri.
    // ON CONFLICT DO NOTHING supaya percobaan ulang setelah 500 di tengah loop
    // (lihat validasi entri di atas) tidak berakhir jadi galat kedua.
    await sql`INSERT INTO progress_merges(client_id, user_id, entries_count)
      VALUES (${clientId + '::' + user.id}, ${user.id}, ${merged})
      ON CONFLICT (client_id) DO NOTHING`;

    const totalXp = await recomputeAllXp(sql, user.id);
    await sql`UPDATE app_users SET total_xp = ${totalXp}, updated_at = now() WHERE id = ${user.id}`;

    return res.status(200).json({ merged, skipped, totalXp, alreadyMerged: false });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error', message: 'Merge service unavailable' });
  }
}
