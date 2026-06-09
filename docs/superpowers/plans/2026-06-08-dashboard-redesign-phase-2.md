# Dashboard Redesign Phase 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Apply the Refined Dark system to the core management screens and add bulk actions + Students CSV import/export.

**Architecture:** A generic `DataTable` + `BulkActionBar` drive selection. Students page gains bulk deactivate / export / move-class / send-notice and CSV import (client parses with papaparse → backend validates per row, resolves class by name+section, partial success). New backend endpoints with pure, TDD'd helpers.

**Tech Stack:** Next 15 / React 19 / TS / framer-motion / papaparse (new); backend Express + Prisma + Jest.

**Spec:** `docs/superpowers/specs/2026-06-08-dashboard-redesign-phase-2-design.md`
**Branch:** `feature/dashboard-redesign-phase-2` (NOT main).

**Testing:** backend Jest in `backend/test/` (pure + guard, DB-free); frontend vitest (pure logic). UI verified via `npx next build` + manual.

---

## Task 1: Backend student-import pure helpers (TDD)

**Files:**
- Create: `backend/src/modules/students/students.import.ts`
- Create: `backend/test/modules/students.import.test.ts`

- [ ] **Step 1: Failing tests**

`backend/test/modules/students.import.test.ts`:
```ts
import { resolveClassId, validateImportRow } from '../../src/modules/students/students.import';

const classes = [
  { id: 'c1', name: 'Class 6', section: 'A' },
  { id: 'c2', name: 'Class 6', section: null },
  { id: 'c3', name: 'Class 7', section: null },
];

describe('resolveClassId', () => {
  it('matches by name + section, case-insensitively', () => {
    expect(resolveClassId(classes, 'class 6', 'a')).toBe('c1');
  });
  it('matches name with empty section to the null-section class', () => {
    expect(resolveClassId(classes, 'Class 6', '')).toBe('c2');
    expect(resolveClassId(classes, 'Class 7', undefined)).toBe('c3');
  });
  it('returns null when no match', () => {
    expect(resolveClassId(classes, 'Class 9', '')).toBeNull();
  });
});

describe('validateImportRow', () => {
  it('returns a normalized create input for a valid row', () => {
    const r = validateImportRow(
      { firstName: 'Ali', lastName: 'Khan', className: 'Class 6', section: 'A', guardianName: 'Mr Khan', guardianPhone: '0171' },
      classes,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.classId).toBe('c1');
      expect(r.value.firstName).toBe('Ali');
      expect(r.value.guardianPhone).toBe('0171');
    }
  });
  it('fails when a required field is missing', () => {
    const r = validateImportRow({ firstName: '', lastName: 'X', className: 'Class 6', section: 'A', guardianName: 'g', guardianPhone: '1' }, classes);
    expect(r.ok).toBe(false);
  });
  it('fails when the class cannot be resolved', () => {
    const r = validateImportRow({ firstName: 'A', lastName: 'B', className: 'Nope', guardianName: 'g', guardianPhone: '1' }, classes);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/class/i);
  });
});
```

- [ ] **Step 2: Run → fail** `cd backend && npm test -- students.import` (module missing).

