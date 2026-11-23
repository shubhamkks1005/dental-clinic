# Release process (9.5.5)

---

## Environments

| Environment | URL | Database | Used for |
|-------------|-----|----------|---------|
| Local | http://localhost:5173 | Local D1 (`.wrangler/`) | Development and testing |
| Staging | `https://dental-clinic.*.workers.dev` | Staging D1 | Testing before production; fake data only |
| Production | `https://[clinic-domain]` | Production D1 | Real patients — extra care |

**Rule:** No real patient data on staging, ever. No code deploys to production without staging passing first.

---

## CI pipeline (GitHub Actions)

Every push to any branch runs:
1. `pnpm check` — TypeScript strict compile + ESLint + Prettier + Vitest (all packages)
2. Playwright e2e (Chromium): landing page, staff smoke, print regression

The CI must be green before merging to `main`.

Secret scan (`gitleaks`) runs in parallel to catch any accidentally committed secret.

---

## Release steps (normal deploy)

```
1. pnpm check            # must be green locally
2. git commit            # commit the change
3. Push to main          # owner pushes (agent never pushes)
4. Wait for CI green     # GitHub Actions check on the push
5. Deploy staging:
       pnpm deploy:staging   # builds and deploys to staging env
6. Smoke test staging:
   - Open staging URL
   - Sign in as doctor (dev-login or Google)
   - Open Today, search a patient, check health endpoint
   - Run any manual check listed in STATE.md for the new feature
7. Deploy production:
       npx wrangler deploy --env production
   (or add a GitHub Actions approval-gated deploy step)
8. Smoke test production:
   - Open production URL
   - Confirm health endpoint: /api/staff/health → 200 with version
9. Write a one-line release note (WhatsApp to doctor)
10. Create a git tag: git tag v0.X.Y && git push --tags
```

---

## Migrations

Before any deploy that includes a new migration:
1. Record a D1 Time Travel restore point (note the timestamp in STATE.md).
2. Run `pnpm db:lock` to record the new migration checksum.
3. Apply the migration to staging: `pnpm db:migrate` (staging env).
4. Confirm staging health is OK before applying to production.
5. Apply to production only after staging is confirmed good.

**Never edit a committed migration.** Write a new one instead.

See `docs/runbooks/MIGRATION_SAFETY.md` for the full migration safety checklist.

---

## Rollback

**Code rollback (bad deploy):**
```bash
npx wrangler rollback --env production
```
Or use the Cloudflare dashboard → Workers & Pages → Deployments → Rollback.
Target: 5 minutes to rollback.

**Database rollback (bad migration, data loss):**
See `docs/runbooks/RESTORE_TIME_TRAVEL.md`.

---

## Version tags and changelog

- Tag every production release: `git tag v0.X.Y`
- Write one plain-English sentence per change (what it does, not how).
- Keep the last 10 releases visible in the GitHub Releases tab.

---

## Deploy checklist

Before every production deploy:

- [ ] `pnpm check` green locally
- [ ] CI green on the branch / commit
- [ ] Staged and tested on staging
- [ ] Any migration checked on staging first
- [ ] Deploy is outside clinic hours (before 09:00 or after 20:00 IST; or Sunday)
- [ ] Release note drafted

---

## See also

- `README.md` — `pnpm deploy:staging` command
- `docs/runbooks/MIGRATION_SAFETY.md` — migration safety
- `docs/runbooks/DOWNTIME.md` — rollback and downtime procedures
