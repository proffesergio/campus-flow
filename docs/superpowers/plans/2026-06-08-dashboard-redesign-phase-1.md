# Dashboard Redesign Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Refined Dark design-system foundation plus a richer, animated admin dashboard home with an onboarding checklist and a global +New quick-add.

**Architecture:** Reuse existing endpoints for most data; add one tenant-scoped aggregate endpoint `GET /api/analytics/dashboard-summary` (onboarding counts + grade distribution + attendance trend). Frontend gets a tokens module + shared components (StatCard, PageHeader, SectionCard, EmptyState) and the dashboard home is rebuilt from focused sub-components. Charts use recharts (already installed). Pure logic is TDD'd; React/visual is verified via build + manual.

**Tech Stack:** Next.js 15 / React 19, TypeScript, framer-motion, recharts, Tailwind; backend Express + Prisma + Jest/supertest.

**Spec:** `docs/superpowers/specs/2026-06-08-dashboard-redesign-phase-1-design.md`

**Branch:** `feature/dashboard-redesign` (already created; spec committed). Do NOT work on `main`.

**Testing reality (match existing patterns):**
- Backend tests live in `backend/test/`, run with `npm test` (from `backend/`). They are DB-free: pure-logic unit tests + guard tests (e.g. 400 without slug). Full DB behavior is verified live.
- Frontend currently has NO test runner. Task 1 adds a minimal **vitest** (node env) so pure helper logic can be TDD'd. React components are verified with `npx next build` + manual visual check (documented per task).

---

## File Structure

**Backend (create/modify):**
- `backend/src/modules/analytics/analytics.helpers.ts` (create) — pure functions: `bucketGradeDistribution`, `buildAttendanceTrend`.
- `backend/test/modules/analytics.helpers.test.ts` (create) — unit tests for the helpers.
- `backend/src/modules/analytics/analytics.service.ts` (modify) — add `getDashboardSummary`.
- `backend/src/modules/analytics/analytics.controller.ts` (modify) — add `dashboardSummary`.
- `backend/src/modules/analytics/analytics.routes.ts` (modify) — add `GET /dashboard-summary`.
- `backend/test/api/analytics.test.ts` (create) — guard test (400 without slug).

**Frontend (create/modify):**
- `frontend/vitest.config.ts`, `frontend/package.json` (modify) — test runner.
- `frontend/lib/dashboard/helpers.ts` (create) — pure: `onboardingSteps`, `trendDirection`, `formatTaka`, `formatCompact`.
- `frontend/lib/dashboard/helpers.test.ts` (create) — unit tests.
- `frontend/lib/design/tokens.ts` (create) — palette + motion presets.
- `frontend/components/ui/page-header.tsx`, `stat-card.tsx`, `section-card.tsx`, `empty-state.tsx` (create).
- `frontend/components/dashboard/QuickAddMenu.tsx`, `OnboardingChecklist.tsx`, `KpiRow.tsx`, `TrendCharts.tsx`, `AtRiskPanel.tsx`, `ActivityFeed.tsx` (create).
- `frontend/app/(dashboard)/layout.tsx` (modify) — mount `QuickAddMenu` in top bar.
- `frontend/app/(dashboard)/dashboard/page.tsx` (modify) — rebuild from new components.

---

## Task 1: Frontend test runner (vitest)

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/lib/dashboard/helpers.test.ts` (smoke test, expanded in Task 2)

- [ ] **Step 1: Install vitest**

Run (from `frontend/`): `npm i -D vitest@^2`
Expected: added to devDependencies, no errors.

- [ ] **Step 2: Add the test script**

In `frontend/package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest config (node env + @/ alias)**

Create `frontend/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: { environment: 'node', include: ['**/*.test.ts'], globals: true },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
});
```

- [ ] **Step 4: Write a smoke test**

Create `frontend/lib/dashboard/helpers.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run (from `frontend/`): `npm test`
Expected: 1 passing test.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/lib/dashboard/helpers.test.ts
git commit -m "test: add vitest runner for frontend pure-logic tests"
```

---

## Task 2: Frontend dashboard pure helpers (TDD)

**Files:**
- Create: `frontend/lib/dashboard/helpers.ts`
- Modify: `frontend/lib/dashboard/helpers.test.ts`

- [ ] **Step 1: Write failing tests**

