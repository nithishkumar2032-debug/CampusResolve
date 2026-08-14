# CampusResolve MVP handoff

**Deadline:** 15 August 2026, 6:00 PM IST  
**Branch:** `mvp-upgrade`  
**Live (pre-upgrade deploy may lag):** https://campusresolve-drab.vercel.app  
**GitHub:** https://github.com/nithishkumar2032-debug/CampusResolve

---

## 1. Summary of improvements

- Enforced server-side status workflow: Submitted → Under Review → Assigned → In Progress → Resolved → Closed
- Centralized SLA matrix (Emergency / High / Medium / Low) with deadline preview before assignment
- Unique tickets `CR-YYYY-####`, activity timeline, escalation records
- Public signup limited to **Student**; Admin can invite Warden/Worker
- Image evidence upload (JPEG/PNG/WebP) with auth-gated `/api/uploads`
- Idempotent demo seed (SEED_VERSION 3) covering 9 workflow scenarios
- Dashboard search/filters; overdue / escalated / emergency KPIs
- Demo Mode labeling on login/signup; passwords hidden when demo is off
- Transition unit checks via `scripts/check-transitions.ts`

## 2. Key files added / modified

| Area | Paths |
|------|--------|
| SLA / transitions | `src/lib/constants.ts`, `src/lib/complaints/deadlines.ts`, `src/lib/complaints/transitions.ts` |
| Store / seed | `src/lib/demo-store.ts`, `src/lib/seed.ts` |
| Actions | `src/lib/actions.ts` |
| Uploads | `src/app/api/uploads/[filename]/route.ts` |
| Dashboards | `src/app/{student,warden,worker,admin}/page.tsx` |
| Filters | `src/components/complaint-filters.tsx` |
| Assign preview | `src/components/assign-worker-form.tsx` |
| Auth UI | `src/app/login/page.tsx`, `src/app/signup/page.tsx` |
| Docs | `docs/MVP_HANDOFF.md`, `.env.example` |

## 3. Database migrations

Existing schema: `supabase/migrations/001_initial.sql`  
Runtime still uses the **demo file store** (`.data/store.json` locally, `/tmp` on Vercel) unless you wire Supabase. Run the SQL in the Supabase SQL editor when enabling durable storage.

## 4. Environment variables

See `.env.example`:

- `NEXT_PUBLIC_DEMO_MODE` (default true)
- `OPENAI_API_KEY` (optional; FAQ fallback works without it)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (optional durable DB)

## 5. Supabase setup (optional for durable production)

1. Create a Supabase project  
2. Run `supabase/migrations/001_initial.sql`  
3. Create a Storage bucket for evidence (private)  
4. Set env vars in Vercel  
5. **Note:** App code currently persists via demo-store; full Supabase repository adapter is the next production hardening step. Do not treat Vercel `/tmp` as permanent.

## 6. Demo accounts

Password for all: `demo1234`

| Role | Email |
|------|--------|
| Student | student@demo.edu |
| Warden | warden@demo.edu |
| Worker (Kumar) | worker@demo.edu |
| Worker 2 | worker2@demo.edu |
| Admin | admin@demo.edu |

## 7. Seed data

- Seed rebuilds when `SEED_VERSION` in `src/lib/constants.ts` changes  
- Force local reseed: delete `.data/store.json` (and restart `npm run dev`)  
- Includes: submitted, under review, assigned high, in progress, resolved awaiting verify, rejected/reopened, overdue escalated, emergency safety, closed

## 8. Tests executed

| Check | How |
|-------|-----|
| Transition rules | `npx tsx scripts/check-transitions.ts` |
| TypeScript / build | `npm run build` |
| Lint | `npm run lint` |

(No Jest/Vitest suite in package yet.)

## 9. Production build

**Succeeded** (`npm run build`, Next.js 16.3.0 / Turbopack):

- TypeScript: passed
- Routes generated for student / warden / worker / admin + uploads + AI APIs
- Lint: 0 errors (1 font warning in `layout.tsx`)
- Transition checks: `OK: transition rules passed`

## 10. Deployment

1. Merge / push `mvp-upgrade` to GitHub  
2. Vercel auto-deploys from main (or set branch)  
3. Confirm Demo Mode env if needed  
4. Smoke-test all four roles on the live URL

## 11. Known limitations

- **Persistence on Vercel:** demo store under `/tmp` resets on cold starts — not durable  
- Supabase schema ready; runtime adapter not fully switched  
- Email / WhatsApp notifications deferred  
- Upload auth is session-based; Storage CDN not used yet  
- Admin invite form does not show toast on success (page revalidates)

## 12. Demonstration script (≈10 minutes)

1. **Login (Student)** — `student@demo.edu` / `demo1234`  
2. Open dashboard KPIs; filter tickets; open a **Resolved** ticket → Accept or Reject with reason  
3. **New Complaint** — leave category/urgency on “Select…”, fill description, optional photo, submit → note `CR-…` ticket  
4. **Logout → Warden** — see Unassigned / Overdue / Emergency cards; open submitted ticket → Under Review → Assign Kumar with deadline preview  
5. **Logout → Worker** — Accept → In Progress → Resolve with notes + optional photo  
6. **Student** — verify resolution (Accept → Closed)  
7. **Admin** — view escalated/overdue queue, category breakdown, invite a staff account  
8. **Security** — as student, visit `/warden` (should redirect); as worker visit `/admin` (blocked)  
9. **Help Assistant** — ask “How do I submit a complaint?” without OpenAI key (FAQ fallback)

## Local commands

```bash
npm install
npm run dev
# Force reseed
Remove-Item .data\store.json -ErrorAction SilentlyContinue
npx tsx scripts/check-transitions.ts
npm run build
npm run lint
```
