# CampusFlow Dashboard Redesign — Phase 1 Design

**Date:** 2026-06-08
**Status:** Approved (design); spec under review
**Visual direction:** Refined Dark (evolve the existing dark theme)
**Rollout strategy:** Foundation-first, phased. This spec covers **Phase 1 only**.

## Context

The CampusFlow admin dashboard (Next.js 15 / React 19, `frontend/app/(dashboard)`) already uses a
dark zinc/blue theme with framer-motion. The user asked to modernize the whole admin dashboard with
engaging, animated, user-friendly UI plus new features. We decomposed the work into phases; this is
Phase 1 — the design-system foundation plus the highest-impact screen (the dashboard home) and two
cross-cutting features (onboarding checklist, global quick-add).

Later phases (out of scope here): list-screen restyles + bulk actions + CSV import (Phase 2), forms
modernization (Phase 3), full English/Bangla translation (Phase 4).

## Goals

1. Establish a reusable **Refined Dark design system** (tokens + shared components) that later phases build on.
2. Replace the dashboard home with a **richer, animated** overview (KPIs, charts, at-risk, activity).
3. Add an **onboarding checklist** that guides freshly-registered (empty) schools.
4. Add a **global `+ New` quick-add** menu to the top bar.
5. No regressions: existing routes, auth, and data flows keep working.

## Non-Goals (Phase 1)

- Restyling list/management screens (Students, Classes, Exams, etc.) beyond what shared components touch.
- Bulk actions / CSV import.
- Forms (Add Student/Exam/Practice) redesign.
- Bilingual translation.
- Role-specific dashboard variants (teacher/finance) — single admin-focused home for now.

## Architecture

### Frontend

New design-system module under `frontend/components/ui/` and `frontend/lib/`:

- `lib/design/tokens.ts` — exported constants for the Refined Dark palette, radii, and motion presets
  (`fadeUp`, `stagger`, `hoverLift`). Single source of truth; components import from here.
- `components/ui/page-header.tsx` — `PageHeader({ title, subtitle, actions })`.
- `components/ui/stat-card.tsx` — `StatCard({ label, value, icon, trend?, accent })` with count-up + trend arrow.
- `components/ui/section-card.tsx` — titled container for charts/sections.
- `components/ui/empty-state.tsx` — `EmptyState({ icon, title, description, action })`.
- (Existing `card`, `button`, `input`, etc. stay; new components compose them.)

Dashboard home (`app/(dashboard)/dashboard/page.tsx`) is rebuilt from these components:

- `components/dashboard/OnboardingChecklist.tsx`
- `components/dashboard/KpiRow.tsx`
- `components/dashboard/TrendCharts.tsx` (recharts: area + bar + donut)
- `components/dashboard/AtRiskPanel.tsx`
- `components/dashboard/ActivityFeed.tsx`

Top bar (`app/(dashboard)/layout.tsx`):

- `components/dashboard/QuickAddMenu.tsx` — radix `dropdown-menu` with items New Student / Class /
  Subject / Exam / Notice. Student/Class/Subject open their create dialog/drawer where one exists;
  Exam/Notice route to their pages.

### Backend

One new endpoint to supply data not already available:

- `GET /api/analytics/dashboard-summary` (auth; roles: school_admin, super_admin) →
  ```json
  {
    "onboarding": { "classes": 10, "subjects": 70, "students": 0, "exams": 0 },
    "gradeDistribution": [ { "label": "A+", "count": 12, "color": "#16a34a" }, ... ],
    "attendanceTrend": [ { "month": "2026-01", "percent": 94.1 }, ... ]
  }
  ```
  Implemented in `analytics.service.ts` / `analytics.controller.ts` / `analytics.routes.ts`,
  tenant-scoped via `req.tenant.schoolId`.

All other dashboard data reuses existing endpoints:

| Data | Endpoint |
| --- | --- |
| Students KPI | `GET /api/students/stats` |
| Fees KPI + monthly chart | `GET /api/finance/dashboard` |
| Upcoming exams KPI | `GET /api/exams?limit=5&upcoming=true` |
| At-risk panel | `GET /api/analytics/at-risk` |
| Activity feed | `GET /api/audit` (recent N) |
| Onboarding counts, grade distribution, attendance trend | `GET /api/analytics/dashboard-summary` (new) |

## Data Flow

1. Dashboard home mounts → fires the data requests in parallel (`Promise.allSettled`) so one slow/empty
   source never blocks the rest (matches the existing pattern).
2. Onboarding checklist reads `dashboard-summary.onboarding`; a step is "done" when its count > 0.
   The whole card hides when all four > 0, OR when the user dismissed it (localStorage key
   `cf_onboarding_dismissed`). Dismissal is per-browser and intentional.
3. KPI trend arrows compare current vs previous period from the respective endpoint payloads.
4. Charts render from `dashboard-summary` (grade donut, attendance trend) and `finance/dashboard` (fee bar).

## Components & Boundaries

Each dashboard component takes plain props (its slice of data + loading flag) and renders — no
component fetches on its own except the page orchestrator. This keeps them independently testable and
reusable. Charts are wrapped in `SectionCard`. Loading states use existing `Skeleton`.

## Error Handling

- Each data source is independent (`allSettled`); a failed source shows a small inline "couldn't load"
  state in its card, never a whole-page error.
- `dashboard-summary` returns zeros/empty arrays for a brand-new school (no special-casing needed; the
  onboarding checklist naturally shows 0/4 → 4/4).

## Testing (TDD)

Behavioral logic gets tests first; pure visual/CSS is verified by running the app.

- **Backend (Jest + supertest, following existing `*.test.ts` patterns):**
  - `dashboard-summary` returns correct onboarding counts for a seeded school.
  - grade distribution buckets grades into the school's `GradeThreshold` labels correctly.
  - attendance trend computes monthly percentages correctly.
  - tenant isolation: a user from school A cannot read school B's summary (403 / scoped data).
- **Frontend (component tests where infra exists; otherwise logic-level):**
  - OnboardingChecklist: marks steps done by count, hides at 4/4, respects dismissal.
  - KPI trend arrow direction from sample payloads.
- **Manual/visual verification:** dashboard renders in Refined Dark, animations play, `+New` routes
  correctly, empty-school state shows the checklist.

## Rollout / Branch

- Implemented on a feature branch (NOT `main`), via subagent-driven-development (implementer + spec
  review + code-quality review per task), each task TDD.
- Pre-req: the uncommitted Step-1 work (classes/subjects/profile + cf_role login fix) is committed
  first so the branch starts from a clean base.

## Open Questions / Assumptions

- Assumes `GradeThreshold` rows exist per school (they're seeded at registration) for grade
  distribution coloring/labels. If absent, fall back to default A–F buckets.
- Activity feed uses the audit log; if audit entries are sparse for new schools, the feed shows an
  empty state (acceptable).
