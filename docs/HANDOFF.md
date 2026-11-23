# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 6 started). Read RUN_PROMPT.md, STATE.md, MAP.md. Fake data only. Never push.

## Where we are
- **Phase 6 in progress** (dashboard, reports, settings). Owner said start.
- Phase 5 gate: passed with exceptions — leftovers stay under Waiting (incl. 5.4.2, 5.5.2–5.5.4).
- Next free migration number: **0044** (0043 = first_arrived_on from 6.2.1).
- Carry forward all Waiting items under STATE.

## Done this round (local commits; never push)
| Task | Commit | Notes |
|------|--------|-------|
| Phase 6 start | (this handoff) | 6.1.1 Waiting; DRAFT defs in DECISIONS |
| 6.2.1 | (pending) | first_arrived_on + backfill |

## Skipped / Waiting
6.1.1 (sister); 5.4.2; 5.5.2–5.5.4; prior 3.x/4.x/5.x skips in STATE.
Baad me in Phase 6: 6.3.9, 6.3.10, 6.4.3, 6.4.4.

## New migrations (owner applies; agent did not touch staging)
- Apply **0006–0043** then `pnpm deploy:staging`.
- Next free: **0044**
- Also: GitHub secret `HEALTHCHECKS_BILLING_URL` for 5.4.1.

## Waiting on me
See STATE.md — 6.1.1 sister metrics; 5.5.2–5.5.4; 5.4.2; etc.

## Commands
```
nvm use system
pnpm check 2>&1 | tail -25
```

Do not put real patient data anywhere.
