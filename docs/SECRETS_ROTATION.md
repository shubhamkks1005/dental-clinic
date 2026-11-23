# Secrets rotation (9.3.3)

Where the secrets live and when to rotate them. **This file never contains secret values.**

See `docs/ACCOUNTS.md` for the full account register (which account holds each secret, permissions, and setup steps).

---

## Secrets table

| Secret | Where stored | Min permission | Rotate every |
|--------|-------------|---------------|-------------|
| Cloudflare API token (deploy) | GitHub secret `CLOUDFLARE_API_TOKEN` | Workers Scripts Edit + D1 Edit (this account only) | 6 months |
| Cloudflare API token (backup) | GitHub secret `CLOUDFLARE_API_TOKEN_BACKUP` | D1 Export only | 6 months |
| Cloudflare API token (analytics) | GitHub secret `CLOUDFLARE_ANALYTICS_TOKEN` | Account Analytics read only | 6 months |
| Google OIDC client secret | Worker secret `GOOGLE_CLIENT_SECRET` | — | On any sign of leak |
| Session HMAC key (pepper) | Worker secret `SESSION_HMAC_KEY` | — | 6 months (ends all sessions — plan the outage) |
| Ops webhook HMAC key | Worker secret `OPS_WEBHOOK_SECRET` | — | 6 months |
| B2 application key (backup write) | GitHub secret `B2_APP_KEY` + `B2_KEY_ID` | Bucket read+write (dental-clinic-backups only) | 6 months |
| B2 key (file storage) | Worker secret `S3_APP_KEY` + `S3_KEY_ID` | Bucket read+write (dental-clinic-files only) | 6 months |
| Healthchecks backup URL | GitHub secret `HEALTHCHECKS_BACKUP_URL` | Ping only | On any sign of leak |
| Healthchecks billing URL | GitHub secret `HEALTHCHECKS_BILLING_URL` | Ping only | On any sign of leak |
| SMS gateway credentials | Worker secret (name TBD — see 7.1.2) | Gateway API only | 6 months |
| age private key (backup decrypt) | Developer password manager + sealed envelope at sister's home | — | Never (rotate only if compromised; re-encrypt all backups) |

---

## 6-month rotation calendar template

Fill in real dates before go-live.

| Rotation | Due date | Done date | Done by |
|----------|----------|-----------|---------|
| Rotation 1 (after go-live) | ________ | | developer |
| Rotation 2 | ________ | | developer |
| Rotation 3 | ________ | | developer |
| Rotation 4 | ________ | | developer |

**Rotation drill procedure (run once before go-live for 9.3.3):**

1. Generate a new token / key with the same minimum permissions.
2. Update the secret in GitHub (or `wrangler secret put`) — do not remove the old one yet.
3. Deploy to staging; confirm staging works.
4. Deploy to production; confirm production works.
5. Delete the old token from Cloudflare / B2 / provider dashboard.
6. Write the rotation date in the table above.

---

## Rules

- Every token has the minimum permission for its job. No shared admin tokens.
- Worker secrets are set with `wrangler secret put --env production` — never typed in chat, files, or the repo.
- If a secret is ever printed in a log or accidentally committed: treat it as compromised, rotate immediately, audit `audit_log` and `access_log` for unexpected access.
- The age private key is never in GitHub, CI, or any cloud service. Only the developer and the sealed envelope copy.

---

## See also

- `docs/ACCOUNTS.md` — full account register with setup steps and "not secret" metadata
- `docs/BREACH_PLAN.md` — what to do if a secret is compromised
