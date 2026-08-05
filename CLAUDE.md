# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev                  # Vite dev server (frontend only — /api/* returns 404)
npm run build                # build-glossary-index.mjs, then vite build
npm run preview

npm run validate             # runs all five gates below in order; use this before pushing
npm run validate:glossary    # slug/kanji uniqueness, reading is pure hiragana, related-slug refs resolve
npm run validate:final       # asserts 6 years × 125 questions, 5 options, answer ∈ 1..5, 5 parts of 25
npm run validate:sections    # src/data.js level counts == SECTION_LEVELS in api/_sections.mjs (+ the 005 migration)
npm run validate:ruby        # static gate: no leaked bracket annotations (3 classes, see below)
npm run validate:furigana    # furigana layout: postcss CSS analysis (layer 1)
npm run validate:furigana:measure   # + real glyph measurement in headless Chrome at 360/768/1280px (layer 2)
```

There is no test runner, linter, or formatter. The `validate:*` scripts are the only automated checks — treat them as the test suite. `npm run validate` chains all five and is what you want after touching content, CSS, or `api/_sections.mjs`.

Two traps when reading their results:
- **Never pipe them** (`… | tail`) to check success. The shell reports the *last* command's exit code, so a real failure reads as `EXIT=0`. Run them bare.
- `validate:furigana` exits **2**, not 0, when it cannot find a browser to measure with — "measured nothing" must not look like "passed". Only 0 is green.

`npm run dev` serves only the SPA. The `api/` functions are Vercel Functions and do not run under Vite, so auth and server progress are unavailable locally — logged-out guest mode (localStorage) is what you actually exercise. To run the API locally you need `vercel dev` plus the env vars from README.md.

### Database scripts

All of these read `DATABASE_URL` from the environment and hit Neon directly. There is no `.env` loader in the scripts, so the variable must already be exported in your shell.

```bash
node scripts/run-migration.mjs scripts/001_init.sql   # apply a migration (README: use DATABASE_URL_UNPOOLED)
node scripts/verify-schema.mjs                        # dump columns + constraints for the 8 core tables
node scripts/verify-consistency.mjs                   # app_users.total_xp vs SUM(level_progress.xp_earned); must print []
node scripts/backup-db.mjs out.json                   # dump 4 tables to JSON
node scripts/e2e-make-token.mjs [email]               # mint a magic token, prints raw token for /api/auth/verify?token=
node scripts/cleanup-e2e-test.mjs                     # delete the e2e-smoke-test@kaigokitty.internal user
node scripts/gen-furigana.mjs                         # regenerate src/furigana.generated.js (see caveat below)
```

Migrations are idempotent and additive (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DO $$ ... EXCEPTION WHEN duplicate_object`), designed to be safely re-run. `run-migration.mjs` strips `BEGIN`/`COMMIT` and splits on `;` while respecting `$$`-quoted blocks, because the Neon HTTP driver auto-commits per statement — so a migration is **not** atomic when applied this way; a mid-file failure leaves partial state. `scripts/drop-legacy.mjs` DROPs the four core tables CASCADE — destructive, never run it casually.

## Architecture

Vite + React SPA (`src/`) plus Vercel Functions (`api/`), deployed to Vercel with all routes rewritten to `index.html` (`vercel.json`). Persistence is Neon Postgres via `@neondatabase/serverless`.

### Content is generated, not authored

This is the least obvious thing about the codebase. `src/data.js` builds all 13 sections and their 152 levels **at import time** from a compact `plans` array (title, level count, icon, topic list) crossed with `qTemplates`. Every level gets 5 materi cards from `makeGeneratedJapaneseCard()` and 5 questions; `src/content/final/index.js` does the same for the mock exam (6 years × 125 questions). Questions carry `correctIndex` (0-based into `choices`), **not** an `answer` field.

Answer keys used to be constant — every level quiz resolved to the person-centered-care option and every exam question to `'1'`. They are now distributed: level quizzes run 18.7–21.1% across the five positions over 760 questions, the exam 18.4–22.3% over 750, with no uniform section and no level whose questions all share one index. If you touch a template, re-check that distribution; a careless edit collapses it back to constant without failing any build.

So most Japanese "content" is templated filler. Only two files are hand-written and represent the intended quality bar: `src/content/s1l1.json` (Indonesian, 10 cards, its `_comment` explicitly calls itself the density benchmark) and `src/content/s1l1-ja.json` (the Japanese overlay). `Materi` in `main.jsx` special-cases `section 1 / level 1` to load them, merging the two via `mergeJapaneseCard()`. Anything that appears to "fix content" by editing generated text is fixing a template, which changes hundreds of levels at once — check which layer you are in first.

