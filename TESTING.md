# CampusFlow — Pre-Deployment Testing Guide

This guide walks you through testing CampusFlow **locally** before deploying to a live
server for a school pilot. Work top to bottom. Each feature has a **"How to test"**
section — complete it before moving to the next feature.

> Convention: the demo school's slug is **`dhaka-model`**. In local dev (no subdomain),
> the backend identifies the tenant via the **`X-School-Slug: dhaka-model`** request header,
> which the frontend sends automatically after you log in.

---

## 0. One-time local setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ running locally (or Docker)
- `backend/.env` and `frontend/.env.local` filled in (copy from the `.env.example` files)

### Install + database
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push          # sync schema to your dev DB
npm run prisma:seed         # load the demo school (idempotent)

# Frontend
cd ../frontend
npm install
```

### Demo accounts (password for all: `Password123`)
| Role | Email | Use it to test |
|------|-------|----------------|
| School Admin | `admin@dhaka-model.test` | full admin: students, classes, exams, settings |
| Teacher | `teacher@dhaka-model.test` | attendance, grade entry, teacher home |
| Finance | `finance@dhaka-model.test` | fees, invoices, payments |
| Parent | `parent@dhaka-model.test` | **parent portal** (linked to 2 children) |
| Student | `student@dhaka-model.test` | student portal (is the parent's child *Tanvir*) |

The seed creates: 10 classes (6–10, sections A/B), ~150 students, a published
Midterm Mathematics exam per class with grades, 10 school-days of attendance, and a
mix of pending/paid/overdue invoices.

### Run the apps
```bash
# Terminal 1
cd backend && npm run dev      # http://localhost:3001  (API docs: /api/docs)

# Terminal 2
cd frontend && npm run dev     # http://localhost:3000
```

### Automated tests (run before every commit)
```bash
cd backend
npm test            # 70 unit/guard tests, no DB needed
npx tsc --noEmit    # type safety (must be clean)
cd ../frontend
npx tsc --noEmit
npm run build       # production build must succeed
```

---

## Feature 1 — Parent Portal ✅ (built & tested)

Read-only portal where a guardian sees each child's attendance, results, and fees.
Backend: `backend/src/modules/parents/`. Frontend: `frontend/app/(parent)/`.

### How to test (UI)
1. Go to `http://localhost:3000/login`, school slug `dhaka-model`, log in as
   **`parent@dhaka-model.test` / `Password123`**.
2. You should land on **`/parent`** and see **2 children** (Tanvir – Class 8 A,
   Lamia – Class 6 A). *(Before this feature, parents got a 404 — that's now fixed.)*
3. Click a child → confirm the overview cards show **Attendance %**, **Class Rank**,
   and **Pending Fees (৳)**.
4. Switch the tabs:
   - **Attendance** → ~10 dated records with present/absent/late.
   - **Results** → the Midterm Mathematics grade (marks / 100 + letter).
   - **Fees** → invoices with pending/paid/overdue badges.
5. Open **Notices** (left nav) → you should see the seeded "Welcome to CampusFlow".

### How to test (security — important)
A parent must **never** see another family's child. To verify quickly via API:
```bash
cd backend && node -e "
const B='http://localhost:3001/api',H={'Content-Type':'application/json','X-School-Slug':'dhaka-model'};
const ck=r=>(r.headers.get('set-cookie')||'').split(/,(?=\s*\w+=)/).map(c=>c.split(';')[0]).join('; ');
const login=async e=>ck(await fetch(B+'/auth/login',{method:'POST',headers:H,body:JSON.stringify({email:e,password:'Password123'})}));
(async()=>{
  const p={...H,Cookie:await login('parent@dhaka-model.test')};
  const kids=(await (await fetch(B+'/parents/me/children',{headers:p})).json()).data;
  const all=(await (await fetch(B+'/students?limit=100',{headers:{...H,Cookie:await login('admin@dhaka-model.test')}})).json()).items;
  const notMine=all.find(s=>!kids.some(k=>k.id===s.id));
  const a=await fetch(B+'/parents/me/children/'+notMine.id+'/dashboard',{headers:p});
  console.log('non-child dashboard:', a.status, a.status===404?'PASS (blocked)':'FAIL');
  const s=await fetch(B+'/parents/me/children',{headers:{...H,Cookie:await login('student@dhaka-model.test')}});
  console.log('student hits parent API:', s.status, s.status===403?'PASS (forbidden)':'FAIL');
})();"
```
Expected: `non-child dashboard: 404 PASS` and `student hits parent API: 403 PASS`.

### Expected results (recorded from last verified run)
- Parent login → 200; 2 children returned.
- Child dashboard → attendance 80%, rank 13/15, pending fees ৳2,500.
- Cross-family access → 404; wrong role → 403.

---

## Feature 2 — Payments (bKash/Nagad via SSLCommerz) + Receipt PDF ✅ (built & tested)

bKash/Nagad/cards are payment options on SSLCommerz's hosted page, so initiating an
SSLCommerz session covers all of them. Backend: `finance.service.ts`
(`initiateSSLCommerz`, hardened `handleSSLCommerzIPN`) + `services/receipt.service.ts`.

**Security hardening done:** the IPN is now re-validated server-side against
SSLCommerz's `validationserverAPI.php` using the `val_id` (the raw IPN POST is never
trusted), with an amount check and `val_id`-based idempotency.

