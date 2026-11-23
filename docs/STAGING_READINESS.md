# Staging readiness (fake data only)

Run these by hand, in order, on the **dev Mac** (terminal in the repo). Nothing here has been run against staging by the agent.

## 1. Type the Cloudflare token (never printed, never saved)
```
cd ~/dental-clinic
source ~/.nvm/nvm.sh; nvm use system
read -rs CLOUDFLARE_API_TOKEN; export CLOUDFLARE_API_TOKEN
```

## 2. Check, then apply migrations to staging
Everything not yet applied goes in one command. Expected pending: **0049 to 0054** at least (HANDOFF listed 0006 to 0053 as pending; new in this run: **0054_error_log_role_version**).
```
pnpm check 2>&1 | tail -25
cd apps/worker
pnpm wr d1 migrations apply DB --remote --env staging
cd ..
```

## 3. Deploy staging
```
pnpm deploy:staging
```
Open the printed URL; check `/app` loads. Purge stays a dry run (no `RETENTION_MODE` var).

## 4. Seed fake data (once; safe to re-run, it says "Already seeded")
```
pnpm --filter @clinic/worker db:seed:staging -- --staging
```
It refuses unless the database is `dental-clinic-staging` (id taken from wrangler.jsonc). Optional rehearsal on local D1 first: `pnpm --filter @clinic/worker db:migrate` then `pnpm --filter @clinic/worker db:seed:staging -- --local`.

## 5. Test receptionist
`staff-admin.mjs` only has `seed-doctor` and `recover-doctor`; it cannot reactivate a receptionist. Use the app: sign in as the doctor, **Settings > Staff**, find the receptionist, press **Reactivate**. No SQL, no email written in any file.

## 6. Then
Give testers `docs/TESTING.md`. Delete the API token in the Cloudflare dashboard when finished, and close the terminal (the typed token only lives in that session).
