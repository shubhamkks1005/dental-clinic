# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 6 gate done; do not start Phase 7). Read RUN_PROMPT.md, STATE.md, MAP.md. Fake data only. Never push.

## Where we are
- **Phase 6 complete locally** through **6.7.3**. Gate: **passed with exceptions** (see STATE.md).
- **Do not start Phase 7** until the owner says so.
- Next free migration: **0049** (0048 past_records).
- Leftovers carried in STATE Waiting: 6.1.1 / 6.6.2 / 6.6.3 (sister), 6.3.9–10, 6.4.3–4, Phase 5 Waiting items, staging migrations **0006–0048**.

## Done this round (local commits; never push)
| Task | Commit | Notes |
|------|--------|-------|
| 6.7.1 | `f2ba7ae` | History chips + date/tooth/q; summary always loaded |
| 6.7.2 | `6107cee` | A4 history print summary; clinical.view; receptionist 403 |
| 6.7.3 | `33a8488` | past_records + Added later feed; mig **0048** |
| Phase 6 gate | (docs) | passed with exceptions in STATE.md |

## Skipped / Waiting
6.1.1; 6.3.9; 6.3.10; 6.4.3; 6.4.4; 6.6.2; 6.6.3; 5.4.2; 5.5.2–5.5.4; prior 3.x/4.x in STATE.

## New migrations (owner applies; agent did not touch staging)
- Apply **0006–0048** then `pnpm deploy:staging`.
- Next free: **0049**
- Also: GitHub secret `HEALTHCHECKS_BILLING_URL` for 5.4.1.

## Next task
Wait for owner: **start Phase 7** (or clear Waiting sister items). Do not begin Phase 7 work until told.

## Commands
```
nvm use system
pnpm check 2>&1 | tail -25
```

Do not put real patient data anywhere.