Replace `frontend/lib/dashboard/helpers.test.ts` with:
```ts
import { describe, it, expect } from 'vitest';
import { onboardingSteps, trendDirection, formatTaka, formatCompact } from './helpers';

describe('onboardingSteps', () => {
  it('marks a step done when its count > 0 and computes completion', () => {
    const steps = onboardingSteps({ classes: 2, subjects: 5, students: 0, exams: 0 });
    expect(steps.map((s) => s.done)).toEqual([true, true, false, false]);
    expect(steps.filter((s) => s.done).length).toBe(2);
  });
  it('all done when every count > 0', () => {
    const steps = onboardingSteps({ classes: 1, subjects: 1, students: 1, exams: 1 });
    expect(steps.every((s) => s.done)).toBe(true);
  });
});

describe('trendDirection', () => {
  it('up when current > previous', () => expect(trendDirection(10, 8)).toBe('up'));
  it('down when current < previous', () => expect(trendDirection(8, 10)).toBe('down'));
  it('flat when equal or no previous', () => {
    expect(trendDirection(5, 5)).toBe('flat');
    expect(trendDirection(5, null)).toBe('flat');
  });
});

describe('formatTaka', () => {
  it('formats numbers with the taka sign and grouping', () => {
    expect(formatTaka(1200)).toBe('৳1,200');
    expect(formatTaka('0')).toBe('৳0');
    expect(formatTaka('abc')).toBe('৳0');
  });
});

describe('formatCompact', () => {
  it('shortens large numbers', () => {
    expect(formatCompact(1248)).toBe('1.2K');
    expect(formatCompact(840000)).toBe('840K');
    expect(formatCompact(50)).toBe('50');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run (from `frontend/`): `npm test`
Expected: FAIL — `helpers.ts` has no such exports.

- [ ] **Step 3: Implement helpers**

Create `frontend/lib/dashboard/helpers.ts`:
```ts
export interface OnboardingCounts {
  classes: number;
  subjects: number;
  students: number;
  exams: number;
}

export interface OnboardingStep {
  key: keyof OnboardingCounts;
  label: string;
  href: string;
  done: boolean;
}

const STEP_DEFS: { key: keyof OnboardingCounts; label: string; href: string }[] = [
  { key: 'classes', label: 'Add classes', href: '/dashboard/classes' },
  { key: 'subjects', label: 'Add subjects', href: '/dashboard/subjects' },
  { key: 'students', label: 'Add students', href: '/dashboard/students' },
  { key: 'exams', label: 'Create first exam', href: '/dashboard/exams/new' },
];

export function onboardingSteps(counts: OnboardingCounts): OnboardingStep[] {
  return STEP_DEFS.map((d) => ({ ...d, done: (counts[d.key] ?? 0) > 0 }));
}

export type Direction = 'up' | 'down' | 'flat';

export function trendDirection(current: number, previous: number | null | undefined): Direction {
  if (previous == null) return 'flat';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}

export function formatTaka(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '৳0';
  return `৳${Math.round(n).toLocaleString('en-US')}`;
}

export function formatCompact(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const k = value / 1000;
    return `${k % 1 === 0 || k >= 100 ? Math.round(k) : k.toFixed(1)}K`;
  }
  const m = value / 1_000_000;
  return `${m % 1 === 0 || m >= 100 ? Math.round(m) : m.toFixed(1)}M`;
}
```

- [ ] **Step 4: Run to verify pass**

Run (from `frontend/`): `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/dashboard/helpers.ts frontend/lib/dashboard/helpers.test.ts
git commit -m "feat: dashboard pure helpers (onboarding, trend, formatting)"
```

---

## Task 3: Backend dashboard-summary helpers (TDD)

**Files:**
- Create: `backend/src/modules/analytics/analytics.helpers.ts`
- Create: `backend/test/modules/analytics.helpers.test.ts`

- [ ] **Step 1: Write failing tests**

Create `backend/test/modules/analytics.helpers.test.ts`:
```ts
import { bucketGradeDistribution, buildAttendanceTrend } from '../../src/modules/analytics/analytics.helpers';

describe('bucketGradeDistribution', () => {
  const thresholds = [
    { label: 'A+', minPercent: 80, maxPercent: 100, color: '#16a34a' },
    { label: 'B', minPercent: 60, maxPercent: 79.99, color: '#eab308' },
    { label: 'F', minPercent: 0, maxPercent: 59.99, color: '#991b1b' },
  ];

  it('counts each percentage into its threshold bucket', () => {
    const result = bucketGradeDistribution([95, 82, 70, 40], thresholds);
    expect(result).toEqual([
      { label: 'A+', count: 2, color: '#16a34a' },
      { label: 'B', count: 1, color: '#eab308' },
      { label: 'F', count: 1, color: '#991b1b' },
    ]);
  });

  it('returns zero counts when there are no grades', () => {
    const result = bucketGradeDistribution([], thresholds);
    expect(result.every((b) => b.count === 0)).toBe(true);
  });
});

