-- 006_profile_theme_friends.sql — handle unik, profil (nama & avatar), tema, dan sistem teman.
-- Idempotent & additive: aman dijalankan berulang, tidak drop data apa pun.
--
-- CATATAN PENERAPAN: scripts/run-migration.mjs membuang BEGIN/COMMIT dan memecah per titik-koma
-- karena driver HTTP Neon auto-commit tiap statement. Jadi file ini TIDAK atomic saat
-- diterapkan lewat script itu — kalau gagal di tengah, sebagian sudah masuk. Verifikasi
-- hasilnya lewat pg_get_constraintdef / information_schema, jangan percaya "OK" dari script.

BEGIN;

-- ---------- profil & tema di app_users ----------
-- handle = ID publik yang dipakai user lain untuk mencari & menambah teman.
-- Disimpan lowercase supaya keunikan tidak bisa ditembus dengan beda kapital
-- (Budi vs budi harus dianggap SAMA — itu sebabnya UNIQUE-nya di kolom, bukan index ekspresi).
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS handle          text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS display_name    text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_key      text NOT NULL DEFAULT 'kitty-1';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS theme           text NOT NULL DEFAULT 'kitty';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS gender          text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS onboarded_step  text NOT NULL DEFAULT 'gender';

-- 4-14 karakter, huruf kecil/angka/underscore. Ditulis eksplisit lowercase di regex supaya
-- data yang tidak ternormalisasi ditolak di lapisan DB, bukan cuma di API.
DO $$ BEGIN
  ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_handle_format;
  ALTER TABLE app_users ADD CONSTRAINT app_users_handle_format
    CHECK (handle IS NULL OR handle ~ '^[a-z0-9_]{4,14}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_theme_valid;
  ALTER TABLE app_users ADD CONSTRAINT app_users_theme_valid
    CHECK (theme IN ('kitty','cinnamoroll'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_gender_valid;
  ALTER TABLE app_users ADD CONSTRAINT app_users_gender_valid
    CHECK (gender IS NULL OR gender IN ('male','female'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_onboarded_step_valid;
  ALTER TABLE app_users ADD CONSTRAINT app_users_onboarded_step_valid
    CHECK (onboarded_step IN ('gender','handle','done'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UNIQUE via index parsial: handle NULL (user lama / belum onboarding) tidak saling bentrok.
CREATE UNIQUE INDEX IF NOT EXISTS app_users_handle_unique
  ON app_users (handle) WHERE handle IS NOT NULL;

-- ---------- teman ----------
-- Satu baris per arah permintaan. Pertemanan dianggap sah kalau status accepted.
-- user_id < friend_id TIDAK dipaksakan supaya arah permintaan (siapa mengirim) tetap terbaca.
CREATE TABLE IF NOT EXISTS friendships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  friend_id   uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE friendships DROP CONSTRAINT IF EXISTS friendships_status_valid;
  ALTER TABLE friendships ADD CONSTRAINT friendships_status_valid
    CHECK (status IN ('pending','accepted','blocked'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tidak boleh berteman dengan diri sendiri.
DO $$ BEGIN
  ALTER TABLE friendships DROP CONSTRAINT IF EXISTS friendships_not_self;
  ALTER TABLE friendships ADD CONSTRAINT friendships_not_self CHECK (user_id <> friend_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Satu pasangan berarah hanya boleh sekali.
CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_unique ON friendships (user_id, friend_id);
-- Index untuk query daftar teman dan daftar permintaan masuk.
CREATE INDEX IF NOT EXISTS friendships_user_idx   ON friendships (user_id, status);
CREATE INDEX IF NOT EXISTS friendships_friend_idx ON friendships (friend_id, status);

-- Leaderboard diurutkan total_xp menurun. Index ini menghindari full scan saat user banyak.
CREATE INDEX IF NOT EXISTS app_users_total_xp_idx ON app_users (total_xp DESC);

COMMIT;