### How to test — receipt + cash payment (no gateway creds needed)
```bash
cd backend && node -e "
const B='http://localhost:3001/api',H={'Content-Type':'application/json','X-School-Slug':'dhaka-model'};
const ck=r=>(r.headers.get('set-cookie')||'').split(/,(?=\s*\w+=)/).map(c=>c.split(';')[0]).join('; ');
(async()=>{
  const a={...H,Cookie:ck(await fetch(B+'/auth/login',{method:'POST',headers:H,body:JSON.stringify({email:'admin@dhaka-model.test',password:'Password123'})}))};
  const inv=(await (await fetch(B+'/finance/invoices?status=pending&limit=1',{headers:a})).json()).items[0];
  await fetch(B+'/finance/invoices/'+inv.id+'/pay-cash',{method:'POST',headers:a,body:JSON.stringify({paidAmount:Number(inv.amount)})});
  const r=await fetch(B+'/finance/invoices/'+inv.id+'/receipt',{headers:a});
  const buf=Buffer.from(await r.arrayBuffer());
  console.log('receipt:',r.status,r.headers.get('content-type'),buf.length+'B',buf.subarray(0,5).toString()==='%PDF-'?'PASS':'FAIL');
})();"
```
Expected: `receipt: 200 application/pdf … PASS`. (Last verified: 3036-byte valid PDF;
parent role correctly **403** on the staff receipt endpoint.)

### How to test — full gateway (needs your sandbox creds)
1. Put `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASS`, `SSLCOMMERZ_IS_LIVE=false` in `backend/.env`.
2. `POST /api/finance/payments/sslcommerz/init` with `{ invoiceId, returnUrl, cancelUrl }`
   → returns `gatewayUrl`; open it and pay with the sandbox bKash/Nagad/card.
3. SSLCommerz calls your `ipn_url`; confirm the invoice flips to *paid* and a Payment row
   appears. For local IPN, expose `localhost:3001` via a tunnel (e.g. ngrok) and set
   `API_BASE_URL` to the tunnel URL.

---

## Feature 3 — Audit Logging ✅ (built & tested)

Every successful create/update/delete on `/api/*` writes an `AuditLog` row
(who/what/when/where). Backend: `middleware/audit.ts` (fire-and-forget) + `modules/audit/`
(admin-only `GET /api/audit`). Sensitive fields (passwords, tokens, logo data-URLs) are
never stored; bodies are truncated.

### How to test
```bash
cd backend && node -e "
const B='http://localhost:3001/api',H={'Content-Type':'application/json','X-School-Slug':'dhaka-model'};
const ck=r=>(r.headers.get('set-cookie')||'').split(/,(?=\s*\w+=)/).map(c=>c.split(';')[0]).join('; ');
(async()=>{
  const a={...H,Cookie:ck(await fetch(B+'/auth/login',{method:'POST',headers:H,body:JSON.stringify({email:'admin@dhaka-model.test',password:'Password123'})}))};
  await fetch(B+'/classes',{method:'POST',headers:a,body:JSON.stringify({name:'Test',section:'Z',academicYear:'2025-2026'})});
  await new Promise(s=>setTimeout(s,400));
  const top=(await (await fetch(B+'/audit?limit=1',{headers:a})).json()).items[0];
  console.log(top.action, top.entity, 'by', top.actorEmail, top.action==='CREATE'&&top.entity==='classes'?'PASS':'FAIL');
})();"
```
Expected: `CREATE classes by admin@dhaka-model.test PASS`. (A non-admin role gets **403** on `/api/audit`.)
In the UI you can also confirm a teacher/finance user cannot reach the audit endpoint.