- [ ] **Step 3: Implement** `backend/src/modules/students/students.import.ts`:
```ts
export interface ClassLite { id: string; name: string; section: string | null }

export interface RawStudentRow {
  firstName?: string;
  lastName?: string;
  className?: string;
  section?: string;
  rollNumber?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface ImportCreateInput {
  classId: string;
  firstName: string;
  lastName: string;
  guardianName: string;
  guardianPhone: string;
  rollNumber?: string;
  guardianEmail?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
}

export type RowResult =
  | { ok: true; value: ImportCreateInput }
  | { ok: false; message: string };

export function resolveClassId(classes: ClassLite[], name?: string, section?: string): string | null {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  const s = (section ?? '').trim().toLowerCase();
  const match = classes.find(
    (c) => c.name.trim().toLowerCase() === n && (c.section ?? '').trim().toLowerCase() === s,
  );
  return match ? match.id : null;
}

export function validateImportRow(row: RawStudentRow, classes: ClassLite[]): RowResult {
  const firstName = row.firstName?.trim();
  const lastName = row.lastName?.trim();
  const guardianName = row.guardianName?.trim();
  const guardianPhone = row.guardianPhone?.trim();
  if (!firstName || !lastName || !guardianName || !guardianPhone) {
    return { ok: false, message: 'Missing required field (firstName, lastName, guardianName, guardianPhone)' };
  }
  const classId = resolveClassId(classes, row.className, row.section);
  if (!classId) {
    return { ok: false, message: `Class not found: "${row.className ?? ''}${row.section ? ' ' + row.section : ''}"` };
  }
  const gender = row.gender?.trim().toLowerCase();
  const value: ImportCreateInput = {
    classId, firstName, lastName, guardianName, guardianPhone,
    ...(row.rollNumber?.trim() ? { rollNumber: row.rollNumber.trim() } : {}),
    ...(row.guardianEmail?.trim() ? { guardianEmail: row.guardianEmail.trim() } : {}),
    ...(gender === 'male' || gender === 'female' || gender === 'other' ? { gender } : {}),
    ...(row.dateOfBirth?.trim() ? { dateOfBirth: row.dateOfBirth.trim() } : {}),
  };
  return { ok: true, value };
}
```

- [ ] **Step 4: Run → pass.** `npm test -- students.import`
- [ ] **Step 5: Commit** `git add backend/src/modules/students/students.import.ts backend/test/modules/students.import.test.ts && git commit -m "feat: student CSV import pure helpers (resolveClassId, validateImportRow)"`

---

## Task 2: Backend bulk + import + notify endpoints

**Files:**
- Modify: `backend/src/modules/students/students.service.ts`, `students.controller.ts`, `students.routes.ts`, `students.validator.ts`
- Modify: `backend/src/modules/notifications/notifications.{service,controller,routes,validator}.ts`
- Create: `backend/test/api/students-bulk.test.ts`

- [ ] **Step 1: Guard tests** — `backend/test/api/students-bulk.test.ts`:
```ts
import request from 'supertest';
import app from '../../src/app';

describe('students bulk/import + notify — guards', () => {
  it('bulk requires slug', async () => {
    const r = await request(app).post('/api/students/bulk').send({ action: 'deactivate', ids: [] });
    expect(r.status).toBe(400);
  });
  it('import requires slug', async () => {
    const r = await request(app).post('/api/students/import').send({ rows: [] });
    expect(r.status).toBe(400);
  });
  it('notify-students requires slug', async () => {
    const r = await request(app).post('/api/notifications/notify-students').send({ studentIds: [], subject: 'x', message: 'y', channels: ['in_app'] });
    expect(r.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run → fail** (routes 404, but tenant middleware returns 400 first → these may PASS immediately like other guard tests; that's acceptable — the guard is the assertion). Run `npm test -- students-bulk` to confirm green after wiring; for now confirm it runs.

- [ ] **Step 3: Validators** — in `students.validator.ts` append:
```ts
export const bulkStudentSchema = z.object({
  action: z.enum(['deactivate', 'delete', 'move-class']),
  ids: z.array(z.string().cuid()).min(1),
  classId: z.string().cuid().optional(),
});
export const importStudentsSchema = z.object({
  rows: z.array(z.record(z.string(), z.string().optional())).min(1).max(1000),
});
```
In `notifications.validator.ts` append:
```ts
export const notifyStudentsSchema = z.object({
  studentIds: z.array(z.string().cuid()).min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
  channels: z.array(z.enum(['email', 'sms', 'in_app'])).min(1),
});
```

- [ ] **Step 4: Student service** — in `students.service.ts` append:
```ts
import { validateImportRow, RawStudentRow } from './students.import';

