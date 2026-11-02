# English for me

A personal, roadmap-based English learning app: build a learning roadmap, get reminded at study time, check off lessons, and get AI coaching on your progress. UI is bilingual (🇻🇳 Vietnamese / 🇬🇧 English) with a one-click toggle.

## Stack

- **Next.js 16** (App Router, Cache Components, `proxy.ts`) + TypeScript + Tailwind CSS v4
- **Supabase** – Postgres + Auth (email + password)
- **Drizzle ORM** – schema & migrations
- i18n via `app/[lang]` routes + JSON dictionaries (`src/i18n`)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run db:generate          # create SQL migration from src/db/schema.ts
npm run db:migrate           # apply it to Supabase
# then run supabase/policies.sql, then supabase/02_link_auth_users.sql in the Supabase SQL Editor
npm run dev                  # http://localhost:3000
```

### Supabase setup

1. **Project Settings → API**: copy the URL and the *publishable* key into `.env.local`.
2. **Connect → ORMs**: copy the transaction-pooler (6543) URL into `DATABASE_URL` and the session-pooler (5432) URL into `DATABASE_URL_DIRECT`.
3. **Authentication → URL Configuration**: set *Site URL* to `http://localhost:3000` and add `http://localhost:3000/auth/callback` (and your production URL) to *Redirect URLs*.

## Project structure

```
src/
  app/
    [lang]/              # every page lives under /vi or /en
      layout.tsx         # root layout (html lang, fonts)
      page.tsx           # landing page
      login/ signup/      # email + password auth (server actions)
      forgot-password/ reset-password/  # password reset flow
      dashboard/         # protected page (session streamed behind Suspense)
    auth/callback/       # exchanges the magic-link code for a session
  components/            # SiteHeader, LanguageToggle
  db/schema.ts           # Drizzle schema (users, roadmaps, phases, lessons, progress, schedules, notifications, ai_insights)
  i18n/                  # locales config + vi/en dictionaries
  lib/supabase/          # server / browser / proxy clients
  proxy.ts               # locale redirect + Supabase session refresh
supabase/policies.sql    # auth → users trigger + Row Level Security
```

## Roadmap

- [x] Phase 0 – setup, auth, bilingual UI, DB schema
- [x] Phase 1 – roadmap / phase / lesson CRUD + drag & drop
- [x] Phase 2 – lesson check-off, progress, streak
- [ ] Phase 3 – scheduling + push/email reminders
- [ ] Phase 4 – progress dashboard & charts
- [ ] Phase 5–6 – AI progress coach
