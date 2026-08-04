-- 002_backfill.sql — normalisasi data lama & recompute agregat
-- Jalankan SETELAH 001_init.sql. Idempotent.

BEGIN;

-- 1) Normalisasi email jadi lowercase + trim
UPDATE app_users SET email = lower(trim(email)) WHERE email <> lower(trim(email));

-- 2) Isi avatar_seed yang masih kosong
UPDATE app_users
SET avatar_seed = substr(md5(id::text), 1, 12)
WHERE avatar_seed IS NULL;

-- 3) Isi name yang masih kosong dari bagian sebelum @
UPDATE app_users
SET name = initcap(split_part(email, '@', 1))
WHERE name IS NULL OR name = '';

-- 4) Isi first_completed_at untuk baris completed lama yang kosong
UPDATE level_progress
SET first_completed_at = COALESCE(last_attempt_at, updated_at, created_at, now())
WHERE status = 'completed' AND first_completed_at IS NULL;

-- 5) Rapikan status: score >= 60 dianggap completed
UPDATE level_progress
SET status = 'completed',
    first_completed_at = COALESCE(first_completed_at, updated_at, now())
WHERE best_score >= 60 AND status <> 'completed';

UPDATE level_progress
SET status = 'in_progress'
WHERE best_score < 60 AND status = 'completed';

-- 6) Hitung ulang stars dari best_score
UPDATE level_progress
SET stars = CASE
  WHEN best_score >= 95 THEN 3
  WHEN best_score >= 80 THEN 2
  WHEN best_score >= 60 THEN 1
  ELSE 0 END;

-- 7) Hitung ulang xp_earned dari best_score
--    base 10 + bonus akurasi (bonus first-try gak bisa direkonstruksi retroaktif)
UPDATE level_progress
SET xp_earned = CASE
  WHEN best_score >= 100 THEN 20
  WHEN best_score >= 80  THEN 15
  WHEN best_score >= 60  THEN 10
  ELSE 0 END
WHERE status = 'completed' OR xp_earned > 0;

UPDATE level_progress SET xp_earned = 0 WHERE status <> 'completed';

-- 8) Rekonstruksi daily_activity dari tanggal penyelesaian
INSERT INTO daily_activity (user_id, activity_date, xp_gained, levels_completed, attempts)
SELECT p.user_id,
       (p.first_completed_at AT TIME ZONE 'UTC' AT TIME ZONE u.timezone)::date,
       SUM(p.xp_earned),
       COUNT(*),
       SUM(GREATEST(p.attempts, 1))
FROM level_progress p
JOIN app_users u ON u.id = p.user_id
WHERE p.status = 'completed' AND p.first_completed_at IS NOT NULL
GROUP BY 1, 2
ON CONFLICT (user_id, activity_date) DO UPDATE
SET xp_gained        = GREATEST(daily_activity.xp_gained, EXCLUDED.xp_gained),
    levels_completed = GREATEST(daily_activity.levels_completed, EXCLUDED.levels_completed),
    attempts         = GREATEST(daily_activity.attempts, EXCLUDED.attempts);

-- 9) RECOMPUTE total_xp — sumber kebenarannya level_progress
UPDATE app_users u
SET total_xp = COALESCE(agg.xp, 0)
FROM (
  SELECT user_id, SUM(xp_earned) AS xp
  FROM level_progress GROUP BY user_id
) agg
WHERE agg.user_id = u.id AND u.total_xp IS DISTINCT FROM COALESCE(agg.xp, 0);

UPDATE app_users u
SET total_xp = 0
WHERE NOT EXISTS (SELECT 1 FROM level_progress p WHERE p.user_id = u.id)
  AND u.total_xp <> 0;

-- 10) Rekonstruksi last_active_date dari daily_activity
UPDATE app_users u
SET last_active_date = d.max_date
FROM (SELECT user_id, MAX(activity_date) AS max_date FROM daily_activity GROUP BY user_id) d
WHERE d.user_id = u.id AND u.last_active_date IS DISTINCT FROM d.max_date;

-- 11) streak_longest minimal sebesar streak_current
UPDATE app_users
SET streak_longest = GREATEST(streak_longest, streak_current)
WHERE streak_longest < streak_current;

-- 12) Bersihin token & session kedaluwarsa
DELETE FROM magic_tokens WHERE expires_at < now() - interval '1 day';
DELETE FROM app_sessions WHERE expires_at < now() - interval '7 days';

COMMIT;

-- ===== VERIFIKASI (harus 0 baris semua) =====
-- SELECT u.id, u.total_xp, COALESCE(SUM(p.xp_earned),0) real_xp
-- FROM app_users u LEFT JOIN level_progress p ON p.user_id=u.id
-- GROUP BY u.id, u.total_xp HAVING u.total_xp <> COALESCE(SUM(p.xp_earned),0);
--
-- SELECT user_id, section_id, level_id, count(*) FROM level_progress
-- GROUP BY 1,2,3 HAVING count(*) > 1;
--
-- SELECT * FROM app_users WHERE streak_current > streak_longest;
