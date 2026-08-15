# CampusResolve — Production handoff

**Branch:** `production-upgrade`  
**Goal:** Permanent Supabase-backed app + PWA (no demo store)

## Architecture before → after

| Before | After |
|--------|--------|
| `cr_session` cookie + `demo-store` | Supabase Auth SSR cookies (`@supabase/ssr`) |
| `.data/store.json` / Vercel `/tmp` | Postgres via Supabase |
| Local `.data/uploads` | Private Storage bucket `complaint-evidence` |
| Demo accounts / Demo Mode | Real signup + Admin staff invite |
| Cache-all service worker | Static-only SW + offline shell |

## Migrations

1. `001_initial.sql` — base tables + trigger  
2. `002_production_runtime.sql` — ticket sequence, RPCs, RLS, escalations, audit_log, storage policies  

## Removed from production runtime

- `src/lib/demo-store.ts` (deleted)
- `src/lib/seed.ts` (deleted)
- `NEXT_PUBLIC_DEMO_MODE`
- Demo passwords / `@demo.edu` UI shortcuts

## Commands

```bash
npm install
npm run test:unit
npm run test:transitions
npm run lint
npm run build
npm run test:e2e
```

## Remaining limitations (honest)

- Full multi-role Playwright suite requires a **dedicated test Supabase project** and GitHub secrets
- Persistence verification against your live Supabase project must be run after you apply migrations and set env vars
- Complaint email/WhatsApp notifications remain out of scope
- Preview/production promotion still requires your Vercel project credentials

## Admin bootstrap

See `docs/DEPLOYMENT.md` §3.
