Here's your complete, project-specific deployment guide.

---

CampusFlow — Free Deployment Guide

Vercel (frontend) · Render free (backend) · Neon free (Postgres) — $0, no domain needed.

Prerequisite: push to GitHub

Render and Vercel both deploy from a Git repo. Make sure this is pushed to GitHub:

git remote -v # confirm a GitHub remote exists; if not, create a repo and add it
git push origin main

---

Step 1 — Database on Neon (do this first)

1. Sign up at neon.tech → Create project (pick a region near you, e.g. AWS us-east or ap-southeast).
2. On the project dashboard, open Connection string. Turn OFF "Connection pooling" so you get the direct connection (Prisma migrations need a direct connection, not the pooled -pooler host).
3. Copy the string. It looks like:
   postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
4. Keep ?sslmode=require on the end. Save this — it's your DATABASE_URL.

postgresql://neondb_owner:npg_prVNDvdx7gm9@ep-long-river-aoqdirhz.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

Host
ep-long-river-aoqdirhz.c-2.ap-southeast-1.aws.neon.tech
Database
neondb
Role
neondb_owner
Password

---

Pooler host
ep-long-river-aoqdirhz-pooler.c-2.ap-southeast-1.aws.neon.tech

---

Step 2 — Generate your JWT secrets

Run locally (both must be ≥32 chars; config/env.ts enforces it):

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
-> 0a93d5252fece965f49952a14682dacb6f1637aa57f8c78a1a956cd324702f7dc4d758c9b002306fbdcac432f67d034c9ae4b7ca5a343de1b97a3c51edfb5e19

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
-> 8fb0fc868f2afbc59652f62d90378d0784f9b2f9fa99f4667a8e7b560f6e01a2673f4987248ac0085fbb3da2f7edc1c4fb868f49e6b011a31049a65c12f5318c

Save the two outputs as JWT_SECRET and JWT_REFRESH_SECRET.

---

Step 3 — Backend on Render

1. Sign up at render.com → New → Web Service → connect your GitHub repo.
2. Configure:


    - Root Directory: backend  ← critical (the Dockerfile lives there)
    - Runtime/Environment: Docker (Render auto-detects backend/Dockerfile)
    - Instance Type: Free
    - Health Check Path: /

3. Add Environment Variables:

| Key                | Value                                                    |
| ------------------ | -------------------------------------------------------- |
| NODE_ENV           | production                                               |
| DATABASE_URL       | (Neon string from Step 1)                                |
| JWT_SECRET         | (first secret from Step 2)                               |
| JWT_REFRESH_SECRET | (second secret)                                          |
| FRONTEND_URL       | http://localhost:3000 (temporary — you'll fix in Step 5) |

▎ Don't set PORT — Render injects it and the app reads process.env.PORT automatically (server.ts:13). All other keys (Stripe, AI, email, SMS) are optional. 4. Create Web Service. On boot the container runs prisma migrate deploy (applies 0_init) then starts the API. First build takes a few minutes. 5. When it's live, copy the URL: https://campusflow-backend-xxxx.onrender.com. Test it: opening that URL in a browser should return the API's root JSON.

---

Step 4 — Frontend on Vercel

1. Sign up at vercel.com → Add New → Project → import the same repo.
2. Configure:


    - Root Directory: frontend  ← critical
    - Framework Preset: Next.js (auto-detected)

3. Add Environment Variable:

| Key                 | Value                                                    |
| ------------------- | -------------------------------------------------------- |
| NEXT_PUBLIC_API_URL | (your Render backend URL from Step 3, no trailing slash) |

▎ NEXT*PUBLIC*\* vars are baked in at build time, so this must be set before deploying. Sentry vars are optional — leave them out. 4. Deploy. Copy your frontend URL: https://campusflow-xxxx.vercel.app.

---

Step 5 — Wire up CORS (the "no domain" gotcha)

The backend only accepts requests from FRONTEND_URL or \*.campusflow.app (app.ts:29-34). Right now it doesn't know your Vercel URL, so the frontend would get CORS-blocked. Fix it:

1. Back in Render → your service → Environment, change:
   FRONTEND_URL = https://campusflow-xxxx.vercel.app
1. (your exact Vercel URL, no trailing slash)
1. Save → Render auto-redeploys. Done.

---

Step 6 — Seed the demo data

Migrations already ran on Render's boot. Now load the demo school from your machine, pointing at Neon:

cd backend
$env:DATABASE_URL = "postgresql://...your Neon string..."
npm run prisma:seed

This creates the dhaka-model demo school. (This is also exactly where the FK-constraint bug we just fixed mattered — the seed wipes and recreates cleanly now.)

---

Step 7 — Log in and verify

Open your Vercel URL. Log in with header X-School-Slug: dhaka-model and any demo account (password Password123):

- admin@dhaka-model.test
- teacher@dhaka-model.test
- finance@dhaka-model.test
- parent@dhaka-model.test
- student@dhaka-model.test

---

Things to know about the free tier

- Cold starts: Render free spins the backend down after ~15 min idle. The first request after that takes ~50s while it wakes — then it's fast. Normal for free hosting; a paid Render instance or Railway removes this.
- Neon: free Postgres is permanent (no 90-day expiry), but a branch auto-suspends when idle and resumes on connect (adds ~1s to the first query).
- Scheduler: the node-cron jobs only run while the backend is awake — fine for a demo, not for guaranteed nightly jobs.
- Redeploys: every git push to main auto-redeploys both Render and Vercel.
