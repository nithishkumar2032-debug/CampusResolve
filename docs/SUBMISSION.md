# Submission package

## Live URL (production)

**https://campusresolve-drab.vercel.app**

Inspect: https://vercel.com/nithishkumar2032-debugs-projects/campusresolve

## GitHub

https://github.com/nithishkumar2032-debug/CampusResolve

## Install as app on phone (PWA)

1. Open https://campusresolve-drab.vercel.app in Chrome (Android) or Safari (iPhone)
2. Menu → **Add to Home Screen** / **Install app**
3. Launch CampusResolve from the home-screen icon

## Demo accounts

Password for all: `demo1234`

| Role | Email |
|------|--------|
| Student | student@demo.edu |
| Warden | warden@demo.edu |
| Worker | worker@demo.edu |
| Admin | admin@demo.edu |

Full MVP handoff (workflows, env, limitations, demo script): [`docs/MVP_HANDOFF.md`](./MVP_HANDOFF.md)

## Local demo

```bash
npm install
npm run dev
```

URL: http://localhost:3000

Force reseed after seed changes: delete `.data/store.json` then restart.

## Downloadable source ZIP

`C:\Users\nithi\Downloads\CampusResolve-App.zip`

## Screenshots to capture

- Login with Demo Mode label
- Student new complaint + ticket detail timeline
- Warden assign screen with deadline preview
- Worker resolve screen
- Admin escalations + invite staff
- Help Assistant chat open

## Notes

- Demo mode (no Supabase env required) — Vercel `/tmp` store may reset on cold starts
- Optional later: `OPENAI_API_KEY`, Supabase keys for cloud AI / persistent DB
- Branch with MVP upgrades: `mvp-upgrade` (merge/redeploy for latest)