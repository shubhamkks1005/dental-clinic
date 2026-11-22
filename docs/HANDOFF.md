# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 3 mid-run; context full — stop). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 2 gate: passed with exceptions** — leftovers stay under STATE **Before real patients**. Do not redo.
- **Phase 3 in progress.** Done through **3.6** (3.6.3 skipped baad me). Next: **3.7.1** (files/R2), then **3.8**, **3.9 skip**, **3.10**, Phase 3 gate. **Do not start Phase 4.**
- **3.1.1 skipped** (Waiting on me — doctor clinic visit). DRAFT clinical list seeds until then.
- **3.5.10 skipped** (baad me — visit templates).
- **3.6.3 skipped** (baad me — multi-sitting steps).
- Permissions: AUTH_PLAN 4f default; **only** `packages/db/src/permissions.ts`. Receptionist must not get clinical notes/diagnosis/chart/restricted medical/X-rays/clinical photos (API + tests). History feed filters at source (3.5.14).
- Chart: dentist view + FDI default via `chart.view`; sister "haan" still Waiting (3.4.3).
- History views use **access_log** (not audit_log) — see DECISIONS 3.5.11.

## Commits this round (local; never push)
| Task | Commit |
|------|--------|
| 3.5.13 | `056beb8` |
| 3.5.14 | `792641c` |
| 3.5.15 | `452db22` |
| 3.6.1–2,4–5 (skip 3.6.3) | `aadd2b1` |

Prior: through 3.5.12 see git log / prior HANDOFF (`8ec7e05` etc.).

## New migrations (owner applies; agent did not touch staging)
- **0018–0028** (prior)
- **0029** `0029_files_patient_history_idx.sql` (3.5.13) — **new this round**
- Staging: apply **0006–0029**, then `pnpm deploy:staging`.
- Next free migration number: **0030**.

## Next task (3.7.1) — start here
1. 3.7.1 Source note in DECISIONS: how X-ray/photo reaches browser (JPEG/PNG export assumption until sister confirms RVG). Card/R2 may block 3.7.2 — if blocked, list under Waiting and skip remaining 3.7 that need R2; still do what can be done offline (schema already has `files`).
2. Then 3.7.2–3.7.7 if R2 available; **3.7.8 DICOM baad me skip**.
3. Then 3.8 consent templates (DRAFT lawyer wording OK) → 3.8.2–3.8.3.
4. **3.9.1–3.9.2 skip** (baad me) — note in STATE/DECISIONS.
5. 3.10.1 automated tests (permissions, finalise, plan sync, upload if exists) → 3.10.2–3.10.5 as feasible (usability 3.10.3 Waiting on doctor).
6. Phase 3 gate checklist in STATE; stop before Phase 4.

## Done this session (brief)
- **3.5.13** Stage-1 feed sources (treatments/files/medical/consents/amendments); migration 0029.
- **3.5.14** Receptionist history filter (no clinical types; scan/consent files only).
- **3.5.15** Archived patient history still viewable.
- **3.6** Plan API + Plan tab (S05/S06); toldOn for accepted; estimate reason; finalise→plan sync; **3.6.3 skipped**.

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
- Plan: `clinical.view`/`edit`; receptionist 403 on plan-items.
- Staging R2 / card may block 3.7 upload — skip and list Waiting.
- Context nearly full → update this file first, then stop.

Do not put real patient data anywhere.
