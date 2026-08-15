# Demo credentials

Shared password for all seeded `*.demo` / `*.student.cr` / `*.tech.cr` accounts below:

**`Hostel@2026`**

| Environment | Login URL |
| --- | --- |
| Production | https://campus-resolve-six.vercel.app/login |
| Local | http://localhost:3000/login |

Older docs that mention password `demo1234` or local JSON seed accounts are outdated for the Supabase production setup.

---

## Students (10)

Prefer these accounts over any older `student.demo@gmail.com` user.

| Name | Email | Password |
| --- | --- | --- |
| Asha Verma | asha.student.cr@gmail.com | Hostel@2026 |
| Rahul Mehta | rahul.student.cr@gmail.com | Hostel@2026 |
| Priya Nair | priya.student.cr@gmail.com | Hostel@2026 |
| Arjun Patel | arjun.student.cr@gmail.com | Hostel@2026 |
| Sneha Reddy | sneha.student.cr@gmail.com | Hostel@2026 |
| Vikram Singh | vikram.student.cr@gmail.com | Hostel@2026 |
| Ananya Iyer | ananya.student.cr@gmail.com | Hostel@2026 |
| Karthik Rao | karthik.student.cr@gmail.com | Hostel@2026 |
| Meera Joshi | meera.student.cr@gmail.com | Hostel@2026 |
| Rohan Gupta | rohan.student.cr@gmail.com | Hostel@2026 |

## Warden

| Name | Email | Password |
| --- | --- | --- |
| Ravi Warden | warden.demo@gmail.com | Hostel@2026 |

## Technicians

| Name | Email | Password |
| --- | --- | --- |
| Kumar Technician | tech.demo@gmail.com | Hostel@2026 |
| Priya Electrician | priya.tech.cr@gmail.com | Hostel@2026 |

## Admin

| Name | Email | Password |
| --- | --- | --- |
| Dean Admin | admin.demo@gmail.com | Hostel@2026 |
| Nithish (owner) | nithish.kumar2032@gmail.com | Own Gmail / account password (not `Hostel@2026`) |

---

## Will these credentials work?

**Yes — if (and only if) all of the following are true:**

1. **Same Supabase project** — Accounts were seeded in the project that Vercel **Production** env vars point to (`NEXT_PUBLIC_SUPABASE_URL` + anon key). Copy the same values from working local `.env.local`.
2. **Valid Project URL shape** — `NEXT_PUBLIC_SUPABASE_URL` must be `https://YOUR_PROJECT.supabase.co` with **no** `/rest/v1` (or other path). Wrong/missing URL on Vercel causes login to fail with a connectivity / misconfiguration message (previously opaque `fetch failed`).
3. **Auth Site URL** — Supabase → Authentication → URL configuration: **Site URL** = `https://campus-resolve-six.vercel.app`; redirect URLs include prod and local `/login` and `/reset-password`.

**Diagnose production:** open https://campus-resolve-six.vercel.app/api/health/supabase — `ok` / `reachable` should be `true` and `urlHost` should match your local Project URL host.

If login fails with invalid credentials, the users were not created in that project (or the password differs). If login succeeds but redirects fail, check Site URL / Redirect URLs.

**Note:** `student.demo@gmail.com` may still exist from older seeds; use the 10 students in the table above for demos.
