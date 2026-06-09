# CampusFlow Dashboard Redesign — Phase 3 Design

**Date:** 2026-06-09
**Status:** Approved (scope); spec under review
**Builds on:** Phases 1 & 2 (merged). **Branch:** `feature/dashboard-redesign-phase-3`
**Scope:** Frontend only — all target endpoints already exist.

## Context

Phases 1–2 delivered the design system, dashboard, list screens, bulk actions, and CSV. Phase 3
modernizes the data-entry **forms** into multi-step wizards with friendlier field UX. No backend
changes are required: the Student/Exam/Practice create+update endpoints and `Student.photoUrl` already
exist.

## Goals

1. A reusable **Wizard/Stepper** pattern (progress indicator, Back/Next, per-step validation).
2. **Student** Add/Edit → wizard: Personal → Academic → Guardian → Review.
3. **Exam** New → 2-step wizard: Details → Schedule & marks.
4. **Practice Materials** create → wizard: Details → Targeting.
5. Field UX: **searchable selects** (Combobox), **inline live validation**, **avatar + image-URL** field, **dependent class→subject**.

## Non-Goals

- Real file/photo upload to object storage (deferred — no storage infra/creds). Avatar takes an image URL for now.
- Marks-entry grid / fee-structure forms (later).
- Bilingual translation (Phase 4).
- Backend changes.

## Architecture (frontend)

New shared pieces:
- `components/ui/wizard.tsx` — `Wizard` (renders a `Stepper` header + current step + Back/Next/Submit). Controlled via a `steps` array `{ id, title, fields }` and a `validateStep(stepId)` callback supplied by the form; advancing calls validation and blocks on errors. Keeps step state internally; exposes `onSubmit` on the last step.
- `components/ui/combobox.tsx` — searchable single-select built on `@radix-ui/react-popover` + an input filter; props `{ options: {value,label}[], value, onChange, placeholder, disabled }`.
- `components/ui/avatar-field.tsx` — circular preview (image or initials) + an image-URL input; `{ value, onChange, initials }`.
- `components/ui/form-field.tsx` — `{ label, error, required, children }` wrapper for consistent label + inline error styling.
- `lib/forms.ts` — pure helper `filterOptions(options, query)` (case-insensitive contains), TDD'd.

Forms:
- `components/students/StudentDrawer.tsx` — rebuilt as a wizard inside the existing `Sheet`. react-hook-form with `mode: 'onTouched'` (live validation). Steps validate their own fields via `trigger(fieldNames)` before advancing. Class via Combobox; avatar via AvatarField. Review step summarizes before submit. Same POST/PUT payloads as today.
- `app/(dashboard)/dashboard/exams/new/page.tsx` — 2-step wizard. Step 1: name, class (Combobox), subject (Combobox, dependent on class via `/exams/subjects?classId=`), examType. Step 2: examDate, totalMarks, passingMarks, term. react-hook-form `onTouched`.
- `app/(dashboard)/dashboard/practice/page.tsx` — convert the create drawer to react-hook-form + 2-step wizard. Step 1 (Details): title, description, type, fileUrl. Step 2 (Targeting): class (Combobox) → subject (Combobox, dependent), isPublished. Keep the list/filters as-is.

## Data Flow

- Each wizard owns react-hook-form state; "Next" runs `trigger(currentStepFields)`; only advances if valid. Final "Save" runs full submit (existing API calls). Errors render inline under fields (FormField).
- Combobox is controlled; dependent subject Combobox refetches/clears when class changes.
- Avatar field stores a URL string into `photoUrl`.

## Error Handling

- Per-step validation prevents advancing with invalid/missing required fields; the offending fields show inline errors and the step stays.
- API failures show a toast and keep the wizard open with entered data intact (no reset on error).

## Testing

- **vitest (pure):** `filterOptions` — case-insensitive substring, empty query returns all, no match returns [].
- **Manual:** create a student through all wizard steps incl. avatar URL + searchable class; back/next preserves data; invalid step blocks advance; create an exam (class→subject dependent) and a practice material; edit an existing student prefills steps.

## Rollout

Branch `feature/dashboard-redesign-phase-3`. Hybrid execution (inline TDD for the pure helper + per-task commits); final code-review subagent; finishing-a-development-branch.

## Open Questions / Assumptions

- Exam/Practice are short, but the user chose the wizard pattern app-wide; a 2-step wizard keeps them consistent without feeling heavy.
- StudentDrawer stays in the right-side Sheet (not a full page); the wizard renders inside it.
- `photoUrl` validates as a URL on the backend (`z.string().url()`); the avatar field should only send non-empty valid URLs (omit when blank).
