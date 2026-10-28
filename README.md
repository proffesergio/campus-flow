<div align="center">

# 🎓 CampusFlow

### The modern, AI-powered school management system built for Bangladesh 🇧🇩

*Attendance · Results · Fees · Parent engagement — bilingual (বাংলা / English), offline-ready, and production-grade.*

<br/>

![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![Tests](https://img.shields.io/badge/tests-71%20passing-success?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![AI](https://img.shields.io/badge/AI-Claude%20%2B%20GPT--4o-8A2BE2?style=flat-square)
![Status](https://img.shields.io/badge/status-pilot--ready-brightgreen?style=flat-square)

</div>

---
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0F172A,100:8B5CF6&height=180&section=header&text=Campus-Flow&fontSize=38&fontColor=fff&animation=fadeIn&fontAlignY=35&desc=AI%20School%20Management%20System&descAlignY=55&descAlign=50" />

<div align="center">

### 🎓 A Modern School Management System with AI Features
**For Bangladeshi schools & colleges - attendance, fees, results, AI chatbot.**

[TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
[Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
[AI](https://img.shields.io/badge/AI_Agent-8B5CF6?style=for-the-badge&logo=openai&logoColor=white)
[Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

</div>

---

### Problem

> 90% Bangladeshi schools use paper registers. Parents don't know attendance, teachers waste 2hrs daily.

### Solution

- 📊 AI attendance with face detection (optional)
- 💰 Fee management with bKash/Nagad integration
- 📈 Auto result generation, transcript
- 🤖 AI chatbot: "How was my child today?" - RAG over school data
- 📱 Parent app, SMS alerts in Bangla

### Quick Start

```bash
git clone https://github.com/proffesergio/campus-flow.git
cd campus-flow
npm install
npx prisma migrate dev
npm run dev
```

### Stack

- **Frontend:** Next.js, TypeScript, Tailwind, shadcn/ui
- **Backend:** NestJS/Next.js API, Prisma, PostgreSQL
- **AI:** LangChain, OpenAI, Vector DB for school Q&A
- **Auth:** NextAuth, role-based (Admin, Teacher, Parent, Student)

### AI Features (Vibe Coding)

- [x] Basic CRUD
- [ ] AI attendance anomaly: "Rahim absent 3 days"
- [ ] RAG chatbot for parents
- [ ] Auto timetable generator with AI

### Demo

Admin: admin@demo.com / admin123
Teacher: teacher@demo.com / teacher123

<div align="center">
Built for education in Bangladesh 🎓
</div>

## ✨ Why CampusFlow

Many Bangladeshi schools still run on paper registers, WhatsApp groups, and manual fee ledgers.
**CampusFlow replaces all of it** with one multi-tenant platform that works on a low-cost Android
phone over a 3G connection — in **Bangla or English**, with **AI woven into the daily workflow**.

<table>
<tr>
<td width="50%">

🏫 **Multi-tenant SaaS**
One deployment, many schools, strict row-level isolation.

📱 **Mobile-first & offline-ready**
Installable PWA with an offline shell for poor connectivity.

</td>
<td width="50%">

🇧🇩 **Truly bilingual**
Full Bangla UI with Bengali numerals (০-৯), one-click toggle.

🤖 **AI built in**
Report-card narratives, a student study assistant, and at-risk early warnings.

</td>
</tr>
</table>

---

## 🚀 Feature Highlights

| Area | What you get |
|------|--------------|
| 👨‍🎓 **Students & Classes** | Enrolment, classes with sections, subjects, teacher assignment |
| 🗓️ **Attendance** | Daily marking + automated **7 PM guardian absence alerts** (SMS / email / in-app) |
| 📝 **Exams & Results** | Bulk grading, class ranking & merit, **AI report-card PDF** with narratives |
| 💳 **Finance** | Fee structures, invoices, **bKash / Nagad / cards via SSLCommerz**, **PDF receipts**, automated due reminders |
| 👪 **Parent Portal** | Guardians see each child's attendance, results & fees — strict per-family isolation |
| 🎒 **Student Portal** | Grades, attendance, fees, AI study assistant, practice generator |
| 🔔 **Communication** | Targeted broadcasts (SMS / email / in-app) with Bangla templates |
| 🛡️ **Security & Compliance** | RBAC (6 roles), **audit logging**, JWT httpOnly cookies, Sentry, privacy / ToS / DPA pages |
| 📊 **Early Warning** | Interpretable at-risk flags from attendance + grade trends |
| 🌐 **Infrastructure** | Installable **PWA**, Docker + docker-compose, GitHub Actions CI |

---

## 🧱 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · shadcn/ui · Framer Motion · next-intl · Sentry |
| **Backend** | Node.js · Express · TypeScript (strict) · Prisma 5 · PostgreSQL · Zod · JWT · Swagger · Sentry |
| **AI** | Anthropic Claude (report narratives) · OpenAI GPT-4o (study chat, practice, admin Q&A) |
| **Payments** | SSLCommerz (bKash / Nagad / cards) · Stripe (international) |
| **Notifications** | Resend (email) · Twilio (SMS) · in-app + Web Push-ready |

---

## 🏛️ Architecture

```
campusflow/
├── backend/                 # Express + Prisma API (port 3001)
│   ├── prisma/              # schema, baseline migration, seed.ts
│   └── src/
│       ├── modules/        # auth, students, classes, attendance, exams, finance,
│       │                   #   notifications, ai, schools, parents, audit, analytics
│       │                   #   (route + controller + service + validator each)
│       ├── middleware/     # auth (JWT), tenant (X-School-Slug), audit, errors
│       ├── services/       # pdf, receipt, notifications, claude, openai
│       └── jobs/           # cron: fee reminders + absence alerts
├── frontend/                # Next.js 15 (port 3000)
│   └── app/                # (auth) (dashboard) (student) (parent) legal/ + PWA
├── docker-compose.yml       # postgres + backend + frontend
├── TESTING.md               # per-feature manual test guide + pre-deploy checklist
├── API.md                   # REST API reference
└── showcase.md              # demo + pilot playbook
```

> **Multi-tenancy:** shared PostgreSQL with a row-level `schoolId` on every record; the tenant is
> resolved from a subdomain (prod) or the `X-School-Slug` header (dev), and JWTs are bound to their
> school. **RBAC:** `super_admin · school_admin · teacher · finance · student · parent`.

---

## ⚡ Quickstart

```bash
# 1. Backend  →  http://localhost:3001  (API docs at /api/docs)
cd backend
cp .env.example .env                 # fill DATABASE_URL + JWT secrets
npm install
npx prisma generate && npx prisma db push
npm run prisma:seed                  # load the demo school "dhaka-model"
npm run dev

# 2. Frontend (new terminal)  →  http://localhost:3000
cd frontend
cp .env.example .env.local           # set NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev
```

### 🔑 Demo accounts &nbsp;·&nbsp; slug `dhaka-model` &nbsp;·&nbsp; password `Password123`

| Role | Email |
|------|-------|
| 🏛️ School Admin | `admin@dhaka-model.test` |
| 👩‍🏫 Teacher | `teacher@dhaka-model.test` |
| 💰 Finance | `finance@dhaka-model.test` |
| 👪 Parent (2 children) | `parent@dhaka-model.test` |
| 🎒 Student | `student@dhaka-model.test` |

---

## 🐳 Docker

```bash
cp .env.docker.example .env          # fill secrets
docker compose up --build            # postgres + backend + frontend
```

---

## ✅ Testing

```bash
cd backend && npm test               # 71 unit/guard tests (no DB needed)
npx tsc --noEmit                     # strict type-check (backend & frontend)
npm run build                        # both apps build clean
```

See **[TESTING.md](./TESTING.md)** for per-feature manual test scripts, the daily-loop smoke
test, and the full **pre-deployment production checklist**.

---

## 📚 Documentation

| Doc | What's inside |
|-----|---------------|
| **[README.md](./README.md)** | What the product is + quickstart (this file) |
| **[API.md](./API.md)** | REST endpoint reference (also live at `/api/docs` via Swagger) |
| **[TESTING.md](./TESTING.md)** | How to test every feature before deploying |
| **[showcase.md](./showcase.md)** | Demo + client-pilot playbook (presentation → real-school rollout) |

---

## 🗺️ Roadmap

**✅ Built** — parent portal · BD payments + receipts · audit logging · Sentry · PWA · bilingual +
Bengali numerals · legal docs · at-risk analytics.

**🔜 Next** — facial-recognition attendance · education-board / IPEMIS integration · admissions CRM ·
deeper predictive ML · native mobile app.

---

<div align="center">

**Built with ❤️ for the schools of Bangladesh.**

</div>
