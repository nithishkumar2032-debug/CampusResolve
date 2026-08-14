# Next steps: GitHub + Vercel + Installable app

Deadline context: push code, get a live URL, and let users install CampusResolve on a phone/desktop.

## What “downloadable app” means here

CampusResolve is a **web app**. The practical installable form (without Play Store / App Store) is a **PWA**:

1. Open the live URL on your phone
2. Browser menu → **Add to Home Screen** / **Install app**
3. It opens like an app (standalone, with icon)

A native Android/iOS store app is future work and needs separate builds (Kotlin/Swift).

You also have a **source ZIP** you can submit or share:

- `C:\Users\nithi\Downloads\CampusResolve-App.zip`

## Step A — Log in to GitHub (required once)

In PowerShell:

```powershell
gh auth login --hostname github.com --git-protocol https --web
```

1. Copy the one-time code shown in the terminal  
2. Open https://github.com/login/device  
3. Paste the code and authorize  

Then tell the assistant “GitHub login done” so we can create the repo and push.

## Step B — Create repo + push (we can run this after login)

```powershell
gh repo create CampusResolve --public --source=. --remote=origin --push
```

## Step C — Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub  
2. **Add New Project** → import `CampusResolve`  
3. Framework: Next.js (auto-detected)  
4. Deploy (no env vars required for demo mode)  
5. Optional later: `OPENAI_API_KEY`, Supabase keys  

Or with CLI after `npx vercel login`:

```powershell
npx vercel --prod
```

## Step D — Install on phone (PWA)

1. Open the Vercel URL in Chrome/Safari  
2. Install / Add to Home Screen  
3. Launch CampusResolve from the home screen icon  

## Demo accounts (unchanged)

Password for all: `demo1234`

- student@demo.edu  
- warden@demo.edu  
- worker@demo.edu  
- admin@demo.edu  

## Already completed in code

- PWA manifest + service worker + icons  
- Demo store works on Vercel (`/tmp` + memory cache)  
- Local git commits on `master`  
- Learning guide + testing + submission docs  
