# Kaigo Kitty

Mobile-first learning app for the Japanese **介護福祉士** (Certified Care Worker) national
examination. Japanese source text with Indonesian explanations, a three-mode language toggle
(漢字 / ふりがな / Indonesian), 13 sections across 152 levels, and a 6-year mock exam.

Production: <https://kaigo-kitty.vercel.app>

---

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Vite + React 18 SPA (`src/`), React Router |
| Backend | Vercel Functions (`api/`, ESM `.mjs`) |
| Database | Neon Postgres via `@neondatabase/serverless` (HTTP driver) |
| Email | nodemailer over SMTP |
| Styling | Four hand-maintained CSS files, no preprocessor or utility framework |

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
| `DATABASE_URL` | Neon pooled connection string (runtime) |
| `DATABASE_URL_UNPOOLED` | Direct endpoint; use for migrations, not runtime |
| `APP_URL` | Public origin, e.g. `https://kaigo-kitty.vercel.app`; used to build magic-link URLs |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Mail transport (`587` / `false` for STARTTLS) |
| `SMTP_USER` / `SMTP_PASS` | Mail credentials |
| `SMTP_FROM` | From header, e.g. `Kaigo Kitty <no-reply@example.com>` |
| `CHROME_PATH` | Optional. Browser binary for `validate:furigana:measure` if auto-detection fails |

`.env*` is gitignored. Database scripts read `DATABASE_URL` from the ambient environment —
there is no dotenv loader in them, so export it in your shell first.

---

## Validation gates

```bash
npm run validate      # runs the five gates below, in order — use before pushing
```

| Gate | Asserts |
| --- | --- |
| `validate:glossary` | Slug/kanji uniqueness, readings are pure hiragana, related-slug refs resolve |
| `validate:final` | 6 years × 125 questions, 5 options each, answer in range, 5 parts of 25 |
| `validate:sections` | Level counts agree across `src/data.js`, `api/_sections.mjs`, and `005_*.sql` |
| `validate:ruby` | No leaked bracket annotations (three failure classes, documented in the script) |
| `validate:furigana` | Ruby layout contract — static CSS analysis via postcss |

```bash
npm run validate:furigana:measure   # adds real glyph measurement in headless Chrome
```

Two traps worth knowing:

- **Never pipe these to check success.** The shell reports the *last* command's exit status, so
  `npm run validate | tail` prints `EXIT=0` even when validation failed. Run them bare.
- **`validate:furigana` exits `2`** — distinct from both pass (`0`) and fail (`1`) — when it cannot
  find a browser to measure with, so "measured nothing" can never be misread as "passed".

The measure layer drives an installed Chrome or Edge over CDP with no Puppeteer dependency, and
measures real glyph boxes at 360 / 768 / 1280 px: reading above base, centers aligned, no
collisions, minimum font size, kanji not stretched, and no horizontal overflow past the parent.
It is Chromium-only. `scripts/qa/verify-furigana.js` remains the manual counterpart — pasted into
the console on a materi page in ふり mode to get real Safari/iOS and Firefox evidence.

---

## Architecture notes

### Content is generated, not authored

`src/data.js` builds all 13 sections and 152 levels **at import time** from a compact `plans`
array crossed with question templates; `src/content/final/index.js` does the same for the mock
exam. Questions carry `correctIndex` (0-based into `choices`), not an `answer` field.

Two files are hand-written and set the intended quality bar: `src/content/s1l1.json` (Indonesian,
10 cards — its `_comment` calls itself the density benchmark) and `src/content/s1l1-ja.json`
(the Japanese overlay). `src/content/glossary.json` holds 114 hand-written terms.

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
| `/` | Section list / home |
| `/login` | Magic-link sign-in |
| `/profile` | Profile and stats |
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

Eight core tables: `app_users`, `app_sessions`, `magic_tokens`, `level_progress`,
`daily_activity`, `question_attempts`, `level_attempts`, `progress_merges`.

```bash
node scripts/run-migration.mjs scripts/001_init.sql   # apply a migration (use the unpooled URL)
node scripts/verify-schema.mjs                        # dump columns + constraint definitions
node scripts/verify-consistency.mjs                   # total_xp vs SUM(xp_earned); must print []
node scripts/backup-db.mjs out.json                   # dump four tables to JSON
node scripts/e2e-make-token.mjs [email]               # mint a magic token for manual verification
node scripts/cleanup-e2e-test.mjs                     # remove the e2e smoke-test user
node scripts/gen-furigana.mjs                         # regenerate src/furigana.generated.js
```

### Migrations

`001` through `005` are **applied**. Migrations are written to be idempotent and additive
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

`scripts/drop-legacy.mjs` DROPs the four core tables CASCADE. It is destructive; do not run it
casually.

---

## Deployment

Vercel, `framework: vite`, build `npm run build`, output `dist`. The build runs
`scripts/build-glossary-index.mjs` before `vite build` to regenerate the committed glossary
occurrence index. Pushing to `main` deploys.

## Conventions

Code is deliberately dense: single-line components, chained ternaries in JSX, minimal
whitespace. Match the surrounding style — reformatting existing lines destroys the diff.
Comments and user-facing copy are Indonesian, identifiers are English, content is Japanese.
UI is mobile-first and pink/kawaii, with mascots from `public/assets/hellokitty/`.
