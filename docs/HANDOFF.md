# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 6 mid — through 6.5.6 + 6.6 leftovers). Read RUN_PROMPT.md, STATE.md, MAP.md. Fake data only. Never push.

## Where we are
- **Phase 6 in progress.** Next: **6.7.1** History filters polish (chips, date range, tooth, text search).
- Done this session: **6.5.1–6.5.6**; **6.6.1** (already covered by dashboard rowsRead test); skipped **6.6.2–6.6.3** (Waiting sister).
- Remaining Phase 6: **6.7.1–6.7.3**, then Phase 6 gate (do not start Phase 7).
- Next free migration: **0048** (0046 audit history idx; 0047 tunables).
- 6.1.1 / 6.6.2 Waiting (sister); DRAFT defs + top-4 KPIs in DECISIONS.

## Done this round (local commits; never push)
| Task | Commit | Notes |
|------|--------|-------|
| 6.5.1 | `b5e2bc2` | Settings hub groups+search; clinic/billing/privacy/numbers/system; GET /counters |
| 6.5.2 | `40ed941` | Setting history + restore; Timings panels; mig **0046** |
| 6.5.3 | `85134f9` | TUNABLES + Clinic limits; guard test; README; mig **0047** |
| 6.5.4 | `f6e2b13` | Yearly holidays + national templates; booking block |
| 6.5.5 | (in 6.5.1/3) | Preferences chart.view + tunables |
| 6.5.6 | `1b0f726` | SETTING_HELP every key + UI lines |
| 6.6.1 | (prior) | rowsRead&lt;2000 in dashboard.test |

## Skipped / Waiting
6.1.1; 6.3.9; 6.3.10; 6.4.3; 6.4.4; 6.6.2; 6.6.3; 5.4.2; 5.5.2–5.5.4; prior 3.x/4.x in STATE.

## New migrations (owner applies; agent did not touch staging)
- Apply **0006–0047** then `pnpm deploy:staging`.
- Next free: **0048**
- Also: GitHub secret `HEALTHCHECKS_BILLING_URL` for 5.4.1.

## Next task
**6.7.1** History filters: chips All/Visits/Treatments/Prescriptions/Bills/Files/Appointments; date range; tooth (e.g. 36); search procedure/diagnosis text. Filters must never hide pinned summary. Tests per filter; 10y patient still fast. See docs/PATIENT_HISTORY.md Stage 4. Then 6.7.2 print summary (doctor), 6.7.3 Add past record, then Phase 6 gate.

Stubs today: `HistoryFilterChips.tsx` (All only); `historyFeedQuerySchema` has cursor/limit only — extend query + `historyFeedRepo.listFeed` + UI in `PatientHistoryTab`.

## Commands
```
nvm use system
pnpm check 2>&1 | tail -25
```

Do not put real patient data anywhere.