export async function bulkStudents(
  schoolId: string,
  action: 'deactivate' | 'delete' | 'move-class',
  ids: string[],
  classId?: string,
) {
  // Only touch rows that belong to this tenant.
  const owned = await prisma.student.findMany({ where: { id: { in: ids }, schoolId }, select: { id: true } });
  const ownedIds = owned.map((s) => s.id);
  if (ownedIds.length === 0) return { affected: 0 };

  if (action === 'move-class') {
    if (!classId) throw new AppError(400, 'classId is required to move students');
    const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) throw new AppError(404, 'Target class not found');
    const res = await prisma.student.updateMany({ where: { id: { in: ownedIds }, schoolId }, data: { classId } });
    return { affected: res.count };
  }
  // 'deactivate' and 'delete' both soft-deactivate (hard delete is unsafe with dependent records).
  const res = await prisma.student.updateMany({ where: { id: { in: ownedIds }, schoolId }, data: { status: 'inactive' } });
  return { affected: res.count };
}

export async function importStudents(schoolId: string, rows: RawStudentRow[]) {
  const classes = await prisma.class.findMany({ where: { schoolId }, select: { id: true, name: true, section: true } });
  let created = 0;
  const errors: { row: number; message: string }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const result = validateImportRow(rows[i], classes);
    if (!result.ok) { errors.push({ row: i + 1, message: result.message }); continue; }
    try {
      await prisma.student.create({
        data: {
          schoolId,
          ...result.value,
          ...(result.value.dateOfBirth ? { dateOfBirth: new Date(result.value.dateOfBirth) } : {}),
        },
      });
      created += 1;
    } catch (e) {
      errors.push({ row: i + 1, message: e instanceof Error ? e.message : 'Failed to create' });
    }
  }
  return { created, errors };
}
```

- [ ] **Step 5: Student controller** — append handlers `bulk` and `importCsv` (parse with `bulkStudentSchema` / `importStudentsSchema`, call service, `res.json({ success: true, data })`). **Verify** `students.service.ts` already imports `AppError` (it does for existing code); if not, add it.

- [ ] **Step 6: Student routes** — add:
```ts
router.post('/bulk', requireRole('school_admin', 'teacher', 'super_admin'), controller.bulk);
router.post('/import', requireRole('school_admin', 'super_admin'), controller.importCsv);
```
Place these BEFORE `router.get('/:id', ...)` to avoid param capture.

- [ ] **Step 7: Notify** — in `notifications.service.ts` add `notifyStudents(schoolId, { studentIds, subject, message, channels })`: resolve guardian recipients for those students (reuse the broadcast send loop — fetch students `where id in ids, schoolId`, gather `guardianEmail`/parent user, send via the existing send mechanism), return `{ sent }`. Add controller `notifyStudents` + route `router.post('/notify-students', requireRole('school_admin','teacher'), ctrl.notifyStudents)`.

> Implementer note: read `sendBroadcast`/`resolveRecipients` in `notifications.service.ts` and reuse the same per-recipient send path; do not duplicate the channel-sending logic — extract a shared `sendToRecipients(recipients, subject, message, channels)` if needed.

- [ ] **Step 8: Verify** `cd backend && npm test -- students-bulk && npx tsc --noEmit` → green, exit 0.
- [ ] **Step 9: Commit** `git add backend/src/modules/students backend/src/modules/notifications backend/test/api/students-bulk.test.ts && git commit -m "feat: student bulk ops, CSV import, and targeted notify endpoints"`

---

## Task 3: Frontend CSV helpers (TDD)

**Files:**
- Modify: `frontend/package.json` (add `papaparse`, `@types/papaparse`)
- Create: `frontend/lib/csv.ts`, `frontend/lib/csv.test.ts`

- [ ] **Step 1: Install** `cd frontend && npm i papaparse && npm i -D @types/papaparse`
- [ ] **Step 2: Failing tests** `frontend/lib/csv.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('writes a header row and escapes commas/quotes/newlines', () => {
    const csv = toCsv(
      [{ a: 'x', b: 'has,comma' }, { a: 'quote"d', b: 'line\nbreak' }],
      [{ key: 'a', header: 'A' }, { key: 'b', header: 'B' }],
    );
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('A,B');
    expect(lines[1]).toBe('x,"has,comma"');
    expect(lines[2]).toBe('"quote""d","line\nbreak"');
  });
});
```
- [ ] **Step 3: Run → fail.** `npm test -- csv`
- [ ] **Step 4: Implement** `frontend/lib/csv.ts`:
```ts
import Papa from 'papaparse';

