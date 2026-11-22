# HANDOFF (for the next AI session)

Written: 2026-11-22 (Phase 2 gate). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 2 gate: passed with exceptions** (see STATE). Core 2.4.1–2.4.4 + 2.4.7 done locally.
- Skip baad me: 2.1.10, 2.2.6, 2.3.9–2.3.11, 2.4.5–2.4.6.
- Not done this round (before formal PLAN gate): **2.5.1 events**, **2.6 import**, **2.7 usability**. Owner decides when to start Phase 3.
- Do **not** start Phase 3 until the owner says so.

## Commits this round (local; owner pushes)
| Task | Commit |
|------|--------|
| 2.4.1 day view | `9d896dc` |
| 2.4.2 quick-book | `b0d9cc9` |
| 2.4.3 Today APIs | `da6935b` |
| 2.4.4 day list print | `0704b95` (+ docs `3d182a2`) |
| 2.4.7 auto-refresh | `b6309e0` |

## New migrations (owner applies; agent did not touch staging)
- Still through **`0017_appointments_book_ahead.sql`** — **no new migration** in 2.4.x.
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
- New staff route → STAFF_ROUTE_MATRIX. Day list print uses SAMPLE_CLINIC until 1.5.2.
- Auto-refresh only on Today + Appointments (60s, pauses when tab hidden).

Do not put real patient data anywhere. Update MAP + STATE every finished task.
