# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 3 mid-run; context full — stop). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 2 gate: passed with exceptions** — leftovers stay under STATE **Before real patients**. Do not redo.
- **Phase 3 in progress.** Done through **3.5.12**. Next: **3.5.13** (stage-1 feed sources), then **3.5.14–3.5.15**, **3.6–3.10**, Phase 3 gate. **Do not start Phase 4.**
- **3.1.1 skipped** (Waiting on me — doctor clinic visit). DRAFT clinical list seeds until then.
- **3.5.10 skipped** (baad me — visit templates). Listed under Waiting / DECISIONS.
- Permissions: AUTH_PLAN 4f default; **only** `packages/db/src/permissions.ts`. Receptionist must not get clinical notes/diagnosis/chart/restricted medical/X-rays/clinical photos (API + tests).
- Chart: dentist view + FDI default via `chart.view`; sister "haan" still Waiting (3.4.3).
- History views use **access_log** (not audit_log) — see DECISIONS 3.5.11.

## Commits this round (local; never push)
| Task | Commit |
|------|--------|
| 3.5.8 | `c4b7be8` |
| 3.5.9 | `f3fee0d` |
| 3.5.10 (skip) | `019b4a5` |
| 3.5.11 | `e82b066` |
| 3.5.12 | `8ec7e05` |

Prior: through 3.5.7 see git log / prior HANDOFF (`672455d` etc.).

## New migrations (owner applies; agent did not touch staging)
- **0018–0028** (prior) — **no new migration this round** (3.5.8–3.5.12).
- Staging: apply **0006–0028**, then `pnpm deploy:staging`.
- Next free migration number remains **0029**.

## Next task (3.5.13) — start here
1. Fill stage-1 history feed sources: treatments (plan_items), files (stub empty until 3.7 if no table), medical/allergy changes, consents, visit amendments/addenda.
2. Replace emptySource() stubs in `packages/db/src/repos/history-feed.ts`. Keep files small (~200 smell / 300 split).
3. Then 3.5.14 receptionist API filter + tests (visits/clinical types absent for receptionist).
4. Then 3.5.15 archived patient history viewable + test.
5. Then 3.6 treatment plan → 3.7 files (R2; may need card — skip/list Waiting if blocked) → 3.8 consent → 3.9 baad me skip → 3.10 tests → Phase 3 gate. Stop before Phase 4.

## Done this session (brief)
- **3.5.8** Today incomplete-visits widget; GET `/visits/drafts`; never auto-finalise.
- **3.5.9** Visits tab timeline; GET `/patients/:id/visits/timeline`; dx/px filters.
- **3.5.10** Skipped (baad me).
- **3.5.11** History tab + summary strip; GET `/history/summary`; returning patient defaults to History.
- **3.5.12** GET `/patients/:id/history` merged feed; cursor; appointments+visits; UI Load more.

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
- Draft field patches: **no audit** (PLAN exception). Audit on open / finalise / addendum / entered-in-error.
- History view → access_log resource `patient_history`.
- Context nearly full → update this file first, then stop.

Do not put real patient data anywhere.