export interface CsvColumn<T> { key: keyof T & string; header: string }

function esc(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => esc(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(',')).join('\r\n');
  return body ? `${header}\r\n${body}` : header;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export interface ParsedCsv { headers: string[]; rows: Record<string, string>[] }

export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const headers = result.meta.fields ?? [];
  return { headers, rows: result.data };
}
```
- [ ] **Step 5: Run → pass.** `npm test -- csv`
- [ ] **Step 6: Commit** `git add frontend/package.json frontend/package-lock.json frontend/lib/csv.ts frontend/lib/csv.test.ts && git commit -m "feat: CSV helpers (toCsv/downloadCsv/parseCsv) + papaparse"`

---

## Task 4: DataTable + BulkActionBar components

**Files:** Create `frontend/components/ui/data-table.tsx`, `frontend/components/ui/bulk-action-bar.tsx`

- [ ] **Step 1: DataTable** — generic table with selection. Props:
```tsx
'use client';
import * as React from 'react';
import { SURFACE } from '@/lib/design/tokens';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T> { key: string; header: React.ReactNode; render: (row: T) => React.ReactNode; className?: string }

export function DataTable<T>({
  rows, columns, getId, loading, selectedIds, onSelectionChange, empty,
}: {
  rows: T[]; columns: Column<T>[]; getId: (row: T) => string;
  loading?: boolean;
  selectedIds?: Set<string>; onSelectionChange?: (ids: Set<string>) => void;
  empty?: React.ReactNode;
}) {
  const selectable = !!selectedIds && !!onSelectionChange;
  const allSelected = selectable && rows.length > 0 && rows.every((r) => selectedIds!.has(getId(r)));
  function toggleAll() {
    if (!selectable) return;
    const next = new Set(selectedIds);
    if (allSelected) rows.forEach((r) => next.delete(getId(r)));
    else rows.forEach((r) => next.add(getId(r)));
    onSelectionChange!(next);
  }
  function toggle(id: string) {
    if (!selectable) return;
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange!(next);
  }
  return (
    <div className={`${SURFACE} overflow-hidden`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            {selectable && (
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-zinc-600" />
              </th>
            )}
            {columns.map((c) => (
              <th key={c.key} className={`text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3 ${c.className ?? ''}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-800/50">
                {selectable && <td className="px-4 py-3"><Skeleton className="h-4 w-4 bg-zinc-800" /></td>}
                {columns.map((c) => <td key={c.key} className="px-4 py-3"><Skeleton className="h-4 w-24 bg-zinc-800" /></td>)}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12">{empty}</td></tr>
          ) : (
            rows.map((r) => {
              const id = getId(r);
              const sel = selectable && selectedIds!.has(id);
              return (
                <tr key={id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${sel ? 'bg-blue-500/5' : ''}`}>
                  {selectable && (
                    <td className="px-4 py-3"><input type="checkbox" checked={sel} onChange={() => toggle(id)} className="rounded border-zinc-600" /></td>
                  )}
                  {columns.map((c) => <td key={c.key} className={`px-4 py-3 ${c.className ?? ''}`}>{c.render(r)}</td>)}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: BulkActionBar**:
```tsx
'use client';
import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export function BulkActionBar({ count, onClear, children }: { count: number; onClear: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          className="sticky bottom-4 z-30 mx-auto w-fit flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/95 backdrop-blur px-4 py-2 shadow-2xl"
        >
          <span className="text-sm text-zinc-300">{count} selected</span>
          <div className="flex items-center gap-2">{children}</div>
          <button onClick={onClear} className="text-zinc-500 hover:text-zinc-300" aria-label="Clear selection"><X className="w-4 h-4" /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Typecheck** `cd frontend && npx tsc --noEmit` → 0.
- [ ] **Step 4: Commit** `git add frontend/components/ui/data-table.tsx frontend/components/ui/bulk-action-bar.tsx && git commit -m "feat: reusable DataTable with selection + BulkActionBar"`

---

## Task 5: Students screen — DataTable + bulk actions + import/export

**Files:** Modify `frontend/app/(dashboard)/dashboard/students/page.tsx`; Create `frontend/components/students/StudentImportDialog.tsx`.

- [ ] **Step 1: StudentImportDialog** — file input → `parseCsv` → preview first rows + count → POST `/students/import` `{ rows }` → show `{ created, errors }`. On success `onImported()`. (Full component; uses Dialog, Button, helpers from `lib/csv.ts`.)

- [ ] **Step 2: Rebuild students page** with:
  - `selectedIds` state (`Set<string>`), DataTable with `selectable`.
  - Columns: Student (avatar+name), Class, Roll, Guardian, Status.
  - Header actions: `Import` (opens dialog), `Export` (downloadCsv of current rows via `toCsv`), existing `Add Student`.
  - `BulkActionBar` with: **Deactivate** (`POST /students/bulk {action:'deactivate', ids}`), **Export selected** (`toCsv` of selected), **Move class** (opens class-picker dialog → `POST /students/bulk {action:'move-class', ids, classId}`), **Send notice** (opens subject/message dialog → `POST /notifications/notify-students {studentIds, subject, message, channels:['in_app']}`).
  - After any bulk action: toast result, clear selection, refetch.
  - Keep existing `StudentDrawer` for single add/edit.

> Full code written during implementation; reuse the existing fetch/columns from the current page and the `Dialog`, `Select`, `Input` primitives. Keep each dialog small and local to the page or as tiny components.

- [ ] **Step 3: Build** `npx next build` → exit 0.
- [ ] **Step 4: Manual** — select rows, run each action; import a CSV with good+bad rows (partial success); export downloads.
- [ ] **Step 5: Commit** `git add ... && git commit -m "feat: students DataTable with bulk actions and CSV import/export"`

---

## Task 6: Exams restyle + Classes/Subjects header alignment

**Files:** Modify `frontend/app/(dashboard)/dashboard/exams/page.tsx`, `classes/page.tsx`, `subjects/page.tsx`.

- [ ] **Step 1:** Exams page → `PageHeader` + `DataTable` (columns: name, class, subject, type, date, published). Optional bulk delete via `BulkActionBar` (skip if exam delete has heavy dependencies — then no selection).
- [ ] **Step 2:** Classes/Subjects → replace the hand-rolled header block with `<PageHeader title subtitle actions={<Add button>} />`. Keep card grids.
- [ ] **Step 3: Build** `npx next build` → 0.
- [ ] **Step 4: Commit** `git add ... && git commit -m "feat: restyle exams onto DataTable; align classes/subjects headers"`

---

## Task 7: Final verification

- [ ] `cd backend && npm test && npx tsc --noEmit` → all pass, 0.
- [ ] `cd frontend && npm test && npx next build` → all pass, 0.
- [ ] Dispatch final code-review subagent over `2bdf095..HEAD`.
- [ ] superpowers:finishing-a-development-branch.

---

## Self-Review

**Spec coverage:** DataTable+BulkBar (T4); Students bulk 4 actions + import/export (T2,T3,T5); Exams restyle + Classes/Subjects alignment (T6); backend bulk/import/notify + pure helpers (T1,T2); papaparse (T3). ✓
**Placeholders:** Backend + helper + csv code is complete; T5/T6 UI assembly is specified with exact endpoints/props and reuses existing primitives (full code at implementation, consistent with hybrid execution by an author with full context).
**Type consistency:** `RawStudentRow`/`validateImportRow`/`importStudents` aligned; `Column<T>`/`DataTable` selection via `Set<string>`; CSV `toCsv(rows, columns)` shape matches usage.
