import { db } from './_db.mjs';
import { requireUser, computeXpCandidate, computeStars, SECTIONS, LEVELS_PER_SECTION } from './_auth.mjs';

function todayInTz(tz) {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: tz || 'Asia/Tokyo' }); // YYYY-MM-DD
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

async function recomputeTotalXp(sql, userId) {
  const rows = await sql`SELECT COALESCE(SUM(xp_earned),0)::int AS total FROM level_progress WHERE user_id = ${userId}`;
  return rows[0].total;
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
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
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
  for (let s = 1; s <= SECTIONS; s++) {
    const levels = [];
    let completedLevels = 0;
    for (let l = 1; l <= LEVELS_PER_SECTION; l++) {
      const rec = byKey.get(`${s}-${l}`);
      const status = rec?.status || (l === 1 ? 'available' : 'locked');
      if (rec?.status === 'completed') completedLevels++;
      levels.push({
        levelId: l,
        status: rec?.status || 'locked',
        bestScore: rec?.best_score || 0,
        stars: rec?.stars || 0,
        attempts: rec?.attempts || 0,
        xpEarned: rec?.xp_earned || 0,
        unlocked: l === 1 || Boolean(byKey.get(`${s}-${l - 1}`)?.status === 'completed'),
        firstCompletedAt: rec?.first_completed_at || null,
      });
    }
    const prevSectionUnlocked = s === 1;
    sections.push({
      sectionId: s,
      unlocked: prevSectionUnlocked || null, // patched below
      completedLevels,
      totalLevels: LEVELS_PER_SECTION,
      percent: Math.round((completedLevels / LEVELS_PER_SECTION) * 100),
      levels,
    });
  }
  // second pass: unlock sections based on prior section >=80% completion
  for (let i = 0; i < sections.length; i++) {
    if (i === 0) { sections[i].unlocked = true; continue; }
    const prev = sections[i - 1];
    sections[i].unlocked = prev.percent >= 80;
    if (!sections[i].unlocked) {
      // if section is locked, all its levels are locked regardless of level 1
      sections[i].levels = sections[i].levels.map(lv => ({ ...lv, unlocked: false }));
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

      if (!Number.isInteger(sectionId) || sectionId < 1 || sectionId > SECTIONS)
        return res.status(400).json({ error: 'invalid_input', message: 'sectionId out of range' });
      if (!Number.isInteger(levelId) || levelId < 1 || levelId > LEVELS_PER_SECTION)
        return res.status(400).json({ error: 'invalid_input', message: 'levelId out of range' });
      if (!attemptId) return res.status(400).json({ error: 'invalid_input', message: 'attemptId required' });

      // recompute score server-side from correct/total when provided
      let score = scoreClient;
      if (Number.isFinite(correctCount) && Number.isFinite(totalCount) && totalCount > 0) {
        const serverScore = Math.round((correctCount / totalCount) * 100);
        if (Number.isFinite(scoreClient) && Math.abs(serverScore - scoreClient) > 1) {
          return res.status(400).json({ error: 'invalid_input', message: 'score mismatch' });
        }
        score = serverScore;
      }
      if (!Number.isFinite(score) || score < 0 || score > 100)
        return res.status(400).json({ error: 'invalid_input', message: 'score out of range' });

      // idempotency: same attemptId returns cached response, writes nothing again
      const existingAttempt = await sql`SELECT response FROM level_attempts WHERE attempt_id = ${attemptId}`;
      if (existingAttempt[0]) {
        return res.status(200).json(existingAttempt[0].response);
      }

      // check unlocked
      const prevLevel = levelId > 1
        ? await sql`SELECT status FROM level_progress WHERE user_id=${user.id} AND section_id=${sectionId} AND level_id=${levelId - 1}`
        : [];
      const levelUnlocked = levelId === 1 || prevLevel[0]?.status === 'completed';
      if (!levelUnlocked) return res.status(403).json({ error: 'forbidden', message: 'Level not unlocked' });

      const existing = await sql`SELECT * FROM level_progress WHERE user_id=${user.id} AND section_id=${sectionId} AND level_id=${levelId}`;
      const prevXp = existing[0]?.xp_earned || 0;
      const prevBest = existing[0]?.best_score || 0;
      const prevAttempts = existing[0]?.attempts || 0;
      const isCompleted = score >= 60;

      const xpCandidate = isCompleted ? computeXpCandidate({ score, attempts: prevAttempts }) : 0;
      const xpEarnedNew = Math.max(prevXp, xpCandidate);
      const bestScoreNew = Math.max(prevBest, score);
      const stars = computeStars(bestScoreNew);
      const wasAlreadyCompleted = existing[0]?.status === 'completed';

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

      const nextLevelId = levelId < LEVELS_PER_SECTION ? levelId + 1 : null;
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
          nextSection: nextLevelId ? null : (sectionId < SECTIONS ? { sectionId: sectionId + 1 } : null),
        },
        isNewCompletion: isCompleted && !wasAlreadyCompleted,
      };

      await sql`INSERT INTO level_attempts(attempt_id, user_id, section_id, level_id, response) VALUES (${attemptId}, ${user.id}, ${sectionId}, ${levelId}, ${JSON.stringify(responseBody)})`;

      return res.status(200).json(responseBody);
    }

    if (req.method === 'DELETE') {
      const confirm = req.body?.confirm;
      if (confirm !== 'RESET') return res.status(400).json({ error: 'invalid_input', message: 'confirm: "RESET" required' });
      await sql`DELETE FROM level_progress WHERE user_id = ${user.id}`;
      await sql`DELETE FROM daily_activity WHERE user_id = ${user.id}`;
      await sql`UPDATE app_users SET total_xp = 0, streak_current = 0, streak_longest = 0, last_active_date = NULL WHERE id = ${user.id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error', message: 'Progress service unavailable' });
  }
}
