# Kenshi Kaigo E-Learning

Mobile-first learning app for the Japanese **介護福祉士** (Certified Care Worker) national
examination. Japanese source text with Indonesian explanations, a three-mode language toggle
(漢字 / ふりがな / Indonesian), 13 sections across 152 levels, and a 6-year mock exam.

Production: <https://kaigo.wyna.dev> (alias Vercel: `kaigo-kitty.vercel.app`)

---

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Vite + React 18 SPA (`src/`), React Router |
| Backend | Vercel Functions (`api/`, ESM `.mjs`) |
| Database | Postgres. Driver dipilih dari host di `DATABASE_URL`: `*.neon.tech` → `@neondatabase/serverless` (HTTP), selain itu → `postgres` (postgres.js, TCP). Lihat `api/_db.mjs` |
| Email | nodemailer over SMTP |
| Styling | Six hand-maintained CSS files (`styles`, `routing`, `translation`, `auth`, `themes`, `social`), no preprocessor or utility framework |

No test runner, linter, or formatter. The `validate:*` scripts **are** the test suite.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

`npm run dev` serves the SPA only. Functions in `api/` are Vercel Functions and do not run
under Vite, so `/api/*` returns 404 locally — sign-in and server-side progress are unavailable.
What you actually exercise is **logged-out guest mode**, which persists to `localStorage`.

For the full stack locally you need the Vercel CLI and the environment variables below:

```bash
vercel dev
```

### Environment variables

Set these in Vercel (Project → Settings → Environment Variables). Never commit values.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled connection string (runtime). Neon pooled, atau Supabase transaction pooler port `6543` |
| `DATABASE_URL_UNPOOLED` | Direct/session endpoint; dipakai `run-migration.mjs`, bukan runtime. DDL lewat transaction pooler salah alamat |
| `APP_URL` | Public origin, e.g. `https://kaigo.wyna.dev`; used to build magic-link URLs |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Mail transport (`587` / `false` for STARTTLS) |
| `SMTP_USER` / `SMTP_PASS` | Mail credentials |
| `SMTP_FROM` | From header. **Harus alamat yang diizinkan provider SMTP-nya.** Gmail SMTP menulis ulang From ke akun terautentikasi kecuali alamatnya sudah diverifikasi sebagai "Send mail as" |
| `DB_DRIVER` | Opsional, `postgres`\|`neon`. Menimpa deteksi host — dipakai untuk menguji cabang postgres.js lawan Neon, dan sebagai tuas rollback saat cutover. Kosongkan di produksi |
| `CHROME_PATH` | Optional. Browser binary for `validate:furigana:measure` if auto-detection fails |

`.env*` is gitignored. Database scripts read `DATABASE_URL` from the ambient environment —
there is no dotenv loader in them, so export it in your shell first.

---

## Validation gates

```bash
npm run validate      # runs the nine gates below, in order — use before pushing
```

| Gate | Asserts |
| --- | --- |
| `validate:glossary` | Slug/kanji uniqueness, readings are pure hiragana, related-slug refs resolve |
| `validate:final` | 6 years × 125 questions, 5 options each, answer in range, 5 parts of 25 |
| `validate:sections` | Level counts agree across `src/data.js`, `api/_sections.mjs`, and `005_*.sql` |
| `validate:jsx` | Every `<Capitalized/>` used in JSX is declared in that file |
| `validate:css-classes` | Every `className` in JSX has a matching rule in the six CSS files |
| `validate:ruby` | No leaked bracket annotations (three failure classes, documented in the script) |
| `validate:romaji` | Glossary romaji fields agree with `kanaToRomaji(reading)` — hand-typed romaji is banned (pack v8 found `shicchoushou` vs the correct `shitchoushou`); fix with `node scripts/regen-glossary-romaji.mjs --write` |
| `validate:translation` | Indonesian translation quality — no boilerplate skeletons, no kanji leaks into ID fields, length/paragraph/sentence parity; also runs as a `prebuild` hook |
| `validate:furigana` | Ruby layout contract — static CSS analysis via postcss |

