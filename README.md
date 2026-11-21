# Dental clinic software

Staff app (`/app`) and read-only patient portal (`/my`) in one Cloudflare Worker.
Rules for contributors and AI agents: see `AGENTS.md`. Plan: `docs/PLAN.md`.

## Setup

Node 26 (`.nvmrc`, pinned in `package.json` engines) and pnpm 12.21.0 (`packageManager`).

```
pnpm install
pnpm dev        # web on http://localhost:5173, worker on http://localhost:8787
pnpm check      # typecheck + lint + format check + tests
pnpm build      # web build + worker bundle (one Worker with static assets)
```

## Environments

Config: `apps/worker/wrangler.jsonc`. IDs there are placeholders until the real
resources are created in Cloudflare.

| Environment | Worker name              | D1 (`DB`)                | R2 (`FILES`)                   | Vars                     | Secrets |
| ----------- | ------------------------ | ------------------------ | ------------------------------ | ------------------------ | ------- |
| local       | dental-clinic-local      | dental-clinic-local      | dental-clinic-local-files      | MESSAGING_MODE=dry_run   | none yet (`.dev.vars`, gitignored) |
| staging     | dental-clinic-staging    | dental-clinic-staging    | dental-clinic-staging-files    | MESSAGING_MODE=dry_run   | none yet (`wrangler secret put --env staging`) |
| production  | dental-clinic-production | dental-clinic-production | dental-clinic-production-files | MESSAGING_MODE=dry_run   | none yet (`wrangler secret put --env production`) |

All environments also bind `ASSETS` (the built web app from `apps/web/dist`).

- Local: `pnpm dev`, `pnpm db:migrate` (local D1).
- Staging: `pnpm deploy:staging` (one command; needs the first-time setup below).
- Production: manual commands below. CI deploys are not set up yet (CI only runs checks).

## Deploy

All `wrangler` commands below run from `apps/worker` (`cd apps/worker`), using
`pnpm exec wrangler ...`. Tokens and accounts are listed in `docs/ACCOUNTS.md`.

### First-time setup (once per Cloudflare account)

1. `pnpm exec wrangler login` (opens the browser; use the clinic's Cloudflare account).
2. `pnpm exec wrangler whoami` and check the account name is the clinic's.
3. Create the databases (location hint apac, decision T2):
   - `pnpm exec wrangler d1 create dental-clinic-staging --location apac`
   - `pnpm exec wrangler d1 create dental-clinic-production --location apac`
4. Create the file buckets:
   - `pnpm exec wrangler r2 bucket create dental-clinic-staging-files --location apac`
   - `pnpm exec wrangler r2 bucket create dental-clinic-production-files --location apac`
5. Copy each `database_id` printed in step 3 into `apps/worker/wrangler.jsonc`
   (`env.staging` and `env.production`), replacing the `00000000-...` placeholders.
   IDs are not secrets; commit them.
6. `pnpm --filter @clinic/worker types` (refreshes `worker-configuration.d.ts`), then `pnpm check`.

### Staging deploy (routine)

1. `pnpm check`
2. `pnpm exec wrangler d1 migrations apply DB --remote --env staging` (from `apps/worker`)
3. `pnpm deploy:staging` (from the repo root)
4. Open the URL wrangler prints and check `/app` and `/my` load.

### Production deploy (only after staging works)

1. Note a restore point first:
   `pnpm exec wrangler d1 time-travel info DB --env production` (write the bookmark in the release note).
2. `pnpm exec wrangler d1 migrations apply DB --remote --env production`
3. From the repo root: `pnpm build`, then from `apps/worker`: `pnpm exec wrangler deploy --env production`
4. Open the production URL and check `/app` and `/my` load.

### Secrets

`pnpm exec wrangler secret put NAME --env staging` (or `--env production`). Never put a
secret in `wrangler.jsonc`, the repo, or chat. Local values go in `apps/worker/.dev.vars`.
Add every secret to `docs/ACCOUNTS.md` (name and where it lives, never the value).
