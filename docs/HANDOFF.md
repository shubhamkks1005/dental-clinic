# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 4 mid-flight — stop for context). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 4 in progress.** Phase 3 gate: passed with exceptions (leftovers stay under Before real patients / Waiting — do not redo).
- **Done this round:** 4.1.1 → 4.1.5, 4.2.1 → 4.2.8, 4.3.1–4.3.5 (skip 4.3.4 printer).
- **Next:** 4.4.1 estimate print → 4.4.2 consent print → 4.4.3 medical certificate (+ register) → skip 4.4.4/4.4.5/4.4.7/4.4.8 (baad me) → 4.4.6 blank forms → 4.5.1 print regression → skip 4.5.2 (sister) → 4.5.4 medicines list audit UI → **Phase 4 gate** → stop (no Phase 5).
- Permissions: AUTH_PLAN 4f in `packages/db/src/permissions.ts` only. Doctor writes/finalises Rx; receptionist `prescriptions.print` only; history Rx for receptionist is rx_no without medicine names.
- Print: `/app/print/prescription/:id` (S13); registration empty blocks print; reprint → Duplicate copy + `print_log`.

## Commits this round (local; never push)
| Task | Commit |
|------|--------|
| 4.1.1 | `50d92d9` |
| 4.1.2 | `b270a07` |
| 4.1.3–4.1.5 | `103df87` |
| 4.2.1 | `476e890` |
| 4.2.2–4.2.7 | `486cc7d` |
| 4.2.8 | `69661df` |
| 4.3.1–4.3.5 | `2a65111` |

## New migrations (owner applies; agent did not touch staging)
- Prior: **0018–0031**
- **0032** `0032_medicines_seed.sql`
- **0033** `0033_prescriptions.sql`
- **0034** `0034_clinic_letterhead_settings.sql`
- **0035** `0035_print_log.sql`
- Next free: **0036** (use for certificates).
- Staging: apply **0006–0035**, then `pnpm deploy:staging`.

## Waiting on me (carry forward)
- 4.1.2 sister sign DRAFT medicines; 4.3.3 sister haan on Rx preview; 4.3.4 clinic printer; 4.5.2 sister 10 Rx sign-off
- Lawyer DRAFT consent / certificate wording
- Phase 3 leftovers: 3.1.1, 3.5.10, 3.6.3, 3.7.8, 3.9.1–2, B2 keys, chart haan, usability 3.10.3
- Set real `doctor.registration_no` in Settings before live certificate/Rx print

## Commands
```
nvm use system
pnpm check
pnpm db:migrate
pnpm db:seed
```

Do not put real patient data anywhere.
