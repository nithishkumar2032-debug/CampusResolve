# CampusResolve

College hostel complaint, maintenance request, and escalation management MVP.

**Live app:** https://campusresolve-drab.vercel.app  
**GitHub:** https://github.com/nithishkumar2032-debug/CampusResolve

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- ShadCN/UI
- Demo persistence (local `.data/store.json`) with Supabase schema ready
- LangChain Help Assistant + category/urgency suggest (FAQ fallback if no API key)
- Vercel-ready

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts (password: `demo1234`)

| Role | Email |
|------|--------|
| Student | student@demo.edu |
| Warden | warden@demo.edu |
| Worker | worker@demo.edu |
| Admin | admin@demo.edu |

## Workflow

1. Student submits a request → unique ticket `CR-YYYY-####`
2. Warden reviews → assigns worker → deadlines from urgency
3. Worker accepts → in progress → resolves with notes/evidence
4. Student accepts (closed) or rejects (reopen + escalate)
5. Admin sees escalated / emergency cases and can reassign

Statuses: Submitted → Under Review → Assigned → In Progress → Resolved → Closed

## Environment

Copy `.env.example` to `.env.local`:

```env
OPENAI_API_KEY=           # optional — enables LangChain answers
NEXT_PUBLIC_SUPABASE_URL= # optional — when wiring live Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Without `OPENAI_API_KEY`, the Help Assistant uses built-in FAQ answers and heuristic suggestions.

Without Supabase env vars, the app runs in **demo mode** (file store + cookie sessions).

### Supabase (production data)

1. Create a Supabase project
2. Run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) in the SQL editor
3. Set the env vars above
4. Create Storage bucket policies as needed for `evidence`

## Deploy (Vercel)

1. Push this repo to GitHub
2. Import the project in Vercel
3. Add env vars
4. Deploy

## Project layout

- `src/app/` — role dashboards and ticket pages
- `src/lib/demo-store.ts` — demo data + workflow transitions
- `src/lib/ai/help.ts` — LangChain help + suggest
- `src/components/help-assistant.tsx` — floating chat
- `supabase/migrations/` — Postgres schema + RLS

## Scope notes

- Email/WhatsApp notifications are out of MVP (dashboard escalation flags only)
- AI never blocks ticket submit
- Native mobile app is future work
