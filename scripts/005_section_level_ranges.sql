-- 005_section_level_ranges.sql
--
-- ✅ STATUS: APPLIED — constraint per-section ARRAY[10,10,15,13,10,12,12,9,12,10,17,10,12]
--    terverifikasi aktif di DB produksi via scripts/verify-schema.mjs (2026-08-11).
--    Header lama sempat bilang "REVIEWED-BUT-UNAPPLIED" — itu stale, jangan dipercaya.
--    Migrasi idempotent: aman dijalankan ulang.
--
-- TUJUAN
-- Constraint lama `level_progress_ids_range` (scripts/001_init.sql:119-120) berbunyi:
--     CHECK (section_id BETWEEN 1 AND 13 AND level_id BETWEEN 1 AND 17)
-- Angka 17 itu salah: cuma section 11 yang punya 17 level. Jumlah level nyata per section
-- (sectionId 1..13) adalah 10,10,15,13,10,12,12,9,12,10,17,10,12 — totalnya 152, bukan 13x17=221.
-- Artinya DB mengizinkan 69 kombinasi (section_id, level_id) untuk level yang TIDAK ADA,
-- misalnya section 8 level 10..17 atau section 1 level 11..17.
--
-- Dampak kalau row phantom sampai masuk: buildSectionsMap() di api/progress.mjs hanya
-- mengiterasi level yang benar-benar ada, jadi row itu TIDAK terlihat di UI — tapi
-- recomputeTotalXp() melakukan SUM(xp_earned) atas SEMUA row user, jadi total_xp bisa
-- memuat XP untuk level yang tidak pernah ada. scripts/verify-consistency.mjs juga tidak
-- akan menangkapnya, karena kedua sisi perbandingannya membaca row yang sama.
--
-- Sejak perbaikan di api/_sections.mjs, kedua jalur tulis aplikasi sudah menolak kombinasi
-- ini (api/progress.mjs pakai levelsInSection(), api/progress/merge.mjs pakai isValidLevel()).
-- Jadi constraint ini adalah defense-in-depth: menutup lubang di lapisan penyimpanan supaya
-- bug serupa di masa depan tidak bisa lolos ke data.
--
-- ⚠️ TIDAK ATOMIC KALAU DIJALANKAN LEWAT scripts/run-migration.mjs
-- Script itu membuang BEGIN/COMMIT lalu memecah file pada setiap tanda titik-koma, karena
-- driver HTTP Neon auto-commit tiap statement. Jadi BEGIN/COMMIT di bawah ditulis untuk
-- konsistensi gaya dengan 001-004 dan supaya benar kalau dijalankan lewat psql, BUKAN karena
-- run-migration.mjs menghormatinya. Antar-statement, kegagalan di tengah file MEMANG
-- meninggalkan state separuh jadi.
--
-- KENAPA ITU TETAP AMAN DI SINI — dan ini alasan DROP + ADD digabung dalam SATU blok DO
-- (bukan dua statement terpisah): satu blok DO adalah SATU statement bagi server, jadi
-- eksekusinya atomic. Kalau ADD CONSTRAINT gagal karena masih ada row phantom (check_violation
-- — TIDAK ditangkap oleh handler di bawah, yang hanya menangkap duplicate_object), seluruh
-- blok ikut rollback, termasuk DROP-nya. Artinya constraint LAMA tetap terpasang dan tabel
-- TIDAK pernah berada dalam kondisi tanpa proteksi range sama sekali. Kalau DROP dan ADD
-- dipisah jadi dua statement, jaminan ini HILANG — jangan dipecah.
--
-- Urutan aman kalau harus dijalankan sepotong-sepotong: bagian MIGRASI dulu (level_progress,
-- satu-satunya tabel yang menentukan progres & XP), bagian OPSIONAL (dua tabel log) terakhir.
-- Bagian opsional pakai NOT VALID sehingga tidak mungkin gagal karena data historis, jadi
-- kegagalan di sana tidak pernah membatalkan yang penting.
--
-- CATATAN GAYA KOMENTAR: jangan pernah menulis tanda titik-koma di dalam komentar prosa di
-- file ini. splitStatements() di run-migration.mjs memecah teks pada titik-koma TANPA
-- memahami komentar, jadi titik-koma di tengah baris prosa membuat sisa baris itu terkirim
-- ke server sebagai statement sampah. Sudah diverifikasi: sebelum aturan ini diikuti, file
-- ini menghasilkan 2 statement sampah.
--
-- CARA APPLY (manual, berurutan, jangan dilewati):
--   1. Jalankan blok DIAGNOSTIK di bawah (read-only) untuk menghitung row phantom.
--   2. Kalau hasilnya 0 → lanjut ke bagian MIGRASI, aman.
--      Kalau hasilnya > 0 → ALTER TABLE ... ADD CONSTRAINT akan GAGAL, karena Postgres
--      memvalidasi seluruh row yang ada. Ada dua pilihan, dan ini KEPUTUSAN USER:
--        (a) bersihkan/relokasi row phantom dulu, lalu apply versi validating di bawah, atau
--        (b) pakai varian NOT VALID (lihat CATATAN NOT VALID di bagian bawah file) yang
--            langsung memblokir row baru tanpa memvalidasi row lama.
--      File ini SENGAJA tidak memuat DELETE apapun — menghapus data progres user bukan
--      keputusan yang boleh diambil oleh migration.
--   3. Sesudah apply, jalankan blok VERIFIKASI di paling bawah.
--
-- SINKRONISASI: angka di ARRAY[...] di bawah WAJIB sama dengan SECTION_LEVELS di
-- api/_sections.mjs, yang sendirinya wajib sama dengan `plans` di src/data.js.
-- `npm run validate:sections` sudah membandingkan ketiganya (termasuk file SQL ini) dan
-- exit non-zero kalau ada yang menyimpang. Habis mengubah jumlah level, jalankan itu.


