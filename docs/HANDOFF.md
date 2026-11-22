# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 3 complete locally — gate recorded). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 3 gate: passed with exceptions** — see STATE.md table. **Do not start Phase 4** until the owner says so.
- Skipped (baad me / Waiting): **3.1.1**, **3.5.10**, **3.6.3**, **3.7.8**, **3.9.1–3.9.2**, **3.10.3–3.10.4**.
- Permissions: AUTH_PLAN 4f in `packages/db/src/permissions.ts` only. Receptionist blocked from clinical notes/diagnosis/chart/restricted medical/X-rays/clinical photos (API + tests).
- Storage: B2 via S3 (`STORAGE_DRIVER=s3`); local R2/memory. Check script: `pnpm --filter @clinic/worker storage:check`.

## Commits this round (local; never push)
| Task | Commit |
|------|--------|
| 3.7.1 | `3d6b99e` |
| 3.7.2 | `936cc9a` |
| 3.7.3 | `0c8e5c0` |
| 3.7.4 | `4411b45` |
| 3.7.5–3.7.7 (skip 3.7.8) | `6dc153d` |
| 3.8 | `8596f75` |
| 3.9 skip + 3.10 + gate | `64a3b5c` |

## New migrations (owner applies; agent did not touch staging)
- **0018–0029** (prior)
- **0030** `0030_files_upload_meta.sql`
- **0031** `0031_consent_templates.sql`
- Staging: apply **0006–0031**, then `pnpm deploy:staging`.
- Next free migration number: **0032**.

## Next
Owner clears Waiting (B2 keys, sister chart haan, lawyer DRAFT consents, usability 3.10.3). Then Phase 4 when owner says.

## Commands
```
nvm use system
pnpm check
pnpm db:migrate
pnpm db:seed
pnpm --filter @clinic/worker db:seed:clinical   # local only
```

Do not put real patient data anywhere.
