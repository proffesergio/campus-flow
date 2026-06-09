# CampusFlow — Phase 4: Full Bilingual (English / বাংলা)

**Date:** 2026-06-09  **Branch:** `feature/i18n-phase-4`  **Scope:** Frontend i18n wiring + translations.

## Context
next-intl is already configured: `i18n/request.ts` loads `messages/${locale}.json` from the `NEXT_LOCALE`
cookie; `components/LanguageToggle.tsx` flips the cookie and `router.refresh()`. `messages/en.json` +
`bn.json` exist with namespaces (`nav, auth, common, status, students, attendance, exams, finance,
notifications, dashboard`) but **no screen uses `useTranslations`** — every string is hardcoded English,
so the toggle changes nothing visible. Phase 4 makes the toggle real.

## Goals
1. Every user-facing string on in-scope screens comes from `useTranslations` (client) / `getTranslations` (server).
2. `messages/en.json` and `messages/bn.json` have matching keys; **bn filled with AI-generated Bangla**.
3. Toggling EN⇄বাংলা visibly translates the app.

## Non-Goals
- Backend/API messages, emails/SMS, validation messages from the server.
- Dynamic DB content (school names, student names, user-entered text) — stays as entered.
- Number/date localization beyond what's trivial (keep `৳`/locale date as-is).

## Approach
- **Namespaces** (extend existing): `common` (buttons: save/cancel/add/edit/delete/search/loading…), `nav`,
  `auth`, `dashboard`, `students`, `classes`, `subjects`, `exams`, `attendance`, `finance`,
  `notifications`, `settings`, `profile`, `practice`, `atRisk`, `student` (portal), `parent` (portal).
- **Client components** (most screens are `'use client'`): `const t = useTranslations('students');` then `t('title')`.
- **Server components**: `const t = await getTranslations('x')` (few; most dashboard pages are client).
- Keep keys flat-ish per namespace; reuse `common` for shared verbs to avoid duplication.
- bn values authored in natural Bangla (AI-generated; user refines later).
- **Scope order:** shared (common/nav/auth) + admin screens first, then student & parent portals.

## Data flow
No new data flow. `useTranslations` reads the messages bundle resolved by `request.ts` from the cookie;
`LanguageToggle` already triggers re-render via `router.refresh()`.

## Testing
- **vitest (pure):** a `messages-parity` test asserting `en.json` and `bn.json` have identical key sets
  (recursively) so no key is missing/untranslated structurally.
- **Manual:** toggle to বাংলা on each in-scope screen; confirm labels switch and layout holds (Bangla can be longer).

## Rollout
Branch `feature/i18n-phase-4`; subagent-driven execution (implementer + spec + quality review per task);
finishing-a-development-branch at the end.

## Assumptions
- AI-generated Bangla is acceptable as a first pass.
- Where a string is dynamic data (names), it is NOT translated.
- Bangla digits: keep Western digits/`৳` formatting as today (no digit transliteration this phase).
