# 🎯 CampusFlow — Showcase & Pilot Playbook

> Your end-to-end guide: from spinning up a **dummy-data demo**, to building a **client
> presentation**, to running a **real pilot with actual school student data**.

Use this as a checklist. Each phase has a clear "Done when…" so you always know where you are.

---

## 📌 At a glance — the journey

```
Phase 0  Prepare the demo (seed dummy data)        ⏱  ~30 min
Phase 1  Build the presentation deck                ⏱  ~1 day
Phase 2  Rehearse the live demo (the "wow" path)    ⏱  ~2 hours
Phase 3  Client meeting + demo                      ⏱  ~45 min/meeting
Phase 4  Sign a pilot school + paperwork            ⏱  ~1 week
Phase 5  Deploy to a real server                    ⏱  ~1 day
Phase 6  Load real student data                     ⏱  ~2–3 days
Phase 7  Train staff + go live (parallel run)       ⏱  2–4 weeks
Phase 8  Collect feedback → iterate                 ⏱  ongoing
```

---

# PHASE 0 — Prepare the demo with dummy data

Goal: anyone who opens the app sees a **realistic, fully-populated school** so they grasp the
whole system in minutes — no empty screens.

### 0.1 Seed the database (one command)

```bash
cd backend
npm install
npx prisma generate
npx prisma db push          # create the tables
npm run prisma:seed         # load the demo school "Dhaka Model High School"
```

Seeding demo school…
Seed complete: { classes: 10, students: 150, attendance: 1500 }

Login slug (X-School-Slug header): dhaka-model
Accounts (password: Password123):
admin@dhaka-model.test, teacher@dhaka-model.test, finance@dhaka-model.test
parent@dhaka-model.test (2 children), student@dhaka-model.test

This creates (idempotent — safe to re-run; it wipes & rebuilds the demo school):

- **10 classes** (Class 6–10, sections A & B)
- **~150 students** with Bangladeshi names, roll numbers & guardians
- **A Midterm Mathematics exam per class, fully graded** (so rankings/merit work)
- **10 school-days of attendance** (mostly present, some absent/late)
- **Invoices** in a mix of _pending / paid / overdue_
- **One login per role**, plus a parent linked to 2 children

### 0.2 The demo accounts

**School slug:** `dhaka-model` | **Password (all):** `Password123`

| Role            | Email                      | Best for showing                                                    |
| --------------- | -------------------------- | ------------------------------------------------------------------- |
| 🏛️ School Admin | `admin@dhaka-model.test`   | the full system: students, exams, finance, settings, audit, at-risk |
| 👩‍🏫 Teacher      | `teacher@dhaka-model.test` | attendance marking, grade entry, teacher home                       |
| 💰 Finance      | `finance@dhaka-model.test` | fees, invoices, payments, receipts                                  |
| 👪 Parent       | `parent@dhaka-model.test`  | the parent portal (2 children: Tanvir Cl.8A, Lamia Cl.6A)           |
| 🎒 Student      | `student@dhaka-model.test` | student portal + AI study assistant                                 |

### 0.3 Start both apps

```bash
# Terminal 1
cd backend && npm run dev      # http://localhost:3001  (API docs: /api/docs)
# Terminal 2
cd frontend && npm run dev     # http://localhost:3000
```

> In dev, log in with the school slug **`dhaka-model`** on the login screen.

### 0.4 (Recommended) Put the demo online so anyone can try it

A public URL is far more convincing than "let me share my screen."

