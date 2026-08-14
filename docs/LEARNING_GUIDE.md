# CampusResolve — Learning & Development Guide

This document explains **what was built**, **why each piece exists**, and **how it runs**, in plain language. It is meant for someone new to full-stack web development.

---

## 1. Scaffold and build — what do those words mean?

### Scaffold (set up the empty house)

**Scaffold** means creating the **starter project structure** so you are not inventing folders and config from scratch.

When we ran tools like `create-next-app` and `shadcn init`, they generated:

- A Next.js app folder layout (`src/app`, `package.json`, etc.)
- TypeScript + Tailwind setup
- Basic UI building blocks (buttons, cards, inputs)

Think of scaffolding as: **empty rooms + wiring + doors**, before you put in furniture (your CampusResolve features).

### Build (compile for production)

**Build** means turning your source code into an optimized version the server can run in production.

```bash
npm run build
```

Next.js:

1. Checks TypeScript for errors  
2. Bundles pages and APIs  
3. Outputs a production-ready app  

**Dev mode** (`npm run dev`) is for coding and testing locally.  
**Build** (`npm run build`) is what Vercel uses before going live.

| Command | Purpose |
|---------|---------|
| `npm install` | Download libraries listed in `package.json` |
| `npm run dev` | Run the app locally (http://localhost:3000) |
| `npm run build` | Compile a production version |
| `npm start` | Run the production build locally |

---

## 2. What is this application for? (theory)

### The real-world problem

Hostel complaints (plumbing, electricity, Wi‑Fi, safety) are often reported by phone, WhatsApp, or paper registers. That causes:

- No unique ticket number  
- Unclear who owns the work  
- No status history  
- Missed deadlines with no escalation  

### What CampusResolve does

CampusResolve is a **ticket workflow app** with four roles:

| Role | Job in the system |
|------|-------------------|
| **Student** | Submit complaint, track it, accept/reject the fix |
| **Warden** | Review, prioritize, assign a worker + deadlines |
| **Worker** | Accept task, update progress, mark resolved |
| **Admin** | See escalated/overdue/emergency cases, reassign |

### Status sequence (core concept)

```
Submitted → Under Review → Assigned → In Progress → Resolved → Closed
```

- **Resolved** = worker says the job is done  
- **Closed** = student (or staff) confirms it is actually fixed  
- If the student **rejects**, the ticket reopens and can be **escalated**

That workflow is the heart of the product. Everything else (UI, storage, AI helper) supports it.

---

## 3. How the stack fits together

```
Browser (UI)
    │
    ▼
Next.js app (pages + Server Actions + API routes)
    │
    ├── Demo store (.data/store.json)   ← used today without cloud DB
    ├── Supabase (Auth/DB/Storage)      ← ready when you connect keys
    └── LangChain / OpenAI              ← optional Help Assistant brain
```

| Technology | Role in CampusResolve |
|------------|------------------------|
| **Next.js** | Full web app framework (pages + server logic in one project) |
| **React** | UI components (forms, dashboards, buttons) |
| **TypeScript** | JavaScript with types — catches mistakes earlier |
| **Tailwind CSS** | Utility CSS classes for layout and styling |
| **ShadCN/UI** | Ready-made accessible UI components (Button, Card, Input…) |
| **Supabase** | Cloud Auth + Postgres database + file storage (for production) |
| **LangChain** | Helps call an AI model in a structured way |
| **Vercel** | Hosts the Next.js app on the internet |
| **Git / GitHub** | Version history + remote backup of code |

---

## 4. Dependencies we installed — purpose of each

Dependencies live in `package.json`. `npm install` downloads them into `node_modules/`.

### Core app

| Package | Why it is there |
|---------|-----------------|
| `next` | The framework that runs pages, routing, and server code |
| `react` / `react-dom` | Library that builds interactive UI |
| `typescript` | Type-checking for safer code |

### UI

| Package | Why it is there |
|---------|-----------------|
| `tailwindcss` | Styling system |
| `lucide-react` | Icons (chat bubble, send, etc.) |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Combine CSS classes cleanly (used by ShadCN) |
| `sonner` | Toast notifications |
| `@base-ui/react` | Low-level UI primitives used by current ShadCN buttons/dialogs |

### Data & backend helpers

| Package | Why it is there |
|---------|-----------------|
| `@supabase/supabase-js` | Talk to Supabase from JS |
| `@supabase/ssr` | Supabase helpers that work with Next.js cookies/SSR |
| `date-fns` | Format dates and compute deadlines |
| `zod` | Validate shapes of data (useful with AI JSON / forms) |

### AI

| Package | Why it is there |
|---------|-----------------|
| `langchain` | Orchestration helpers for AI workflows |
| `@langchain/openai` | Connect LangChain to OpenAI chat models |
| `@langchain/core` | Shared message types (`SystemMessage`, `HumanMessage`) |

**Important:** Installing LangChain does **not** mean AI is always “on.” Without an API key, the app uses built-in FAQ/heuristic answers instead.

---

## 5. How the application works (execution flow)

### 5.1 Starting the app

1. You run `npm run dev`  
2. Next.js starts a local server on port **3000**  
3. Browser opens `/login`  
4. Middleware checks for a session cookie named `cr_session`  

Relevant file: `src/middleware.ts`

- No cookie + private page → redirect to `/login`  
- Has cookie + `/login` → redirect to home (then role home)

### 5.2 Login (demo mode)

1. User submits email + password on `/login`  
2. Server Action `loginAction` runs (`src/lib/actions.ts`)  
3. It looks up the user in the demo store (`src/lib/demo-store.ts`)  
4. If password matches, it sets cookie `cr_session = user id`  
5. Redirects by role:
   - student → `/student`
   - warden → `/warden`
   - worker → `/worker`
   - admin → `/admin`

Demo accounts (password `demo1234`):

- `student@demo.edu`
- `warden@demo.edu`
- `worker@demo.edu`
- `admin@demo.edu`

### 5.3 Creating a complaint (student)

1. Student opens `/student/new`  
2. Fills location, description, category, urgency  
3. Optional: clicks **AI suggest** → browser calls `POST /api/ai/suggest`  
4. Submit runs `createComplaintAction`  
5. Store creates a ticket like `CR-2026-0002`  
6. Writes a first activity event: “Complaint registered”  
7. Redirects to ticket detail page  

### 5.4 Warden assign → Worker resolve → Student verify

| Step | Who | What happens in code |
|------|-----|----------------------|
| Review | Warden | `reviewAction` → status `under_review` |
| Assign | Warden | `assignAction` → status `assigned`, sets worker + deadlines |
| Accept | Worker | `acceptAction` → `in_progress` |
| Resolve | Worker | `resolveAction` → `resolved` + notes |
| Accept fix | Student | `verifyAction(accept)` → `closed` |
| Reject fix | Student | `verifyAction(reject)` → reopen + `is_escalated = true` |

Every transition appends a row to `complaint_events` (the timeline).

### 5.5 Escalation (automatic flags)

On each store read, the app checks deadlines:

- Missed **response** deadline while still unassigned → escalate  
- Missed **resolution** deadline while in progress → escalate  
- Emergency / safety → escalate early  
- Student rejection → escalate  

Admin dashboard lists escalated / emergency tickets.

---

## 6. Floating Help Assistant + category/urgency suggest

### What you see

- A **chat bubble** (bottom-right) on authenticated pages  
- Component: `src/components/help-assistant.tsx`  
- It calls API: `POST /api/ai/help` → `src/lib/ai/help.ts`

On the new-complaint form, **AI suggest category & urgency** calls:

- `POST /api/ai/suggest` → same `src/lib/ai/help.ts`

### How it executes **with** an API key

```
User question
   → /api/ai/help
   → LangChain ChatOpenAI (needs OPENAI_API_KEY)
   → Model answer based on CampusResolve system prompt
   → Shown in chat
```

The system prompt tells the AI about roles, statuses, and routes so answers stay on-topic (navigation, drafting complaint text, explaining statuses).

### How it executes **without** an API key (FAQ / heuristic)

This is the mode you have today unless you add a key.

**Help chat (FAQ fallback):**

1. No `OPENAI_API_KEY` found  
2. `askHelpAssistant` calls `faqFallbackAnswer()`  
3. Matches keywords in your question against a short built-in FAQ list in `src/lib/constants.ts`  
4. Returns a pre-written answer  

Example: asking “how do I submit” matches the FAQ about submitting a complaint.

**Category/urgency suggest (heuristic):**

1. No API key (or AI call fails)  
2. `heuristicSuggest()` scans the description with simple keyword rules  

Examples:

- words like `leak`, `tap`, `pipe` → category `plumbing`  
- words like `fire`, `danger`, `urgent` → urgency `emergency`  

So the feature still works offline for demos. AI is **assistive only** — submit never depends on it.

### Design rule (important)

> If AI is down, wrong, or unpaid, students must still file tickets.

That is why suggestions are optional buttons, not required steps.

---

## 7. Demo mode (`.data/store.json`) vs Supabase

### Demo mode (what runs today)

Because cloud Supabase credentials are optional, the MVP uses a **local JSON file database**:

- Path: `.data/store.json` (created automatically on first run)  
- Code: `src/lib/demo-store.ts`  
- Stores: profiles, complaints, events, attachments, ticket counter  

**Pros for learning / deadline:** works with `npm run dev` immediately, no cloud setup.  
**Limits:** data is on one machine; not multi-server production storage.

Cookie auth (`cr_session`) identifies who is logged in.

### Supabase (ready for production)

Supabase provides:

1. **Auth** — real user accounts  
2. **Postgres** — relational database  
3. **Storage** — photo uploads  
4. **RLS** — row-level security (who can see which rows)

#### What is a SQL migration?

A **migration** is a versioned SQL script that creates/updates database tables.

File: `supabase/migrations/001_initial.sql`

It defines:

- `profiles`  
- `complaints`  
- `complaint_events`  
- `attachments`  
- role enums / status enums  
- RLS policies  
- trigger to create a profile when a user signs up  

You run this once in the Supabase SQL Editor when you create a project.

#### What are Supabase clients?

- `src/lib/supabase/client.ts` — browser client  
- `src/lib/supabase/server.ts` — server client (cookie-aware)  

They need env vars:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Until those are set, the app stays in demo mode. The clients/schema are already written so you can connect later without redesigning the product.

---

## 8. What is an API key? (theory)

An **API key** is a secret password that proves *your app* is allowed to use *someone else’s service*.

Examples:

| Key | Service | What it unlocks |
|-----|---------|-----------------|
| `OPENAI_API_KEY` | OpenAI | Chat answers for Help Assistant / smarter suggestions |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Public client access (still limited by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Powerful admin access — **never put in the browser** |

### Why keys exist

Cloud services cost money and have limits. The key lets the provider bill/limit **your** project, not strangers.

### Where keys live in this project

1. Copy `.env.example` → `.env.local`  
2. Put secrets only in `.env.local`  
3. `.env*` is git-ignored so keys are **not** committed to GitHub  

```env
# .env.local (local only — do not commit)
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### `NEXT_PUBLIC_` means “visible in the browser”

- Variables starting with `NEXT_PUBLIC_` are embedded into frontend code  
- Safe only for keys designed to be public **and** protected by server rules (like Supabase anon + RLS)  
- Never prefix a secret admin key with `NEXT_PUBLIC_`

### Without keys, what still works?

| Feature | Without OpenAI key | Without Supabase keys |
|---------|--------------------|------------------------|
| Login / roles / tickets | Yes (demo store) | Yes (demo store) |
| Escalation flags | Yes | Yes |
| Help Assistant | FAQ fallback | FAQ fallback |
| Category suggest | Keyword heuristic | Keyword heuristic |
| Real cloud DB / Auth | N/A | No — use migration when ready |

---

## 9. Git, README, test checklist, submission notes

### Git commit (what we did)

**Git** records snapshots of your code.

We created an **initial commit** of the MVP so the project has version history:

- Message roughly: “Initial CampusResolve MVP…”  
- Branch: `master`  

This does **not** automatically put code on GitHub. GitHub is the remote website. To publish:

```bash
git remote add origin https://github.com/<your-username>/CampusResolve.git
git push -u origin main
```

Then connect that repo to **Vercel** for a public URL.

### README (`README.md`)

The project’s front door: how to install, demo accounts, workflow, env vars, deploy outline.

### Test checklist (`docs/TESTING.md`)

Step-by-step paths to verify before submission:

- Normal ticket lifecycle  
- Reject → escalate  
- Emergency flag  
- Overdue escalation  
- Help Assistant / suggest  

### Submission notes (`docs/SUBMISSION.md`)

What to prepare for the deadline: demo accounts, Vercel steps, screenshot list.

---

## 10. Map of important files (where to read code)

| File / folder | Concept |
|---------------|---------|
| `src/app/login/page.tsx` | Login UI |
| `src/app/student/*` | Student dashboard, form, ticket detail |
| `src/app/warden/*` | Warden queue + assign |
| `src/app/worker/*` | Worker tasks + resolve |
| `src/app/admin/*` | Escalations + reassign |
| `src/lib/actions.ts` | Server Actions (form submissions) |
| `src/lib/demo-store.ts` | Demo “database” + workflow rules |
| `src/lib/auth.ts` | Session cookie helpers |
| `src/lib/ai/help.ts` | FAQ / heuristic / LangChain logic |
| `src/components/help-assistant.tsx` | Floating chat UI |
| `src/middleware.ts` | Route protection |
| `supabase/migrations/001_initial.sql` | Production DB schema |
| `.data/store.json` | Live demo data (auto-created; git-ignored) |

---

## 11. Work completed so far (summary checklist)

### Done in the codebase

- [x] Next.js + TypeScript + Tailwind scaffold  
- [x] ShadCN UI components  
- [x] Login / signup + role-based dashboards  
- [x] Student create + track + verify tickets  
- [x] Warden review + assign + deadlines  
- [x] Worker accept + resolve  
- [x] Admin escalations + reassign  
- [x] Activity timeline on tickets  
- [x] Escalation flags (overdue / reject / emergency)  
- [x] Help Assistant (FAQ without key; LangChain with key)  
- [x] Category/urgency suggest (heuristic without key)  
- [x] Supabase migration + client stubs  
- [x] Demo persistence via `.data/store.json`  
- [x] README + TESTING + SUBMISSION docs  
- [x] Initial git commit  
- [x] Production `npm run build` succeeds  

### Still for you (submission / cloud)

- [ ] Create GitHub remote and push  
- [ ] Deploy on Vercel  
- [ ] (Optional) Create Supabase project + run SQL migration + set env vars  
- [ ] (Optional) Add `OPENAI_API_KEY` for richer AI answers  
- [ ] Capture screenshots for the submission package  

---

## 12. Mini glossary

| Term | Meaning |
|------|---------|
| **Scaffold** | Generate starter project structure |
| **Build** | Compile optimized production app |
| **Dependency** | External library your app needs |
| **Server Action** | Function that runs on the server when a form is submitted |
| **API route** | HTTP endpoint like `/api/ai/help` |
| **RLS** | Database rules controlling which rows a user can see |
| **Migration** | SQL script that creates/updates tables |
| **Demo mode** | Local JSON store instead of cloud DB |
| **API key** | Secret that authorizes use of a cloud service |
| **Escalation** | Flagging a ticket for higher attention |
| **MVP** | Minimum Viable Product — smallest complete useful version |

---

## 13. Suggested learning path (if you feel stuck)

1. Run the app → log in as each role → click through one full ticket.  
2. Read `src/lib/actions.ts` while you click — match buttons to functions.  
3. Open `.data/store.json` after creating a ticket — see data change.  
4. Ask the Help Assistant a question with **no** API key — see FAQ fallback.  
5. Only then add OpenAI / Supabase keys when you want cloud features.

If you want a follow-up doc, we can add a **line-by-line walkthrough** of one file (for example `demo-store.ts` or `help.ts`) next.
