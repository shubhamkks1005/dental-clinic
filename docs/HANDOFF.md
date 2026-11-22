# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 3 mid-run; context full — stop). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 2 gate: passed with exceptions** — leftovers stay under STATE **Before real patients**. Do not redo.
- **Phase 3 in progress.** Done through **3.5.1**. Next: **3.5.2** (visit layout S05: alerts strip, tabs Today’s visit / Chart / Plan / History / Files, last 3 visits side), then **3.5.3–3.5.10**, **3.5.11–15** History stage 1 (PATIENT_HISTORY.md), **3.6–3.10**, Phase 3 gate. **Do not start Phase 4.**
- **3.1.1 skipped** (Waiting on me — doctor clinic visit). DRAFT clinical list seeds until then.
- Permissions: AUTH_PLAN 4f default; **only** `packages/db/src/permissions.ts`. Receptionist must not get clinical notes/diagnosis/chart/restricted medical/X-rays/clinical photos (API + tests).
- Chart: dentist view + FDI default via `chart.view`; sister "haan" still Waiting (3.4.3).

## Commits this round (local; never push)
| Task | Commit |
|------|--------|
| 3.4.3 | `c1937bf` |
| 3.4.4 | `c6f8af2` |
| 3.4.5 | `3232b63` |
| 3.4.6 | `754e4ff` |
| 3.5.1 | *(commit after this HANDOFF)* |

Prior: through 3.4.2 see git log / prior HANDOFF.

## New migrations (owner applies; agent did not touch staging)
- **0018–0026** (prior)
- **0027** chart_view_setting
- **0028** conditions_chart_fields
- Staging: apply **0006–0028**, then `pnpm deploy:staging`.

## Next task (3.5.2) — start here
1. Visit screen layout at `/app/visits/:id` (S05): AlertsStrip on top; tabs: Today’s visit, Chart (reuse VisitChartPanel), Plan, History, Files; side summary of last 3 visits.
2. Keyboard-first; works at 360 / 768 / 1366.
3. Then 3.5.3 complaint/exam/diagnosis/advice; 3.5.4 procedures; 3.5.5 autosave (audit exception for draft patches — see PLAN); etc.
4. Keep files small (~200 smell / 300 split); tests in separate files; `pnpm check` before each commit.

## Commands
```
nvm use system   # Node 26
pnpm check
pnpm db:migrate
pnpm db:seed     # local only
```

## Traps
- Never push. Fake data only. Health: `/api/staff/health`.
- Open visit: appointment → one visit; no appointment → reuse draft for patient+date (DECISIONS 3.5.1).
- Chart playground: `/app/style-guide`. Patient Chart tab for doctors.
- Context nearly full → update this file first, then stop.

Do not put real patient data anywhere.
