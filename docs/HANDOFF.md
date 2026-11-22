# HANDOFF (for the next AI session)

Written: 2026-11-22 (evening, continued). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 1 gate: passed with exceptions** (owner). Phase 2 in progress.
- Last code: **2.2.1** new patient form + POST create.
- Next: **2.2.2** (patient profile). Then 2.2.3 search box, 2.2.4 edit, 2.2.5 list filters, 2.2.7 consents on reg, 2.2.8 no-mobile; skip baad me (2.1.10, 2.2.6). Then 2.3 scheduling toward Phase 2 gate (PLAN ~1092).
- Owner blockers → Waiting on me in STATE.

## Commits this round (local; owner pushes)
| Task | Commit |
|------|--------|
| 2.1.6 patient_search | `919ff28` |
| 2.1.7 duplicate warnings | `8c5fe27` (+ `21f54f4` / `c2d5033` fixes) |
| 2.1.8 archive/restore | `9921845` |
| 2.1.9 consents | `c9241b3` |
| 2.2.1 new patient form | *(this commit after HANDOFF)* |

## New migrations (owner applies; agent did not touch staging)
- `0010_patient_guardian.sql`
- `0011_patient_search.sql`
- **`0012_consents.sql`**

Staging apply: **0006–0012**, then `pnpm deploy:staging`.

## Gate / blockers
- Phase 2 gate is receptionist UX + search budget + booking race — not reached yet.
- Before real patients: see STATE.

## Commands
```
pnpm check
pnpm db:migrate
pnpm db:seed          # local only — also seeds patient_search tokens
pnpm deploy:staging
```

## Traps
- Health: `/api/staff/health`. Never push. Fake data only.
- Create patient: `takePatientCode` + insert + audit in one batch; search tokens in a follow-up batch (code is SQL-minted).
- Test fixtures that seed `P-000001` must bump `patient_code` counter or create collides.
- Default patient list is `status=active`; use `?status=archived` or `all`.
- New staff route → `STAFF_ROUTE_MATRIX`.
- After new-patient save, Book / Walk-in go to `/app/appointments?...` (NotBuiltYet until 2.3).
- Wire profile (2.2.2) and move consents tab there; name links currently go to `/patients/:id/consents`.

Do not put real patient data anywhere. Update MAP + STATE every finished task.