describe('buildAttendanceTrend', () => {
  it('computes present-percentage per month key', () => {
    const rows = [
      { month: '2026-01', present: 90, total: 100 },
      { month: '2026-02', present: 47, total: 50 },
    ];
    expect(buildAttendanceTrend(rows)).toEqual([
      { month: '2026-01', percent: 90 },
      { month: '2026-02', percent: 94 },
    ]);
  });

  it('reports 0 percent for a month with no records', () => {
    expect(buildAttendanceTrend([{ month: '2026-03', present: 0, total: 0 }])).toEqual([
      { month: '2026-03', percent: 0 },
    ]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run (from `backend/`): `npm test -- analytics.helpers`
Expected: FAIL — module not found / exports missing.

- [ ] **Step 3: Implement helpers**

Create `backend/src/modules/analytics/analytics.helpers.ts`:
```ts
export interface GradeThresholdLite {
  label: string;
  minPercent: number;
  maxPercent: number;
  color: string;
}

export interface GradeBucket {
  label: string;
  count: number;
  color: string;
}

/** Count each percentage into the threshold band whose [min,max] contains it. */
export function bucketGradeDistribution(
  percentages: number[],
  thresholds: GradeThresholdLite[],
): GradeBucket[] {
  const buckets = thresholds.map((t) => ({ label: t.label, count: 0, color: t.color }));
  for (const pct of percentages) {
    const idx = thresholds.findIndex((t) => pct >= t.minPercent && pct <= t.maxPercent);
    if (idx >= 0) buckets[idx].count += 1;
  }
  return buckets;
}

export interface MonthAttendance {
  month: string; // 'YYYY-MM'
  present: number;
  total: number;
}

export interface AttendancePoint {
  month: string;
  percent: number;
}

/** Convert raw monthly present/total counts into rounded present-percentages. */
export function buildAttendanceTrend(rows: MonthAttendance[]): AttendancePoint[] {
  return rows.map((r) => ({
    month: r.month,
    percent: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0,
  }));
}
```

- [ ] **Step 4: Run to verify pass**

Run (from `backend/`): `npm test -- analytics.helpers`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/analytics/analytics.helpers.ts backend/test/modules/analytics.helpers.test.ts
git commit -m "feat: analytics helpers for grade distribution and attendance trend"
```

---

## Task 4: Backend dashboard-summary service + endpoint

**Files:**
- Modify: `backend/src/modules/analytics/analytics.service.ts`
- Modify: `backend/src/modules/analytics/analytics.controller.ts`
- Modify: `backend/src/modules/analytics/analytics.routes.ts`
- Create: `backend/test/api/analytics.test.ts`

- [ ] **Step 1: Write the failing guard test**

Create `backend/test/api/analytics.test.ts`:
```ts
import request from 'supertest';
import app from '../../src/app';

// DB-free guard test: the summary is tenant-scoped, so a request with no slug is
// rejected before auth/DB. Full aggregation is verified live (see TESTING.md).
describe('analytics dashboard-summary API — guards', () => {
  it('requires a tenant slug', async () => {
    const res = await request(app).get('/api/analytics/dashboard-summary');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run (from `backend/`): `npm test -- api/analytics`
Expected: FAIL — route returns 404 (not yet defined) instead of 400.

- [ ] **Step 3: Add the service function**

In `backend/src/modules/analytics/analytics.service.ts`, add the import at the top (below the existing `prisma` import):
```ts
import { bucketGradeDistribution, buildAttendanceTrend, MonthAttendance } from './analytics.helpers';
```
Then append:
```ts
export async function getDashboardSummary(schoolId: string) {
  const [classes, subjects, students, exams, thresholds, grades, attendance] = await Promise.all([
    prisma.class.count({ where: { schoolId } }),
    prisma.subject.count({ where: { schoolId } }),
    prisma.student.count({ where: { schoolId, status: 'active' } }),
    prisma.exam.count({ where: { schoolId } }),
    prisma.gradeThreshold.findMany({
      where: { schoolId },
      orderBy: { minPercent: 'desc' },
      select: { label: true, minPercent: true, maxPercent: true, color: true },
    }),
    prisma.grade.findMany({
      where: { schoolId, isAbsent: false, marksObtained: { not: null } },
      select: { marksObtained: true, exam: { select: { totalMarks: true } } },
    }),
    prisma.attendance.findMany({
      where: {
        schoolId,
        date: { gte: sixMonthsAgo() },
      },
      select: { date: true, status: true },
    }),
  ]);

  const percentages = grades
    .filter((g) => g.marksObtained != null && g.exam && g.exam.totalMarks > 0)
    .map((g) => (Number(g.marksObtained) / g.exam!.totalMarks) * 100);

  const monthMap = new Map<string, { present: number; total: number }>();
  for (const a of attendance) {
    const key = a.date.toISOString().slice(0, 7); // YYYY-MM
    const m = monthMap.get(key) ?? { present: 0, total: 0 };
    m.total += 1;
    if (a.status === 'present' || a.status === 'late') m.present += 1;
    monthMap.set(key, m);
  }
  const attendanceRows: MonthAttendance[] = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, present: v.present, total: v.total }));

  return {
    onboarding: { classes, subjects, students, exams },
    gradeDistribution: bucketGradeDistribution(percentages, thresholds),
    attendanceTrend: buildAttendanceTrend(attendanceRows),
  };
}

function sixMonthsAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d;
}
```

> Implementer note: verify the `Grade`/`Attendance` field names against `backend/prisma/schema.prisma` (e.g. `marksObtained`, `isAbsent`, attendance `status` enum values `present`/`late`). Adjust selects to match the actual schema before running.

- [ ] **Step 4: Add the controller**

In `backend/src/modules/analytics/analytics.controller.ts`, append:
```ts
export async function dashboardSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getDashboardSummary(req.tenant.schoolId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
```

- [ ] **Step 5: Add the route**

In `backend/src/modules/analytics/analytics.routes.ts`, add before `export default router;`:
```ts
router.get(
  '/dashboard-summary',
  authenticate,
  requireRole('school_admin', 'super_admin'),
  controller.dashboardSummary,
);
```

- [ ] **Step 6: Run to verify pass (guard) + typecheck**

Run (from `backend/`): `npm test -- api/analytics` → Expected: PASS (400 without slug).
Run (from `backend/`): `npx tsc --noEmit` → Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/analytics backend/test/api/analytics.test.ts
git commit -m "feat: GET /api/analytics/dashboard-summary (onboarding, grades, attendance trend)"
```

---

## Task 5: Design tokens module

**Files:**
- Create: `frontend/lib/design/tokens.ts`

- [ ] **Step 1: Create tokens**

Create `frontend/lib/design/tokens.ts`:
```ts
import type { Variants } from 'framer-motion';

// Refined Dark palette (Tailwind class fragments + raw hex for charts).
export const ACCENTS = {
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    ring: 'border-blue-500/20',    hex: '#3b82f6' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'border-emerald-500/20', hex: '#22c55e' },
  purple:  { text: 'text-purple-400',  bg: 'bg-purple-500/10',  ring: 'border-purple-500/20',  hex: '#a855f7' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   ring: 'border-amber-500/20',   hex: '#f59e0b' },
  red:     { text: 'text-red-400',     bg: 'bg-red-500/10',     ring: 'border-red-500/20',     hex: '#ef4444' },
} as const;

export type AccentName = keyof typeof ACCENTS;

export const SURFACE = 'bg-zinc-900 border border-zinc-800 rounded-xl';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
```

- [ ] **Step 2: Typecheck**

Run (from `frontend/`): `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/design/tokens.ts
git commit -m "feat: Refined Dark design tokens (accents, surface, motion presets)"
```

---

## Task 6: Shared UI components

**Files:**
- Create: `frontend/components/ui/page-header.tsx`
- Create: `frontend/components/ui/section-card.tsx`
- Create: `frontend/components/ui/empty-state.tsx`
- Create: `frontend/components/ui/stat-card.tsx`

- [ ] **Step 1: PageHeader**

Create `frontend/components/ui/page-header.tsx`:
```tsx
import * as React from 'react';

export function PageHeader({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

- [ ] **Step 2: SectionCard**

Create `frontend/components/ui/section-card.tsx`:
```tsx
import * as React from 'react';
import { SURFACE } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';

export function SectionCard({
  title, action, className, children,
}: { title?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(SURFACE, 'p-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="text-sm font-medium text-zinc-300">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
```

- [ ] **Step 3: EmptyState**

Create `frontend/components/ui/empty-state.tsx`:
```tsx
import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon, title, description, action,
}: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="py-12 text-center">
      <Icon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
      <p className="text-zinc-400 font-medium">{title}</p>
      {description && <p className="text-zinc-600 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: StatCard**

Create `frontend/components/ui/stat-card.tsx`:
```tsx
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ACCENTS, AccentName, SURFACE, fadeUp } from '@/lib/design/tokens';
import type { Direction } from '@/lib/dashboard/helpers';

export function StatCard({
  label, value, icon: Icon, accent = 'blue', trend, hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  accent?: AccentName;
  trend?: { direction: Direction; text: string };
  hint?: string;
}) {
  const a = ACCENTS[accent];
  return (
    <motion.div variants={fadeUp} className={`${SURFACE} p-4`}>
      <div className="flex items-start justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.bg}`}>
          <Icon className={`w-4 h-4 ${a.text}`} />
        </span>
      </div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      {trend && (
        <p className={`text-xs mt-1 inline-flex items-center gap-1 ${
          trend.direction === 'up' ? 'text-emerald-400' : trend.direction === 'down' ? 'text-red-400' : 'text-zinc-500'
        }`}>
          {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
          {trend.text}
        </p>
      )}
      {hint && !trend && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    </motion.div>
  );
}
```

- [ ] **Step 5: Typecheck**

Run (from `frontend/`): `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/components/ui/page-header.tsx frontend/components/ui/section-card.tsx frontend/components/ui/empty-state.tsx frontend/components/ui/stat-card.tsx
git commit -m "feat: shared Refined Dark components (PageHeader, SectionCard, EmptyState, StatCard)"
```

---

## Task 7: QuickAddMenu (+New)

**Files:**
- Create: `frontend/components/dashboard/QuickAddMenu.tsx`
- Modify: `frontend/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Build the menu**

Create `frontend/components/dashboard/QuickAddMenu.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@radix-ui/react-dropdown-menu';
import { Plus, UserPlus, Layers, Library, BookOpen, Bell } from 'lucide-react';

const ITEMS = [
  { label: 'New Student', icon: UserPlus, href: '/dashboard/students?new=1' },
  { label: 'New Class', icon: Layers, href: '/dashboard/classes?new=1' },
  { label: 'New Subject', icon: Library, href: '/dashboard/subjects?new=1' },
  { label: 'New Exam', icon: BookOpen, href: '/dashboard/exams/new' },
  { label: 'New Notice', icon: Bell, href: '/dashboard/notifications?new=1' },
];

export default function QuickAddMenu() {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 px-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-50"
      >
        {ITEMS.map(({ label, icon: Icon, href }) => (
          <DropdownMenuItem
            key={label}
            onSelect={() => router.push(href)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 outline-none cursor-pointer"
          >
            <Icon className="w-4 h-4 text-zinc-400" /> {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

> Note: the create pages (`classes`, `subjects`, `students`) currently open their create dialog via internal state. Wiring the `?new=1` query param to auto-open is handled in Task 7 Step 2 for classes/subjects and is acceptable to defer for students (the page still loads; user clicks Add). Implementer: add a `useSearchParams` effect to `classes/page.tsx` and `subjects/page.tsx` that calls `openCreate()` when `new=1` is present, wrapped in `Suspense` per Next 15.

- [ ] **Step 2: Auto-open on ?new=1 (classes + subjects)**

In `frontend/app/(dashboard)/dashboard/classes/page.tsx`, inside the component add:
```tsx
// near other imports
import { useSearchParams } from 'next/navigation';
// inside component, after openCreate is defined:
const searchParams = useSearchParams();
useEffect(() => {
  if (searchParams.get('new') === '1') openCreate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams]);
```
Apply the identical change to `frontend/app/(dashboard)/dashboard/subjects/page.tsx`.

> Next 15 requires `useSearchParams` to be under a `<Suspense>`. Both pages are client components rendered inside the dashboard layout which already provides a boundary via the animated `<main>`; if `next build` complains, wrap the page body in `<Suspense>` as done in `login/page.tsx`.

- [ ] **Step 3: Mount in the top bar**

In `frontend/app/(dashboard)/layout.tsx`, add import:
```tsx
import QuickAddMenu from '@/components/dashboard/QuickAddMenu';
```
Then in the header, immediately after `<LanguageToggle />`, add:
```tsx
<QuickAddMenu />
```

- [ ] **Step 4: Build to verify**

Run (from `frontend/`): `npx next build`
Expected: exit 0, no type/lint errors.

- [ ] **Step 5: Commit**

```bash
git add "frontend/components/dashboard/QuickAddMenu.tsx" "frontend/app/(dashboard)/layout.tsx" "frontend/app/(dashboard)/dashboard/classes/page.tsx" "frontend/app/(dashboard)/dashboard/subjects/page.tsx"
git commit -m "feat: global +New quick-add menu in dashboard top bar"
```

---

## Task 8: OnboardingChecklist

**Files:**
- Create: `frontend/components/dashboard/OnboardingChecklist.tsx`

- [ ] **Step 1: Build the component**

Create `frontend/components/dashboard/OnboardingChecklist.tsx`:
```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, Check, X } from 'lucide-react';
import { onboardingSteps, OnboardingCounts } from '@/lib/dashboard/helpers';

const DISMISS_KEY = 'cf_onboarding_dismissed';

export default function OnboardingChecklist({ counts }: { counts: OnboardingCounts }) {
  const [dismissed, setDismissed] = useState(
    typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1',
  );
  const steps = onboardingSteps(counts);
  const doneCount = steps.filter((s) => s.done).length;

  if (dismissed || doneCount === steps.length) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/[0.12] to-blue-500/[0.03] p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white inline-flex items-center gap-2">
          <Rocket className="w-4 h-4 text-blue-400" /> Finish setting up your school
          <span className="text-blue-400 font-medium">· {doneCount} of {steps.length} done</span>
        </p>
        <button onClick={dismiss} className="text-zinc-500 hover:text-zinc-300" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        {steps.map((s) =>
          s.done ? (
            <span key={s.key} className="inline-flex items-center gap-1 text-xs text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1">
              <Check className="w-3 h-3" /> {s.label}
            </span>
          ) : (
            <Link key={s.key} href={s.href}
              className="inline-flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-full px-3 py-1 transition-colors">
              → {s.label}
            </Link>
          ),
        )}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run (from `frontend/`): `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/dashboard/OnboardingChecklist.tsx
git commit -m "feat: onboarding checklist for new schools"
```

---

## Task 9: Dashboard data components (KpiRow, TrendCharts, AtRiskPanel, ActivityFeed)

**Files:**
- Create: `frontend/components/dashboard/KpiRow.tsx`
- Create: `frontend/components/dashboard/TrendCharts.tsx`
- Create: `frontend/components/dashboard/AtRiskPanel.tsx`
- Create: `frontend/components/dashboard/ActivityFeed.tsx`

- [ ] **Step 1: KpiRow**

Create `frontend/components/dashboard/KpiRow.tsx`:
```tsx
'use client';

import { motion } from 'framer-motion';
import { Users, ClipboardCheck, DollarSign, BookOpen } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { stagger } from '@/lib/design/tokens';
import { formatCompact, formatTaka, trendDirection } from '@/lib/dashboard/helpers';

export interface KpiData {
  students: { total: number; thisMonth: number } | null;
  attendancePercent: number | null;
  attendancePrev: number | null;
  feesCollected: string | number | null;
  feesThisMonth: string | number | null;
  upcomingExams: number;
  nextExamLabel?: string;
}

export default function KpiRow({ data }: { data: KpiData }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Students" icon={Users} accent="blue"
        value={data.students ? formatCompact(data.students.total) : '—'}
        trend={data.students ? { direction: data.students.thisMonth > 0 ? 'up' : 'flat', text: `+${data.students.thisMonth} this month` } : undefined} />
      <StatCard label="Attendance" icon={ClipboardCheck} accent="emerald"
        value={data.attendancePercent != null ? `${data.attendancePercent}%` : '—'}
        trend={data.attendancePercent != null ? { direction: trendDirection(data.attendancePercent, data.attendancePrev), text: 'vs last month' } : undefined} />
      <StatCard label="Fees collected" icon={DollarSign} accent="purple"
        value={data.feesCollected != null ? formatTaka(data.feesCollected) : '—'}
        hint={data.feesThisMonth != null ? `${formatTaka(data.feesThisMonth)} this month` : undefined} />
      <StatCard label="Upcoming exams" icon={BookOpen} accent="amber"
        value={data.upcomingExams} hint={data.nextExamLabel} />
    </motion.div>
  );
}
```

- [ ] **Step 2: TrendCharts**

Create `frontend/components/dashboard/TrendCharts.tsx`:
```tsx
'use client';

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { SectionCard } from '@/components/ui/section-card';
import { ACCENTS } from '@/lib/design/tokens';

export interface AttendancePoint { month: string; percent: number }
export interface FeePoint { month: string; collected: number }
export interface GradeBucket { label: string; count: number; color: string }

const axis = { stroke: '#52525b', fontSize: 11 };
const tooltip = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#e4e4e7' };

export default function TrendCharts({
  attendance, fees, grades,
}: { attendance: AttendancePoint[]; fees: FeePoint[]; grades: GradeBucket[] }) {
  const hasGrades = grades.some((g) => g.count > 0);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <SectionCard title="Attendance trend" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={attendance}>
            <defs>
              <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENTS.blue.hex} stopOpacity={0.5} />
                <stop offset="100%" stopColor={ACCENTS.blue.hex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" {...axis} tickLine={false} axisLine={false} />
            <YAxis {...axis} tickLine={false} axisLine={false} domain={[0, 100]} width={28} />
            <Tooltip contentStyle={tooltip} />
            <Area type="monotone" dataKey="percent" stroke={ACCENTS.blue.hex} strokeWidth={2} fill="url(#att)" />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Grade distribution">
        {hasGrades ? (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={grades} dataKey="count" nameKey="label" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {grades.map((g) => <Cell key={g.label} fill={g.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltip} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-zinc-600 text-center py-12">No grades published yet</p>
        )}
      </SectionCard>

      <SectionCard title="Fee collection (monthly)" className="lg:col-span-3">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={fees}>
            <XAxis dataKey="month" {...axis} tickLine={false} axisLine={false} />
            <YAxis {...axis} tickLine={false} axisLine={false} width={40} />
            <Tooltip contentStyle={tooltip} cursor={{ fill: 'rgba(168,85,247,0.08)' }} />
            <Bar dataKey="collected" fill={ACCENTS.purple.hex} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}
```

- [ ] **Step 3: AtRiskPanel**

Create `frontend/components/dashboard/AtRiskPanel.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { SectionCard } from '@/components/ui/section-card';

export interface AtRiskItem {
  student: { id: string; firstName: string; lastName: string };
  reasons: string[];
}

export default function AtRiskPanel({ items }: { items: AtRiskItem[] }) {
  return (
    <SectionCard
      title={`⚠ At-risk students`}
      action={<span className="text-xs text-red-400">{items.length}</span>}
    >
      {items.length === 0 ? (
        <p className="text-sm text-zinc-600 py-4 text-center">No students flagged 🎉</p>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {items.slice(0, 5).map((it) => (
            <li key={it.student.id} className="py-2">
              <Link href={`/dashboard/students/${it.student.id}`}
                className="text-sm text-zinc-200 hover:text-white">
                {it.student.firstName} {it.student.lastName}
              </Link>
              <p className="text-xs text-zinc-500">{it.reasons[0] ?? ''}</p>
            </li>
          ))}
        </ul>
      )}
      <Link href="/dashboard/at-risk" className="text-xs text-blue-400 hover:underline mt-2 inline-block">
        View all
      </Link>
    </SectionCard>
  );
}
```

- [ ] **Step 4: ActivityFeed**

Create `frontend/components/dashboard/ActivityFeed.tsx`:
```tsx
'use client';

import { SectionCard } from '@/components/ui/section-card';

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  actorName?: string;
}

function timeAgo(dateStr: string) {
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <SectionCard title="Recent activity">
      {items.length === 0 ? (
        <p className="text-sm text-zinc-600 py-4 text-center">No recent activity</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 6).map((it) => (
            <li key={it.id} className="text-xs text-zinc-400 py-1">
              <span className="text-zinc-200">{it.actorName ?? 'Someone'}</span> {it.action} {it.entity}
              <span className="text-zinc-600"> · {timeAgo(it.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
```

- [ ] **Step 5: Typecheck**

Run (from `frontend/`): `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/components/dashboard/KpiRow.tsx frontend/components/dashboard/TrendCharts.tsx frontend/components/dashboard/AtRiskPanel.tsx frontend/components/dashboard/ActivityFeed.tsx
git commit -m "feat: dashboard KPI row, trend charts, at-risk and activity panels"
```

---

## Task 10: Assemble the dashboard home

**Files:**
- Modify: `frontend/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Rebuild the page**

Replace `frontend/app/(dashboard)/dashboard/page.tsx` with a version that fetches data and composes the components. Use `Promise.allSettled` so one failing source never blocks the rest:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { fadeUp, stagger } from '@/lib/design/tokens';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import KpiRow, { KpiData } from '@/components/dashboard/KpiRow';
import TrendCharts, { AttendancePoint, FeePoint, GradeBucket } from '@/components/dashboard/TrendCharts';
import AtRiskPanel, { AtRiskItem } from '@/components/dashboard/AtRiskPanel';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import { OnboardingCounts } from '@/lib/dashboard/helpers';

interface Summary {
  onboarding: OnboardingCounts;
  gradeDistribution: GradeBucket[];
  attendanceTrend: AttendancePoint[];
}

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('');
  const [counts, setCounts] = useState<OnboardingCounts>({ classes: 0, subjects: 0, students: 0, exams: 0 });
  const [grades, setGrades] = useState<GradeBucket[]>([]);
  const [attendance, setAttendance] = useState<AttendancePoint[]>([]);
  const [fees, setFees] = useState<FeePoint[]>([]);
  const [kpi, setKpi] = useState<KpiData>({
    students: null, attendancePercent: null, attendancePrev: null,
    feesCollected: null, feesThisMonth: null, upcomingExams: 0,
  });
  const [atRisk, setAtRisk] = useState<AtRiskItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    Promise.allSettled([
      api.get('/analytics/dashboard-summary'),
      api.get('/students/stats'),
      api.get('/finance/dashboard'),
      api.get('/exams?limit=5&upcoming=true'),
      api.get('/analytics/at-risk'),
      api.get('/audit?limit=6'),
    ]).then(([summary, students, finance, exams, risk, audit]) => {
      if (summary.status === 'fulfilled') {
        const s = summary.value.data.data as Summary;
        setCounts(s.onboarding);
        setGrades(s.gradeDistribution);
        setAttendance(s.attendanceTrend);
        const last = s.attendanceTrend[s.attendanceTrend.length - 1]?.percent ?? null;
        const prev = s.attendanceTrend[s.attendanceTrend.length - 2]?.percent ?? null;
        setKpi((k) => ({ ...k, attendancePercent: last, attendancePrev: prev }));
      }
      if (students.status === 'fulfilled') {
        const st = students.value.data.data;
        setKpi((k) => ({ ...k, students: { total: st.total, thisMonth: st.thisMonth } }));
      }
      if (finance.status === 'fulfilled') {
        const f = finance.value.data.data;
        setFees((f.monthlyData ?? []).map((m: { month: string; collected: number }) => ({ month: m.month, collected: m.collected })));
        setKpi((k) => ({ ...k, feesCollected: f.totalCollected, feesThisMonth: f.collectedThisMonth }));
      }
      if (exams.status === 'fulfilled') {
        const list = exams.value.data.data ?? [];
        const next = list[0];
        setKpi((k) => ({ ...k, upcomingExams: list.length, nextExamLabel: next ? `next: ${next.subject?.name ?? next.name}` : undefined }));
      }
      if (risk.status === 'fulfilled') setAtRisk(risk.value.data.items ?? []);
      if (audit.status === 'fulfilled') {
        const rows = audit.value.data.data ?? audit.value.data.items ?? [];
        setActivity(rows.map((r: { id: string; action: string; entity: string; createdAt: string; user?: { firstName: string } }) => ({
          id: r.id, action: r.action, entity: r.entity, createdAt: r.createdAt, actorName: r.user?.firstName,
        })));
      }
    });
  }, []);

  return (
    <div className="p-6 space-y-5">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-white">{greeting} 👋</h1>
        <p className="text-sm text-zinc-500">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </motion.div>

      <OnboardingChecklist counts={counts} />
      <KpiRow data={kpi} />
      <TrendCharts attendance={attendance} fees={fees} grades={grades} />

      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AtRiskPanel items={atRisk} />
        <ActivityFeed items={activity} />
      </motion.div>
    </div>
  );
}
```

> Implementer: confirm the exact shapes of `/students/stats`, `/finance/dashboard` (`monthlyData`, `totalCollected`, `collectedThisMonth`), `/analytics/at-risk` (`items`), and `/audit` (`data`/`items`, plus `action`/`entity`/`user` fields) by reading their controllers. Adjust the mapping to match. The old dashboard page used `/students/stats`, `/finance/dashboard`, and `/exams?upcoming=true`, so those shapes are known-good there.

- [ ] **Step 2: Build to verify**

Run (from `frontend/`): `npx next build`
Expected: exit 0; `/dashboard` route compiles.

- [ ] **Step 3: Manual verification (document result in commit/PR)**

Run the app (`npm run dev` in `frontend/`, backend running), log in as an admin:
- Dashboard shows greeting, onboarding checklist (for a school missing students/exams), KPI cards, charts, at-risk + activity.
- `+New` menu opens and routes correctly.
- No console errors.

- [ ] **Step 4: Commit**

```bash
git add "frontend/app/(dashboard)/dashboard/page.tsx"
git commit -m "feat: rebuild dashboard home from Refined Dark components"
```

---

## Task 11: Final verification

- [ ] **Step 1: Full typecheck + build + tests**

Run:
- `cd backend && npm test && npx tsc --noEmit` → all pass, exit 0.
- `cd frontend && npm test && npx next build` → all pass, exit 0.

- [ ] **Step 2: Final review + handoff**

Use superpowers:finishing-a-development-branch to decide merge/PR for `feature/dashboard-redesign`.

---

## Self-Review

**Spec coverage:**
- Design system tokens + shared components → Tasks 5, 6. ✓
- Rich dashboard home (KPIs, charts incl. grade donut, at-risk, activity) → Tasks 9, 10. ✓
- Onboarding checklist → Tasks 2 (logic) + 8 (UI). ✓
- Global +New → Task 7. ✓
- Backend `dashboard-summary` (onboarding counts, grade distribution, attendance trend) → Tasks 3, 4. ✓
- App shell refine → top-bar +New (Task 7); deeper sidebar polish is low-risk styling folded into Task 7/cosmetic and not separately required by the spec's Phase-1 must-haves.
- TDD on behavioral logic → Tasks 2, 3 (pure) + guard test Task 4. ✓

**Placeholder scan:** No TBD/TODO; each code step has full code. Implementer notes call out shapes to confirm against the schema/controllers (these are verification reminders, not missing content).

**Type consistency:** `OnboardingCounts`/`onboardingSteps` shared between helpers, checklist, and page. `Direction` shared between helpers and StatCard. `GradeBucket`/`AttendancePoint` defined in TrendCharts and reused in the page import. Endpoint response `{ success, data: { onboarding, gradeDistribution, attendanceTrend } }` matches the page's `summary.value.data.data` access.
