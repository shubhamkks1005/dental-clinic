# HANDOFF (for the next AI session)

Written: 2026-11-22 (evening). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 1 gate: passed with exceptions** (owner). Phase 2 in progress.
- Last code: **2.1.5** `takePatientCode` (counters → P-000123).
- Next: **2.1.6** (search tokens — Large). Then 2.1.7… through 2.2.x until Phase 2 gate (~PLAN receptionist UX).
- Skip baad me. Owner blockers → Waiting on me in STATE.

## Commits this round (local; owner pushes)
| Task | Commit |
|------|--------|
| version_metadata staging/prod | `d77d307` |
| 2.1.2 | `df98dc6` |
| 1.1.7 | `5e33d2d` |
| 2.1.3 | `b410786` |
| 2.1.4 | `0a9a823` |
| 2.1.5 | `55fc7b1` |

## Gate / blockers
- **Before Phase 2 hard blockers:** none (STATE).
- **Before real patients:** backup 7 nights, alarms, clinic profile, real hours, sheets, Access/permissions/printer/PC checks, staging migrations **0006–0010**, push+CI — see STATE.
- **New migration this round:** `0010_patient_guardian.sql` — **owner applies**; agent did not apply to staging.

## Commands
```
pnpm check
pnpm db:migrate
pnpm db:seed          # local D1 only — never staging
pnpm test:e2e
pnpm deploy:staging
```
Node 26 via Homebrew. Never write secrets.

## Traps
- Health path: `/api/staff/health` (not `/api/health`).
- Staging still needs migrations **0006–0010** before next deploy.
- `pnpm db:seed` is local-only; Patients screen (S02/S15) lists seeded rows.
- New staff API route → `STAFF_ROUTE_MATRIX` or CI fails.
- Guardian save rule is in shared (`guardianSaveError`); wire it when building 2.2.1 new-patient save.

Do not put real patient data anywhere. Update MAP + STATE every finished task.
