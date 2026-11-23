# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 6 mid — through 6.4.2). Read RUN_PROMPT.md, STATE.md, MAP.md. Fake data only. Never push.

## Where we are
- **Phase 6 in progress.** Next: **6.5.1** Settings hub (one page, groups, search).
- Done this session: **6.3.1–6.3.8**, skipped **6.3.9–6.3.10**; **6.4.1–6.4.2**, skipped **6.4.3–6.4.4**.
- Remaining Phase 6: **6.5.1–6.5.6**, **6.6.1–6.6.3**, **6.7.1–6.7.3**, then Phase 6 gate (do not start Phase 7).
- Next free migration: **0046** (0045 outreach_contacts).
- 6.1.1 Waiting (sister); DRAFT defs + top-4 KPIs in DECISIONS.

## Done this round (local commits; never push)
| Task | Commit | Notes |
|------|--------|-------|
| 6.3.1 | `149f135` | GET /dashboard prepared arrays; cache; rowsRead&lt;2000 |
| 6.3.2 | `d09a4da` | SVG chart kit + style-guide |
| 6.3.3–5 | `1d5eb62` | Doctor S10 UI, ranges, growth |
| 6.3.6 | `41168c0` | Busy heatmap |
| 6.3.7–8 | `b7107b3` | Call lists + today summary; mig **0045** |
| 6.4.1–2 | `b40309c` | Monthly print + stats CSV |

## Skipped / Waiting
6.1.1; 6.3.9; 6.3.10; 6.4.3; 6.4.4; 5.4.2; 5.5.2–5.5.4; prior 3.x/4.x in STATE.

## New migrations (owner applies; agent did not touch staging)
- Apply **0006–0045** then `pnpm deploy:staging`.
- Next free: **0046**
- Also: GitHub secret `HEALTHCHECKS_BILLING_URL` for 5.4.1.

## Next task
**6.5.1** Settings one home: groups (clinic, timings, lists, templates, users, preferences, backup…), search, ≤3 clicks. Screens S12. Then 6.5.2 history/restore, 6.5.3 magic numbers → settings, 6.5.4–6.5.6 holidays/prefs/help text.

## Commands
```
nvm use system
pnpm check 2>&1 | tail -25
```

Do not put real patient data anywhere.