Three further gates are not in the chain, because each needs something the others don't:

```bash
npm run validate:furigana:measure   # real glyph measurement in headless Chrome (needs a browser)
npm run validate:overflow           # non-ruby overflow + touch targets <44px (needs a browser)
npm run validate:browsers           # WebKit + Firefox + Chromium (needs a live deployment)
```

`validate:jsx` exists because of an outage worth understanding: `main.jsx` used `<UnlimitedFinal/>`
without importing it, and **every route went blank**. `element={<Foo/>}` dereferences the
identifier while React builds the `<Routes>` children array, so the `ReferenceError` fires before
any route is matched, and with no error boundary React unmounts the entire tree. `npm run build`
exits 0 on this — a bare identifier in JSX could legitimately be a global, so the bundler emits it
as written. The build stayed green for as long as production was white.

Two traps worth knowing:

- **Never pipe these to check success.** The shell reports the *last* command's exit status, so
  `npm run validate | tail` prints `EXIT=0` even when validation failed. Run them bare.
- **`validate:furigana` and `validate:browsers` exit `2`** — distinct from both pass (`0`) and
  fail (`1`) — when they cannot find a browser or engine to measure with, so "measured nothing"
  can never be misread as "passed".

The measure layer drives an installed Chrome or Edge over CDP with no Puppeteer dependency, and
measures real glyph boxes at 320 / 360 / 402 / 444 / 768 / 1280 / 1920 px — 402 is iPhone 17
(1206 physical / DPR 3) and 444 is Poco F6 (1220 / DPR 2.75). It checks reading above base,
centers aligned, no collisions, minimum font size, kanji not stretched, and no horizontal overflow.

