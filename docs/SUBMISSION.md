# Submission package

## Live demo (local)

```bash
npm install
npm run dev
```

URL: http://localhost:3000

## Demo accounts

| Role | Email | Password |
|------|--------|----------|
| Student | student@demo.edu | demo1234 |
| Warden | warden@demo.edu | demo1234 |
| Worker | worker@demo.edu | demo1234 |
| Admin | admin@demo.edu | demo1234 |

## Deploy to Vercel + GitHub

1. Create a GitHub repository and push this project:
   ```bash
   git remote add origin https://github.com/<you>/CampusResolve.git
   git branch -M main
   git push -u origin main
   ```
2. In [vercel.com](https://vercel.com): Import the GitHub repo → Framework Next.js → Deploy
3. Optional env vars: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. For production database: run `supabase/migrations/001_initial.sql` in Supabase SQL editor

## Screenshots to capture

- Login with demo chips
- Student new complaint + ticket detail timeline
- Warden assign screen
- Worker resolve screen
- Admin escalations
- Help Assistant chat open