`src/content/glossary.json` (114 hand-written terms) is the other real content. `npm run build` runs `scripts/build-glossary-index.mjs`, which counts term occurrences and writes the committed `glossary.index.json` that the app imports. That script prefers scanning a `src/content/sections/` directory which **does not exist**, so it always falls back to counting substrings in `src/data.js` text.

### Three-mode language switch

Every text surface renders through `Furigana` in `src/Furigana.jsx` with mode `kanji` / `furigana` / `id`. **It is the only component allowed to emit ruby** — a raw `<ruby>` anywhere else is a bug. Readings use a custom bracket notation `尊厳[そんげん]`, parsed by `parseRuby()` (regex `RUBY_RE`) into `<ruby class="fg-ruby"><span class="fg-rb">base</span><rt class="fg-rt">reading</rt></ruby>`. Layout is flex `column-reverse` (`src/routing.css`), not the browser's ruby engine, so readings cannot overlap and Safari matches Chrome.

Three things there are load-bearing; changing any of them regresses layout, and `npm run validate:furigana` will catch it:
- `annotate()` runs in **kanji mode too**, so the `<ruby>` element still exists and CSS hides only the reading via `visibility:hidden` (not `display:none`). This keeps line height identical across a 漢字 ⇄ ふり toggle.
- `flex-direction:column-reverse` puts `.fg-rb` first in DOM order (correct reading order for copy-paste and screen readers) while painting the reading above.
- `RUBY_RE` requires a **kanji** base and a **pure-kana** reading. Do not loosen it to accept digits or kanji readings — a leaking annotation is a content bug to fix in the content (see `validate:ruby` below).

Ruby verification is two independent gates, both wired into `npm run validate`:
- `scripts/validate-ruby.mjs` (`npm run validate:ruby`) — static gate against the three bracket-leak classes that have actually occurred: HTML ruby tags in data, a bracket whose contents are not pure kana (`拭[拭]`), and a non-kanji base (`1[ひと]つ`). Any of them renders the bracket literally on screen, because there is no `dangerouslySetInnerHTML` to fall back on.
- `scripts/qa/verify-furigana-headless.mjs` (`npm run validate:furigana`, add `:measure` for layer 2) — layer 1 statically analyses the CSS via postcss; layer 2 drives installed Chrome/Edge over CDP and *measures real glyph boxes* at 360/768/1280px (reading above base, centers aligned, no collisions, min font size, kanji not stretched, no overflow past the parent). `SAMPLES` is audit-derived, not hand-picked — worst-case tokens by base length and kana:kanji ratio, plus the real `.termSheet h2` and `.japaneseTerm` containers, since a synthetic `<div>` understates the problem (same token: 333.6px synthetic vs 421.3px real). **Exit code 2 means "measured nothing"** (no browser found) and is deliberately not 0, so a missing browser can never read as green.

`scripts/qa/verify-furigana.js` is the older manual counterpart: pasted into a browser console on a materi page in ふり mode. It is still the only way to get real Safari/iOS and Firefox evidence, which the headless verifier (Chromium-only) cannot provide.

### Auth and progress

Magic-link only, no passwords, no OAuth yet. `POST /api/auth/magic-link` inserts a SHA-256 token hash with a 20-minute expiry and emails the link via nodemailer; `GET /api/auth/verify` validates, upserts the user, marks the token used (single-use), and sets an HttpOnly/Secure/SameSite=Lax `kaigo_session` cookie valid 30 days. Only hashes are stored — for tokens, sessions, and IPs. `requireUser()` in `api/_auth.mjs` is the gate for every protected handler; `api/_db.mjs` deliberately performs no DDL at runtime.

`AuthContext` (session state) wraps `ProgressContext` (progress state), and this order matters. Guests accumulate progress in localStorage under `kaigoKittyProgress`; on first authenticated load `ProgressContext` POSTs it to `/api/progress/merge`, keyed by a persistent `clientId` that the server records in `progress_merges` for idempotency, then clears the local copy. If a submit fails while authenticated it falls back to writing the local guest entry so nothing is lost.

`POST /api/progress` recomputes the score server-side from `correctCount`/`totalCount` and rejects a client score that disagrees by more than 1 point. Idempotency is per-`attemptId`: the full response JSON is cached in `level_attempts` and replayed verbatim on retry, so the client must send a fresh UUID per attempt (`Quiz` generates one in `useState`).

### Preview-vs-official unlocking

The core progression rule: **nothing is ever blocked.** Every section and level is openable and playable. Prerequisites only decide whether an attempt counts.

