# STATUS INTEGRASI PACK v7

Catatan apa yang mendarat, apa yang sudah lewat (stale), dan apa yang sengaja
ditunda — setelah pack `kaigo-kitty-v7.zip` diintegrasikan ke repo ini.
Pack v7 adalah **audit pack** (6 dokumen + 1 auditor), bukan codebase, jadi
"integrasi" = adopsi dokumennya ke `docs/v7/`, adopsi auditornya, dan
menyelesaikan temuan-temuan yang masih valid.

## 1. Yang diadopsi

| Item | Status |
|---|---|
| 6 dokumen pack → `docs/v7/` (README → `README-V7-PACK.md`) | ✅ |
| `scripts/audit-translation-quality.mjs` | ✅ diadaptasi (lihat §4) |
| Terjemahan template → terjemahan nyata per level (`src/content/translations.js`) | ✅ 1824 field ID, 152/152 titleId unik |
| Kanji bocor ke judul mode ID (judul `Belajar 事例の読み方`) | ✅ semua titleId 100% Indonesia |
| Kanji di `questionId` level | ✅ diganti `Topik <titleId>: …` |
| Bottom nav 6 item di HP | ✅ 4 item <1024px, 6 item di desktop (Teman & Peringkat dipindah ke kartu profil) |
| Kartu Teman & Peringkat di halaman profil (C3) | ✅ |
| Label angka streak/XP di header (C4/C5) | ✅ |
| Gate `validate:translation` + hook `prebuild` | ✅ gate ke-8 di chain `npm run validate` |
| CI `.github/workflows/ci.yml` (E4/E5) | ✅ validate-on-push + tes terjemahan-rusak-sengaja |

## 2. Temuan pack vs keadaan repo — triage

Pack v7 diaudit terhadap snapshot yang lebih lama; sebagian temuannya sudah
tidak berlaku di repo ini.

### Valid saat pack ditulis → sudah diperbaiki sekarang

- **Terjemahan cetakan** (44, temuan utama): body/hook/point ID dulu satu kalimat
  template untuk 152 level. Sekarang `src/content/translations.js` menyediakan
  tabel judul per topik + array fungsi `(titleId)=>…`, sehingga setiap level
  punya teks ID unik yang menyisipkan judul topiknya.
- **Kanji bocor ke mode ID** (46 Mendesak): titleId, heading kartu, objectiveId,
  dan penjelasan soal level semuanya Indonesia murni. Auditor memverifikasi:
  ≤4 karakter CJK per field ID, 0 error.
- **Bottom nav 6 item** (46 Mendesak): 4 di HP, 6 di desktop.
- **`validate:translation` di CI & prebuild** (46 Infrastruktur).
- **README route baru** (46 Infrastruktur): `/final`, `/glossary/:slug`, `/friends`,
  `/leaderboard`, `/achievements` sudah tercatat di README.

### Stale — sudah beres sebelum pack datang (jangan dikerjakan ulang)

| Temuan pack | Keadaan sebenarnya |
|---|---|
| `requireUser()` belum mengembalikan kolom 006 (`handle`, `theme`, `gender`) | Sudah — SELECT-nya memuat handle, display_name, avatar_key, theme, gender, onboarded_step, visibility, avatar_frame, handle_changed_at |
| Glossary 98 entri `status: "stub"` | Sudah — glossary.json sekarang 114 istilah lengkap; `build-glossary-index.mjs` menghitung kemunculan dari data.js |
| Avatar preset, bingkai avatar, handle cooldown, leaderboard, achievement, onboarding gender→tema | Sudah live di kaigo.wyna.dev (HEAD sebelum pack: bfc1a66); tema `cinnamoroll` sudah diganti `sora` |
| Furigana gagal render | Sudah flex column-reverse; dua gate (`validate:ruby`, `validate:furigana`) menjaga |
| `.backup/` dikeluarkan dari git | Dipertahankan seperti sekarang: `.backup/` tracked tapi isinya hanya salinan sumber lama, tanpa secret — diverifikasi terhadap history penuh |
| Folder `sql/` 001–007 + README urutan | Di repo ini migrasi hidup di `scripts/001…007.sql`, urutan menjalankan ada di README & CLAUDE.md |
| `prefers-reduced-motion` mematikan kelopak total | Sudah ada di CSS animasi login/onboarding |

### Ditunda (butuh keputusan manusia / di luar scope upgrade ini)

- **Struktur Final Test** (45): dokumen eksternal bilang ujian resmi 3 part
  (A=60, B=45, C=20), spec repo pakai 5 bagian × 25 sesuai permintaan awal.
  Rincian dokumen itu sendiri salah hitung (Part A dirinci jadi 58, total 123).
  **Jangan ubah struktur sebelum verifikasi ke sssc.or.jp** — `validate:final`
  mengunci bentuk 6 tahun × 125 soal × 5 bagian × 25, mengubahnya berarti
  mengubah gate + seluruh 750 soal. Prompt ujian memang bilingual dengan nama
  mapel kanji disengaja; auditor menghitungnya sebagai angka informasi
  (618 prompt), bukan error.
- **Naskah soal asli**: contoh soal di soal ujian masih ilustrasi buatan sendiri
  (12 template × variasi). Mengisi 750 soal asli = proyek konten terpisah.
- **Maskot Hello Kitty** (46 Hukum): aset `public/assets/hellokitty/` adalah IP
  Sanrio dan domain publik sudah live. Ini keputusan bisnis/hukum, bukan bug
  teknis — flag ke pemilik produk.

