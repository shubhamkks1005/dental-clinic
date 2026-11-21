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
| staging     | dental-clinic-staging    | dental-clinic-staging    | none until task 3.7 (R2 may need a card) | MESSAGING_MODE=dry_run   | none yet (`wrangler secret put --env staging`) |
| production  | dental-clinic-production | dental-clinic-production | dental-clinic-production-files | MESSAGING_MODE=dry_run   | none yet (`wrangler secret put --env production`) |

All environments also bind `ASSETS` (the built web app from `apps/web/dist`). `FILES` exists locally
and in production config; staging has none until task 3.7.

- Local: `pnpm dev`, `pnpm db:migrate` (local D1).
- Staging: `pnpm deploy:staging` (one command; needs the first-time setup below).
- Production: manual commands below. CI deploys are not set up yet (CI only runs checks).

## Deploy

No browser login on the dev Mac: wrangler uses an API token that is typed into the terminal
for one session only. All `wrangler` commands go through `pnpm wr ...` from `apps/worker`
(`cd apps/worker`), which keeps wrangler's config and logs inside the repo (`.wrangler/`,
gitignored). Tokens and accounts are listed in `docs/ACCOUNTS.md`.

### Each terminal session that talks to Cloudflare

```
read -rs "CLOUDFLARE_API_TOKEN?Cloudflare API token (hidden): "; echo
export CLOUDFLARE_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID=<account id from the dashboard; not a secret>
cd apps/worker && pnpm wr d1 list     # proves the token works
```

When done: `unset CLOUDFLARE_API_TOKEN` (or close the terminal). Never paste the token in chat,
a file, a commit or a command line argument.

### First-time setup (once per Cloudflare account)

1. Dashboard (personal device): create the account and the API token (see `docs/ACCOUNTS.md`).
   No R2 yet (decide about the card before task 3.7). If Zero Trust or anything else asks for a card, stop and ask the owner first.
2. This Mac, in a session as above: create the databases (location hint apac, decision T2):
   - `pnpm wr d1 create dental-clinic-staging --location apac`
   - `pnpm wr d1 create dental-clinic-production --location apac`
3. Copy each `database_id` printed in step 2 into `apps/worker/wrangler.jsonc`
   (`env.staging` and `env.production`), replacing the `00000000-...` placeholders.
   IDs are not secrets; commit them.
4. `pnpm --filter @clinic/worker types` (refreshes `worker-configuration.d.ts`), then `pnpm check`.
5. After the staging deploy and the Access test: delete the setup API token in the Cloudflare dashboard
   (My Profile > API Tokens), not only `unset` it. Create a new short-lived token when one is needed again.

### Staging deploy (routine)

1. `pnpm check`
2. `pnpm wr d1 migrations apply DB --remote --env staging` (from `apps/worker`)
3. `pnpm deploy:staging` (from the repo root)
4. Open the URL wrangler prints and check `/app` and `/my` load.

### Production deploy (only after staging works)

1. Note a restore point first:
   `pnpm wr d1 time-travel info DB --env production` (write the bookmark in the release note).
2. `pnpm wr d1 migrations apply DB --remote --env production`
3. From the repo root: `pnpm build`, then from `apps/worker`: `pnpm wr deploy --env production`
4. Open the production URL and check `/app` and `/my` load.

### Database migrations

1. Change the schema in `packages/db/src/schema` (rules: `packages/db/CLAUDE.md`).
2. `pnpm db:generate` writes `packages/db/migrations/NNNN_name.sql`. Read the SQL.
   For data-only changes (seed rows): `pnpm --filter @clinic/db exec drizzle-kit generate --custom --name <name>`, then write the SQL.
3. `pnpm db:lock` records the file's checksum. Commit the SQL, `meta/` and `checksums.json` together.
4. `pnpm db:migrate` applies it to the local D1. Staging and production: see the deploy steps above.

Rules:
- Never edit a migration after it is committed. A test (`pnpm check`) fails if you do; put the change in a new migration.
- One change per migration.
- Breaking changes take two releases: first add the new column or table, later remove the old one.
- Before applying to production, note a Time Travel bookmark (production deploy, step 1).

### Secrets

`pnpm wr secret put NAME --env staging` (or `--env production`; wrangler asks for the value with hidden input). Never put a
secret in `wrangler.jsonc`, the repo, or chat. Local values go in `apps/worker/.dev.vars`.
Add every secret to `docs/ACCOUNTS.md` (name and where it lives, never the value).
