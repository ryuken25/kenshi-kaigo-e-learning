-- 001_init.sql — Kenshi Kaigo E-Learning schema (idempotent, aman dijalankan berulang)
-- Jalankan pakai DATABASE_URL_UNPOOLED.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- helper: auto updated_at ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- app_users ----------
CREATE TABLE IF NOT EXISTS app_users (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text NOT NULL,
  name             text,
  avatar_seed      text,
  timezone         text NOT NULL DEFAULT 'Asia/Tokyo',
  total_xp         int  NOT NULL DEFAULT 0,
  streak_current   int  NOT NULL DEFAULT 0,
  streak_longest   int  NOT NULL DEFAULT 0,
  last_active_date date,
  onboarded_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_seed    text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS timezone       text NOT NULL DEFAULT 'Asia/Tokyo';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS streak_longest int NOT NULL DEFAULT 0;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS onboarded_at   timestamptz;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS google_sub     text;

CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_key      ON app_users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS app_users_google_sub_key ON app_users (google_sub) WHERE google_sub IS NOT NULL;

DROP TRIGGER IF EXISTS trg_app_users_updated ON app_users;
CREATE TRIGGER trg_app_users_updated BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- app_sessions ----------
CREATE TABLE IF NOT EXISTS app_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent   text,
  ip_hash      text,
  revoked_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_sessions ADD COLUMN IF NOT EXISTS revoked_at   timestamptz;
ALTER TABLE app_sessions ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE app_sessions ADD COLUMN IF NOT EXISTS ip_hash      text;

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON app_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON app_sessions (expires_at);

-- ---------- magic_tokens ----------
CREATE TABLE IF NOT EXISTS magic_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  ip_hash    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE magic_tokens ADD COLUMN IF NOT EXISTS ip_hash text;
CREATE INDEX IF NOT EXISTS idx_magic_email_created ON magic_tokens (lower(email), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_magic_expires       ON magic_tokens (expires_at);

-- ---------- level_progress ----------
CREATE TABLE IF NOT EXISTS level_progress (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  section_id         int  NOT NULL,
  level_id           int  NOT NULL,
  status             text NOT NULL DEFAULT 'in_progress',
  best_score         int  NOT NULL DEFAULT 0,
  last_score         int  NOT NULL DEFAULT 0,
  stars              int  NOT NULL DEFAULT 0,
  attempts           int  NOT NULL DEFAULT 0,
  xp_earned          int  NOT NULL DEFAULT 0,
  total_time_ms      bigint NOT NULL DEFAULT 0,
  first_completed_at timestamptz,
  last_attempt_at    timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE level_progress ADD COLUMN IF NOT EXISTS stars              int NOT NULL DEFAULT 0;
ALTER TABLE level_progress ADD COLUMN IF NOT EXISTS xp_earned          int NOT NULL DEFAULT 0;
ALTER TABLE level_progress ADD COLUMN IF NOT EXISTS last_score         int NOT NULL DEFAULT 0;
ALTER TABLE level_progress ADD COLUMN IF NOT EXISTS total_time_ms      bigint NOT NULL DEFAULT 0;
ALTER TABLE level_progress ADD COLUMN IF NOT EXISTS first_completed_at timestamptz;
ALTER TABLE level_progress ADD COLUMN IF NOT EXISTS last_attempt_at    timestamptz;

DO $$ BEGIN
  ALTER TABLE level_progress ADD CONSTRAINT level_progress_user_level_key
    UNIQUE (user_id, section_id, level_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE level_progress ADD CONSTRAINT level_progress_score_range
    CHECK (best_score BETWEEN 0 AND 100 AND last_score BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE level_progress ADD CONSTRAINT level_progress_ids_range
    CHECK (section_id BETWEEN 1 AND 13 AND level_id BETWEEN 1 AND 17);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE level_progress ADD CONSTRAINT level_progress_status_valid
    CHECK (status IN ('in_progress','completed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_progress_user         ON level_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_section ON level_progress (user_id, section_id);

DROP TRIGGER IF EXISTS trg_progress_updated ON level_progress;
CREATE TRIGGER trg_progress_updated BEFORE UPDATE ON level_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- daily_activity ----------
CREATE TABLE IF NOT EXISTS daily_activity (
  user_id          uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  activity_date    date NOT NULL,
  xp_gained        int  NOT NULL DEFAULT 0,
  levels_completed int  NOT NULL DEFAULT 0,
  attempts         int  NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, activity_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_user_date ON daily_activity (user_id, activity_date DESC);

-- ---------- question_attempts ----------
CREATE TABLE IF NOT EXISTS question_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  section_id      int  NOT NULL,
  level_id        int  NOT NULL,
  question_id     text NOT NULL,
  is_correct      bool NOT NULL,
  selected_option text,
  time_ms         int,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qa_user_wrong ON question_attempts (user_id, is_correct, created_at DESC);

-- ---------- attempt idempotency ----------
CREATE TABLE IF NOT EXISTS level_attempts (
  attempt_id  uuid PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  section_id  int  NOT NULL,
  level_id    int  NOT NULL,
  response    jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_level_attempts_user ON level_attempts (user_id, created_at DESC);

-- ---------- guest merge idempotency ----------
CREATE TABLE IF NOT EXISTS progress_merges (
  client_id     text PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  entries_count int NOT NULL DEFAULT 0,
  merged_at     timestamptz NOT NULL DEFAULT now()
);

COMMIT;