- Quickest: `docker compose up --build` on a small VPS (DigitalOcean / Contabo / local BD host),
  then point a subdomain like `demo.campusflow.app` at it (HTTPS via Caddy/Nginx + Let's Encrypt).
- Re-run `npm run prisma:seed` on the server so the demo data is fresh before a big meeting.
- Share a one-pager with the URL + the 5 demo logins above.

> ✅ **Done when:** you can open the app (locally or online), log in as all 5 roles, and every
> screen shows realistic data.

---

# PHASE 1 — Build the client presentation

Keep it to **10–12 slides**. Clients buy outcomes, not features. Lead with the pain.

### Suggested deck outline

1. **Title** — CampusFlow: Modern, AI-powered school management for Bangladesh.
2. **The problem** — paper registers, WhatsApp chaos, manual fee ledgers, parents in the dark.
3. **The solution (one line)** — one app for attendance, results, fees & parent updates — in Bangla.
4. **Live demo hook** — "Let me show you a real school running on it" → switch to the app.
5. **For the school office** — students, classes, exams, automated report cards.
6. **For teachers** — fast attendance + grade entry; less paperwork.
7. **For parents** — the headline: instant absence SMS + a portal to see results & fees.
8. **For finance** — bKash/Nagad fee collection, instant receipts, dues tracking.
9. **Built for Bangladesh** — full Bangla UI + Bengali numerals, works on cheap phones / 3G,
   installable app (PWA), offline-friendly.
10. **AI advantage** — auto report-card comments, a student study assistant, at-risk early warnings.
11. **Trust & safety** — role-based access, audit trail, data privacy (privacy policy / DPA ready).
12. **Pricing + next step** — propose a free 2–4 week pilot at _their_ school.

### Talking points that land with BD schools

- "Parents get an **automatic SMS** the evening their child is absent — no extra work for teachers."
- "Fees can be paid by **bKash/Nagad**, and a **receipt is generated instantly**."
- "The whole system works in **বাংলা**, with **Bengali numerals**, on a ৳8,000 phone."
- "You keep your current process during the pilot — **zero risk**."

### Assets to capture for the deck

Take clean screenshots from the seeded demo (do this with the data loaded):

- Admin dashboard, Students list, an AI report-card PDF, Finance dashboard,
  Parent portal (child detail), the At-Risk Students page, and the app in **Bangla**.
- One phone screenshot of the **installed PWA** (Add to Home Screen).

> ✅ **Done when:** you have a 10–12 slide deck + a folder of screenshots, and you can present
> it in under 15 minutes.

---

# PHASE 2 — Rehearse the live demo (the "wow" path)

Run this exact sequence 2–3 times until it's smooth. It tells a story across roles.

1. **Login as Teacher** → mark today's attendance for Class 8 A; mark 1–2 students absent.
2. **Explain** that at 7 PM the system auto-sends the guardian an SMS/email (mention the schedule;
   you can also show the notification log).
3. **Login as Parent** (`parent@…`) → open child **Tanvir** → show **Attendance %, Class Rank,
   Pending Fees**, then the Attendance / Results / Fees tabs.
4. **Toggle to বাংলা** in the header → show numbers become **০-৯** (e.g. `৳ ২,৫০০`). Switch back.
5. **Login as Finance** → open a _pending_ invoice → **Record cash payment** → it flips to **paid**
   → **download the PDF receipt**.
6. **Login as Admin** → **At-Risk Students** → show the flagged list with reasons (low attendance /
   failing grades). Then open a student's **AI report card PDF**.
7. **(Optional) Student** → AI study assistant answering a homework question.
8. **Close** on the phone: install the app (Add to Home Screen) to prove it's mobile-first.

### Demo hygiene

- Re-seed right before the meeting: `cd backend && npm run prisma:seed` (resets to a clean state).
- Have the 5 logins on a sticky note / second screen.
- Pre-open tabs for each role to switch fast (use separate browser profiles to stay logged in as
  multiple roles at once).
- Test your internet / projector beforehand; keep the local instance as a backup.

> ✅ **Done when:** you can run the 8-step path in ~10 minutes without fumbling.

---

# PHASE 3 — The client meeting

- **Discovery first (5 min):** how many students? how do they take attendance / collect fees now?
  do parents complain about communication? This lets you tailor the demo live.
- **Demo (12–15 min):** the rehearsed path, but emphasize _their_ pain points.
- **Handle the top objections:**
  - _"Our teachers aren't tech-savvy."_ → Show how fast attendance marking is; offer training.
  - _"Parents don't have smartphones."_ → SMS alerts work on any phone; portal is a bonus.
  - _"Is our data safe?"_ → role-based access, audit log, data stays in _their_ tenant, DPA provided.
  - _"What does it cost?"_ → propose a **free pilot** first; price after they see value.
- **Close with a concrete ask:** "Can we run a free 2–4 week pilot with one section, starting [date]?"

> ✅ **Done when:** a school verbally agrees to a pilot and names a start date + a point of contact.

---

# PHASE 4 — Convert to a pilot (paperwork & scope)

Before any real student data is touched:

- [ ] **Sign the pilot agreement** and the **Data Processing Agreement** (template at `/legal/dpa`).
- [ ] Have the school review your **Privacy Policy** (`/legal/privacy`) and **Terms** (`/legal/terms`)
      — get these checked by a lawyer for Bangladesh before real data.
- [ ] **Scope the pilot:** which classes/sections, which modules (recommend: attendance, results,
      fees, parent alerts), and what stays on the old system as a fallback.
- [ ] Name a **school champion** (an admin or senior teacher) who will be your day-to-day contact.
- [ ] Set **success criteria** with them (e.g. "parents receive absence alerts", "fees collected
      via bKash", "report cards generated for one term").

> ✅ **Done when:** signed agreement + DPA, agreed scope, named champion, written success criteria.

---

# PHASE 5 — Deploy to a real (production) server

- [ ] Provision **managed PostgreSQL** with **encryption at rest + automated daily backups**.
- [ ] Set production secrets in the host's **secret store** (not in the repo). Use the templates:
      `backend/.env.production.example`, `frontend/.env.production.example`. Generate JWT secrets:
      `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.
- [ ] Add real keys: **SSLCommerz** (bKash/Nagad), **Resend** (email), **Twilio** (SMS),
      **Sentry DSN** (both apps), AI keys (Claude / OpenAI).
- [ ] Deploy: `docker compose up --build` (or your host's pipeline). Apply schema with
      **`npx prisma migrate deploy`** (fresh DB) — or `prisma migrate resolve --applied 0_init`
      first if the DB already exists.
- [ ] Set up the **domain + HTTPS** (e.g. `theirschool.campusflow.app`), confirm secure cookies +
      CORS allowlist, and verify `/health` returns ok.
- [ ] Add **uptime monitoring** hitting `/health`.
- [ ] **Do NOT** run the dummy seed on production. Production starts empty.

> Full deploy detail + the production checklist lives in **[TESTING.md](./TESTING.md)**.
> ✅ **Done when:** the school's branded URL is live over HTTPS, error tracking + backups are on,
> and the dummy demo data is **not** present.

---

# PHASE 6 — Load real school student data

- [ ] **Create the school tenant** (register the school → its first admin account).
- [ ] **Collect data** from the school in a spreadsheet: classes/sections, students (name, roll,
      DOB, guardian name + **phone** + email), and current fee structure.
- [ ] **Set up classes & subjects** first (students reference a class).
- [ ] **Import students.** For a small pilot you can add them via the UI; for a full class, prepare a
      one-off import script that reads the spreadsheet and calls `POST /api/students` (or writes via
      Prisma). Validate guardian phone numbers — they drive the SMS alerts.
- [ ] **Link parent accounts to children** (set each student's parent) so guardians can log in.
- [ ] **Create fee structures + generate invoices** for the term.
- [ ] **Spot-check** with the school champion: do a few students' records look right?
- [ ] **Data minimisation:** only collect what the pilot needs; keep the spreadsheet secure and delete
      it after import.

> ✅ **Done when:** the pilot's real classes, students, guardians, and fees are in the system and
> the champion has verified a sample.

---

# PHASE 7 — Train staff & go live (parallel run)

- [ ] **30–45 min training** per role: teachers (attendance + grades), office (students + report
      cards), finance (invoices + payments), and a short parent guide (how to log in / read SMS).
- [ ] **Parallel run:** the school keeps its existing process as a safety net for the first weeks.
- [ ] **Run the daily loop for real:** teacher marks attendance → guardian gets the alert → parent
      sees it in the portal. (The smoke-test steps are in **TESTING.md**.)
- [ ] Collect a **real fee payment** via bKash/Nagad end-to-end and confirm the receipt.
- [ ] Generate **report cards** for one assessment.
- [ ] Keep a shared **issue log** with the champion; triage daily in the first week.

> ✅ **Done when:** for 1–2 weeks the school runs attendance, fees, and parent alerts on CampusFlow
> in parallel, with issues being logged and fixed.

---

# PHASE 8 — Feedback → iterate → expand

- [ ] **Weekly feedback session** with the champion (what's saving time? what's confusing?).
- [ ] Track metrics: attendance marked on time, alerts delivered, fees collected online, parent logins.
- [ ] Fix top friction points; prioritise from real usage (not the original wishlist).
- [ ] **Decide:** expand from one section → whole school, agree pricing, and convert the pilot to a
      paid contract.
- [ ] Capture a **testimonial / case study** ("absence alerts cut truancy", "fees collected faster")
      — this sells the next school.

> ✅ **Done when:** the school decides to continue (paid), and you have a metric or quote to show
> the next prospect.

---

## ⚠️ Golden rules

1. **Never mix dummy and real data.** Demo seed = a separate environment from any real school.
2. **No real student data without a signed DPA** and (ideally) legal review for Bangladesh.
3. **Re-seed before every demo** so prospects always see a full, clean system.
4. **Pilot = parallel run.** The school never loses its fallback — that removes their risk and your pressure.

## 📎 Related docs

- **[README.md](./README.md)** — what the product is + quickstart.
- **[TESTING.md](./TESTING.md)** — how to test every feature + the production checklist.
- **[API.md](./API.md)** — API reference (and live Swagger at `/api/docs`).
