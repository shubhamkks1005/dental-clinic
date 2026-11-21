# ACCOUNTS (register of accounts and tokens)

Never write a secret value, password, recovery code or token here. Only where it lives.
Secrets live in exactly two places: Worker secrets (`wrangler secret put`) and GitHub
encrypted secrets. Local development uses `apps/worker/.dev.vars` (gitignored).
Every token: least permissions, an expiry date, one purpose. Review this file every 6 months.

## Accounts

| Account | Used for | Owner login | 2FA | Notes |
| --- | --- | --- | --- | --- |
| GitHub (shubhamkks1005) | repo, CI, encrypted secrets | owner | (owner fills) | personal account only |
| Cloudflare | Worker, D1, R2, Access | (owner fills) | (owner fills) | not created yet |

## Tokens and secrets

| Name | Purpose | Stored in | Permissions | Created | Expires | Last rotated |
| --- | --- | --- | --- | --- | --- | --- |
| CLOUDFLARE_API_TOKEN (deploy) | CI deploy + D1 migrations (added with the deploy step) | GitHub secret | Account: Workers Scripts Edit, D1 Edit; only this account (confirm the minimum when creating) | - | - | - |
| CLOUDFLARE_API_TOKEN (backup) | nightly D1 export (task 0.6.8 / 9.1) | GitHub secret, separate name | Account: D1 only, smallest level that export accepts (test in 0.6.8) | - | - | - |
| CLOUDFLARE_ACCOUNT_ID | tells wrangler which account | GitHub variable (not a secret) | - | - | - | - |

Add a row before creating any new token (B2, Healthchecks, Brevo, SMS gateway, domain).
