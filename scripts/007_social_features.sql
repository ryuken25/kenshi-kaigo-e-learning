-- 007_social_features.sql — fitur sosial: leaderboard, achievement, frame, cooldown handle.
-- Dijalankan SETELAH 006. Idempotent & additive: aman dijalankan berulang, tidak drop data.
--
-- CATATAN PENERAPAN: scripts/run-migration.mjs membuang BEGIN/COMMIT dan memecah per titik-koma
-- karena driver HTTP Neon auto-commit tiap statement. Jadi file ini TIDAK atomic saat
-- diterapkan lewat script itu — kalau gagal di tengah, sebagian sudah masuk. Verifikasi
-- hasilnya lewat pg_get_constraintdef / information_schema, jangan percaya "OK" dari script.
--
-- CATATAN TEMA: 'cinnamoroll' adalah IP Sanrio — tidak boleh jadi tema bikinan sendiri.
-- Diganti 'sora' (karakter orisinal). Baris lama dimigrasikan di UPDATE bawah.
-- 'kitty' tetap dipertahankan sebagai tema default user lama.

BEGIN;

-- ============ PROFIL: cooldown handle & privasi leaderboard ============

-- Kapan handle terakhir diganti. api/profile.mjs menolak ganti handle kalau
-- belum 7 hari — dicek di SERVER, bukan client, supaya tidak bisa diakali.
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS handle_changed_at timestamptz;

