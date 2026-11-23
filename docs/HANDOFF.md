# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 5 gate complete — stop). Read RUN_PROMPT.md, STATE.md, MAP.md. Fake data only. Never push.

## Where we are
- **Phase 5 gate: passed with exceptions.** Do **not** start Phase 6 until owner says so.
- Next free migration number: **0043** (none added this round after 0042).
- Carry forward all Waiting items under STATE.

## Done this round (local commits; never push)
| Task | Commit | Notes |
|------|--------|-------|
| RUN_PROMPT | `051fd71` | standing rules + AGENTS one-liner |
| 5.3.1 | `08331fd` | draft line edit + fee-change reason |
| 5.3.2 | `e52b18f` | split cash+UPI UI |
| 5.3.3 | `d431358` | statement print + filter |
| 5.3.12 | `1b597da` | CA monthly CSV (patient code only) |
| 5.3.15 | `6b74362` | plan estimate/billed/paid |
| 5.4.1 | `cbb789d` | weekly integrity Action |
| 5.4.2 | — | Waiting 2.5.1 |
| 5.5.1 | `6077206` | money property + 50 parallel issue |
| 5.5.2–5.5.4 | — | Waiting sister/CA |
| fix export 403 | `eb7ac69` | permission before month parse |
| Phase 5 gate | (this handoff) | passed with exceptions |

## Skipped (baad me / Waiting)
5.3.13, 5.3.14; 5.4.2; 5.5.2; 5.5.3; 5.5.4; prior 3.x/4.x skips in STATE.

## New migrations (owner applies; agent did not touch staging)
- Still: **0037–0042** (and earlier 0006–0036). **No new migration this round.**
- Next free: **0043**
- Staging: apply **0006–0042**, then `pnpm deploy:staging`.
- Also: GitHub secret `HEALTHCHECKS_BILLING_URL` for 5.4.1.

## Waiting on me
See STATE.md — 5.5.2 sister usability; 5.5.3 CA; 5.4.1 Healthchecks; 5.3.12 CSV approve; 5.3.11 printer; 5.2.5 opening balances; 5.1.1 CA answers; etc.

## Commands
```
nvm use system
pnpm check 2>&1 | tail -25
```

Do not put real patient data anywhere. Do not start Phase 6 until told.
