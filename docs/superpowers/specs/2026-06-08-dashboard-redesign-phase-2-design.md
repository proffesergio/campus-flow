# CampusFlow Dashboard Redesign — Phase 2 Design

**Date:** 2026-06-08
**Status:** Approved (scope); spec under review
**Builds on:** Phase 1 (Refined Dark design system, shared components) — merged to main.
**Branch:** `feature/dashboard-redesign-phase-2`

## Context

Phase 1 established the Refined Dark design system and the dashboard home. Phase 2 applies that
system to the core management screens and adds two power-user capabilities: **bulk actions** and
**Students CSV import/export**. The work centers on the Students screen (the only true high-volume
table); Classes/Subjects are already card grids from the earlier onboarding work and need only
header/spacing alignment; Exams is a table that gets the same DataTable treatment.

## Goals

1. A reusable **DataTable** with row selection + a bulk-action bar, used by Students (and Exams).
2. **Students** screen: DataTable + bulk actions (deactivate/delete, export selected, move class, send notice) + CSV import + export.
3. **Exams** screen: restyle onto shared components + DataTable.
4. **Classes/Subjects**: align to `PageHeader` and shared spacing (light touch — keep existing card grids).
5. Backend support: bulk student operations, CSV import (validated, per-row error report), targeted notify.

## Non-Goals (Phase 2)

- Attendance/Finance/Notifications/At-Risk screen restyles (later).
- Forms redesign (Phase 3).
- Bilingual translation (Phase 4).
- CSV for entities other than students.

## Architecture

### Frontend

- `components/ui/data-table.tsx` — generic `DataTable<T>`:
  - Props: `columns` (key, header, render), `rows`, `getId`, `selectable`, `selectedIds`, `onSelectionChange`, `loading`, `empty` (EmptyState), optional `rowHref`/`onRowClick`.
  - Renders header checkbox (select-all on current page), per-row checkbox, Refined Dark table styling, skeleton rows when loading.
  - Pure presentational; selection state owned by the parent.
- `components/ui/bulk-action-bar.tsx` — sticky bar shown when `selectedIds.length > 0`: count + action buttons + clear. Actions passed as props.
- `lib/csv.ts` — pure helpers: `toCsv(rows, columns)` (export) and `parseStudentsCsv(text)` → `{ rows, errors }` using `papaparse`. TDD'd.
- `components/students/StudentImportDialog.tsx` — file picker → parse (papaparse) → preview table + validation errors → POST to import endpoint → result summary (created N, failed M with row reasons).
- `components/students/StudentBulkBar.tsx` — wires the 4 bulk actions for students (uses BulkActionBar): Deactivate, Export CSV (client-side via `toCsv`), Move to class (class picker dialog), Send notice (subject/message dialog).
- Rebuild `app/(dashboard)/dashboard/students/page.tsx` on DataTable + selection + bulk bar + Import button.
- Restyle `app/(dashboard)/dashboard/exams/page.tsx` onto `PageHeader` + DataTable (bulk delete only).
- Align `classes/page.tsx` + `subjects/page.tsx` to use `PageHeader` (cosmetic; keep card grids).
- Add `papaparse` + `@types/papaparse` to frontend deps.

### Backend

- `POST /api/students/bulk` (roles: school_admin, teacher*, super_admin) — body `{ action: 'deactivate'|'delete'|'move-class', ids: string[], classId?: string }`. Tenant-scoped; verifies every id belongs to the school. `delete` restricted to school_admin/super_admin. Returns `{ affected }`.
- `POST /api/students/import` (roles: school_admin, super_admin) — body `{ rows: RawStudentRow[] }` where each row has the create fields **plus `className`/`section`** (not classId). Server resolves class by `(name, section, current academicYear)`; validates each row with a Zod schema; creates valid rows; returns `{ created, errors: [{ row: number, message: string }] }`. Does not abort on a bad row (partial success).
- `POST /api/notifications/notify-students` (roles: school_admin, teacher) — body `{ studentIds: string[], subject, message, channels }`. Resolves those students' guardian recipients and reuses the existing send path. Returns `{ sent }`.
- Pure helpers extracted for TDD: `resolveClassId(classes, name, section)` and the per-row student-import validation/normalization (`validateImportRow`).

## Data Flow

- **Selection:** Students page holds `selectedIds: Set<string>`; DataTable reflects/raises changes; BulkBar acts on the set; after an action, refetch + clear selection.
- **Export selected:** client-side — `toCsv` over the selected (or all filtered) rows → download Blob. No backend.
- **Import:** client parses file (papaparse) → preview/validate locally for obvious issues → POST rows → backend authoritative validation → show result; refetch list.
- **Move class / send notice:** open a small dialog, POST to the respective endpoint with `ids`.

## Error Handling

- Bulk endpoints validate ownership; any id outside the tenant → 400/skipped (report count). Partial success returns counts.
- Import never throws on a single bad row; collects `{row, message}` and continues. Frontend shows a per-row error list.
- Client CSV parse errors (malformed file, missing required columns) surface before any network call.

## Testing (TDD where logic is pure)

- **Backend (Jest):**
  - `resolveClassId` — exact match by name+section, case-insensitive, returns null when ambiguous/missing.
  - `validateImportRow` — required fields, class resolution failure → row error; valid row → normalized create input.
  - Guard tests: `/students/bulk`, `/students/import`, `/notifications/notify-students` reject without slug (400).
- **Frontend (vitest):**
  - `toCsv` — escapes commas/quotes/newlines; header order from columns.
  - `parseStudentsCsv` — maps headers, reports missing-required-column and per-row errors.
- **Manual:** select rows → each bulk action; import a sample CSV (some good, some bad rows) → partial success; export → file downloads.

## Rollout / Branch

- Branch `feature/dashboard-redesign-phase-2` off main (post-Phase-1).
- Hybrid execution: inline TDD + per-task commits; final code-review subagent; then finishing-a-development-branch.

## Open Questions / Assumptions

- CSV import columns (header row): `firstName,lastName,className,section,rollNumber,guardianName,guardianPhone,guardianEmail,gender,dateOfBirth`. Required: firstName, lastName, className, guardianName, guardianPhone. Others optional.
- `delete` in bulk = same rule as single delete (the service forbids deleting students with dependent records where applicable; otherwise sets inactive). If hard delete is unsafe, bulk "delete" degrades to deactivate and says so.
- Class resolution uses the current academic year (`String(new Date().getFullYear())`), matching the seed convention.
