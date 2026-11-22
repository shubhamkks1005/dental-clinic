# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 3 mid-run; context full — stop). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 2 gate: passed with exceptions** — leftovers stay under STATE **Before real patients**. Do not redo.
- **Phase 3 in progress.** Done through **3.5.7**. Next: **3.5.8** (incomplete visits widget on Today), then **3.5.9–3.5.10**, **3.5.11–15** History stage 1 (PATIENT_HISTORY.md), **3.6–3.10**, Phase 3 gate. **Do not start Phase 4.**
- **3.1.1 skipped** (Waiting on me — doctor clinic visit). DRAFT clinical list seeds until then.
- Permissions: AUTH_PLAN 4f default; **only** `packages/db/src/permissions.ts`. Receptionist must not get clinical notes/diagnosis/chart/restricted medical/X-rays/clinical photos (API + tests).
- Chart: dentist view + FDI default via `chart.view`; sister "haan" still Waiting (3.4.3).

## Commits this round (local; never push)
| Task | Commit |
|------|--------|
| 3.5.2 | `030680b` |
| 3.5.3 | `780a004` |
| 3.5.4 | `6bd0110` |
| 3.5.5 | `202e74f` |
| 3.5.6 | `39e2af3` |
| 3.5.7 | `672455d` |

Prior: through 3.5.1 see git log / prior HANDOFF.

## New migrations (owner applies; agent did not touch staging)
- **0018–0028** (prior) — no new migration this round (3.5.2–3.5.7).
- Staging: apply **0006–0028**, then `pnpm deploy:staging`.

## Next task (3.5.8) — start here
1. Today screen widget: “N visits not finalised” (yesterday’s drafts still show next morning). Never auto-finalise.
2. Then 3.5.9 visit timeline; 3.5.10 templates marked “baad me” — skip or stub per PLAN and list in STATE if skipped.
3. History stage 1: 3.5.11–3.5.15 after visit/treatment deps (PATIENT_HISTORY.md).
4. Keep files small (~200 smell / 300 split); tests in separate files; `pnpm check` before each commit.

## Done this session (brief)
- **3.5.2** Visit layout S05: alerts, tabs, last 3 visits API.
- **3.5.3** Notes form, diagnoses, quick phrases, PATCH (no audit on draft patch).
- **3.5.4** Procedures from chart selection + usual fee.
- **3.5.5** Autosave (1.5s / 5s min, chip, offline retry).
- **3.5.6** Finalise UI + soft warnings.
- **3.5.7** Addenda UI; entered-in-error → void + audit.

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
- Context nearly full → update this file first, then stop.

Do not put real patient data anywhere.
