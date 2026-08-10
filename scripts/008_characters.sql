-- 008_characters.sql — sistem karakter orisinal (doc 49).
-- Kolom theme LAMA dibiarkan hidup (data lama tetap valid); karakter yang
-- menentukan skin tombol via [data-char]. Backfill menyalin nilai theme ke
-- character_id supaya user lama tidak lompat balik ke momo pink.
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS character_id text NOT NULL DEFAULT 'momo';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS characters_unlocked text[] NOT NULL DEFAULT ARRAY['momo'];

-- Backfill satu arah (hanya baris yang masih default). Pemetaan doc 49:
-- kitty/sakura→momo, sora→sora, matcha→nagi, yozora→kurumi.
UPDATE app_users SET character_id = CASE theme
    WHEN 'sora'   THEN 'sora'
    WHEN 'matcha' THEN 'nagi'
    WHEN 'yozora' THEN 'kurumi'
    ELSE 'momo'
  END
WHERE character_id = 'momo';

-- Pasangan awal ikut gender lama (pasangan gender lain menyusul di unlock level).
UPDATE app_users
SET characters_unlocked = array['momo'] || CASE gender
    WHEN 'male'   THEN array['sora']
    WHEN 'female' THEN array['kurumi']
    WHEN 'other'  THEN array['kurumi','sora']
    ELSE array[]::text[]
  END
WHERE characters_unlocked = array['momo'];

DO $$ BEGIN
  ALTER TABLE app_users ADD CONSTRAINT app_users_character_valid
    CHECK (character_id IN ('momo','kurumi','sora','kinako','nagi','beni'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
