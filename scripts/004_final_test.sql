-- 004_final_test.sql — progres Ujian Akhir. Idempotent, aditif, tanpa DROP.

BEGIN;

CREATE TABLE IF NOT EXISTS final_progress (
  user_id       uuid   NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  year          int    NOT NULL,
  part          int    NOT NULL,
  mode          text   NOT NULL DEFAULT 'practice',
  correct_count int    NOT NULL DEFAULT 0,
  answered      int    NOT NULL DEFAULT 0,
  best_correct  int    NOT NULL DEFAULT 0,
  attempts      int    NOT NULL DEFAULT 0,
  xp_earned     int    NOT NULL DEFAULT 0,
  duration_ms   bigint NOT NULL DEFAULT 0,
  answers       jsonb  NOT NULL DEFAULT '{}'::jsonb,
  first_done_at timestamptz,
  last_attempt  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, year, part)
);

DO $$ BEGIN
  ALTER TABLE final_progress ADD CONSTRAINT final_year_range
    CHECK (year BETWEEN 2021 AND 2035);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE final_progress ADD CONSTRAINT final_part_range
    CHECK (part BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE final_progress ADD CONSTRAINT final_counts_range
    CHECK (correct_count BETWEEN 0 AND 25
       AND best_correct  BETWEEN 0 AND 25
       AND answered      BETWEEN 0 AND 25);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE final_progress ADD CONSTRAINT final_mode_valid
    CHECK (mode IN ('practice','exam'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_final_user      ON final_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_final_user_year ON final_progress (user_id, year);

DROP TRIGGER IF EXISTS trg_final_updated ON final_progress;
CREATE TRIGGER trg_final_updated BEFORE UPDATE ON final_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- idempotensi submit, pola sama dengan level_attempts
CREATE TABLE IF NOT EXISTS final_attempts (
  attempt_id uuid PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  year       int  NOT NULL,
  part       int  NOT NULL,
  response   jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_final_attempts_user ON final_attempts (user_id, created_at DESC);

-- preferensi mode terakhir
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS pref_final_mode text NOT NULL DEFAULT 'practice';
DO $$ BEGIN
  ALTER TABLE app_users ADD CONSTRAINT app_users_final_mode_valid
    CHECK (pref_final_mode IN ('practice','exam'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;

-- ===== VERIFIKASI =====
-- \d+ final_progress
--
-- Ringkasan per tahun (diturunkan, tidak disimpan terpisah):
-- SELECT year, SUM(best_correct) AS benar, COUNT(*) AS bagian
-- FROM final_progress WHERE user_id = $1 GROUP BY year ORDER BY year DESC;
--
-- Konsistensi (harus 0 baris):
-- SELECT * FROM final_progress WHERE best_correct < correct_count;
