# HANDOFF (for the next AI session)

Written: 2026-11-22 (Phase 3 mid-run; context full — stop). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 2 gate: passed with exceptions** — leftovers stay under STATE **Before real patients**. Do not redo.
- **Phase 3 in progress.** Schema block **3.2.1–3.2.6 done**. Next: **3.2.7** clinical permissions (staff visit API + STAFF_ROUTE_MATRIX + receptionist 403 tests), then **3.3.x** medical history UI, **3.4** chart, **3.5** visit screen, **3.5.11–15** History stage 1, **3.6–3.10**, then Phase 3 gate. **Do not start Phase 4.**
- **3.1.1 skipped** (Waiting on me — doctor clinic visit). DRAFT clinical list seeds until then.
- Permissions: AUTH_PLAN 4f default; **only** `packages/db/src/permissions.ts`. Receptionist must not get clinical notes/diagnosis/chart/restricted medical/X-rays/clinical photos (API + tests).

## Commits this round (local; never push)
| Task | Commit |
|------|--------|
| 3.1.2 (+ Phase 3 start / skip 3.1.1) | `11b15fe` |
| 3.2.1 visits | `ca8fb2a` |
| 3.2.2 tooth_events | `524d717` |
| 3.2.3 clinical lists | `66cf4a3` |
| 3.2.4 medical history | `4695ec8` |
| 3.2.5 plan items | `2a3edc6` |
| 3.2.6 finalise/addenda | `d6337bc` |

## New migrations (owner applies; agent did not touch staging)
- **0018** visits
- **0019** tooth_events
- **0020** visit_diagnoses / visit_procedures
- **0021** clinical lists DRAFT seed
- **0022** medical_history + alerts
- **0023** plan_items + plan_item_versions
- **0024** visit_addenda
- Staging: apply **0006–0024**, then `pnpm deploy:staging`.

## Next task (3.2.7) — start here
1. Thin staff routes: `POST /api/staff/visits` (open), `POST /api/staff/visits/:id/finalise`, `POST /api/staff/visits/:id/addenda` (and maybe GET).
2. Domain wrappers in `apps/worker/src/domain/visits.ts`; mount on staff router.
3. Add each route to `STAFF_ROUTE_MATRIX` with `clinical.edit` / `clinical.view`.
4. HTTP tests: receptionist → 403; doctor → 201/200. Repo ForbiddenError already covered for open/toothEvents/medicalHistory.
5. `pnpm check`, commit, update STATE/MAP/HANDOFF.

## Commands
```
nvm use system   # Node 26
pnpm check
pnpm db:migrate
pnpm db:seed     # local only
```

## Traps
- Never push. Fake data only. Health: `/api/staff/health`.
- Drizzle `db:generate` invents silly names — rename to `NNNN_descriptive.sql` and fix journal tag; never reuse a number. Hand-seed migrations (0021) need journal + `pnpm db:lock`.
- Surfaces stored `m|d|o|b|l|whole` (lowercase). Visit lock = repo only (no triggers). Snapshot hash = Web Crypto SHA-256.
- Context nearly full → update this file first, then stop.

Do not put real patient data anywhere.
