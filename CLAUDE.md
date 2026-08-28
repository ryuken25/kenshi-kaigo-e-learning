# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev                  # Vite dev server (frontend only — see the warning below)
npm run build                # build-glossary-index.mjs, then vite build (prebuild runs validate:translation)
npm run preview

npm run validate             # the nine gates below, in order; run this before pushing
npm run validate:glossary    # slug/kanji uniqueness, reading is pure hiragana, related-slug refs resolve
npm run validate:final       # 6 years x 125 questions, 5 options, answer in 1..5, 5 parts of 25
npm run validate:sections    # level counts agree: src/data.js == api/_sections.mjs == 005_*.sql
npm run validate:jsx         # every <Capitalized/> in JSX is declared in that file (a bare one blanks the app)
npm run validate:css-classes # every className in JSX has a rule in one of the six CSS files
npm run validate:ruby        # static gate: no leaked bracket annotations (3 classes)
npm run validate:romaji      # glossary romaji == kanaToRomaji(reading); --write to fix
npm run validate:translation # Indonesian translation quality (also runs as a prebuild hook)
npm run validate:furigana    # furigana layout: postcss CSS analysis (layer 1)

npm run validate:furigana:measure   # layer 2: real glyph measurement in headless Chrome at 7 widths
npm run validate:overflow           # non-ruby horizontal overflow + touch targets <44px
npm run validate:browsers           # WebKit + Firefox + Chromium against production via Playwright
```

There is no test runner, linter, or formatter. The `validate:*` scripts **are** the test suite.
The last three are deliberately not in the chain: the first two need a browser, the third needs a
live deployment.

**`npm run dev` can no longer reach the app.** Since the v8 auth gate every learning route is
wrapped in `RequireAuth` (`src/main.jsx`), and `api/` are Vercel Functions that do not run under
Vite — so `/api/auth/session` fails, `AuthContext` settles on `status:'guest'`, and every route
redirects to `/login`, where the magic-link POST also fails. Vite alone gives you the landing page
and the login form, nothing behind them. To exercise anything real you need `vercel dev` plus the
env vars in README.md, or the deployed site.

### Reading gate results

- **Never pipe them** (`… | tail`) to check success. The shell reports the *last* command's exit
  code, so a real failure reads as `EXIT=0`. Run them bare.
- `validate:furigana` and `validate:browsers` exit **2**, not 0, when they find no browser/engine
  to measure with — "measured nothing" must never look like "passed". Only 0 is green.
- The gate count drifted: `ci.yml`'s comment and README both still say "8 gates" from before
  `validate:romaji` joined the chain. It is 9.

Two gates exist because of outages, and undoing either re-opens a white screen:

`validate:jsx` — `main.jsx` once used `<UnlimitedFinal/>` without importing it and **every route
rendered blank**. `element={<Foo/>}` dereferences the identifier while React builds the `<Routes>`
children array, so the `ReferenceError` fires before any path is matched, and with no error
boundary in `src/` React unmounts the whole tree. `npm run build` exits 0 on this: a bare
identifier in JSX is syntactically valid (it could be a global), so the bundler emits it verbatim.
The build was green the entire time production was white. This is also why the lazy routes are
written as `React.lazy(()=>import('./FinalTest.jsx').then(m=>({default:m.FinalHome})))` assigned to
a local `const` — the gate must still see `<FinalHome/>` declared in the file.

`validate:css-classes` — a class used in JSX with **no matching rule in any of the six CSS files**
falls back to `display:inline`, so `<b>`/`<span>`/`<small>` fuse into one line (this shipped as
"Ujian AkhirSimulasi 2021-2026…"; the same bug hit `.termSheetBackdrop`, `.sr-only`,
`.finalHomeBanner`). The build never fails on this — an unstyled class is valid CSS. The script
scrapes selectors from `styles.css` / `routing.css` / `translation.css` / `auth.css` /
`themes.css` / `social.css` and cross-checks every `className=` in `src/*.jsx`, boundary-anchored
so `.finalHomeBannerXX` cannot satisfy a lookup for `finalHomeBanner`, with an allowlist for
template-literal fragments and intentionally unstyled page-scope markers.

### CI

`.github/workflows/ci.yml` runs `npm run validate` then `npm run build` on every push and PR. A
second job, **translation-tamper-probe**, deliberately corrupts a string in
`src/content/translations.js` and asserts `validate:translation` *fails* — and fails for the right
reason (`filler_phrase|template` in the log). **A green tamper probe means the translation gate is
broken**, not that the code is fine. If you change the wording the probe anchors on, update the
probe; it throws `tamper anchor tidak ditemukan` rather than silently passing.

### Database and generator scripts

All DB scripts read `DATABASE_URL` from the ambient environment and hit Neon directly — there is
no dotenv loader, so export it first.

```bash
node scripts/run-migration.mjs scripts/001_init.sql   # apply a migration (README: use DATABASE_URL_UNPOOLED)
node scripts/verify-schema.mjs                        # dump columns + constraints
node scripts/verify-consistency.mjs                   # total_xp vs level+final xp sums; must print []
node scripts/backup-db.mjs out.json                   # dump 4 tables to JSON
node scripts/e2e-make-token.mjs [email]               # mint a magic token for /api/auth/verify?token=
node scripts/smoke-social.mjs                         # in-process E2E of the social APIs against prod Neon
node scripts/cleanup-e2e-test.mjs                     # delete the e2e-smoke-test user
node scripts/gen-furigana.mjs                         # regenerate src/furigana.generated.js (bracket notation only)
node scripts/gen-characters.mjs                       # regenerate the 36 character SVGs (deterministic, byte-identical)
node scripts/regen-glossary-romaji.mjs --write        # rewrite every glossary romaji field from its reading
```

`smoke-social.mjs` imports the Vercel handlers and calls them **in-process against the production
database**, creating and then deleting two `@kaigokitty.internal` users. It is the closest thing to
an integration test here; it is also a live write to prod.

Migrations are idempotent and additive (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, a
`DO` block that swallows `duplicate_object`). But `run-migration.mjs` strips `BEGIN`/`COMMIT` and
splits on `;` (respecting dollar-quoted blocks) because the Neon HTTP driver auto-commits per
statement — so a migration applied this way is **not atomic**, and a mid-file failure leaves
partial state. `.smoke/mig008.log` is a real example: three statements failed, the next two
"succeeded", and the file had to be re-run. Verify with `pg_get_constraintdef()`, do not trust the
script's own "OK". `scripts/drop-legacy.mjs` DROPs core tables CASCADE — destructive, never run it
casually.

## Architecture

Vite + React SPA (`src/`) plus Vercel Functions (`api/`, ESM `.mjs`), deployed to Vercel with all
routes rewritten to `index.html` (`vercel.json`; Vercel matches `api/` before the rewrite).
Persistence is Neon Postgres via `@neondatabase/serverless`. Production: `https://kaigo.wyna.dev`.

**Vercel needs one file per API path.** `api/final/local-merge.mjs` exists as its own file for that
reason; shared logic between it and `api/final.mjs` lives in `api/_final.mjs`. Underscore-prefixed
modules in `api/` are helpers, not routes.

### Content is generated, not authored

The least obvious thing here. `src/data.js` builds all 13 sections and their 152 levels **at import
time** from a compact `plans` array (title, level count, icon, topic list) crossed with
`qTemplates`; `src/content/final/index.js` does the same for the mock exam (6 years x 125
questions). Randomness is a seeded FNV-1a + mulberry32 PRNG, never `Math.random()`, so the tree is
byte-identical in the browser, on the server, and across builds — which is what lets
`api/final.mjs` reconstruct the answer key server-side instead of trusting the client. Questions
carry `correctIndex` (0-based into `choices`), **not** an `answer` field; the exam uses `answer`
with `'1'`..`'5'` keys.

Answer keys used to be constant (every level quiz resolved to the person-centered-care option,
every exam question to `'1'`). They are now distributed: level quizzes run 18.7–21.1% across the
five positions over 760 questions, the exam 18.4–22.3% over 750. If you touch a template, re-check
that distribution — a careless edit collapses it back to constant without failing any build.

Only three things are hand-written and set the quality bar: `src/content/s1l1.json` (Indonesian, 10
cards, its `_comment` calls itself the density benchmark), `src/content/s1l1-ja.json` (the Japanese
overlay), and `src/content/glossary.json` (133 terms). `Materi` in `main.jsx` special-cases
section 1 / level 1 to load the first two and merge them via `mergeJapaneseCard()`. **Editing
generated Japanese means editing a template, which changes hundreds of levels at once — identify
which layer you are in first.**

`npm run build` runs `scripts/build-glossary-index.mjs`, which counts term occurrences and writes
the committed `glossary.index.json` the app imports. That script prefers scanning a
`src/content/sections/` directory which **does not exist**, so it always falls back to counting
substrings in `src/data.js`.

### Three-mode language switch

Every text surface renders through `Furigana` in `src/Furigana.jsx` with mode `kanji` / `furigana`
/ `id`. **It is the only component allowed to emit ruby** — a raw `<ruby>` anywhere else is a bug.
Readings use bracket notation `尊厳[そんげん]`, parsed by `parseRuby()` (`RUBY_RE`) into
`<ruby class="fg-ruby"><span class="fg-rb">base</span><rt class="fg-rt">reading</rt></ruby>`.
Layout is flex `column-reverse` (`src/routing.css`), not the browser's ruby engine, so readings
cannot overlap and Safari matches Chrome.

Three things are load-bearing; `validate:furigana` catches regressions:
- `annotate()` runs in **kanji mode too**, so the `<ruby>` element always exists and only the
  reading is suppressed. It used to be `visibility:hidden` (identical line height across a
  漢字 ⇄ ふり toggle); it is now `display:none` — a deliberate user decision for a tighter kanji
  mode (79px vs 87.8px), accepting that toggling shifts text ~9px per line. The trade-off is
  written out in the CSS comment above the rule. **Do not flip it back without asking the user.**
- `flex-direction:column-reverse` puts `.fg-rb` first in DOM order (correct for copy-paste and
  screen readers) while painting the reading above.
- `RUBY_RE` requires a **kanji** base and a **pure-kana** reading. Do not loosen it to accept
  digits or kanji readings — a leaking annotation is a content bug, fix it in the content.

The same `RUBY_RE` is duplicated in `src/lib/tts.js` and `scripts/audit-translation-quality.mjs`.
TTS speaks `toKana(annotated)`, never the kanji: 行 can be い/おこな/ぎょう/こう and the engine
guesses wrong, but the bracket reading is authoritative.

Verification is two independent gates: `scripts/validate-ruby.mjs` (static — HTML ruby tags in
data, non-kana bracket contents like `拭[拭]`, non-kanji base like `1[ひと]つ`; all three render the
bracket literally on screen because there is no `dangerouslySetInnerHTML` to fall back on) and
`scripts/qa/verify-furigana-headless.mjs` (layer 1 postcss analysis; `--measure` drives installed
Chrome/Edge over CDP and measures real glyph boxes at 320/360/402/444/768/1280/1920 — 402 is
iPhone 17, 444 is Poco F6). `SAMPLES` there is audit-derived, not hand-picked, and measures inside
the real `.termSheet h2` / `.japaneseTerm` containers because a synthetic `<div>` understates the
problem (333.6px vs 421.3px for the same token). `scripts/qa/verify-furigana.js` is the manual
console counterpart; real iOS Safari on hardware is the one thing no script covers.

**Romaji is never hand-typed.** It is derived from `reading` via `kanaToRomaji()` in
`src/lib/kana.js`; the v8 audit found `shicchoushou` where Hepburn wants `shitchoushou`.
`validate:romaji` is the gate, `--write` is the fix.

### Auth gate: guest mode is gone

`RequireAuth` (an `<Outlet/>` wrapper in `main.jsx`) gates every learning route. Only `/` (landing)
and `/login` are open; anything else redirects to `/login?next=<path>`, and the magic link carries
`next` through `/api/auth/verify` so the user lands where they started (the redirect target is
sanitized against `//` and backslash open-redirects).

Consequence for reading the code: the guest branches in `ProgressContext.submitAttempt` and in
`useSectionUnlockMap()` are **unreachable in the product** — nobody can reach a quiz while logged
out. They are kept for the pre-gate localStorage that `mergeGuestIntoAccount()` still lifts on
first authenticated load. Do not "fix" a guest-path bug as if users hit it, and do not delete the
merge path as if it were dead.

### Auth and progress

Magic-link only, no passwords, no OAuth. `POST /api/auth/magic-link` stores a SHA-256 token hash
with a 20-minute expiry and mails the link via nodemailer; `GET /api/auth/verify` validates,
upserts the user, marks the token used (single-use), and sets an HttpOnly/Secure/SameSite=Lax
`kaigo_session` cookie valid 30 days. Only hashes are stored — tokens, sessions, and IPs.
`requireUser()` in `api/_auth.mjs` gates every protected handler and slides `last_seen_at`;
`api/_db.mjs` deliberately performs no DDL at runtime.

`AuthContext` (session) wraps `ProgressContext` (progress), and that order matters. Guest merge is
keyed by a persistent `clientId` recorded in `progress_merges` for idempotency.

`POST /api/progress` recomputes the score server-side from `correctCount`/`totalCount` and rejects
a client score off by more than 1. Idempotency is per-`attemptId`: the full response JSON is cached
in `level_attempts` and replayed verbatim, so the client must send a fresh UUID per attempt
(`Quiz` and `FinalQuiz` both generate one in `useState`, with a `getRandomValues` fallback for
browsers without `crypto.randomUUID`).

### The XP invariant

`total_xp` is **always recomputed**, never incremented, via `recomputeAllXp()` in `api/_auth.mjs`:

```
total_xp = SUM(level_progress.xp_earned) + SUM(final_progress.xp_earned)
```

Every path that awards XP must recompute through that one function. This is the rule most easily
broken by a well-meaning edit, and three parts of the codebase exist only to protect it:
- `final_progress` joined the sum when the exam was wired. Omitting it makes a user's total *drop*
  on their next level submit.
- Achievements store an `xp_reward` column but **deliberately never pay it** — injecting XP from
  outside the two tables breaks the invariant.
- `/api/final/local-merge` writes `xp_earned = 0`: lifted offline/legacy exam data never earns
  retroactive XP.

`scripts/verify-consistency.mjs` asserts it and must print `[]`.

### Preview-vs-official unlocking

The core progression rule: **nothing is ever blocked.** Every section and level is openable and
playable. Prerequisites only decide whether an attempt *counts*.

- Level prerequisite: previous level in the section is `completed` (level 1 always qualifies).
- Section prerequisite: previous section is >=80% complete.
- Both met → official attempt. Pass is `score >= 60`; XP is `10 + accuracy bonus + first-try
  bonus`; a replay of an already-completed level earns 20% (min 2). Completion drives streak,
  `daily_activity`, achievement evaluation, and character unlocks.
- Not met → **preview attempt**: `status = 'preview_attempt'`, flat 3 XP, written to separate
  `preview_*` columns so official stats stay clean, unlocks nothing. The response carries
  `isPreview: true` and the UI shows a preview banner and pill.

The 80% gate is integer math — `completed * 5 >= total * 4`, never a rounded percentage, so a
100%-complete section always passes its own gate regardless of level count.

### Constants duplicated across files — change one, change all

`validate:sections` catches a *size* divergence but no logic or list divergence. The rest is on you.

| Concept | Sites that must agree |
| --- | --- |
| Levels per section | `src/data.js` (`plans`), `api/_sections.mjs` (`SECTION_LEVELS`), `scripts/005_*.sql` CHECK |
| 80% gate logic | `api/progress.mjs` (authoritative), `buildSectionsMap()` in the same file, `useSectionUnlockMap()` in `main.jsx` |
| Character list + unlock rules | `api/_characters.mjs`, `src/lib/social.jsx` (`CHARACTER_IDS`, `CHARACTERS`), `scripts/008_characters.sql` CHECK |
| Themes / avatars / genders / visibility | `api/profile.mjs` (server validation), `src/lib/social.jsx`, `scripts/006`+`007` CHECKs |
| Achievement IDs | `api/_achievements.mjs` (rules + `CLIENT_REPORTABLE`), seed rows in `scripts/007_social_features.sql` |
| Bracket ruby regex | `src/Furigana.jsx`, `src/lib/tts.js`, `scripts/audit-translation-quality.mjs`, `scripts/validate-ruby.mjs` |

`api/_sections.mjs` intentionally does **not** import `src/data.js`: that file builds the whole
~1.4 MB content tree at import time, and a Vercel cold start needs only 13 numbers.

### Character system

Six original characters (`momo`, `kurumi`, `sora`, `kinako`, `nagi`, `beni`) generated as 36
deterministic SVGs into `public/assets/characters/` by `scripts/gen-characters.mjs`. **The Sanrio
mascots are gone** — `public/assets/hellokitty/` no longer exists and `MASCOT_MAP` was removed;
`api/profile.mjs` still validates a legacy `AVATAR_KEYS` list naming those files, but `Avatar` in
`src/lib/social.jsx` renders the character SVG and ignores `avatarKey`. Do not reintroduce
third-party IP into the product.

The active character is applied to `<html data-char>` by `ThemeApply`, which also sets the
`--btn-*` custom properties; `useCharExpr()` watches that attribute with a `MutationObserver` so
expression swaps (result screens, toasts) follow the current character. `nagi` and `beni` show as
"coming soon" with **no unlock path and no lock icon** — a deliberate design choice against locks
that never open; the server refuses to set them unless already present in `characters_unlocked`.
Unlocks are granted in `api/progress.mjs` from `LEVEL_UNLOCKS`, whose thresholds must stay
ascending because the grant loop stops at the first unmet condition.

### Social layer and final exam — both wired

Older notes in this repo (including `docs/v8/STATUS-INTEGRASI.md`, which describes the state at
pack-integration time, not HEAD) call these "provisioned but unwired". That is no longer true:

- `api/profile.mjs`, `api/friends.mjs`, `api/leaderboard.mjs`, `api/achievements.mjs` back
  `src/Social.jsx` (`FriendsPage`, `LeaderboardPage`, `AchievementsPage`, `OnboardingWizard`,
  `ProfileEditor`). Friendships are one row per direction; an accepted friendship is a **pair** of
  rows. All actions address users by public `handle`, never internal UUID. Handles are lowercase
  4–14 chars, unique, changeable once per 7 days — enforced server-side via `handle_changed_at`,
  with the first set free. The leaderboard is weekly XP from `daily_activity` since Monday 00:00
  Asia/Tokyo, with a deterministic tiebreak (xp → streak → created_at → id) because plain
  `ORDER BY xp` makes equal-XP ranks jump on refresh and reads as a bug.
- `api/final.mjs` + `api/final/local-merge.mjs` back `FinalTest.jsx`, which is now server-first:
  answers are sent raw, the server recomputes `correct` against the deterministic question bank,
  and `final_progress` / `final_attempts` / `pref_final_mode` are all in use. localStorage
  (`kk_final_progress`) is now an offline fallback marked `saved:false` and replayed through
  `local-merge` (idempotent upsert with `GREATEST`, never bumps `attempts`). All years and parts
  remain open from the start — the exam does not use the preview/official system.
- Achievements have two paths: `evaluateAchievements()` (pure server stats, idempotent, called
  after official completion, profile PATCH, and friend accept) and `reportClientAchievements()`
  (a whitelist for sources the server cannot fully verify — glossary, unlimited practice; IDs
  outside `CLIENT_REPORTABLE` are rejected silently). Unlock count drives an avatar frame tier.

Fourteen tables now exist: `app_users`, `app_sessions`, `magic_tokens`, `level_progress`,
`daily_activity`, `question_attempts`, `level_attempts`, `progress_merges`, `final_progress`,
`final_attempts`, `friendships`, `achievements`, `user_achievements`, `leaderboard_seen`.
Migrations `001`–`008` are applied.

Note on `005_section_level_ranges.sql`: the explicit `section_id BETWEEN 1 AND 13` is what makes
the CHECK real — without it an out-of-range array subscript yields NULL, and a CHECK evaluating to
NULL is treated as *satisfied*.

## Previously known bugs — both fixed

Kept as history because the fixes are load-bearing and easy to undo by accident.

**1. Generated furigana rendered as literal HTML source.** `scripts/gen-furigana.mjs` used to emit
`<ruby>…<rt>…</rt></ruby>`, which the bracket parser cannot read, so tag text appeared verbatim in
ふり mode. The generator now emits bracket notation; `src/furigana.generated.js` holds 2314 entries
with zero HTML tags (the only `<ruby>` string left is the comment warning you not to reintroduce
them). Fixed at the generator, **not** by adding `innerHTML` — there is still no
`dangerouslySetInnerHTML` anywhere, which is why `validate:ruby` is a permanent gate.

**2. `LEVELS_PER_SECTION = 17`.** The constant is gone. It was hardcoded to 17 when only section 11
has 17 levels, so 11 of 13 sections could never pass their 80% gate. `api/_sections.mjs` is now the
single server-side source of truth, and `useSectionUnlockMap()` mirrors its integer expression —
verified in agreement across all 61,836 progression states.

## Conventions

Code is written in an extremely dense style: single-line components, chained ternaries in JSX,
minimal whitespace, near-zero destructuring. `main.jsx` holds ~20 components in ~640 lines. Match
it — do not reformat existing lines while editing nearby code, as it destroys the diff.

Comments and all user-facing copy are Indonesian; identifiers are English; content is Japanese. UI
is mobile-first and kawaii. CSS is six hand-maintained plain files (`styles.css`, `routing.css`,
`translation.css`, `auth.css`, `themes.css`, `social.css`) with no preprocessor or utility
framework, also minified-dense.

Client-side keys: `kaigoKittyProgress`, `kaigoKittyClientId`, `kk_final_progress`, `kk_final_mode`,
`kk_final_merged`, `kk_lang_mode`, `kk_unlimited_count` (localStorage); `kk_materi_pos_<s>_<l>`,
`kk_glossary_state` (sessionStorage, for scroll/position restore). The `kaigoKitty*` names survive
the rebrand deliberately — renaming them would be a data migration, not a rename.

`docs/v7/` and `docs/v8/` are integration packs and their `STATUS-INTEGRASI.md` files record the
state **at the time each pack landed**. They go stale; HEAD is the source of truth.

## Secrets

`creds.txt` in the repo root holds a GitHub PAT, Vercel token, Neon API key, Cloudflare/R2,
Midtrans and Porkbun credentials. It is gitignored and has never been committed. Do not read it
into context, echo it, or move it into tracked files. The whole `.claude/` directory and `skills/`
are gitignored, as is `.smoke/` (scratch dir for smoke tests: tokens, headers, payloads).

Runtime secrets (`DATABASE_URL`, `SMTP_*`, `APP_URL`) come from Vercel env vars only; see README.md
for the full list. `.backup/` was accidentally committed once and has since been untracked — if it
reappears in `git status`, that is why.
