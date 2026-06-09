# Dashboard Redesign Phase 3 — Implementation Plan

> REQUIRED SUB-SKILL: subagent-driven-development / executing-plans. Checkbox steps.

**Goal:** Modernize Student/Exam/Practice forms into multi-step wizards with searchable selects, inline validation, avatar-URL field, and dependent class→subject.

**Architecture:** Frontend-only. New shared components (Wizard, Combobox, AvatarField, FormField) + a pure `filterOptions` helper (TDD). Forms use react-hook-form with `mode:'onTouched'`; steps validate via `trigger()` before advancing. Existing endpoints unchanged.

**Spec:** `docs/superpowers/specs/2026-06-09-dashboard-redesign-phase-3-design.md`. **Branch:** `feature/dashboard-redesign-phase-3`.

---

## Task 1: filterOptions pure helper (TDD)
**Files:** Create `frontend/lib/forms.ts`, `frontend/lib/forms.test.ts`

- [ ] Test (`forms.test.ts`):
```ts
import { describe, it, expect } from 'vitest';
import { filterOptions } from './forms';
const opts = [{ value: '1', label: 'Class 6' }, { value: '2', label: 'Class 7 - A' }, { value: '3', label: 'Mathematics' }];
describe('filterOptions', () => {
  it('returns all for empty query', () => expect(filterOptions(opts, '')).toHaveLength(3));
  it('matches case-insensitively by label substring', () => {
    expect(filterOptions(opts, 'class').map(o => o.value)).toEqual(['1', '2']);
    expect(filterOptions(opts, 'MATH')).toHaveLength(1);
  });
  it('returns [] when nothing matches', () => expect(filterOptions(opts, 'zzz')).toEqual([]));
});
```
- [ ] Run → fail. `cd frontend && npm test -- forms`
- [ ] Implement `frontend/lib/forms.ts`:
```ts
export interface Option { value: string; label: string }
export function filterOptions(options: Option[], query: string): Option[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => o.label.toLowerCase().includes(q));
}
```
- [ ] Run → pass. Commit: `feat: filterOptions helper for searchable selects`

## Task 2: Shared form components
**Files:** Create `frontend/components/ui/form-field.tsx`, `combobox.tsx`, `avatar-field.tsx`, `wizard.tsx`

