# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 6 — 6.3.1 done). Read RUN_PROMPT.md, STATE.md, MAP.md. Fake data only. Never push.

## Where we are
- **Phase 6 in progress.** Next: **6.3.2** Chart components (SVG bar/line/heatmap/KPI/sparkline; no heavy lib).
- Phase 5 gate leftovers stay under Waiting (5.4.2, 5.5.2–5.5.4, etc.).
- Next free migration: **0045** (0043 first_arrived_on; 0044 daily_stats).
- 6.1.1 Waiting (sister); DRAFT defs + top-4 KPIs in DECISIONS.

## Done this round (local commits; never push)
| Task | Commit | Notes |
|------|--------|-------|
| 6.3.1 | (pending) | GET /api/staff/dashboard prepared arrays; cache private max-age=60; rowsRead&lt;2000 |

Prior: 6.2.1–6.2.5 in previous session (`e47a1b7`…`16ddb23`).

## Skipped / Waiting
6.1.1 (sister); 5.4.2; 5.5.2–5.5.4; baad me Phase 6: 6.3.9, 6.3.10, 6.4.3, 6.4.4.
Prior 3.x/4.x skips in STATE.

## New migrations (owner applies; agent did not touch staging)
- Apply **0006–0044** then `pnpm deploy:staging`.
- Next free: **0045**
- Also: GitHub secret `HEALTHCHECKS_BILLING_URL` for 5.4.1.

## Next task
**6.3.2** Chart components — small SVG: bar, stacked bar, line, heatmap, KPI tile, sparkline. Design tokens. Table toggle, keyboard tooltip, no pie. Screens S10.

## Commands
```
nvm use system
pnpm check 2>&1 | tail -25
```

Do not put real patient data anywhere.
