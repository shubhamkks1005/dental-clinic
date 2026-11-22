# HANDOFF (for the next AI session)

Written: 2026-11-22 (late). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 1 gate: passed with exceptions** (owner). Phase 2 in progress.
- Last code: **2.2.3** global patient search box.
- Next: **2.2.4** (patient edit) → 2.2.5 list filters → 2.2.7 notice/consent on reg → 2.2.8 no-mobile/shared mobile. Skip baad me (2.1.10, 2.2.6).
- Then **2.3** scheduling (schema → slots → booking race) toward **Phase 2 gate** (PLAN ~1092: 10 fake cards &lt;90s, search last-4, booking race, etc.). Gate not reached this session.
- Owner blockers → Waiting on me in STATE.

## Commits this round (local; owner pushes)
| Task | Commit |
|------|--------|
| 2.1.6 patient_search | `919ff28` |
| 2.1.7 duplicate warnings | `8c5fe27` (+ `21f54f4` / `c2d5033` fixes) |
| 2.1.8 archive/restore | `9921845` |
| 2.1.9 consents | `c9241b3` |
| 2.2.1 new patient form | `133bf6b` |
| 2.2.2 patient profile | `9a58329` |
| 2.2.3 search box | *(commit after this HANDOFF)* |

## New migrations (owner applies; agent did not touch staging)
- `0010_patient_guardian.sql`
- `0011_patient_search.sql`
- **`0012_consents.sql`**

Staging apply: **0006–0012**, then `pnpm deploy:staging`.

## Gate / blockers
- Phase 2 gate needs remaining 2.2.x polish + full 2.3 scheduling — not done.
- Before real patients: see STATE.

## Commands
```
pnpm check
pnpm db:migrate
pnpm db:seed          # local only
pnpm deploy:staging
```

## Traps
- Health: `/api/staff/health`. Never push. Fake data only.
- Create: `takePatientCode` + insert + audit one batch; search tokens follow-up (SQL-minted code).
- Seeded `P-000001` fixtures must bump `patient_code` counter or create collides.
- Default list `status=active`. New staff route → `STAFF_ROUTE_MATRIX`.
- Book / Walk-in links → `/app/appointments?...` (NotBuiltYet until 2.3).
- TopBar search is a slot; `PatientSearch` lives in features/patients.
- Last visit in search results is "—" until appointments exist.

Do not put real patient data anywhere. Update MAP + STATE every finished task.
