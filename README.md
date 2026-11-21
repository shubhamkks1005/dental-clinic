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
- Staging: `pnpm deploy:staging` (one command; needs `wrangler login` and real IDs first).
- Production: no script yet; added with CI in task 1.1.3.