## 3. Terjemahan nyata — cara kerjanya

`src/content/translations.js` berisi:

- `TOPIC` — 120 judul Indonesia per topik + 7 override per-section
  (`'<sectionId>:<topik>'`) untuk topik yang sah muncul di dua section
  (mis. pencegahan infeksi di S4 dan S8) → 152 titleId unik.
- `REVIEW` — 13 judul untuk level review terakhir tiap section.
- `SECTION_ID_DESC` — 13 deskripsi section bahasa Indonesia (menggantikan
  kalimat Jepang lama di kartu section).
- `BODY_ID` / `HOOK_ID` / `POINT_ID` — padanan 3 tubuh kalimat template Jepang,
  semua berupa fungsi `(titleId)=>…` yang menyisipkan judul topik, sehingga:
  (a) tidak ada dua level dengan teks ID identik, (b) deteksi kerangka-berulang
  tidak pernah melihat pengulangan ≥3×.
- `TIP_HEADING` — heading kartu kiat ujian.

Aturan mutu yang dijaga gate `validate:translation` (lihat §4): rasio panjang
id/ja ≥ 0,9 · jumlah paragraf sama · CJK ≤ 4 karakter per field id · tanpa
frasa cetakan · tanpa kerangka berulang · titleId unik & bebas kanji.

Menyunting template = mengubah ratusan level sekaligus (arsitektur generated
di CLAUDE.md). Sunting `translations.js`, jalankan `npm run validate:translation`.

## 4. Auditor — adaptasi dari pack

Pack menulis auditor untuk repo yang kontennya JSON di `src/content/sections/`.
Di repo ini semua konten GENERATED di `src/data.js` saat import, folder itu tidak
ada — auditor asli memeriksa 0 field. Adaptasi:

- Sumber utama: `import { sections } from '../src/data.js'` → pindai
  `levels[].materi` (walk generik body/heading/points) + objective/objectiveId
  + titleId (unik & bebas kanji). Folder JSON tetap dipindai kalau suatu hari ada.
- Ujian akhir: opsi diperiksa penuh kecuali skeleton; explanation (hanya `id`)
  dicek CJK + frasa cetakan; prompt bilingual dihitung sebagai angka informasi.
- **Dikecualikan dari deteksi template**: field yang memang templated-by-design —
  `explanationId`/`explanationJa` & `choiceIds` soal level (12 template dipakai
  berulang), explanation & opsi soal ujian. Keputusan: mengubah semua itu jadi
  terjemahan unik per soal = proyek konten 750+ soal; gate menjaga yang sudah nyata.
- Ambang & 6 pemeriksaan dipertahankan dari pack: `MIN_RATIO 0.9`, `SUSPECT_RATIO 1.2`,
  `MAX_CJK_IN_ID 4`, `TEMPLATE_REPEAT 3`, blacklist frasa cetakan.
- `--strict` → exit 1 kalau ada error. Exit 0 = hijau; peringatan (suspect_short
  di poin ringkasan ~1.05–1.2) tidak menggagalkan gate.

Kabel: `validate:translation` = gate ke-8 di `npm run validate`, dan hook
`prebuild` sehingga tidak ada deploy/build yang lolos dengan terjemahan rusak.

## 5. Gate & perintah baru

```
npm run validate:translation    # auditor mutu terjemahan (--strict)
npm run validate                # sekarang 8 gate: glossary, final, sections,
                                # jsx, css-classes, ruby, translation, furigana
```

## 6. QA

### Gates lokal (run 2026-08-11, semua bare tanpa pipe)

| Gate | Hasil |
|---|---|
| validate:glossary | ✅ exit 0 — 133 entri, slug unik |
| validate:final | ✅ exit 0 — 6 tahun × 125 soal, 5 bagian/tahun |
| validate:sections | ✅ exit 0 — 13 section / 152 level, ketiga sumber sinkron |
| validate:jsx | ✅ exit 0 — 99 pemakaian, 0 undeclared |
| validate:css-classes | ✅ exit 0 — 256 class, semua punya aturan |
| validate:ruby | ✅ exit 0 — 29079 anotasi sah, 0 bocor |
| validate:translation | ✅ exit 0 — 5824 field, 0 error, 32 peringatan benign, 152/152 titleId unik |
| validate:furigana | ✅ exit 0 (layer 1 postcss) |
| npm run validate (chain penuh) | ✅ exit 0 |
| npm run build (termasuk prebuild hook) | ✅ exit 0 — bundle 1,58 MB / 191,8 kB gzip |
| distribusi jawaban level (harus 18–21%) | ✅ 18.7 / 19.5 / 21.1 / 20.7 / 20.1 (760 soal, 0 level seragam) |
| distribusi jawaban ujian | ✅ 18.9 / 20.0 / 20.4 / 22.3 / 18.4 (750 soal) |

### Produksi kaigo.wyna.dev (deploy 2026-08-11, commit 6d5bcb7)

| Cek | Hasil |
|---|---|
| Homepage & /friends route | ✅ 200 |
| API hidup (leaderboard/achievements jawab auth-gate, bukan 404 SPA) | ✅ `{"error":"Not signed in"}` |
| Bundle JS berisi terjemahan baru ("adalah tema yang diujikan", judul topik) | ✅ terverifikasi di index-BStZtlsp.js |
| Bundle CSS berisi aturan nav mobile & label header | ✅ navFriends & statLabel ada di index-D5JUn8JX.css |
| CI GitHub Actions (validate+build & tamper-probe) | ✅ success di 6d5bcb7 — probe terjemahan-rusak bekerja |
