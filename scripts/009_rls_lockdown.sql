-- 009_rls_lockdown.sql — tutup akses PostgREST ke seluruh tabel aplikasi.
--
-- MASALAH (Security Advisor Supabase, 2026-08-31, "rls_disabled_in_public"):
-- Supabase memasang ALTER DEFAULT PRIVILEGES yang memberi anon/authenticated hak
-- penuh atas tabel baru di schema public. Migrasi 001-008 membuat tabelnya dengan
-- SQL biasa, jadi keempat belas tabel ikut ter-grant SELECT/INSERT/UPDATE/DELETE/
-- TRUNCATE ke `anon` — sementara RLS mati. Akibatnya siapa pun yang memegang anon
-- key project bisa membaca, mengubah, dan menghapus SEMUA data lewat /rest/v1.
-- Anon key memang dirancang untuk dipublikasikan di browser; yang seharusnya
-- menahan akses adalah RLS, dan itulah yang belum ada.
--
-- KENAPA AMAN UNTUK APLIKASI INI: api/_db.mjs menyambung lewat pooler sebagai role
-- `postgres`, dan role itu punya rolbypassrls = true. RLS tidak pernah berlaku
-- baginya, jadi tidak ada satu pun query aplikasi yang berubah perilakunya.
-- (Jangan tambahkan FORCE ROW LEVEL SECURITY — itu justru akan mengikat pemilik
-- tabel dan mematikan seluruh aplikasi.)
--
-- Kebijakan yang dipakai: RLS menyala TANPA satu pun POLICY. Di PostgreSQL itu
-- berarti "tolak semua baris" untuk setiap role yang tidak bypass. Aplikasi tidak
-- memakai PostgREST sama sekali, jadi tidak ada yang perlu diizinkan.
--
-- Idempoten: ENABLE pada tabel yang sudah menyala dan REVOKE hak yang sudah dicabut
-- keduanya tidak berefek dan tidak melempar error.

ALTER TABLE public.app_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_progress       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_attempts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_merges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_progress       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_attempts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_seen     ENABLE ROW LEVEL SECURITY;

-- Sabuk kedua: cabut GRANT-nya sekalian. RLS saja sudah menahan, tetapi kalau suatu
-- saat ada yang menambahkan POLICY yang terlalu longgar, hak tabelnya sudah tidak ada.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;

-- Tabel yang dibuat NANTI jangan ikut ter-grant otomatis lagi.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
