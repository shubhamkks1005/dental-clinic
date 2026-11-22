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
| CLOUDFLARE_API_TOKEN (backup) | nightly D1 export (task 0.6.8 / 1.6.3 / 9.1) | GitHub secret `CLOUDFLARE_API_TOKEN_BACKUP` | Account: D1 only, smallest level that export accepts | - | - | - |
| CLOUDFLARE_ACCOUNT_ID | tells wrangler which account | GitHub variable `CLOUDFLARE_ACCOUNT_ID` (not a secret; value already in wrangler.jsonc) | - | - | - | - |
| AGE recipient (public) | encrypt nightly dumps (1.6.3) | GitHub variable `AGE_RECIPIENT` (age1… public only). Private key: paper + password manager only — never GitHub, never the repo | - | - | - | - |
| B2 application key | upload encrypted dumps (1.6.3) | GitHub secrets `B2_KEY_ID` + `B2_APPLICATION_KEY`; variables `B2_BUCKET` + optional `B2_ENDPOINT` | bucket write only, this backup bucket | - | - | - |
| Healthchecks backup check | dead-man ping after backup (1.6.3 / 1.6.4) | GitHub secret `HEALTHCHECKS_BACKUP_URL` (the ping URL, not the login) | - | - | - | - |
| UptimeRobot monitor | hit `/api/staff/health` every 5 min (1.6.4) | UptimeRobot account only (no repo secret) | - | - | - | - |

Add a row before creating any new token (B2, Healthchecks, Brevo, SMS gateway, domain).

## 1.6.3 owner setup (before the first real backup run)

1. Create Backblaze B2 account (if it asks for a card: stop and decide first). Create a private bucket for dumps. Application key: this bucket only. Put key id + key in GitHub secrets; bucket name (and endpoint if not default) in variables.
2. Install `age` on your laptop; `age-keygen -o clinic-backup.age`. Put the `age1…` public line in GitHub variable `AGE_RECIPIENT`. Keep the private key offline (sister sealed envelope + your password manager). Never commit it.
3. Create Healthchecks.io check (period 24 h, grace 2 h). Put the ping URL in `HEALTHCHECKS_BACKUP_URL`.
4. Create Cloudflare API token (D1 export only, this account). Put it in `CLOUDFLARE_API_TOKEN_BACKUP`. Set variable `CLOUDFLARE_ACCOUNT_ID` to the Account ID in wrangler.jsonc.
5. On GitHub: Actions → Backup → Run workflow (manual). Confirm one encrypted object appears in B2 and Healthchecks goes green.
6. Leave the schedule on for 7 nights; then restore once: download `.age`, decrypt with the private key, import into a throwaway local D1, compare row counts. Note the result in STATE.
