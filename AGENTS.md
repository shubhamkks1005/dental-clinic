# Dental clinic software: rules for AI agents

Single-clinic dental software (1 doctor, 1 receptionist, ~100-200 new patients/month).
Staff app + read-only patient portal. NO public website in this repo.
The human owner is a developer who gives you tasks; the doctor (his sister) is not technical.

## Start of every session (do this first, nothing else)
0. Fresh clone or "new laptop" (no node_modules)? Read docs/SETUP_NEW_LAPTOP.md first and guide the owner through it.
1. Read docs/RUN_PROMPT.md (standing rules), docs/HANDOFF.md / docs/STATE.md (where we are), docs/FIXES.md (the owner's bug and polish list, work it top to bottom), and docs/MAP.md (what each file does).
1b. Current phase is Phase Q (docs/PHASE_Q.md): read the section of the task named in HANDOFF.md. Product audit and designs: docs/product-audit/, docs/ui-audit/, docs/design/proposal/. FINAL DESIGNS WIN (owner, 2026-11-25): a file in docs/design/final/ (index: docs/design/final/README.md) is the final design for that screen and beats anything in docs/design/proposal/, the PDF or an older task text; docs/design/proposal/ is only a reference for screens that have no final design yet.
2. Do NOT read the whole codebase. Find files with search (grep/ripgrep), then read only the lines you need.
3. If the task needs a decision that is not in docs/SPEC.md or docs/DECISIONS.md, ASK the owner. Never guess clinical, legal, tax or money rules. (When following RUN_PROMPT.md, prefer writing the choice in DECISIONS.md and continuing unless it is a real blocker.)

## How to work
- One task at a time, by its id from docs/PLAN.md (example: 1.2.3). Do not start other tasks.
- Before coding: write a 3-line plan (files you will touch, what changes, how it will be verified). Touch only those files.
- Smallest change that satisfies the task's "Done when" test. No extra features, no refactors of untouched code.
- No new dependency without asking. Prefer what is already in package.json.
- After coding run `pnpm check` (typecheck + lint + tests; Phase 1 creates this script, before that run what exists). Fix failures; do not disable tests or lint.
- Write a test for every rule in the task. If a test is impossible, write a numbered manual check the owner can follow.
- Finish with: (a) files changed, (b) how to verify in under 2 minutes, (c) anything unsure. Then update docs/MAP.md and docs/STATE.md.
- For any UI task, find the matching screen (caption S01 to S19, see the Screen map in docs/DESIGN.md) in docs/design/align-dentistry-screens.pdf before writing code, and follow docs/DESIGN.md. Rebuild it as React components, do not copy anything from the mockup. In your final message, say which screen you followed. Also read docs/ui-audit/REVIEW_CHECKLIST.md before coding and tick it in your final message (existing UI problems and design rules: docs/ui-audit/).

## Stack (fixed; see docs/DECISIONS.md before proposing a change)
- One Cloudflare Worker with static assets. API: Hono in apps/worker. Staff + portal UI: Vite + React SPA in apps/web.
- Database: Cloudflare D1 (SQLite) via Drizzle in packages/db. Files: R2, served only through an authenticated Worker route.
- Shared types and validation (zod) in packages/shared. Both apps import from it; never duplicate types.
- Staff login: Cloudflare Access (verify the JWT in the Worker). Patient login: phone OTP + password, read-only portal.
- Free-plan limits are real: 10 ms CPU per request, 3 MB gzip Worker size, 50 subrequests, one cron trigger (`*/5 * * * *`) with internal branches. Do not add heavy loops or crypto per request.
- Not allowed: Next.js, server-side PDF generation, FTS5 (breaks D1 export), third-party analytics or error trackers, any SaaS that receives patient data.

## Data rules (never break)
- Money is an integer in paise. Never floats.
- Finalised records (visit, prescription, bill, receipt, certificate) are locked. Corrections are new addendum rows. Never UPDATE a finalised row.
- Delete is soft only (deleted_at). Every write to patient or money data adds an audit_log row.
- Numbers (receipt, bill, refund, certificate) come only from the counters table: per financial year, gap-free, inside the same db.batch as the insert. Patient code format: P-000123.
- D1 has no interactive BEGIN/COMMIT. Use db.batch() for atomic multi-statement writes.
- Times are stored in UTC, shown in IST. Mobile numbers are normalised by one shared function only.
- Settings (medicine list, timings, clinic details) are editable by the doctor in the UI and versioned. Never hard-code them.

## Privacy and safety rules (never break)
- NO patient health information in SMS or WhatsApp text. Templates may contain only first name, clinic name, date/time, clinic number.
- NEVER put real patient data in the repo, tests, fixtures, logs, screenshots or staging. Use fake data only (docs/SPEC.md has the fake-data generator rule).
- Secrets only in Worker secrets / local .dev.vars (gitignored). Never print or commit a secret.
- Prescriptions: the doctor's own medicine list only. No dose calculator, no interaction engine, no automatic suggestions.
- Messaging goes through adapters (SmsAdapter, EmailAdapter, StorageAdapter). Business code never calls a provider directly. MESSAGING_MODE=dry_run must send nothing real.
- Portal endpoints (/api/portal/*) are separate from staff endpoints (/api/staff/*), read-only, and return only the logged-in patient's own rows.

## Code style
- Follow docs/DESIGN.md and the mockups linked there for every screen.
- TypeScript strict. Small files, small functions, plain names. Comments only for the "why".
- UI text is short and simple.
- ALL UI text and printed documents (prescription, bill, receipt) are in English only: no Hindi, no Hinglish, no translation system. ONE exception (owner decision 2026-11-23): the printed patient CONSENT forms are Hindi, with the English form name under the Hindi heading. The app screens around them stay English.
- EVERY screen (staff app and portal) must be responsive: phone (360 px wide), tablet (768 px) and laptop (1366x768). Design mobile-first, one layout that adapts, no separate mobile site. Touch targets at least 44 px, no horizontal scroll, tables become cards or scroll inside their own box on phones, inputs use the right keyboard (tel, numeric). A UI task is done only when checked at 360, 768 and 1366 px widths.
- Errors shown to staff are plain sentences (what happened, what to do). Never show stack traces.

## Code structure (so changes stay easy)
- One file, one job. Rule of thumb: a file over ~200 lines is a smell; over 300, split it before adding more.
- apps/worker: a route file only validates input, calls one function, and returns the reply. Business rules live in src/domain/<feature>.ts as plain functions that are easy to test. Database access only in packages/db. Providers only in src/adapters/*.
- apps/web: one folder per feature, src/features/<name>/ (screens, components, hooks, API calls for that feature). Shared building blocks only in src/ui/. A component over ~150 lines gets split.
- One rule lives in one place (money, phone normaliser, number generation, date format). Before writing a helper, grep for an existing one. Never copy-paste logic.
- A feature does not import another feature's internals. It uses that feature's index.ts.
- When you add, move or split a file, update docs/MAP.md in the same task.
- If a task forces you to touch an old file that breaks these rules, split it only as much as the task needs, and note it in docs/STATE.md.

## Do not
- Do not build a public website, online payment, or any feature not in docs/PLAN.md.
- Do not read, edit, search, run commands in, or cd into any folder outside this repo. The owner has other repos on this computer (some belong to his employer); they are off limits. Never touch global config (git config --global, global npm/pnpm packages, shell profile) without asking.
- GIT: commit locally after each task, but NEVER push unless the owner says "push". Before any push run `git remote -v` and `git config user.email`. Push only to the owner's PERSONAL GitHub remote named origin. If the remote or email looks like an office/company account, STOP and ask. Never add another remote, never force push, never push to any other organisation.
- Do not rewrite or reformat files you were not asked to touch.
- Do not mark a task done unless its "Done when" test was actually run.