- Level prerequisite: previous level in the section is `completed` (level 1 always qualifies).
- Section prerequisite: previous section is ≥80% complete.
- Both met → official attempt. Pass is `score >= 60`; XP is `10 + accuracy bonus + first-try bonus`, and a replay of an already-completed level earns only 20% (min 2). Completion also drives streak and `daily_activity`.
- Not met → **preview attempt**: `status = 'preview_attempt'`, flat 3 XP, written to separate `preview_*` columns so official stats stay clean, and it does not unlock anything. The response carries `isPreview: true` and the UI shows a "preview" banner and pill.

This dual-track logic is duplicated in three places that must stay in agreement: `api/progress.mjs` (authoritative), `buildSectionsMap()` in the same file (the `GET` shape, which patches `levelUnlocked: false` across a whole section in a second pass), and `useSectionUnlockMap()` in `main.jsx` (the guest path, reading localStorage). All three now derive section sizes from the same source — the API pair from `api/_sections.mjs`, the client from `src/data.js` — and all three use the identical integer expression `completed*5 >= total*4` for the 80% gate. Change one and you must change the others; `npm run validate:sections` catches a size divergence but not a logic one.

`FinalTest.jsx` does **not** use this system. Exam progress is localStorage-only under `kk_final_progress`, all years and parts are open from the start, and although `scripts/004_final_test.sql` already created `final_progress` / `final_attempts` and an `app_users.pref_final_mode` column, no API route reads or writes them — the server side is provisioned but unwired.

## Previously known bugs — both fixed

Kept as history because the fixes are load-bearing and easy to undo by accident. Neither is live; do not "re-fix" them.

**1. Generated furigana rendered as literal HTML source — fixed.** `scripts/gen-furigana.mjs` used to emit `<ruby>…<rt>…</rt></ruby>`, which the bracket parser could not read, so tag text appeared verbatim on screen in ふり mode. The generator now emits bracket notation; `src/furigana.generated.js` holds 2314 entries with zero HTML tags (the only `<ruby>` string left in the file is the comment warning you not to reintroduce them). Fixed at the generator, **not** by adding `innerHTML` — there is still no `dangerouslySetInnerHTML` anywhere, which is why `validate:ruby` exists as a permanent gate.

**2. `LEVELS_PER_SECTION = 17` — fixed.** The constant is gone. `api/_sections.mjs` is now the single server-side source of truth (`SECTION_LEVELS = [10,10,15,13,10,12,12,9,12,10,17,10,12]`, plus `levelsInSection` / `meetsSectionGate` / `sectionPercent`), re-exported by `api/_auth.mjs` and imported by `api/progress.mjs`. The 80% gate uses integer math (`completed*5 >= total*4`), not rounded percentages, and `useSectionUnlockMap()` in `main.jsx` mirrors that exact expression for guests — verified in agreement across all 61,836 progression states. `npm run validate:sections` asserts `src/data.js` and `SECTION_LEVELS` still match; it will fail if a section's level count changes on only one side.

`scripts/005_section_level_ranges.sql` tightens the DB-side `level_progress` CHECK to the real per-section ranges. **It is written but not applied** — applying it needs `DATABASE_URL`. Note the explicit `section_id BETWEEN 1 AND 13`: without it an out-of-range subscript yields NULL, and a CHECK evaluating to NULL is treated as *satisfied*, so the guard is what makes the constraint real.

## Conventions

Code is written in an extremely dense style: single-line components, chained ternaries in JSX, minimal whitespace, near-zero destructuring. `main.jsx` holds ~20 components in 537 lines. Match it — do not reformat existing lines while editing nearby code, as it destroys the diff.

Comments and all user-facing copy are Indonesian; identifiers are English; content is Japanese. UI is mobile-first, pink/kawaii, Hello Kitty mascots from `public/assets/hellokitty/` mapped through `MASCOT_MAP`.

CSS is four hand-maintained plain files (`styles.css`, `routing.css`, `translation.css`, `auth.css`) with no preprocessor or utility framework, also minified-dense.

Client-side keys in use: `kaigoKittyProgress`, `kaigoKittyClientId`, `kk_final_progress`, `kk_final_mode` (localStorage); `kk_materi_pos_<s>_<l>`, `kk_glossary_state` (sessionStorage, for scroll/position restore).

## Secrets

`creds.txt` in the repo root holds a GitHub PAT, Vercel token, Neon API key, Cloudflare/R2, Midtrans and Porkbun credentials. It is gitignored and has never been committed — verified against full history. Do not read it into context, echo it, or move it into tracked files. `.claude/settings.json` also carries an API token and is gitignored.

Runtime secrets (`DATABASE_URL`, `SMTP_*`, `APP_URL`) come from Vercel env vars only; see README.md for the full list. `.backup/` is tracked in git but contains only older copies of source files, no secret literals.
