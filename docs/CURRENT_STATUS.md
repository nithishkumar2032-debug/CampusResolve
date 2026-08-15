# CampusResolve — Current Application Status

**Document date:** 14 August 2026  
**Branch:** `production-upgrade`  
**Overall status:** **Production upgrade in progress on branch** — Supabase Auth/data layer, PWA hardening, demo removal. Requires Supabase env + migrations before live persistence is verified.

## Links

| Resource | URL |
|----------|-----|
| Production (previous MVP deploy) | https://campusresolve-drab.vercel.app |
| GitHub | https://github.com/nithishkumar2032-debug/CampusResolve |
| Deployment guide | [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) |
| Production handoff | [`docs/PRODUCTION_HANDOFF.md`](./PRODUCTION_HANDOFF.md) |

## What changed in this upgrade

- Replaced demo file store with Supabase repositories + SQL RPCs for transitions
- Replaced `cr_session` with Supabase SSR authentication
- Private Storage for evidence; signed URL viewing
- Removed Demo Mode / demo accounts from UI
- Admin invite with toast + aria-live feedback
- Safer PWA service worker (no private data caching)
- Offline page, App Router manifest, install prompt
- Forgot/reset password flows
- Vitest unit tests + Playwright smoke tests + GitHub Actions CI

## Required before declaring complete

1. Apply `001` + `002` migrations on your Supabase project  
2. Set Vercel + local env vars  
3. Bootstrap first Admin  
4. Pass persistence checklist in `DEPLOYMENT.md`  
5. Preview deploy smoke test, then production  

## Known limitations until env is configured

- Local/production app cannot persist data without Supabase credentials  
- Authenticated E2E scenarios skip unless `E2E_STUDENT_*` secrets exist  
