import { db } from './_db.mjs';
import { requireUser, computeXpCandidate, computeStars, PREVIEW_XP_FLAT, recomputeAllXp } from './_auth.mjs';
import { evaluateAchievements } from './_achievements.mjs';
import { SECTION_COUNT, levelsInSection, meetsSectionGate, sectionPercent } from './_sections.mjs';
import { LEVEL_UNLOCKS } from './_characters.mjs';

function todayInTz(tz) {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: tz || 'Asia/Tokyo' }); // YYYY-MM-DD
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

async function recomputeTotalXp(sql, userId) {
  // Gabungan level + ujian akhir (final_progress) — lihat recomputeAllXp di _auth.mjs.
  return recomputeAllXp(sql, userId);
}

async function applyStreak(sql, user) {
  const today = todayInTz(user.timezone);
  let nextStreak = user.streak_current;
  let increased = false;
  if (!user.last_active_date) {
    nextStreak = 1;
    increased = true;
  } else {
    const last = new Date(user.last_active_date).toISOString().slice(0, 10);
    if (last === today) {
      nextStreak = user.streak_current;
    } else {
      // Kemarin dihitung dari tanggal LOKAL user (today), bukan dari UTC. Dulu baris
      // ini pakai Date.now()-86400000 dalam UTC sementara `today` & last_active_date
      // dalam Asia/Tokyo: antara 00:00-08:59 JST tanggal UTC masih H-1, jadi yesterday
      // jadi H-2 dan streak orang yang belajar pagi selalu di-RESET ke 1.
      // Aritmetika kalender di atas string tanggal: selalu tepat satu hari, bebas DST.
      const yesterday = new Date(Date.parse(today + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
      if (last === yesterday) {
        nextStreak = user.streak_current + 1;
        increased = true;
      } else {
        nextStreak = 1;
        increased = false; // reset, not really an "increase"
      }
    }
  }
  const nextLongest = Math.max(user.streak_longest, nextStreak);
  await sql`
    UPDATE app_users SET streak_current = ${nextStreak}, streak_longest = ${nextLongest},
      last_active_date = ${today}, updated_at = now()
    WHERE id = ${user.id}
  `;
  return { current: nextStreak, longest: nextLongest, increased };
}

async function buildSectionsMap(sql, userId) {
  const rows = await sql`SELECT section_id, level_id, status, best_score, stars, attempts, xp_earned, first_completed_at FROM level_progress WHERE user_id = ${userId}`;
  const byKey = new Map(rows.map(r => [`${r.section_id}-${r.level_id}`, r]));

  const sections = [];
  for (let s = 1; s <= SECTION_COUNT; s++) {
    const totalLevels = levelsInSection(s);
    const levels = [];
    let completedLevels = 0;
    for (let l = 1; l <= totalLevels; l++) {
      const rec = byKey.get(`${s}-${l}`);
      const status = rec?.status || (l === 1 ? 'available' : 'locked');
      if (rec?.status === 'completed') completedLevels++;
      // levelUnlocked = prasyarat resmi terpenuhi (level sebelumnya completed, atau ini level 1)
      const levelUnlocked = l === 1 || Boolean(byKey.get(`${s}-${l - 1}`)?.status === 'completed');
      levels.push({
        levelId: l,
        status,
        bestScore: rec?.best_score || 0,
        stars: rec?.stars || 0,
        attempts: rec?.attempts || 0,
        xpEarned: rec?.xp_earned || 0,
        // unlocked sekarang SELALU true (bisa dibuka/dilihat/dicoba) — preview kalau prasyarat belum lengkap.
        unlocked: true,
        levelUnlocked, // prasyarat resmi — dipakai FE utk tampilkan gembok "preview-only"
        firstCompletedAt: rec?.first_completed_at || null,
      });
    }
    const prevSectionUnlocked = s === 1;
    sections.push({
      sectionId: s,
      unlocked: true, // selalu bisa dibuka/dilihat
      sectionUnlockedOfficially: prevSectionUnlocked || null, // patched below
      completedLevels,
      totalLevels,
      percent: sectionPercent(completedLevels, s),
      levels,
    });
  }
  // second pass: prasyarat resmi section berdasar section sebelumnya >=80% completion.
  // Section tetap bisa dibuka & dicoba (preview) walau prasyarat belum lengkap.
  for (let i = 0; i < sections.length; i++) {
    if (i === 0) { sections[i].sectionUnlockedOfficially = true; continue; }
    const prev = sections[i - 1];
    // pakai meetsSectionGate (integer math), BUKAN prev.percent >= 80 — persen sudah
    // dibulatkan jadi bisa beda tipis dari gate resmi di POST.
    sections[i].sectionUnlockedOfficially = meetsSectionGate(prev.completedLevels, prev.sectionId);
    if (!sections[i].sectionUnlockedOfficially) {
      // section belum resmi terbuka -> semua levelnya jadi preview-only (levelUnlocked=false)
      sections[i].levels = sections[i].levels.map(lv => ({ ...lv, levelUnlocked: false }));
    }
  }
  return sections;
}

export default async function handler(req, res) {
  try {
    const sql = db();
    const user = await requireUser(sql, req);
    if (!user) return res.status(401).json({ error: 'Not signed in' });

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'private, no-store');
      const totalXp = await recomputeTotalXp(sql, user.id);
      const sections = await buildSectionsMap(sql, user.id);
      const recent = await sql`
        SELECT activity_date, xp_gained, levels_completed FROM daily_activity
        WHERE user_id = ${user.id} ORDER BY activity_date DESC LIMIT 14
      `;
      return res.status(200).json({
        userId: user.id,
        totalXp,
        streak: { current: user.streak_current, longest: user.streak_longest, lastActiveDate: user.last_active_date },
        sections,
        recentActivity: recent.map(r => ({ date: r.activity_date, xpGained: r.xp_gained, levelsCompleted: r.levels_completed })),
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const sectionId = Number(body.sectionId);
      const levelId = Number(body.levelId);
      const scoreClient = Number(body.score);
      const correctCount = Number(body.correctCount);
      const totalCount = Number(body.totalCount);
      const attemptId = String(body.attemptId || '');

      if (!Number.isInteger(sectionId) || sectionId < 1 || sectionId > SECTION_COUNT)
        return res.status(400).json({ error: 'invalid_input', message: 'sectionId out of range' });
      if (!Number.isInteger(levelId) || levelId < 1 || levelId > levelsInSection(sectionId))
        return res.status(400).json({ error: 'invalid_input', message: 'levelId out of range' });
      if (!attemptId) return res.status(400).json({ error: 'invalid_input', message: 'attemptId required' });
      // UUID wajib: tanpa ini attemptId sampah bikin PK error (500), bukan 400.
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId))
        return res.status(400).json({ error: 'invalid_input', message: 'attemptId must be a UUID' });

      // Score selalu direkomputasi server-side dari correct/total — kedua field WAJIB.
      // Celah lama: omit keduanya dan scoreClient lolos mentah (klaim 100 tanpa bukti).
      if (!Number.isInteger(correctCount) || !Number.isInteger(totalCount) || correctCount < 0 || totalCount <= 0 || correctCount > totalCount)
        return res.status(400).json({ error: 'invalid_input', message: 'correctCount/totalCount required' });
      const score = Math.round((correctCount / totalCount) * 100);
      if (Number.isFinite(scoreClient) && Math.abs(score - scoreClient) > 1)
        return res.status(400).json({ error: 'invalid_input', message: 'score mismatch' });

      // Idempotency per attemptId, di-scope ke user: tanpa AND user_id, replay attemptId
      // user lain mengembalikan response mereka (bocor totalXp/streak orang lain).
      const existingAttempt = await sql`SELECT response FROM level_attempts WHERE attempt_id = ${attemptId} AND user_id = ${user.id}`;
      if (existingAttempt[0]) {
        return res.status(200).json(existingAttempt[0].response);
      }

      // check unlocked — sekarang cuma dipakai utk tentukan status resmi vs preview, BUKAN untuk blokir.
      const prevLevel = levelId > 1
        ? await sql`SELECT status FROM level_progress WHERE user_id=${user.id} AND section_id=${sectionId} AND level_id=${levelId - 1}`
        : [];
      const levelPrereqMet = levelId === 1 || prevLevel[0]?.status === 'completed';
      // section prereq: section sebelumnya >=80% completed (level 1 selalu boleh resmi)
      let sectionPrereqMet = sectionId === 1;
      if (!sectionPrereqMet) {
        // level_id dibatasi ke jumlah level nyata section itu: /api/progress/merge tidak
        // memvalidasi range, jadi bisa ada row level_id di luar range yang kalau ikut dihitung
        // bikin gate lolos palsu + beda dari completedLevels di buildSectionsMap.
        const prevSectionRows = await sql`SELECT status FROM level_progress WHERE user_id=${user.id} AND section_id=${sectionId - 1} AND level_id <= ${levelsInSection(sectionId - 1)} AND status='completed'`;
        sectionPrereqMet = meetsSectionGate(prevSectionRows.length, sectionId - 1);
      }
      const levelUnlockedOfficially = levelPrereqMet && sectionPrereqMet;

      const existing = await sql`SELECT * FROM level_progress WHERE user_id=${user.id} AND section_id=${sectionId} AND level_id=${levelId}`;
      const prevXp = existing[0]?.xp_earned || 0;
      const prevBest = existing[0]?.best_score || 0;
      const prevAttempts = existing[0]?.attempts || 0;
      const wasAlreadyCompleted = existing[0]?.status === 'completed';
      const passedThisAttempt = score >= 60;

      if (!levelUnlockedOfficially) {
        // ===== PREVIEW ATTEMPT: prasyarat belum lengkap. Diterima, dikasih feedback, TAPI
        // tidak menghitung sebagai completed resmi & tidak memengaruhi unlock berikutnya. =====
        const prevPreviewXp = existing[0]?.preview_xp_earned || 0;
        const prevPreviewBest = existing[0]?.preview_best_score || 0;
        const prevPreviewAttempts = existing[0]?.preview_attempts || 0;
        const previewXpCandidate = passedThisAttempt ? PREVIEW_XP_FLAT : 0;
        const previewXpNew = Math.max(prevPreviewXp, previewXpCandidate);
        const previewBestNew = Math.max(prevPreviewBest, score);

        // upsert row tapi JANGAN sentuh status resmi kalau sudah pernah completed sebelumnya (harusnya
        // tidak mungkin karena kalau completed berarti prereq level ini sendiri terpenuhi, tapi jaga2).
        const previewUpsert = await sql`
          INSERT INTO level_progress(user_id, section_id, level_id, status, best_score, last_score, stars, attempts,
            xp_earned, preview_best_score, preview_attempts, preview_xp_earned, last_attempt_at)
          VALUES (${user.id}, ${sectionId}, ${levelId}, 'preview_attempt', 0, ${score}, 0, 0,
            0, ${previewBestNew}, 1, ${previewXpNew}, now())
          ON CONFLICT (user_id, section_id, level_id) DO UPDATE SET
            last_score = EXCLUDED.last_score,
            preview_best_score = GREATEST(level_progress.preview_best_score, EXCLUDED.preview_best_score),
            preview_attempts = level_progress.preview_attempts + 1,
            preview_xp_earned = GREATEST(level_progress.preview_xp_earned, EXCLUDED.preview_xp_earned),
            last_attempt_at = now()
          RETURNING *
        `;
        const prow = previewUpsert[0];
        const previewXpDelta = prow.preview_xp_earned - prevPreviewXp;
        const totalXp = await recomputeTotalXp(sql, user.id);

        const responseBody = {
          level: {
            sectionId, levelId, status: 'preview_attempt', bestScore: prow.preview_best_score,
            stars: 0, attempts: prow.preview_attempts, xpEarned: prow.preview_xp_earned,
          },
          xpDelta: Math.max(0, previewXpDelta),
          totalXp,
          streak: { current: user.streak_current, longest: user.streak_longest, increased: false },
          unlocked: { nextLevel: null, nextSection: null },
          isNewCompletion: false,
          isPreview: true,
          message: 'Level/section ini belum resmi terbuka — attempt kamu dicatat sebagai latihan preview, bukan completion resmi.',
        };
        await sql`INSERT INTO level_attempts(attempt_id, user_id, section_id, level_id, response, is_preview) VALUES (${attemptId}, ${user.id}, ${sectionId}, ${levelId}, ${JSON.stringify(responseBody)}, true)`;
        return res.status(200).json(responseBody);
      }

      // ===== RESMI: prasyarat terpenuhi. Completion pertama = XP penuh, replay = XP kecil (20%, min 2). =====
      const isCompleted = passedThisAttempt;
      const isRepeat = wasAlreadyCompleted; // sudah pernah completed sebelumnya -> ini replay/grinding

      const xpCandidate = isCompleted ? computeXpCandidate({ score, attempts: prevAttempts, isRepeat }) : 0;
      const xpEarnedNew = Math.max(prevXp, xpCandidate);
      const bestScoreNew = Math.max(prevBest, score);
      const stars = computeStars(bestScoreNew);

      const upserted = await sql`
        INSERT INTO level_progress(user_id, section_id, level_id, status, best_score, last_score, stars, attempts, xp_earned, first_completed_at, last_attempt_at)
        VALUES (${user.id}, ${sectionId}, ${levelId}, ${isCompleted ? 'completed' : 'in_progress'}, ${bestScoreNew}, ${score}, ${stars}, 1, ${xpEarnedNew},
                ${isCompleted ? sql`now()` : null}, now())
        ON CONFLICT (user_id, section_id, level_id) DO UPDATE SET
          status = CASE WHEN level_progress.status = 'completed' THEN 'completed' ELSE EXCLUDED.status END,
          best_score = GREATEST(level_progress.best_score, EXCLUDED.best_score),
          last_score = EXCLUDED.last_score,
          stars = GREATEST(level_progress.stars, EXCLUDED.stars),
          attempts = level_progress.attempts + 1,
          xp_earned = GREATEST(level_progress.xp_earned, EXCLUDED.xp_earned),
          first_completed_at = COALESCE(level_progress.first_completed_at, EXCLUDED.first_completed_at),
          last_attempt_at = now()
        RETURNING *
      `;
      const row = upserted[0];

      const xpDelta = row.xp_earned - prevXp;
      const totalXp = await recomputeTotalXp(sql, user.id);
      await sql`UPDATE app_users SET total_xp = ${totalXp}, updated_at = now() WHERE id = ${user.id}`;

      let streakResult = { current: user.streak_current, longest: user.streak_longest, increased: false };
      if (isCompleted) {
        streakResult = await applyStreak(sql, user);
        const today = todayInTz(user.timezone);
        await sql`
          INSERT INTO daily_activity(user_id, activity_date, xp_gained, levels_completed, attempts)
          VALUES (${user.id}, ${today}, ${Math.max(0, xpDelta)}, 1, 1)
          ON CONFLICT (user_id, activity_date) DO UPDATE SET
            xp_gained = daily_activity.xp_gained + ${Math.max(0, xpDelta)},
            levels_completed = daily_activity.levels_completed + 1,
            attempts = daily_activity.attempts + 1
        `;
      }

      // ===== Unlock karakter (doc 49/008): completion resmi menambah hitungan;
      // pasangan gender lain terbuka di 5 level, kinako di 15. Idempoten —
      // karakter yang sudah punya tidak pernah dobel. =====
      let newCharacters = [];
      if (isCompleted) {
        const cnt = await sql`SELECT COUNT(*)::int n FROM level_progress WHERE user_id=${user.id} AND status='completed'`;
        const done = cnt[0].n;
        const ownedRows = await sql`SELECT characters_unlocked FROM app_users WHERE id=${user.id}`;
        const owned = new Set(ownedRows[0]?.characters_unlocked || []);
        newCharacters = LEVEL_UNLOCKS.filter(u => done >= u.completed && !owned.has(u.id)).map(u => u.id);
        if (newCharacters.length)
          await sql`UPDATE app_users SET characters_unlocked=${[...owned, ...newCharacters]}, updated_at=now() WHERE id=${user.id}`;
      }

      // Achievement dievaluasi SETELAH semua stats (xp/streak/daily) tertulis
      // supaya engine melihat state final. Skipped kalau attempt gagal.
      // Hasil ikut ter-cache di level_attempts bersama responseBody — replay
      // attemptId yang sama tidak pernah mengevaluasi (apalagi mendobel) lagi.
      const newAchievements = isCompleted ? await evaluateAchievements(sql, user.id) : [];

      const nextLevelId = levelId < levelsInSection(sectionId) ? levelId + 1 : null;
      const responseBody = {
        level: {
          sectionId, levelId, status: row.status, bestScore: row.best_score,
          stars: row.stars, attempts: row.attempts, xpEarned: row.xp_earned,
        },
        xpDelta: Math.max(0, xpDelta),
        totalXp,
        streak: streakResult,
        unlocked: {
          nextLevel: nextLevelId ? { sectionId, levelId: nextLevelId } : null,
          nextSection: nextLevelId ? null : (sectionId < SECTION_COUNT ? { sectionId: sectionId + 1 } : null),
        },
        isNewCompletion: isCompleted && !wasAlreadyCompleted,
        newAchievements,
        newCharacters,
      };

      await sql`INSERT INTO level_attempts(attempt_id, user_id, section_id, level_id, response) VALUES (${attemptId}, ${user.id}, ${sectionId}, ${levelId}, ${JSON.stringify(responseBody)})`;

      return res.status(200).json(responseBody);
    }

    if (req.method === 'DELETE') {
      const confirm = req.body?.confirm;
      if (confirm !== 'RESET') return res.status(400).json({ error: 'invalid_input', message: 'confirm: "RESET" required' });
      await sql`DELETE FROM level_progress WHERE user_id = ${user.id}`;
      await sql`DELETE FROM daily_activity WHERE user_id = ${user.id}`;
      // Reset harus total: achievement, bingkai avatar, & peringkat mingguan
      // ikut hilang — statistik yang di-reset tidak boleh terus memunculkan badge.
      await sql`DELETE FROM user_achievements WHERE user_id = ${user.id}`;
      await sql`DELETE FROM leaderboard_seen WHERE user_id = ${user.id}`;
      // total_xp TIDAK boleh di-nolkan mentah: final_progress tidak ikut dihapus di sini,
      // jadi total_xp=0 melanggar invariant SUM(level)+SUM(final) dan langsung muncul di
      // scripts/verify-consistency.mjs. Recompute — hasilnya 0 kalau user memang belum
      // pernah menyetor bagian ujian, dan tetap benar kalau pernah.
      const totalXp = await recomputeTotalXp(sql, user.id);
      await sql`UPDATE app_users SET total_xp = ${totalXp}, streak_current = 0, streak_longest = 0, last_active_date = NULL, avatar_frame = 'none' WHERE id = ${user.id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error', message: 'Progress service unavailable' });
  }
}
