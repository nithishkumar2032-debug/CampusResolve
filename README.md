# CampusResolve

College hostel complaint, maintenance request, and escalation management — production web app with PWA install support.

**Live app:** https://campusresolve-drab.vercel.app  
**GitHub:** https://github.com/nithishkumar2032-debug/CampusResolve

## Stack

- Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + ShadCN/UI
- Supabase Auth (SSR cookies via `@supabase/ssr`) + Postgres + private Storage
- LangChain Help Assistant with FAQ fallback (no API key required)
- Vercel hosting + Progressive Web App (installable)

## Quick start

1. Create a Supabase project
2. Run SQL migrations in order:
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_production_runtime.sql`
3. Copy `.env.example` → `.env.local` and fill values (never commit secrets)
4. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Roles

| Role | How created |
|------|-------------|
| Student | Public `/signup` (always student) |
| Warden / Worker | Admin invite on `/admin` |
| Admin | Bootstrap via Supabase SQL / dashboard (see `docs/DEPLOYMENT.md`) |

## Workflow

Submitted → Under Review → Assigned → In Progress → Resolved → Closed

Student verification required before Closed. Rejection reopens and escalates.

## Scripts

```bash
npm run lint
npm run test          # unit + transition checks
npm run test:e2e      # Playwright smoke (needs env for auth flows)
npm run build
```

## Documentation

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Supabase, Storage, Admin bootstrap, Vercel
- [`docs/CURRENT_STATUS.md`](docs/CURRENT_STATUS.md) — current status
- [`docs/WORK_DONE.md`](docs/WORK_DONE.md) — work log
- [`docs/PRODUCTION_HANDOFF.md`](docs/PRODUCTION_HANDOFF.md) — production handoff

## PWA

Supported browsers can install CampusResolve (standalone window). Service worker caches only safe static assets and the offline shell — never auth tokens or private complaint APIs.
