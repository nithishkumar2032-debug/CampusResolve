# CampusResolve production deployment

## 1. Supabase project

1. Create a project at https://supabase.com
2. In **SQL Editor**, run:
   1. `supabase/migrations/001_initial.sql`
   2. `supabase/migrations/002_production_runtime.sql`
3. Confirm Storage bucket `complaint-evidence` exists (created by migration; private)
4. Authentication → URL configuration:
   - Site URL: your production URL (e.g. `https://campusresolve-drab.vercel.app`)
   - Redirect URLs: `https://YOUR_DOMAIN/login`, `https://YOUR_DOMAIN/reset-password`, `http://localhost:3000/login`, `http://localhost:3000/reset-password`

## 2. Environment variables

### Local (`.env.local`)

See `.env.example`. Required:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional: `OPENAI_API_KEY`

### Vercel

Project Settings → Environment Variables — set the same keys for Production and Preview.

### GitHub Actions secrets

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_STUDENT_EMAIL` / `E2E_STUDENT_PASSWORD` (test project only)

Never commit real keys. Never paste secrets into chat.

## 3. Bootstrap the first Admin

After your own Auth user exists (sign up as student once, or create via Supabase Auth dashboard):

```sql
update public.profiles
set role = 'admin', active = true, updated_at = now()
where email = 'YOUR_ADMIN_EMAIL@college.edu';
```

Prefer doing this only for the first institutional admin. Further staff use Admin invite.

## 4. Vercel deploy

1. Push `production-upgrade` (or merge to `master`)
2. Confirm env vars
3. Deploy Preview first; smoke-test login, signup, create complaint, upload, PWA manifest
4. Promote to Production

## 5. Persistence verification checklist

1. Register a new Student  
2. Create a complaint; note ticket id  
3. Refresh — ticket remains  
4. Log out / log in — ticket remains  
5. Other browser/profile — ticket remains  
6. Redeploy / cold start — ticket remains with history/evidence  

## 6. Rollback

1. Revert the GitHub deploy to the previous production deployment in Vercel  
2. Do **not** re-run destructive SQL  
3. If needed, redeploy the last known-good commit from `master`  

## 7. Backup

Use Supabase dashboard backups / PITR (plan-dependent). Export critical tables periodically for institutional archives.