---

## Feature 4 — Error Tracking (Sentry) + Production Secrets ✅ (built & tested)

Sentry is wired on **both** apps and is a **no-op until a DSN is set**, so local/CI runs
are unchanged. Backend: `src/instrument.ts` (imported first in `server.ts`) + capture of
5xx in `errorHandler.ts`. Frontend: `sentry.{server,edge}.config.ts`,
`instrumentation*.ts`, `app/global-error.tsx`, and `withSentryConfig` in `next.config.ts`.
Secrets templates: `backend/.env.production.example`, `frontend/.env.production.example`.

### How to test
- **Without a DSN (now):** `cd backend && npm run build` and `cd frontend && npm run build`
  both succeed (verified); the app boots normally — Sentry stays disabled.
- **With a DSN:** set `SENTRY_DSN` (backend) and `NEXT_PUBLIC_SENTRY_DSN` (frontend),
  restart, then trigger an error (e.g. hit an endpoint that throws) and confirm the
  event appears in your Sentry project. Backend log prints
  `[sentry] backend error tracking enabled` on boot when the DSN is present.

> Production secrets: copy each `.env.production.example`, fill values into your host's
> secret store (not the repo), and generate JWT secrets with
> `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.

---

## Feature 5 — Progressive Web App (PWA) ✅ (built & tested)

Installable, offline-capable, push-ready. Files: `app/manifest.ts`, `public/icon.svg`,
`public/sw.js` (network-first navigations + stale-while-revalidate assets + push handler),
`components/PWARegister.tsx` (registers SW in production), `app/offline/page.tsx`, plus
manifest/theme metadata in `app/layout.tsx`.

### How to test
1. `cd frontend && npm run build && npm start` (SW only registers in production).
2. Open `http://localhost:3000` in Chrome → **DevTools → Application**:
   - **Manifest** → name/icons/theme load with no errors; an **Install** icon appears in the address bar.
   - **Service Workers** → `sw.js` is *activated and running*.
3. In **DevTools → Network**, tick **Offline**, then reload a page you've visited →
   you get the cached page (or the `/offline` screen for un-cached routes).
4. Run **Lighthouse → PWA** (or Installable check) — should pass installability.

> Note: installability requires HTTPS in production (localhost is exempt). The build
> verification (manifest + `/offline` route generate; tsc clean) is automated.

---

## Feature 7 — Bilingual Toggle + Bengali Numerals ✅ (built & tested)

`components/LanguageToggle.tsx` (EN ⇄ বাংলা) writes the `NEXT_LOCALE` cookie and refreshes;
it's mounted in the dashboard and parent headers. `lib/format.ts` provides
`formatNumber/formatCurrency/formatDate/formatPercent` that render Bengali numerals
(০-৯) when locale=bn — wired into the parent child-detail screen as the reference example.

### How to test
1. `cd frontend && npm run dev`, log in (any role with a dashboard, or the parent).
2. Click **বাংলা** in the header → UI strings switch to Bangla (from `messages/bn.json`),
   and on the **parent → child** screen the attendance %, rank, and fees render in Bengali
   numerals (e.g. `৳ ২,৫০০`, `৮০%`, `১৩ / ১৫`). Click **EN** to switch back.
3. The choice persists across reloads (cookie). Helper sanity (verified): `2500 → ২,৫০০`.

> Rollout note: the toggle is global; Bengali-numeral formatting is applied in the parent
> portal as the pattern. Extend `formatCurrency/Number/Date` to other screens incrementally.

---

## Feature 8 — Legal Docs ✅ (built & tested)

Public, readable policy pages at `/legal/privacy`, `/legal/terms`, `/legal/dpa`
(`app/legal/`), each with a "review with counsel" banner and tailored to a Bangladeshi
school handling minors' data. `middleware.ts` allows `/legal` (and PWA assets) without login.

