# CampusFlow — Real Domain & Multi-Tenant Setup

Follow this **after you've purchased the domain** (assumed `campusflow.app` below — substitute your
actual domain everywhere). This wires up per-school subdomains so every school you create is
automatically reachable at `<school-slug>.campusflow.app` with **zero per-school DNS work**.

> The cross-site backend fixes (CORS, cookies, tenant header) are **already committed** — see
> "Code changes already done" at the bottom. This file is only the infra/DNS steps that depend on
> owning the domain.

---

## How the multi-tenancy works (so the steps make sense)

- **Frontend** (`frontend/middleware.ts`): reads the school slug from the subdomain using
  `NEXT_PUBLIC_APP_DOMAIN`. `dhaka-grammar.campusflow.app` → slug `dhaka-grammar`.
- **Frontend** (`frontend/lib/api.ts`): sends the slug to the API as the `X-School-Slug` header
  (with `withCredentials: true`).
- **Backend** (`backend/src/middleware/tenant.ts`): resolves the school from the slug.
- **Backend** (`backend/src/middleware/auth.ts`): the JWT carries `schoolId` and is rejected if it
  doesn't match the resolved tenant — so tenant isolation is enforced server-side.
- **Backend CORS** (`backend/src/app.ts`): already allows any `*.campusflow.app` origin.

The slug is the only thing that matters: create a school with a unique slug and its subdomain works
instantly because of the **wildcard** domain.

---

## Step 1 — Add the domain to Vercel (frontend)

Vercel → project → **Settings → Domains**. Add all three:

| Domain                | Purpose                                              |
| --------------------- | --------------------------------------------------- |
| `campusflow.app`      | apex — landing/marketing page (or redirect to www)  |
| `www.campusflow.app`  | www                                                 |
| `*.campusflow.app`    | **wildcard** — every school subdomain (the key one) |

## Step 2 — DNS records at your registrar

Use the exact values Vercel shows you (they may differ); typical values:

| Type  | Name | Value                   |
| ----- | ---- | ----------------------- |
| A     | `@`  | `76.76.21.21`           |
| CNAME | `*`  | `cname.vercel-dns.com`  |
| CNAME | `www`| `cname.vercel-dns.com`  |

- The `*` CNAME is what makes **all** school subdomains resolve.
- Wildcard SSL is auto-provisioned by Vercel. For wildcard certs Vercel usually requires you to use
  **Vercel's nameservers** OR verify the wildcard — follow the in-dashboard instructions.
- Propagation can take minutes to a few hours.

## Step 3 — Environment variables

**Vercel (Production)** — then **redeploy** (`NEXT_PUBLIC_*` is baked in at build time):

| Key                     | Value                                          |
| ----------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_APP_DOMAIN`| `campusflow.app`                               |
| `NEXT_PUBLIC_API_URL`   | `https://campus-flow-6i27.onrender.com`        |

**Render (backend)**:

| Key            | Value                          |
| -------------- | ------------------------------ |
| `APP_DOMAIN`   | `campusflow.app`               |
| `FRONTEND_URL` | `https://campusflow.app`       |

> CORS already accepts any `*.campusflow.app`, so each school subdomain is covered automatically.

## Step 4 — Onboard a school (repeatable, no infra changes)

1. Create the school via the register-school flow (or seed). Give it a unique **slug**
   (lowercase, hyphenated, e.g. `dhaka-grammar`).
2. It's immediately live at `https://dhaka-grammar.campusflow.app`. No DNS or Vercel change needed.
3. **Reserve/blocklist** slugs that collide with real subdomains: `www`, `api`, `app`, `admin`,
   `mail`, `static`, `assets`. (Worth enforcing in the register-school validator.)

## Step 5 — Verify

1. Visit `https://<slug>.campusflow.app` → should load the school's login.
2. Log in → cookies set, dashboard loads (cross-site cookies work because of the SameSite=None fix).
3. Data routes return the right school's data (tenant resolved from the subdomain).

---

## Optional, cleaner long-term: put the API on `api.campusflow.app`

Move the Render backend to a custom domain `api.campusflow.app`. Then frontend and backend share the
`campusflow.app` parent, and you *could* switch cookies to `SameSite=Lax` with cookie
`domain=.campusflow.app` instead of `None` — avoids third-party-cookie blocking in some browsers.
Tradeoff: a `.campusflow.app`-scoped cookie is shared across all school subdomains (fine here because
the JWT pins the tenant). If you do this, also set the cookie `domain` in
`backend/src/modules/auth/auth.controller.ts`.

---

## Code changes already done (committed — no action needed)

These fix the split frontend (Vercel) / backend (Render) cross-site setup. They work for both the
current `*.vercel.app` testing URL **and** the future `*.campusflow.app` domain:

1. **CORS** (`backend/src/app.ts`): allow `*.vercel.app` (previews + prod alias) in addition to
   `*.campusflow.app`. Once on the real domain you can remove the `*.vercel.app` entry if you want to
   lock it down.
2. **Cookies** (`backend/src/modules/auth/auth.controller.ts`): `SameSite=None; Secure` in
   production (cross-site cookies); `Strict` kept in development.
3. **Tenant resolution** (`backend/src/middleware/tenant.ts`): honor the `X-School-Slug` header in
   production (not just dev), since the API host isn't the tenant subdomain. Safe — `authenticate()`
   rejects any token whose `schoolId` doesn't match the resolved tenant.