-- ============================================================================
-- DIAGNOSTIK — READ-ONLY. Jalankan ini DULU, sebelum bagian MIGRASI.
-- Tidak mengubah apapun. Kalau semua angka 0, migrasi di bawah aman dijalankan.
--
-- SENGAJA DIKOMENTARI. Bukan karena query-nya berbahaya (murni SELECT), tapi karena
-- run-migration.mjs mengeksekusi SEMUA statement dalam satu jalan dan hanya mencetak 80
-- karakter pertama tiap statement — hasil SELECT-nya tidak ikut ditampilkan. Kalau blok ini
-- aktif, operator akan mengira sudah "menjalankan diagnostik" padahal angkanya tidak pernah
-- terlihat, lalu ALTER TABLE di bawah langsung jalan tanpa ada yang memeriksa apa-apa.
-- Jalankan blok ini lewat psql atau Neon SQL Editor, baca angkanya dengan mata sendiri.
-- ============================================================================
-- SELECT 'level_progress' AS tbl, count(*) AS phantom_rows FROM level_progress
--  WHERE section_id NOT BETWEEN 1 AND 13
--     OR level_id > (ARRAY[10,10,15,13,10,12,12,9,12,10,17,10,12])[section_id]
--     OR level_id < 1
-- UNION ALL
-- SELECT 'question_attempts', count(*) FROM question_attempts
--  WHERE section_id NOT BETWEEN 1 AND 13
--     OR level_id > (ARRAY[10,10,15,13,10,12,12,9,12,10,17,10,12])[section_id]
--     OR level_id < 1
-- UNION ALL
-- SELECT 'level_attempts', count(*) FROM level_attempts
--  WHERE section_id NOT BETWEEN 1 AND 13
--     OR level_id > (ARRAY[10,10,15,13,10,12,12,9,12,10,17,10,12])[section_id]
--     OR level_id < 1;
--
-- Rincian per (section, level) kalau angka di atas > 0 — berguna untuk memutuskan langkah 2:
-- SELECT section_id, level_id, count(*) AS rows, sum(xp_earned) AS xp_terdampak
--   FROM level_progress
--  WHERE section_id NOT BETWEEN 1 AND 13
--     OR level_id > (ARRAY[10,10,15,13,10,12,12,9,12,10,17,10,12])[section_id]
--     OR level_id < 1
--  GROUP BY section_id, level_id ORDER BY section_id, level_id;


-- ============================================================================
-- MIGRASI
-- ============================================================================
BEGIN;

