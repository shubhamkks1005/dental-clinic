# HANDOFF (for the next AI session)

Written: 2026-11-22 (late night). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 1 gate: passed with exceptions** (owner). Phase 2 through **2.3.4** done.
- Next: **2.3.5** booking rules + override → 2.3.6 status machine → 2.3.7 walk-in/emergency → 2.3.8 reschedule/cancel → **2.4 Today/day view** → **Phase 2 gate** (PLAN ~1092).
- Skip baad me: 2.1.10 merge, 2.2.6 CSV, 2.3.9–2.3.11, 2.4.5–2.4.6.
- Owner blockers → Waiting on me in STATE.

## Commits this round (local; owner pushes)
| Task | Commit |
|------|--------|
| 2.3.1 appointments schema | `09ac73c` |
| 2.3.2 visit types colour + seed | `e2bf4a0` |
| 2.3.3 free slots | `18c9b0b` |
| 2.3.4 booking + overlap race | `06c7e96` |

Prior 2.2.x: see previous HANDOFF / `git log`.

## New migrations (owner applies; agent did not touch staging)
- Through **`0016_visit_types_seed.sql`**
- Also: `0015_appointments.sql`, `0014_patient_contact_relation.sql`, `0013_privacy_notice_settings.sql`, …

Staging apply: **0006–0016**, then `pnpm deploy:staging`.

## Gate / blockers
- Phase 2 gate needs rest of 2.3 (rules, status, walk-in, cancel/reschedule) + 2.4 Today/day view/print + gate checklist (PLAN ~1092).
- Overlap race Done when already met in 2.3.4 (50 parallel → 1 win, no loser audit).
- Search budget / consents-without-SMS already covered earlier.

## What exists for scheduling
- Schema: `appointments` (UTC start_at + IST date_local/start_min/end_min); busy statuses in shared.
- Visit types: seeded 7 rows with minutes+colour; `roundUpToSlot` / `visitTypeSnapshot`.
- `findFreeSlots` + `slotSearchEarliest` (now+15m) in packages/shared.
- `POST /api/staff/appointments` → INSERT…WHERE NOT EXISTS + `auditInsertIfChanged`.

## Commands
```
pnpm check
pnpm db:migrate
pnpm db:seed          # local only
pnpm deploy:staging
```

## Traps
- Health: `/api/staff/health`. Never push. Fake data only.
- Terminal Node: `nvm use system` (Homebrew 26); default nvm is often v16.
- Booking overlap SQL must not pass `undefined` into insert cells (priority/complaint).
- New staff route → STAFF_ROUTE_MATRIX + route-matrix `bodyFor`. New setting → SETTING_SCHEMAS + seed + `pnpm db:lock`.
- Today UI still FAKE sample data until 2.4 wires APIs.

Do not put real patient data anywhere. Update MAP + STATE every finished task.