`validate:browsers` covers the engine gap: Playwright driving **WebKit (Safari's engine)**,
Firefox, and Chromium over 11 routes × the same 7 widths against the deployed site. Playwright is
intentionally not a dependency — the script finds it in the npx cache and selects the build whose
browser revisions are actually present, since several versions coexist and each pins a different
revision. Real iOS Safari on hardware remains the one thing no script here covers;
`scripts/qa/verify-furigana.js` is the manual console counterpart for that.

---

## Architecture notes

### Content is generated, not authored

`src/data.js` builds all 13 sections and 152 levels **at import time** from a compact `plans`
array crossed with question templates; `src/content/final/index.js` does the same for the mock
exam. Questions carry `correctIndex` (0-based into `choices`), not an `answer` field.

Two files are hand-written and set the intended quality bar: `src/content/s1l1.json` (Indonesian,
10 cards — its `_comment` calls itself the density benchmark) and `src/content/s1l1-ja.json`
(the Japanese overlay). `src/content/glossary.json` holds 133 hand-written terms.

Consequence: editing generated Japanese text means editing a **template**, which changes hundreds
of levels at once. Identify which layer you are in before changing content.

### Three-mode language switch

Every text surface renders through `Furigana` in `src/Furigana.jsx`, which is the only component
allowed to emit ruby — a raw `<ruby>` anywhere else is a bug. Readings use bracket notation
(`尊厳[そんげん]`) parsed by a regex requiring a **kanji** base and a **pure-kana** reading.
Layout is flex `column-reverse` rather than the browser's ruby engine, so readings cannot overlap
and Safari matches Chrome. There is no `dangerouslySetInnerHTML` anywhere, which is why a leaked
bracket renders literally on screen — and why `validate:ruby` exists as a permanent gate.

### Auth and progress

Magic-link only; no passwords, no OAuth yet (Google is the intended next provider). Tokens are
stored as SHA-256 hashes with a 20-minute expiry and are single-use; sessions are an HttpOnly,
Secure, SameSite=Lax `kaigo_session` cookie valid 30 days. Only hashes are stored — for tokens,
sessions, and IPs. `requireUser()` in `api/_auth.mjs` gates every protected handler, and
`api/_db.mjs` performs no DDL at runtime.

Guests accumulate progress in `localStorage`; on first authenticated load it is POSTed to
`/api/progress/merge`, keyed by a persistent client id recorded server-side for idempotency.
`POST /api/progress` recomputes the score server-side and rejects a client score that disagrees
by more than one point. Idempotency is per-`attemptId`: the response JSON is cached and replayed
verbatim on retry, so clients must send a fresh UUID per attempt.

### Progression: nothing is ever blocked

Every section and level is openable and playable. Prerequisites only decide whether an attempt
**counts**.

- Level prerequisite: the previous level in the section is `completed` (level 1 always qualifies).
- Section prerequisite: the previous section is ≥ 80% complete, as integer math
  (`completed * 5 >= total * 4`), never rounded percentages.
- Both met → official attempt. Pass is `score >= 60`; XP is `10 + accuracy bonus + first-try
  bonus`; replaying a completed level earns 20% (minimum 2).
- Not met → **preview attempt**: flat 3 XP, written to separate `preview_*` columns so official
  statistics stay clean, and it unlocks nothing.

This dual-track logic is duplicated in three places that must stay in agreement: `api/progress.mjs`
(authoritative), `buildSectionsMap()` for the `GET` shape, and `useSectionUnlockMap()` in
`main.jsx` (the guest path). `validate:sections` catches a size divergence but not a logic one.

The mock exam does not use this system: exam progress is `localStorage`-only, and all years and
parts are open from the start.

---

## API

| Method | Endpoint | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/magic-link` | Emails a sign-in link; stores only the token hash |
| `GET` | `/api/auth/verify` | Validates the token, upserts the user, sets the session cookie |
| `GET` | `/api/auth/session` | Current session, or unauthenticated |
| `GET` | `/api/progress` | Full section/level progress map |
| `POST` | `/api/progress` | Submit an attempt; server recomputes the score |
| `POST` | `/api/progress/merge` | One-time guest → account merge, idempotent per client id |

## Routes

| Path | Screen |
| --- | --- |
| `/` | Public landing page |
| `/login` | Magic-link sign-in (supports `?next=` deep-link) |
| `/belajar` | Section list / home (session required) |
| `/onboarding` | First-run profile wizard (session required) |
| `/profile` | Profile and stats |
| `/friends` | Friend list, requests, and handle lookup |
| `/leaderboard` | Global public ranking and friends ranking |
| `/achievements` | Achievement list and avatar frames |
| `/glossary`, `/glossary/:slug` | Glossary index and term detail |
| `/section/:sectionId` | Level list |
| `/section/:sectionId/recap` | Section recap |
| `/section/:sectionId/level/:levelId` | Level overview |
| `/section/:sectionId/level/:levelId/materi` | Study cards |
| `/section/:sectionId/level/:levelId/quiz` | Quiz |
| `/section/:sectionId/level/:levelId/result` | Attempt result |
| `/final` | Mock exam year picker |
| `/final/:year`, `/final/:year/result` | Year overview and result |
| `/final/:year/part/:part`, `.../result` | Exam part and its result |
| `/final/unlimited` | Unlimited practice from the exam pool |
| `/practice` | Practice mode |
| `*` | Not-found fallback |

`vercel.json` rewrites all paths to `index.html`; Vercel matches functions in `api/` before the
rewrite, so API routes are unaffected.

---

## Database

Fourteen tables: `app_users`, `app_sessions`, `magic_tokens`, `level_progress`,
`daily_activity`, `question_attempts`, `level_attempts`, `progress_merges`,
`final_progress`, `final_attempts`, `friendships`, `achievements`, `user_achievements`,
`leaderboard_seen`.

```bash
node scripts/run-migration.mjs scripts/001_init.sql   # apply a migration (use the unpooled URL)
node scripts/verify-schema.mjs                        # dump columns + constraint definitions
node scripts/verify-consistency.mjs                   # total_xp vs SUM(xp_earned); must print []
node scripts/backup-db.mjs .backup/dump.json          # dump SEMUA tabel publik ke JSON
node scripts/restore-db.mjs .backup/dump.json --yes    # muat ulang dump itu ke DB kosong (tanpa --yes = uji coba)
SRC_URL=.. DST_URL=.. node scripts/compare-schema.mjs # diff kolom/constraint/indeks dua database
node scripts/e2e-make-token.mjs [email]               # mint a magic token for manual verification
node scripts/cleanup-e2e-test.mjs                     # remove the e2e smoke-test user
node scripts/gen-furigana.mjs                         # regenerate src/furigana.generated.js
```

### Migrations

`001` through `008` are **applied**. Migrations are written to be idempotent and additive
(`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DO $$ … EXCEPTION WHEN duplicate_object`), so
re-running them is safe.

`005_section_level_ranges.sql` tightens the `level_progress` CHECK from a flat
`level_id BETWEEN 1 AND 17` to the real per-section ranges via an array subscript. Note the
explicit `section_id BETWEEN 1 AND 13`: without it an out-of-range subscript yields NULL, and a
CHECK evaluating to NULL is treated as *satisfied* — the guard is what makes the constraint real.

Caveat when applying anything: `run-migration.mjs` strips `BEGIN`/`COMMIT` and splits on `;`
because the Neon HTTP driver auto-commits per statement. A migration applied this way is
therefore **not atomic**, and a mid-file failure leaves partial state. Verify the result against
`pg_get_constraintdef()` rather than trusting the script's own "OK".

`scripts/drop-legacy.mjs` DROPs core tables CASCADE. It is destructive; do not run it
casually.

---

## Pindah ke Supabase — SUDAH DILAKUKAN (2026-08-28)

Produksi jalan di **Supabase**: project `kenshi-kaigo-sg`, region `ap-southeast-1`
(Singapura), PostgreSQL 17.6, transaction pooler
`aws-0-ap-southeast-1.pooler.supabase.com:6543`. Function Vercel dipatok ke `sin1`
lewat `vercel.json` supaya sebaris dengan databasenya — lihat "Region dan latensi".

Pindahnya dua langkah dalam satu hari: Neon → Supabase Sydney (`ap-southeast-2`),
lalu Sydney → Singapura. Langkah kedua perlu **project baru**, karena region
Supabase **tidak bisa diganti di tempat**; jalur resminya bikin project lalu
migrasi ("restore to another project" yang lebih mulus itu fitur paid plan).

**DUA lapis jalan mundur, dua-duanya dibiarkan hidup dan utuh:**

| lapis | isi | URL rollback |
| --- | --- | --- |
| Supabase Sydney (`kenshi-kaigo`) | salinan penuh saat cutover kedua | `.env.rollback-supabase-syd.local` |
| Neon | salinan penuh saat cutover pertama | `.env.rollback-neon.local` |

Untuk Neon pakai berkas rollback itu, **bukan** `.env.neon.local` — host-nya sama
tapi parameter query-nya berbeda.

### Region dan latensi

Diukur di produksi dengan `/api/auth/session`: tanpa cookie = nol query, dengan
cookie palsu = tepat satu query. Selisihnya = biaya satu perjalanan ke database.
Angkanya **min** dari 10 sampel; median kena noise jaringan klien.

| function | database | 0 query | 1 query | biaya/query |
| --- | --- | --- | --- | --- |
| `iad1` (default) | Sydney | 380ms | 830ms | ~420ms |
| `sin1` | Sydney | 156ms | 343ms | ~187ms |
| `syd1` | Sydney | 292ms | 295ms | ~3ms |
| `sin1` | **Singapura** | **203ms** | **203ms** | **~0ms** |

Dua pelajaran yang terbaca dari tabel itu:

1. **Function harus sebaris dengan database.** Default `iad1` membuat tiap query
   menyeberang separuh bumi. Satu `GET /api/final` butuh tiga query berurutan,
   jadi ~1,26 detik dari waktu tunggunya murni jarak.
2. **Sesudah itu, yang tersisa cuma jarak user ke function.** Singapura ~90ms
   lebih dekat ke user (Indonesia) daripada Sydney, dan hematnya konstan — tidak
   peduli endpoint-nya butuh berapa query.

Kalau target usernya pindah benua, dua-duanya (`vercel.json` regions DAN region
project Supabase) harus ikut pindah bersamaan. Memindahkan salah satu saja membuat
keadaan lebih buruk daripada tidak memindahkan apa pun — baris `sin1`/Sydney di
tabel itu buktinya.

Dua hal berjalan tidak seperti runbook di bawah, dan dua-duanya lebih baik:

- **Migrasi 001–008 dijalankan lewat Supabase Management API** (`POST
  /v1/projects/<ref>/database/query`) satu berkas satu request, bukan lewat
  `run-migration.mjs`. Artinya `BEGIN`/`COMMIT` di tiap berkas benar-benar berlaku,
  jadi migrasinya **atomik** — justru lebih aman daripada jalur biasa yang membuang
  keduanya. Jalur ini juga tidak butuh password DB, cuma token `sbp_`.
- **`compare-schema.mjs` akan melaporkan 106 selisih palsu** di kombinasi ini.
  Neon PG 18.6, Supabase PG 17.6, dan PG 18 mewujudkan NOT NULL sebagai baris
  `pg_constraint` bernama (`contype='n'`) sementara PG 17 tidak. Semua selisihnya
  bernama `*_not_null`. Bagian kolom sudah memuat `null=NO/YES` dan itu identik,
  jadi NOT NULL-nya sama persis. Saring `AND c.contype <> 'n'` sebelum menyimpulkan:
  sesudah itu kolom 126=126, constraint 49=49, index 38=38, identik.

Bukti cutover yang dipakai, bukan sekadar "tidak ada galat": hitung baris
`magic_tokens` di kedua database, POST `/api/auth/magic-link` ke alamat
`@kaigokitty.internal` di produksi (INSERT terjadi **sebelum** kirim email, jadi
barisnya pasti tertulis), lalu hitung ulang. Neon 6 → 6, Supabase 6 → 7. Barisnya
dihapus lagi sesudahnya. Data juga dibandingkan per-tabel (14 tabel, 64 baris,
identik), `SUM(app_users.total_xp)` 27 = 27, `verify-consistency.mjs` cetak `[]`,
dan ketiga kolom jsonb dibaca balik sebagai **objek** (bukan string ganda-encode —
jebakan yang gagalnya senyap).

### Runbook (disimpan untuk perpindahan berikutnya)

`api/_db.mjs` memilih driver dari HOST di `DATABASE_URL`, jadi perpindahan seperti
ini **tidak butuh deploy kode**, cukup ganti env var.

1. Ambil dua connection string dari Supabase (Project Settings → Database):
   - **transaction pooler**, port `6543` → untuk `DATABASE_URL` (runtime)
   - **session/direct**, port `5432` → untuk `DATABASE_URL_UNPOOLED` (migrasi)
2. Terapkan migrasi berurutan:
   ```bash
   DATABASE_URL_UNPOOLED=<direct> node scripts/run-migration.mjs scripts/001_init.sql
   # … sampai 008
   ```
   Berkas migrasi **tidak atomik** di skrip ini. Verifikasi dengan `verify-schema.mjs`
   dan `pg_get_constraintdef()`, jangan percaya "OK" dari skripnya.
3. Pindahkan data:
   ```bash
   DATABASE_URL=<neon> node scripts/backup-db.mjs .backup/pindah.json
   DATABASE_URL=<supabase-pooler> node scripts/restore-db.mjs .backup/pindah.json        # uji coba
   DATABASE_URL=<supabase-pooler> node scripts/restore-db.mjs .backup/pindah.json --yes  # sungguhan
   ```
4. Buktikan skemanya benar-benar mendarat:
   ```bash
   SRC_URL=<neon> DST_URL=<supabase> node scripts/compare-schema.mjs
   ```
   `verify-schema.mjs` hanya **mencetak**; berkas ini **membandingkan** dan keluar 1 kalau ada
   selisih. Penting karena `run-migration.mjs` tidak atomik — migrasi yang gagal di tengah
   meninggalkan skema separuh jadi tanpa satu pun galat di akhir.

   `restore-db.mjs` membaca tipe kolom dari `information_schema` **tujuan** untuk memutuskan
   mana yang dikirim sebagai array JS dan mana sebagai string JSON — menebak dari bentuk
   nilainya menghasilkan baris yang tersimpan tanpa galat tapi isinya salah. `ON CONFLICT
   DO NOTHING`, jadi restore yang gagal di tengah aman diulang.
5. Ganti `DATABASE_URL` di Vercel (Production + Preview) ke URL pooler `6543`, lalu
   redeploy — env var Vercel baru berlaku di deployment baru.
6. Rollback: kembalikan `DATABASE_URL` ke nilai di `.env.rollback-neon.local` dan
   redeploy. `DB_DRIVER=neon` hanya berguna selama URL-nya MASIH Neon — flag itu tidak
   bisa menyelamatkan URL Supabase.

   Catatan cutover 2026-08-28: `vercel env add` menyimpan Production & Preview sebagai
   **Secret** (nilainya tidak bisa dibaca balik lewat `env pull`), sedangkan Development
   tersimpan sebagai Config. Kalau perlu memverifikasi nilai yang terkirim, banding lewat
   Development — perintah dan stdin-nya sama.

   **JEBAKAN, dan ini gagal DIAM-DIAM.** Sekali variabelnya dibuat per-environment,
   `vercel env rm DATABASE_URL --yes` **tanpa** nama environment tidak menghapus apa
   pun (tiga entri bernama sama = ambigu), lalu `env add` berikutnya juga gagal karena
   variabelnya masih ada. Keluaran CLI-nya tidak terbaca seperti kegagalan, deployment
   berikutnya tetap READY, dan produksi tetap menunjuk database LAMA. Ketahuan cuma
   karena probe `magic_tokens` di bawah menunjukkan Sydney yang naik, bukan Singapura.
   Sebut environment-nya satu per satu: `env rm DATABASE_URL production --yes`, dst.
   Lalu WAJIB verifikasi ulang sebelum percaya cutover-nya jadi.

Tiga hal yang bisa menggigit:

- **Versi Postgres.** Neon di sini PG 18.6, Supabase 17.6. Migrasi 001–008 jalan apa adanya
  di dua-duanya, tapi bedanya muncul waktu MEMBANDINGKAN skema — lihat catatan `contype='n'`
  di atas.
- **IPv6.** Host direct `db.<ref>.supabase.co` IPv6-only tanpa add-on IPv4. Kalau mesinmu
  IPv4-only, pakai pooler port `5432` (session mode) untuk `DATABASE_URL_UNPOOLED`.
- **Transaction pooler dan prepared statement.** postgres.js dijalankan dengan
  `prepare:false` — jangan dihidupkan, Supavisor memultipleks koneksi per-transaksi.

---

## Deployment

Vercel, `framework: vite`, build `npm run build`, output `dist`. The build runs
`scripts/build-glossary-index.mjs` before `vite build` to regenerate the committed glossary
occurrence index.

**Pushing to `main` does NOT deploy.** The Vercel project has no Git integration
connected (`link: null`, zero deploy hooks) — every production release so far was
pushed from a laptop with the Vercel CLI, which attaches commit metadata and so
*looks* like a Git-triggered deploy in the dashboard. To release:

```bash
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
```

Verify afterwards by fetching a file that only exists in the new build; a static
asset that 200s with `content-type: text/html` and ~987 bytes is `index.html`
coming back through the catch-all rewrite, which means the asset is not deployed.
Comparing local `dist/` chunk hashes against production is not a valid check —
`package.json` pins `vite`/`react` to `latest`, so Vercel resolves its own
versions and emits different hashes for identical source. Read the chunk list out
of the deployed `index.html` instead.

## Conventions

Code is deliberately dense: single-line components, chained ternaries in JSX, minimal
whitespace. Match the surrounding style — reformatting existing lines destroys the diff.
Comments and user-facing copy are Indonesian, identifiers are English, content is Japanese.
UI is mobile-first and kawaii, with original characters from `public/assets/characters/`
(the Sanrio assets are gone — do not reintroduce third-party IP).
