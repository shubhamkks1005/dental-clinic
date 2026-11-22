# HANDOFF (for the next AI session)

Written: 2026-11-22 (Phase 3 start). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 2 gate: passed with exceptions** — leftovers stay under STATE "Before real patients". Do not redo them.
- **Phase 3 started** (owner asked). First open code path: skip blocked **3.1.1** (doctor clinic visit); do **3.1.2** then **3.2.x** clinical schema onward through History stage 1 and Phase 3 gate.
- Permissions: AUTH_PLAN 4f default; all role rules only in `packages/db/src/permissions.ts`. Receptionist must not receive clinical notes/diagnosis/chart/restricted medical/X-rays/clinical photos (API + tests).

## Commits this round
(update as each task lands)

## New migrations (owner applies; agent did not touch staging)
- Still through **`0017_appointments_book_ahead.sql`** until Phase 3 adds more.
- Staging apply if not done: **0006–0017**, then `pnpm deploy:staging`.

## Commands
```
pnpm check
pnpm db:migrate
pnpm db:seed          # local only
pnpm deploy:staging
```

## Traps
- Health: `/api/staff/health`. Never push. Fake data only.
- Terminal Node: `nvm use system` (Homebrew 26).
- New staff route → STAFF_ROUTE_MATRIX.
- Clinical: finalised visits read-only; corrections = amendments; soft delete only; audit every clinical view/change.
- Lawyer wording: placeholder "DRAFT - lawyer to confirm" + STATE line; do not block.
- Context nearly full → update this file first, then stop.

Do not put real patient data anywhere. Update MAP + STATE every finished task. Do not start Phase 4.
