# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 4 gate done — stop). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 4 gate: passed with exceptions.** Do **not** start Phase 5 until the owner says so.
- **Done this round:** 4.4.1 → 4.4.3, 4.4.6, 4.5.1, 4.5.4 + Phase 4 gate.
- **Skipped (baad me):** 4.4.4, 4.4.5, 4.4.7, 4.4.8, 4.5.2.
- Permissions: AUTH_PLAN 4f in `packages/db/src/permissions.ts` (`certificates.write` / `certificates.print` added).
- Print: estimate, consent, certificate, blank×20, Rx sample `?lines=1..8`; print_log + Duplicate copy.

## Commits this round (local; never push)
| Task | Commit |
|------|--------|
| 4.4.1 | `90eb4f1` |
| 4.4.2 | `7c06036` |
| 4.4.3 | `d597f53` |
| 4.4.6 | `b07ea90` |
| 4.5.1 | `283669f` |
| 4.5.4 | `fc52302` |
| Phase 4 gate docs | (commit after this handoff) |

## New migrations (owner applies; agent did not touch staging)
- Prior: **0018–0035**
- **0036** `0036_certificates.sql`
- Next free: **0037**
- Staging: apply **0006–0036**, then `pnpm deploy:staging`.

## Waiting on me (carry forward)
- 4.1.2 / 4.3.3 / 4.5.2 sister medicines + Rx / 10 Rx printer haan
- 4.3.4 clinic printer; estimate/consent/certificate sister haan
- Lawyer DRAFT: estimate disclaimer, consent templates, certificate banner
- Set real `doctor.registration_no` in Settings
- Phase 3 leftovers: 3.1.1, 3.5.10, 3.6.3, 3.7.8, 3.9.1–2, B2 keys, chart haan, usability 3.10.3
- Owner visual responsive + keyboard pass

## Commands
```
nvm use system
pnpm check
pnpm test:e2e
pnpm db:migrate
pnpm db:seed
```

Do not put real patient data anywhere.
