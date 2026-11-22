# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 3 mid-run; context full — stop). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 2 gate: passed with exceptions** — leftovers stay under STATE **Before real patients**. Do not redo.
- **Phase 3 in progress.** Done through **3.4.2**. Next: **3.4.3** (direction/notation — dentist-view R label already on chart; sister "haan" still Waiting; proceed with FDI display default + always show notation name), then **3.4.4** conditions colours from list, **3.4.5** wire chart to draft visit tooth_events, **3.4.6** deciduous/mixed by age, then **3.5.x** visit screen, **3.5.11–15** History stage 1, **3.6–3.10**, Phase 3 gate. **Do not start Phase 4.**
- **3.1.1 skipped** (Waiting on me — doctor clinic visit). DRAFT clinical list seeds until then.
- Permissions: AUTH_PLAN 4f default; **only** `packages/db/src/permissions.ts`. Receptionist must not get clinical notes/diagnosis/chart/restricted medical/X-rays/clinical photos (API + tests).

## Commits this round (local; never push)
| Task | Commit |
|------|--------|
| 3.2.7 | `dd4e6d0` |
| 3.3.1 | `f8e3c6d` |
| 3.3.2 | `584d8bb` |
| 3.3.3 | `2830713` |
| 3.3.4 | `6a70b5b` |
| 3.4.1 | `d12c542` |
| 3.4.2 | *(commit after this HANDOFF)* |

Prior schema block 3.1.2–3.2.6: see git log / prior HANDOFF.

## New migrations (owner applies; agent did not touch staging)
- **0018–0024** (prior session)
- **0025** medical_history_checklist_seed
- **0026** medical_history_stale_months
- Staging: apply **0006–0026**, then `pnpm deploy:staging`.

## Next task (3.4.3) — start here
1. Chart already labels "R (patient's right)" and stores FDI. Add display-notation setting or constant (FDI default) always visible on chart.
2. Skip blocking on sister haan — note Waiting in STATE; decide FDI display in DECISIONS if needed.
3. Then 3.4.4: load `conditions` list colours into ToothChart legend/marks.
4. 3.4.5: staff routes for tooth_events + wire Chart into visit (needs 3.5.1 open visit) — may do API first.
5. Keep files small; tests in separate files; `pnpm check` before each commit.

## Commands
```
nvm use system   # Node 26
pnpm check
pnpm db:migrate
pnpm db:seed     # local only
```

## Traps
- Never push. Fake data only. Health: `/api/staff/health`.
- Chart playground: `/app/style-guide` (keyboard Enter applies local filling).
- Visit-screen AlertsStrip still deferred to 3.5.2.
- Context nearly full → update this file first, then stop.

Do not put real patient data anywhere.
