# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 6 mid — 6.2.x done). Read RUN_PROMPT.md, STATE.md, MAP.md. Fake data only. Never push.

## Where we are
- **Phase 6 in progress.** Data prep **6.2.1–6.2.5 done**. Next: **6.3.1** Dashboard API.
- Phase 5 gate leftovers stay under Waiting (5.4.2, 5.5.2–5.5.4, etc.).
- Next free migration: **0045** (0043 first_arrived_on; 0044 daily_stats).
- 6.1.1 Waiting (sister); DRAFT defs + top-4 KPIs in DECISIONS.

## Done this round (local commits; never push)
| Task | Commit | Notes |
|------|--------|-------|
| 6.2.1 | `e47a1b7` | first_arrived_on + mig 0043 |
| 6.2.2 | `19665b3` | daily_stats/monthly_stats + mig 0044 |
| 6.2.3 | `ecc5d89` | cron + recompute API + S10 button |
| 6.2.4 | `3e6999b` | day-close incomplete appt block |
| 6.2.5 | `16ddb23` | edge number tests + noshow_* |

## Skipped / Waiting
6.1.1 (sister); 5.4.2; 5.5.2–5.5.4; baad me Phase 6: 6.3.9, 6.3.10, 6.4.3, 6.4.4.
Prior 3.x/4.x skips in STATE.

## New migrations (owner applies; agent did not touch staging)
- Apply **0006–0044** then `pnpm deploy:staging`.
- Next free: **0045**
- Also: GitHub secret `HEALTHCHECKS_BILLING_URL` for 5.4.1.

## Next task
**6.3.1** Dashboard API `/api/dashboard?range=...` — prepared arrays, Cache-Control private max-age=60, rows-read &lt;2000 test. Use daily_stats for past days; live for today. reports.full. Screens S10.

## Commands
```
nvm use system
pnpm check 2>&1 | tail -25
```

Do not put real patient data anywhere.
