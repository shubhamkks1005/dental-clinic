# HANDOFF (for the next AI session)

Written: 2026-11-22 (late). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 1 gate: passed with exceptions** (owner). Phase 2 through **2.3.8** done.
- Next: **2.4.1** day view → 2.4.2 quick-book → 2.4.3 Today screen (wire real APIs) → 2.4.4 print → 2.4.7 auto-refresh → **Phase 2 gate** (PLAN ~1092). Skip 2.4.5–2.4.6 (baad me).
- Also skip baad me: 2.1.10 merge, 2.2.6 CSV, 2.3.9–2.3.11.
- Owner blockers → Waiting on me in STATE.

## Commits this round (local; owner pushes)
| Task | Commit |
|------|--------|
| Patient History plan | `29a4735` |
| 2.3.5 booking rules | `7a0d49f` |
| 2.3.6 status wheel | `9bba344` |
| 2.3.7 walk-in/emergency | `0909a40` |
| 2.3.8 reschedule/cancel | *(commit after this handoff)* |

Prior 2.3.1–2.3.4: see previous HANDOFF / `git log`.

## New migrations (owner applies; agent did not touch staging)
- Through **`0017_appointments_book_ahead.sql`** (book_ahead_days=90)
- Also still pending if not applied: `0015`–`0016`, earlier 0006–0014…

Staging apply: **0006–0017**, then `pnpm deploy:staging`.

## Plan note (this session)
- Unified Patient History: `docs/PATIENT_HISTORY.md`; tasks 3.5.11–15, 4.2.8, 5.3.16, 6.7.1–3; **+34 core h**. Totals 1063→1097; **Cut A pre-pilot 738→772**.

## What exists for scheduling (2.3)
- Book + soft rules + override → overbook; walk-in (arrived) + emergency overbook; status PATCH; cancel reasons; reschedule chain; GET `/patients/:id/appointments` + `/appointments/:id/chain`.
- Profile Appointments tab lists rows + shows reschedule chain text (S04/S17).
- `notifyPatient` on cancel is **audit only** until 2.5.1 events → Phase 7 SMS.
- Today UI still mostly FAKE sample data until 2.4 wires APIs (`statusActionButtons` helper ready).

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
- New staff route → STAFF_ROUTE_MATRIX + route-matrix `bodyFor`. New setting → SETTING_SCHEMAS + seed + `pnpm db:lock`.
- Reschedule uses two batches (insert new, then mark old); overlap race → 409, old unchanged.
- Book/walk-in/reschedule need `appointments.book_ahead_days` setting (migration 0017).

Do not put real patient data anywhere. Update MAP + STATE every finished task.
