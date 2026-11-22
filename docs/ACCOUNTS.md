# ACCOUNTS (register of accounts and tokens)

Never write a secret value, password, recovery code or token here. Only where it lives.
Secrets live in exactly two places: Worker secrets (`wrangler secret put`) and GitHub
encrypted secrets. Local development uses `apps/worker/.dev.vars` (gitignored).
Every token: least permissions, an expiry date, one purpose. Review this file every 6 months.

## Accounts

| Account | Used for | Owner login | 2FA | Notes |
| --- | --- | --- | --- | --- |
| GitHub (shubhamkks1005) | repo, CI, encrypted secrets | owner | (owner fills) | personal account only |
| Cloudflare | Worker, D1, R2 | owner's personal Gmail via Google login, plus a password | security key | created on the owner's personal device; never logged in on the dev Mac |
| Cloudflare Zero Trust (Access) | staff login (one-time PIN) | same as Cloudflare | same | Free plan; if it asks for a card, stop and decide first |

The Cloudflare account was created with the owner's personal Gmail via Google login; a password is set and 2FA uses a security key.

## Not secret, but needed (fill in after setup)

| Item | Value | Used by |
| --- | --- | --- |
| Account ID | bc903cf48da626b1bbd501857a4a0013 | `account_id` in apps/worker/wrangler.jsonc and wrangler.spike.jsonc (not exported in the terminal); later CI |
| Access team domain | (owner fills, like yourteam.cloudflareaccess.com) | JWT check (1.3.2) |
| Access app AUD tag (staging) | (owner fills) | JWT check (1.3.2) |
| Staging URL | (owner fills, printed by deploy) | Access app domain, smoke tests |

## Tokens and secrets

| Name | Purpose | Stored in | Permissions | Created | Expires | Last rotated |
| --- | --- | --- | --- | --- | --- | --- |
| CLOUDFLARE_API_TOKEN (Mac setup) | wrangler on the dev Mac: create/migrate/delete D1, staging deploy, spike 0.6.3 | nowhere: typed with `read -s` for one terminal session | Account: D1 Edit, Workers Scripts Edit; Account resources: this account only (confirmed enough for d1 create/migrate and remote dev in spike 0.6.3) | 2026-11-22 | 30 days after creation; DELETE in the dashboard after the staging deploy and Access test | - |
| CLOUDFLARE_API_TOKEN (deploy) | CI deploy + D1 migrations (added with the deploy step) | GitHub secret | Account: Workers Scripts Edit, D1 Edit; only this account (confirm the minimum when creating) | - | - | - |
| CLOUDFLARE_API_TOKEN (backup) | nightly D1 export (task 0.6.8 / 9.1) | GitHub secret, separate name | Account: D1 only, smallest level that export accepts (test in 0.6.8) | - | - | - |
| CLOUDFLARE_ACCOUNT_ID | tells wrangler which account | GitHub variable (not a secret) | - | - | - | - |

Add a row before creating any new token (B2, Healthchecks, Brevo, SMS gateway, domain).
