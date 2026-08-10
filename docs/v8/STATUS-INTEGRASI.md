# STATUS INTEGRASI PACK v8

Catatan apa yang mendarat, apa yang sudah lewat (stale), dan apa yang sengaja
ditunda — setelah pack `kaigo-kitty-v8.zip` diintegrasikan (commit `a52a8db`,
rebrand `724179b`, deploy produksi 2026-08-11). Pack v8 = audit pack (6 dokumen
+ data characters/quotes + snippet kanaToRomaji/tts), jadi "integrasi" = adopsi
dokumennya ke `docs/v8/` dan menyelesaikan temuan yang masih valid.

## 1. Yang diadopsi

| Item | Status |
|---|---|
| 6 dokumen pack → `docs/v8/` (README pack ikut) | ✅ |
| `data/characters.json`, `data/quotes.json` → `docs/v8/data/` | ✅ |
| `snippets/kanaToRomaji.js` → `src/lib/kana.js` (uji 7/7 vektor) | ✅ |
| `snippets/tts.js` → `src/lib/tts.js` (Web Speech API) | ✅ |
| Auth-gate (doc 50): mode tamu dihapus | ✅ `RequireAuth` bungkus semua route belajar |
| Deep-link `?next=` magic-link → verify | ✅ sanitasi open-redirect (`//`, backslash) |
| Romaji tampil di SEMUA mode bahasa (doc 51) | ✅ CompareTerm, term card, termSheet, glossary |
| Regenerasi romaji glossary dari reading | ✅ 82 entri (統合失調症 → tougoushitchoushou) |
| Gate baru `validate:romaji` (masuk chain, 9 gate) | ✅ |
| Auditor `sentence_loss` (doc 44 lanjutan) | ✅ 0 error saat jalan |
| Kinsoku shori semua elemen `lang="ja"` (doc 48) | ✅ routing.css |
| Kontras tombol (doc 48) | ✅ token `--btn-*` per karakter, ≥4.5:1 |
| Quote harian beranda ganti slogan statis | ✅ 20 quote, deterministik per tanggal+user |
| TTS tombol listen quiz & practice | ✅ disembunyikan kalau tak ada voice ja |
| `SECTION` → `BAB` + deskripsi penuh bab | ✅ |
| Label internal `sourceYear · difficulty` dicabut dari kartu soal | ✅ |

## 2. Temuan pack vs keadaan repo — triage

### Sudah benar di repo (tidak perlu aksi)
- Grid 2 kolom di mobile (doc 48): repo memang sengaja 1 kolom di <600px;
  2 kolom mulai ≥600px dengan `grid-auto-rows:1fr` (tinggi kartu kini seragam).
- Section 12/13 terkunci (doc 48): repo pakai desain preview-attempt — semua
  section selalu bisa dibuka, prasyarat hanya menentukan attempt resmi vs preview.
- Kinsoku `.fg` sudah ada di routing.css sejak awal; v8 memperluas ke semua `[lang=ja]`.

### Ditunda (besar / butuh keputusan desain)
- Sistem karakter penuh (doc 49): unlock karakter via level, pilihan gender awal,
  SVG karakter. Yang mendarat baru versi LIGHT: 4 palet tombol `--btn-*` via
  `[data-char]` (momo/sora/kinako/kurumi, map dari tema lama). Karakter orisinal
  sudah dirancang di `docs/v8/data/characters.json` (6 karakter, palet lengkap).
- Term chips di kartu soal (doc 52): redesign besar, belum dieksekusi.
- UI overhaul penuh (doc 52): hanya potongan yang masuk triage valid.

## 3. Berubah di luar pack (request user)

- **Rebrand**: semua surface user-facing `Kaigo Kitty` → `Kenshi Kaigo E-Learning`
  (title HTML, header, eyebrow landing, document.title glossary, email magic-link,
  README). Key localStorage (`kaigoKittyProgress` dkk) sengaja TIDAK diganti —
  itu migrasi data, bukan rebrand.
- **Env `APP_URL` Vercel** diperbaiki `https://kaigo-kitty.vercel.app` →
  `https://kaigo.wyna.dev` — magic link di email sekarang pakai domain produksi.

## 4. QA produksi (kaigo.wyna.dev, 2026-08-11)

| Cek | Hasil |
|---|---|
| `GET /` → 200, `<title>Kenshi Kaigo E-Learning</title>` | ✅ |
| Bundle memuat `kenshi kaigo e-learning`, `Masuk dengan email`, `quoteJa`, `BAB `, `tougoushitchoushou` | ✅ semua 1+ |
| `POST /api/auth/magic-link` email invalid → 400 `Valid email required` | ✅ |
| `GET /api/auth/verify` tanpa token → 400 `Missing sign-in token` | ✅ |
| `GET /api/progress` tanpa sesi → 401 `Not signed in` | ✅ auth-gate hidup |
| Gates: 9/9 hijau (`npm run validate`), build 477-532ms | ✅ |
| Distribusi jawaban: level 18.7/19.5/21.1/20.7/20.1 (760), ujian 18.9/20.0/20.4/22.3/18.4 (750) | ✅ |

## 5. Catatan perilaku pasca auth-gate

- Guest lama yang masih buka app: redirect ke `/login?next=...`; progress
  localStorage lama mereka TIDAK ikut ke server (merge endpoint tetap ada tapi
  flow otomatis tamu dihapus). Progress baru mulai dari akun.
- `/profile` tetap jadi default redirect verify — titik pemicu onboarding user baru.
- `FinalTest` masih localStorage-only (`kk_final_progress`) — tabel DB
  `final_progress` sudah ada tapi belum diwire (keadaan sama sejak 004).
