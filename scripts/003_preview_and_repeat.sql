-- 003_preview_and_repeat.sql — tambah dukungan preview attempt (unlock-preview) tanpa mengubah data lama.
-- Idempotent, aman dijalankan berulang. Tidak drop apapun.

BEGIN;

ALTER TABLE level_progress ADD COLUMN IF NOT EXISTS preview_best_score int NOT NULL DEFAULT 0;
ALTER TABLE level_progress ADD COLUMN IF NOT EXISTS preview_attempts   int NOT NULL DEFAULT 0;
ALTER TABLE level_progress ADD COLUMN IF NOT EXISTS preview_xp_earned  int NOT NULL DEFAULT 0;

-- allow 'preview_attempt' as a valid status alongside existing ones
DO $$ BEGIN
  ALTER TABLE level_progress DROP CONSTRAINT IF EXISTS level_progress_status_valid;
  ALTER TABLE level_progress ADD CONSTRAINT level_progress_status_valid
    CHECK (status IN ('in_progress','completed','preview_attempt'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE level_attempts ADD COLUMN IF NOT EXISTS is_preview boolean NOT NULL DEFAULT false;

COMMIT;