-- Siapa yang boleh muncul di papan peringkat global. Default 'public'.
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
DO $$ BEGIN
  ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_visibility_valid;
  ALTER TABLE app_users ADD CONSTRAINT app_users_visibility_valid
    CHECK (visibility IN ('public','private'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tema diperluas. Nilai lama 'cinnamoroll' dipindah ke 'sora' di bawah.
DO $$ BEGIN
  ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_theme_valid;
  ALTER TABLE app_users ADD CONSTRAINT app_users_theme_valid
    CHECK (theme IN ('kitty','sora','matcha','yozora'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
UPDATE app_users SET theme = 'sora' WHERE theme = 'cinnamoroll';

-- Gender diperluas untuk onboarding inklusif (Lainnya / Tidak ingin mengisi).
DO $$ BEGIN
  ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_gender_valid;
  ALTER TABLE app_users ADD CONSTRAINT app_users_gender_valid
    CHECK (gender IS NULL OR gender IN ('male','female','other','prefer_not'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Nama tampilan terlihat orang asing di papan global: tidak boleh kosong, max 24.
DO $$ BEGIN
  ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_display_name_len;
  ALTER TABLE app_users ADD CONSTRAINT app_users_display_name_len
    CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 24);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============ ACHIEVEMENT ============

-- Definisi achievement. id = text stabil (dipakai engine, client, dan terjemahan).
-- Di-seed dengan ON CONFLICT DO NOTHING di bawah — menambah achievement baru
-- cukup tambah baris INSERT, yang lama tidak tersentuh.
CREATE TABLE IF NOT EXISTS achievements (
  id          text PRIMARY KEY,
  name_id     text NOT NULL,
  desc_id     text NOT NULL,
  category    text NOT NULL,
  icon        text NOT NULL,
  xp_reward   integer NOT NULL DEFAULT 0,
  tier        integer NOT NULL DEFAULT 0
);

-- Kunci komposit = idempoten alami: satu unlock per user per achievement,
-- submit progres berulang tidak akan pernah mendobelkan.
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id         uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  achievement_id  text NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS user_achievements_unlock_idx ON user_achievements (unlocked_at);

-- Bingkai avatar = hadiah achievement yang terlihat orang lain di papan peringkat.
-- Tier dihitung server dari jumlah achievement terbuka (lihat api/_achievements.mjs),
-- BUKAN disimpan hasil hitungannya — cukup kolom pilihannya saja.
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_frame text NOT NULL DEFAULT 'none';
DO $$ BEGIN
  ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_avatar_frame_valid;
  ALTER TABLE app_users ADD CONSTRAINT app_users_avatar_frame_valid
    CHECK (avatar_frame IN ('none','bronze','silver','gold','sakura','rainbow'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============ LEADERBOARD ============

-- Peringkat terakhir yang dilihat user, per lingkup per minggu — untuk delta ▲▼.
-- PK komposit (user, scope, week) = UPSERT idempotent, satu baris per kombinasi.
CREATE TABLE IF NOT EXISTS leaderboard_seen (
  user_id    uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  scope      text NOT NULL,
  week_start date NOT NULL,
  last_rank  integer NOT NULL,
  seen_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, scope, week_start)
);
DO $$ BEGIN
  ALTER TABLE leaderboard_seen DROP CONSTRAINT IF EXISTS lb_scope_valid;
  ALTER TABLE leaderboard_seen ADD CONSTRAINT lb_scope_valid
    CHECK (scope IN ('friends','global'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index papan global: hanya user visible yang punya handle yang dihitung.
CREATE INDEX IF NOT EXISTS app_users_visible_handle_idx ON app_users (total_xp DESC)
  WHERE visibility = 'public' AND handle IS NOT NULL;

-- ============ SEED DEFINISI ACHIEVEMENT (35) ============

INSERT INTO achievements (id, name_id, desc_id, category, icon, xp_reward, tier) VALUES
  -- BELAJAR (13)
  ('first-steps','Langkah Pertama','Selesaikan level pertamamu.','learning','🌱',5,0),
  ('level-10','10 Level','Selesaikan 10 level.','learning','📚',10,1),
  ('level-25','25 Level','Selesaikan 25 level.','learning','📖',15,1),
  ('level-50','50 Level','Selesaikan 50 level.','learning','🏔️',20,2),
  ('level-75','75 Level','Selesaikan 75 level.','learning','⛰️',25,2),
  ('all-152','Kaigo Master','Selesaikan semua 152 level.','learning','👑',50,3),
  ('section-1','Fondasi Kokoh','Selesaikan seluruh section 1.','learning','🧱',10,1),
  ('perfect-score','Sempurna','Raih skor 100 di satu level.','learning','💯',5,0),
  ('streak-3','Konsisten','Streak belajar 3 hari.','learning','🔥',5,0),
  ('streak-7','Seminggu Penuh','Streak belajar 7 hari.','learning','🔥',10,1),
  ('streak-30','Tak Terbendung','Streak belajar 30 hari.','learning','⚡',25,2),
  ('early-bird','Rajin Pagi','Selesaikan level sebelum jam 8 pagi.','learning','🌅',5,0),
  ('night-owl','Belajar Malam','Selesaikan level setelah jam 9 malam.','learning','🌙',5,0),
  -- UJIAN (6)
  ('exam-first','Simulasi Pertama','Selesaikan satu tahun ujian akhir.','exam','🎯',10,1),
  ('exam-pass','Lulus Simulasi','Raih skor ≥ 60 di ujian akhir.','exam','🎓',15,1),
  ('exam-gold','Nilai Emas','Raih skor ≥ 90 di ujian akhir.','exam','🥇',25,2),
  ('exam-all-years','Enam Tahun','Coba semua 6 tahun ujian akhir.','exam','🗓️',20,2),
  ('unlimited-100','Maraton Soal','Jawab 100 soal mode unlimited.','exam','🏃',10,1),
  ('perfect-part','Bagian Sempurna','Sempurna di satu bagian ujian.','exam','✨',15,1),
  -- SOSIAL (10)
  ('handle-set','Identitas Baru','Pasang handle pertamamu.','social','🏷️',5,0),
  ('profile-setup','Tampil Beda','Atur nama tampilan dan avatar.','social','🪞',5,0),
  ('first-friend','Teman Pertama','Berhasil menambah teman pertama.','social','🤝',10,1),
  ('friend-5','Lingkaran Kecil','Punya 5 teman.','social','👥',15,1),
  ('friend-10','Komunitas','Punya 10 teman.','social','🎉',20,2),
  ('lb-appear','Masuk Papan','Muncul di papan peringkat global.','social','📋',10,1),
  ('lb-top50','Top 50','Masuk 50 besar global mingguan.','social','🌟',20,2),
  ('lb-top10','Top 10','Masuk 10 besar global mingguan.','social','🚀',30,3),
  ('theme-switch','Ganti Suasana','Ganti tema aplikasi.','social','🎨',5,0),
  ('avatar-pick','Pilih Gayamu','Ganti avatar profilmu.','social','🖼️',5,0),
  -- GLOSSARY (3) — dilaporkan client, murni kosmetik
  ('glossary-10','Kolektor Istilah','Lihat 10 istilah glossary.','glossary','📖',5,0),
  ('glossary-50','Kamus Berjalan','Lihat 50 istilah glossary.','glossary','📚',10,1),
  ('glossary-all','Ensiklopedia','Lihat semua istilah glossary.','glossary','🏛️',20,2),
  -- META (3)
  ('xp-100','Kolektor XP','Kumpulkan total 100 XP.','meta','💎',5,0),
  ('xp-500','Pemburu XP','Kumpulkan total 500 XP.','meta','💎',15,1),
  ('xp-1000','Sultan XP','Kumpulkan total 1000 XP.','meta','💎',25,2)
ON CONFLICT (id) DO NOTHING;

COMMIT;
