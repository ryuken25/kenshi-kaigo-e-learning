# 46 — YANG BELUM TERTUTUP

Daftar bawaan dari pack v1–v6.1 yang belum kelihatan mendarat.
Centang yang sudah, kerjakan sisanya.

## Mendesak

- [ ] **Terjemahan template** — `44-TRANSLATION-QUALITY.md`
- [ ] **Kanji bocor ke mode ID** — judul masih `Belajar 事例の読み方`
- [ ] **`requireUser()` belum mengembalikan kolom 006** (`handle`, `theme`, `gender`)
      → frontend profil tidak akan bisa baca datanya walau ada di DB
- [ ] **Bottom nav 6 item** → 4 di HP, 6 di sidebar desktop

## Infrastruktur

- [ ] `.github/workflows/ci.yml` dipasang (ada di pack v6)
- [ ] `audit-translation-quality.mjs` masuk CI dan `prebuild`
- [ ] Folder `sql/` berisi 001–007 + README urutan menjalankan
- [ ] `.backup/` dikeluarkan dari git (`git rm -r --cached .backup`)
- [ ] README diperbarui: route baru (`/final`, `/glossary/:slug`, `/u/:handle`,
      `/friends`, `/leaderboard`, `/achievements`), env var baru
- [ ] Migrasi berikutnya pakai `DATABASE_URL_UNPOOLED` + driver TCP
      supaya transaksinya benar-benar atomic

## Konten

- [ ] Audit cakupan dijalankan, angkanya dilaporkan
- [ ] Glossary: `id.long`, `en`, `synonyms`, `examples` diisi
      (98 entri masih `status: "stub"`)
- [ ] Istilah yang muncul di soal tapi belum ada di glossary ditambahkan
      (perkiraan ~116 yang belum terdaftar)
- [ ] Bacaan hasil otomatis ditandai `furiSource: "auto"` lalu diperiksa manusia
- [ ] Final Test: struktur bagian diputuskan (`45-FINAL-TEST-STRUCTURE.md`)
- [ ] Naskah soal asli dimasukkan (contoh di pack v5 masih ilustrasi buatan sendiri)

## Fitur

- [ ] Avatar preset 72 kombinasi + 12 SVG maskot
- [ ] Bingkai avatar terbuka lewat achievement
- [ ] Handle: cooldown 7 hari terlihat di UI, handle lama ditahan 30 hari
- [ ] Papan peringkat global: pemecah seri deterministik, baris sendiri ditempel
- [ ] 35 achievement + notifikasi + halaman
- [ ] Onboarding gender → tema dengan pratinjau warna di kartu pilihan
- [ ] `/profile/settings` bisa ubah pilihan gender (satu-satunya jalan ganti tema)

## Animasi

- [ ] `motion.css` + `motion.js` dipasang
- [ ] Bar progres pakai `transform: scaleX`, bukan `width`
- [ ] FLIP di papan peringkat
- [ ] Koreografi benar/salah/level-selesai/achievement
- [ ] `prefers-reduced-motion` mematikan kelopak dan efek meriah **total**

## Hukum

- [ ] `public/assets/hellokitty/` diganti maskot orisinal
      (sudah disebut di pack v2, v3, v5 — makin mendesak sekarang karena
      domain kustom `kaigo.wyna.dev` sudah publik)

## Sudah beres ✅

- [x] Furigana render (flex) — terbukti dari dumping halaman
- [x] Mode 漢字 / ふり berfungsi
- [x] Migrasi 006 & 007 di Neon production
- [x] Domain `kaigo.wyna.dev` live
- [x] Tema `cinnamoroll` diganti `sora`
