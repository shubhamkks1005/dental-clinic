# HANDOFF (for the next AI session)

Written: 2026-11-22 (late evening). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 1 gate: passed with exceptions** (owner). Phase 2 in progress.
- Last code: **2.1.8** archive/restore.
- Next: **2.1.9** (consents table). Then 2.2.1+ receptionist screens until Phase 2 gate (PLAN ~1092: 10 fake cards &lt;90s each, search last-4, etc.).
- Skip baad me (2.1.10 merge, 2.2.6 CSV). Owner blockers → Waiting on me in STATE.

## Commits this round (local; owner pushes)
| Task | Commit |
|------|--------|
| 2.1.6 patient_search | `919ff28` |
| 2.1.7 duplicate warnings | `8c5fe27` (+ `21f54f4` / `c2d5033` fixes) |
| 2.1.8 archive/restore | `9921845` |

## New migrations (owner applies; agent did not touch staging)
- `0010_patient_guardian.sql` (earlier)
- **`0011_patient_search.sql`** (this round)

Staging apply: **0006–0011**, then `pnpm deploy:staging`.

## Gate / blockers
- Phase 2 gate is receptionist UX + search budget + booking race — not reached yet.
- Before real patients: see STATE (backup, Access, clinic profile, push+CI, migrations).

## Commands
```
pnpm check
pnpm db:migrate
pnpm db:seed          # local only — also seeds patient_search tokens
pnpm deploy:staging
```

## Traps
- Health: `/api/staff/health`. Never push. Fake data only.
- Wire `guardianSaveError` + duplicate-check + `takePatientCode` + `rebuildPatientSearchStatements` in the same batch when building 2.2.1 save.
- Default patient list is `status=active`; use `?status=archived` or `all`.
- New staff route → `STAFF_ROUTE_MATRIX`.

Do not put real patient data anywhere. Update MAP + STATE every finished task.