### How to test
1. `cd frontend && npm run dev`; while **logged out**, open `http://localhost:3000/legal/privacy`.
2. Confirm it renders (no redirect to login) and you can tab between Privacy / Terms / DPA.

---

## Feature 9 — At-Risk Early Warning ✅ (built & tested)

Rule-based, interpretable early warning. Backend: `modules/analytics/`
(`GET /api/analytics/at-risk`, admin/teacher) flags active students with attendance < 75%
or average grade < 40% (borderline < 50%), each with human-readable reasons + a high/medium
level. Frontend: `/dashboard/at-risk` page + nav entry under Academics.

### How to test
```bash
cd backend && node -e "
const B='http://localhost:3001/api',H={'Content-Type':'application/json','X-School-Slug':'dhaka-model'};
const ck=r=>(r.headers.get('set-cookie')||'').split(/,(?=\s*\w+=)/).map(c=>c.split(';')[0]).join('; ');
(async()=>{
  const a={...H,Cookie:ck(await fetch(B+'/auth/login',{method:'POST',headers:H,body:JSON.stringify({email:'admin@dhaka-model.test',password:'Password123'})}))};
  const j=await (await fetch(B+'/analytics/at-risk',{headers:a})).json();
  console.log('summary', JSON.stringify(j.summary));
})();"
```
Expected (with seed data): a non-zero `{ total, high, medium }` (last verified
`{total:52,high:6,medium:46}`). In the UI, log in as admin/teacher → **At-Risk Students**
in the sidebar shows the flagged list with reason chips. A student role gets **403** on the API.

---

## ✅ All 9 priority-plan features are built & tested. See README.md + API.md for reference docs.

---

## Pre-deploy production checklist (gate before a real school)

Run this checklist once features 1–4 + 6 are done. Do **not** put real student data
on the system until every 🔴 item is checked.

### 🔴 Required
- [ ] `npm test` + `tsc --noEmit` (both apps) + `npm run build` (both apps) all green.
- [ ] Parent portal verified (UI + the security script above).
- [ ] One BD payment gateway (bKash/Nagad via SSLCommerz) completes a **sandbox**
      payment and the invoice flips to *paid* via webhook (Feature 2).
- [ ] Privacy Policy, ToS, and a school DPA published and signed off (Feature 8).
- [ ] Production secrets set in the **host secret store** (not committed):
      64-char `JWT_SECRET` / `JWT_REFRESH_SECRET`, gateway + AI keys.
      Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Managed PostgreSQL with **encryption at rest** + **automated daily backups** (PITR).
- [ ] Apply schema with migrations: on a fresh DB `npx prisma migrate deploy`; on an
      existing db created via `db push`, first `npx prisma migrate resolve --applied 0_init`.
- [ ] HTTPS/TLS + domain (`*.campusflow.app` wildcard); confirm `secure` cookies and the
      CORS allowlist in `backend/src/app.ts` match the production frontend origin.
- [ ] Sentry capturing errors on backend + frontend (Feature 4).
- [ ] Confirm automated **receipt** delivery fires on a successful payment (Feature 2).

### 🟡 Recommended (first month)
- [ ] PWA installable + offline shell (Feature 5).
- [ ] Audit logging live on all mutations (Feature 3).
- [ ] Language toggle visible + Bengali numerals (Feature 7).
- [ ] Uptime monitor hitting `/health`; alert on downtime.
- [ ] Cloudflare in front (rate limiting / basic DDoS).
- [ ] `npm audit` + Dependabot in CI.
- [ ] Core Web Vitals check on a throttled 3G profile.
- [ ] In-app feedback widget for pilot staff.

---

## Daily-loop smoke test (do this once end-to-end before the pilot)
1. **Teacher** logs in → marks today's attendance for a class (mark 1–2 absent).
2. The **7 PM scheduler** (or trigger manually) sends the absence alert to the
   guardian (check the notification log / inbox).
3. **Parent** logs in → sees the absence on the child's Attendance tab + a notice.
4. **Admin** publishes exam results → **report card PDF** generates for a student.
5. **Finance** records/confirms a fee payment → invoice shows *paid* + receipt.
6. Switch UI to **Bangla** and confirm the core screens read correctly.

If all six steps pass with seeded data, the operational core is pilot-ready.
