# Kaigo Kitty

Mobile-first Japanese 介護福祉士 learning app.

## Current production auth

- Magic-link email sign-in via Vercel Functions.
- Neon Postgres stores users, magic tokens, sessions, and level progress.
- Guest learning remains available locally; account sync is the production path.
- Google OAuth is intentionally left as the next provider after magic-link verification.

## Required Vercel environment variables

```text
DATABASE_URL=postgresql://...
APP_URL=https://kaigo-kitty.vercel.app
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=Kaigo Kitty <your-email@example.com>
```

Never commit `.env` or secret values.

## Local

```bash
npm install
npm run build
npm run dev
```

## Routes

- `/`
- `/login`
- `/profile`
- `/glossary`
- `/section/:sectionId`
- `/section/:sectionId/level/:levelId`
- `/section/:sectionId/level/:levelId/materi`
- `/section/:sectionId/level/:levelId/quiz`
- `/section/:sectionId/level/:levelId/result`
- `/section/:sectionId/recap`
