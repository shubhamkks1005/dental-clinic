# HANDOFF (for the next AI session)

Written: 2026-11-22 (night). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 1 gate: passed with exceptions** (owner). Phase 2 receptionist slice through **2.2.8** done.
- Next: **2.3.1** appointments schema → slots → booking race → Today wiring → **Phase 2 gate** (PLAN ~1092). Gate **not** reached this session (needs 2.3).
- Skip baad me: 2.1.10 merge, 2.2.6 CSV.
- Owner blockers → Waiting on me in STATE.

## Commits this round (local; owner pushes)
| Task | Commit |
|------|--------|
| 2.2.4 patient edit | `a4d2793` |
| 2.2.5 list filters | `cfb4547` |
| 2.2.7 reg consents | `c3a5a44` |
| 2.2.8 contact mobile | *(pending)* |

Prior (still local): 2.1.6–2.2.3 see previous HANDOFF / `git log`.

## New migrations (owner applies; agent did not touch staging)
- Through **`0014_patient_contact_relation.sql`**
- Also: `0013_privacy_notice_settings.sql`, `0012_consents.sql`, `0011_patient_search.sql`, `0010_patient_guardian.sql`

Staging apply: **0006–0014**, then `pnpm deploy:staging`.

## Gate / blockers
- Phase 2 gate needs 2.3 scheduling (schema, visit types, free slots, booking overlap race, status machine, walk-in, Today).
- Search budget already covered by 2.1.6; consents-without-SMS by 2.2.7.

## Commands
```
pnpm check
pnpm db:migrate
pnpm db:seed          # local only
pnpm deploy:staging
```

## Traps
- Health: `/api/staff/health`. Never push. Fake data only.
- Create: takePatientCode + insert + audit; search tokens follow-up; optional registration consents after.
- Seeded `P-000001` fixtures must bump `patient_code` counter.
- `inactive_6m` filter uses registration age until appointments (2.3).
- contactMobile = mobile ?? guardianMobile; contact_relation required when contact exists.
- New staff route → STAFF_ROUTE_MATRIX. New setting → SETTING_SCHEMAS + seed migration + `pnpm db:lock`.

Do not put real patient data anywhere. Update MAP + STATE every finished task.
