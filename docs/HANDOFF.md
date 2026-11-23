# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 6 — 6.3.2 done). Read RUN_PROMPT.md, STATE.md, MAP.md. Fake data only. Never push.

## Where we are
- **Phase 6 in progress.** Next: **6.3.3** Doctor dashboard UI (4 KPI tiles + charts on S10).
- Phase 5 gate leftovers stay under Waiting (5.4.2, 5.5.2–5.5.4, etc.).
- Next free migration: **0045**.
- 6.1.1 Waiting (sister); DRAFT defs + top-4 KPIs in DECISIONS.

## Done this round (local commits; never push)
| Task | Commit | Notes |
|------|--------|-------|
| 6.3.1 | `149f135` | GET /api/staff/dashboard prepared arrays; cache; rowsRead&lt;2000 |
| 6.3.2 | (pending) | SVG chart kit + style-guide demos |

## Skipped / Waiting
6.1.1 (sister); 5.4.2; 5.5.2–5.5.4; baad me Phase 6: 6.3.9, 6.3.10, 6.4.3, 6.4.4.
Prior 3.x/4.x skips in STATE.

## New migrations (owner applies; agent did not touch staging)
- Apply **0006–0044** then `pnpm deploy:staging`.
- Next free: **0045**

## Next task
**6.3.3** Doctor dashboard on S10: 4 KPI tiles (DRAFT top-4), daily patients, stacked new/returning, billed/collected, appt status, top procedures/referrals, attention list stubs. Wire GET /dashboard. Lazy-load charts if needed.

## Commands
```
nvm use system
pnpm check 2>&1 | tail -25
```

Do not put real patient data anywhere.