- [ ] **FormField**:
```tsx
import * as React from 'react';
export function FormField({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-300">{label}{required && <span className="text-red-400"> *</span>}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
```
- [ ] **Combobox** (searchable single-select on radix popover):
```tsx
'use client';
import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { filterOptions, Option } from '@/lib/forms';
export function Combobox({ options, value, onChange, placeholder = 'Select…', disabled }: {
  options: Option[]; value?: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const selected = options.find((o) => o.value === value);
  const filtered = filterOptions(options, query);
  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(''); }}>
      <Popover.Trigger asChild disabled={disabled}>
        <button type="button" className="w-full h-10 flex items-center justify-between rounded-lg bg-zinc-800 border border-zinc-700 px-3 text-sm text-left disabled:opacity-50">
          <span className={selected ? 'text-white' : 'text-zinc-500'}>{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="w-4 h-4 text-zinc-500" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={4} className="z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl p-1">
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-zinc-800">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-zinc-600 px-3 py-2">No matches</p>
            ) : filtered.map((o) => (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-800 text-left">
                {o.label}{o.value === value && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
```
- [ ] **AvatarField**:
```tsx
'use client';
import { Input } from '@/components/ui/input';
export function AvatarField({ value, onChange, initials }: { value?: string; onChange: (v: string) => void; initials?: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
        {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : (initials || '?')}
      </div>
      <div className="flex-1">
        <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="Image URL (https://…)" />
        <p className="text-xs text-zinc-600 mt-1">Paste an image URL. File upload coming later.</p>
      </div>
    </div>
  );
}
```
- [ ] **Wizard** (stepper + nav):
```tsx
'use client';
import * as React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
export interface WizardStep { id: string; title: string; content: React.ReactNode }
export function Wizard({ steps, onValidateStep, onSubmit, submitting, submitLabel = 'Save' }: {
  steps: WizardStep[];
  onValidateStep: (stepId: string) => Promise<boolean> | boolean;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const [i, setI] = React.useState(0);
  const last = i === steps.length - 1;
  async function next() { if (await onValidateStep(steps[i].id)) setI((n) => Math.min(n + 1, steps.length - 1)); }
  async function finish() { if (await onValidateStep(steps[i].id)) onSubmit(); }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${idx < i ? 'bg-blue-600 text-white' : idx === i ? 'bg-blue-600/20 text-blue-400 border border-blue-500' : 'bg-zinc-800 text-zinc-500'}`}>
                {idx < i ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </span>
              <span className={`text-xs ${idx === i ? 'text-white' : 'text-zinc-500'}`}>{s.title}</span>
            </div>
            {idx < steps.length - 1 && <div className="flex-1 h-px bg-zinc-800" />}
          </React.Fragment>
        ))}
      </div>
      <div>{steps[i].content}</div>
      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" disabled={i === 0 || submitting} onClick={() => setI((n) => Math.max(n - 1, 0))} className="text-zinc-400">Back</Button>
        {last ? (
          <Button type="button" onClick={finish} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">{submitting && <Loader2 className="w-4 h-4 animate-spin" />}{submitLabel}</Button>
        ) : (
          <Button type="button" onClick={next} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">Next →</Button>
        )}
      </div>
    </div>
  );
}
```
- [ ] Typecheck. Commit: `feat: form components (FormField, Combobox, AvatarField, Wizard)`

## Task 3: Student drawer → wizard
**Files:** Modify `frontend/components/students/StudentDrawer.tsx`
- [ ] Rebuild using react-hook-form (`mode:'onTouched'`), `Wizard`, `Combobox` (class), `AvatarField` (photoUrl), `FormField`. Steps: Personal (firstName,lastName,dob,gender,bloodGroup,photoUrl) → Academic (classId,rollNumber) → Guardian (guardianName,guardianPhone,guardianEmail,address) → Review (+ portal access toggle on create). `onValidateStep` calls `trigger(fieldsForStep)`. Keep submit payload + edit prefill identical to current. Omit `photoUrl` when blank.
- [ ] `npx next build` → 0. Commit: `feat: multi-step Student wizard with searchable class + avatar`

## Task 4: Exam new → wizard
**Files:** Modify `frontend/app/(dashboard)/dashboard/exams/new/page.tsx`
- [ ] 2-step wizard. Step 1 Details: name, class (Combobox), subject (Combobox, dependent on class via `/exams/subjects?classId=`), examType. Step 2 Schedule: examDate, totalMarks, passingMarks, term. react-hook-form `onTouched`; `trigger` per step. Same POST `/exams`.
- [ ] Build → 0. Commit: `feat: multi-step New Exam wizard with dependent subject`

## Task 5: Practice create → wizard
**Files:** Modify `frontend/app/(dashboard)/dashboard/practice/page.tsx`
- [ ] Convert the create drawer to react-hook-form + 2-step wizard. Step 1 Details: title, description, type, fileUrl. Step 2 Targeting: class (Combobox) → subject (Combobox, dependent), isPublished. Keep list/filters. Same POST `/practice-materials` (classId/subjectId nullable).
- [ ] Build → 0. Commit: `feat: multi-step Practice Materials wizard`

## Task 6: Final verification
- [ ] `cd frontend && npm test && npx next build` → pass/0. (backend untouched; run `cd backend && npx tsc --noEmit` as a sanity check.)
- [ ] Final code-review subagent over the phase diff.
- [ ] finishing-a-development-branch.

---

## Self-Review
**Coverage:** Wizard+Combobox+AvatarField+FormField (T2); filterOptions TDD (T1); Student/Exam/Practice wizards (T3–T5); searchable selects (Combobox), inline validation (`onTouched`+trigger), avatar-URL (AvatarField), dependent class→subject (T4/T5). ✓
**Placeholders:** Shared components have full code; form rebuilds specify exact steps/fields/endpoints (authored at implementation with full context). 
**Types:** `Option {value,label}` shared by filterOptions + Combobox; Wizard `WizardStep`; react-hook-form `trigger` field name lists per step.
