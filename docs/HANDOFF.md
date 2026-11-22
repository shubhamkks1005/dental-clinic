# HANDOFF (for the next AI session)

Written: 2026-11-22 (late). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 1 gate: passed with exceptions** (owner). Phase 2 started.
- Last code: **2.1.1** patients fields + migration `0009_patients`.
- Next: **2.1.2** (mobile normaliser already exists — confirm Done when), then 2.1.3…; also finish **1.1.7** seed (`pnpm db:seed` into local D1) now that patients table exists.
- Skip baad me. Owner blockers → Waiting on me in STATE.

## Commits this round (local; owner pushes)
| Task | Commit |
|------|--------|
| 1.7.2 | `4bf3078` |
| 1.7.3 | `38259fa` |
| 2.1.1 | (pending if not yet committed — check `git log`) |

Earlier: 1.6.2–1.6.3, 1.7.4–1.7.5, prior Phase 1 — see STATE.

## Gate / blockers
- **Before Phase 2 hard blockers:** none (STATE).
- **Before real patients:** backup 7 nights, alarms, clinic profile, real hours, sheets, Access/permissions/printer/PC checks, staging migrations **0006–0009**, push+CI — see STATE sections.

## Deps note
- Owner asked for `@cloudflare/vitest-pool-workers`; installed successor `@cloudflare/vitest-plugin` (Vitest 5). Playwright Chromium smoke in CI after `pnpm check`.

## Commands
```
pnpm check
pnpm test:e2e
pnpm --filter @clinic/worker test:workers
pnpm db:migrate
pnpm deploy:staging
```
Node 26 via Homebrew. Never write secrets.

## Traps
- Health path: `/api/staff/health` (not `/api/health`).
- Staging still needs migrations 0006–0009 before next deploy.
- Playwright artifacts: `test-results/` gitignored.
- New staff API route → `STAFF_ROUTE_MATRIX` or CI fails.

Do not put real patient data anywhere. Update MAP + STATE every finished task.