-- level_progress — ini tabel yang menentukan progres & gate 80%, jadi yang paling penting.
--
-- KENAPA HARUS DROP DULU, ADD SAJA TIDAK CUKUP: constraint baru memakai NAMA YANG SAMA
-- (`level_progress_ids_range`). Pada tabel yang sudah punya nama itu, ADD CONSTRAINT melempar
-- duplicate_object — dan handler EXCEPTION di bawah (pola idempoten yang diwarisi dari
-- 001-004) MENELAN error itu jadi NULL. Hasilnya: definisi baru tidak pernah terpasang,
-- constraint lama `level_id BETWEEN 1 AND 17` tetap berlaku, dan migration melaporkan sukses.
-- Justru pola idempoten itulah yang bikin ADD-tanpa-DROP gagal secara SENYAP di sini.
-- (Catatan: kalau dua CHECK berbeda nama sampai ko-eksis, Postgres meng-AND keduanya, jadi
-- yang terjadi bukan "phantom lolos" melainkan definisi baru yang tidak pernah aktif.)
DO $$ BEGIN
  ALTER TABLE level_progress DROP CONSTRAINT IF EXISTS level_progress_ids_range;
  ALTER TABLE level_progress ADD CONSTRAINT level_progress_ids_range
    CHECK (
      section_id BETWEEN 1 AND 13
      AND level_id >= 1
      AND level_id <= (ARRAY[10,10,15,13,10,12,12,9,12,10,17,10,12])[section_id]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- Catatan kenapa `section_id BETWEEN 1 AND 13` harus ditulis eksplisit dan DULUAN:
-- subskrip array di luar batas (mis. section_id = 99) menghasilkan NULL, dan Postgres
-- menganggap CHECK yang bernilai NULL sebagai TERPENUHI. Tanpa batas section_id itu,
-- section_id = 99 justru akan lolos. Urutan AND di atas menutup celah tersebut.

COMMIT;


-- ============================================================================
-- OPSIONAL — dua tabel log yang saat ini TANPA constraint sama sekali.
-- Keduanya append-only dan tidak dipakai untuk menghitung progres/XP, jadi ini murni
-- kebersihan data. Dipisah supaya bisa dilewati: kalau ada row historis yang tidak
-- memenuhi (mis. preview attempt lama ke level yang tidak ada, yang dulu diterima
-- api/progress.mjs sebelum diperbaiki), ADD CONSTRAINT di sini akan gagal dan itu
-- TIDAK boleh menggagalkan bagian MIGRASI di atas.
-- Pakai NOT VALID: langsung berlaku untuk row BARU, tanpa memvalidasi row lama, jadi
-- tidak mungkin gagal karena data historis.
-- ============================================================================
-- BEGIN;
-- DO $$ BEGIN
--   ALTER TABLE question_attempts ADD CONSTRAINT question_attempts_ids_range
--     CHECK (section_id BETWEEN 1 AND 13 AND level_id >= 1
--            AND level_id <= (ARRAY[10,10,15,13,10,12,12,9,12,10,17,10,12])[section_id]) NOT VALID;
-- EXCEPTION WHEN duplicate_object THEN NULL;
-- END $$;
-- DO $$ BEGIN
--   ALTER TABLE level_attempts ADD CONSTRAINT level_attempts_ids_range
--     CHECK (section_id BETWEEN 1 AND 13 AND level_id >= 1
--            AND level_id <= (ARRAY[10,10,15,13,10,12,12,9,12,10,17,10,12])[section_id]) NOT VALID;
-- EXCEPTION WHEN duplicate_object THEN NULL;
-- END $$;
-- COMMIT;


-- ============================================================================
-- CATATAN NOT VALID (opsi 2b dari langkah 2 di header)
-- Kalau diagnostik menemukan row phantom di level_progress tapi user belum mau menyentuh
-- data, ganti ADD CONSTRAINT di bagian MIGRASI dengan versi ber-NOT VALID:
--     ALTER TABLE level_progress ADD CONSTRAINT level_progress_ids_range
--       CHECK (...) NOT VALID;
-- Efeknya: row BARU langsung ditolak, row lama dibiarkan apa adanya (tetap ikut ke-SUM di
-- total_xp — jadi ini menahan pendarahan, bukan menyembuhkan). Setelah data dibersihkan,
-- promosikan dengan:
--     ALTER TABLE level_progress VALIDATE CONSTRAINT level_progress_ids_range;
-- VALIDATE hanya mengambil lock ringan (SHARE UPDATE EXCLUSIVE), jadi aman di jam sibuk.
-- ============================================================================


-- ============================================================================
-- VERIFIKASI — jalankan SESUDAH apply. Read-only.
-- ============================================================================
-- 1. Constraint sudah dalam bentuk baru? Harus memuat ARRAY[...], bukan `1 AND 17`:
-- SELECT conname, pg_get_constraintdef(oid) AS definisi, convalidated
--   FROM pg_constraint
--  WHERE conrelid = 'level_progress'::regclass AND contype = 'c'
--  ORDER BY conname;
--
-- 2. Uji tolak/terima — dua-duanya HARUS berperilaku seperti komentarnya.
--    Jalankan di transaksi yang di-ROLLBACK, jangan tinggalkan datanya:
-- BEGIN;
--   -- ini HARUS gagal (section 8 cuma punya 9 level):
--   -- INSERT INTO level_progress(user_id, section_id, level_id)
--   --   VALUES ((SELECT id FROM app_users LIMIT 1), 8, 10);
--   -- ini HARUS berhasil (section 11 memang punya 17 level):
--   -- INSERT INTO level_progress(user_id, section_id, level_id)
--   --   VALUES ((SELECT id FROM app_users LIMIT 1), 11, 17);
-- ROLLBACK;
--
-- 3. Tidak ada lagi row di luar range (harus 0):
-- SELECT count(*) FROM level_progress
--  WHERE section_id NOT BETWEEN 1 AND 13
--     OR level_id < 1
--     OR level_id > (ARRAY[10,10,15,13,10,12,12,9,12,10,17,10,12])[section_id];
