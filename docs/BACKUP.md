# Backup design (9.1.1 / 1.6.3)

Three layers. A backup counts only after a restore drill.

| Layer | What | How old data can be | When it helps |
| --- | --- | --- | --- |
| 1. D1 Time Travel | Cloudflare point-in-time restore (7 days, free) | ~1 minute | Bad migration, bad delete, bug |
| 2. Nightly export | `wrangler d1 export` → age encrypt → Backblaze B2 | up to ~24 h | Cloudflare/D1 account loss; mistakes older than 7 days |
| 3. Weekly copies | Encrypted dump + file list on clinic PC; R2→B2 file copy | up to ~7 days | Lose both Cloudflare and B2 access |

## Targets (estimate until measured in 9.1.7)

- Data loss: under 24 hours (Time Travel can be ~1 minute).
- Full restore from B2: under 4 hours (replace with measured time after drill).

## Schedule

- Nightly D1 export at **02:30 IST** (`0 21 * * *` UTC) in `.github/workflows/backup.yml`.
- Export pauses other D1 requests while it runs, so it runs after clinic hours.
- GitHub schedules can be late or drop; **Healthchecks** is the dead-man ping (grace 2–3 h).

## Retention (agent default until sister confirms)

- Daily encrypted dumps on B2: 30 days (B2 lifecycle).
- Monthly: keep 12 months.
- Yearly: keep 3 years.
- Clinic PC: keep 3 weekly copies.

## Who holds what (never store values in the repo)

| Item | Who | Where |
| --- | --- | --- |
| B2 account + app key | developer | GitHub secrets `B2_*`; login password manager |
| age public recipient | CI | GitHub variable `AGE_RECIPIENT` |
| age private key | developer + sister | password manager + sealed envelope at sister’s home — **never** GitHub/repo/CI |
| Cloudflare API (backup) | CI | GitHub secret `CLOUDFLARE_API_TOKEN_BACKUP` (D1 export only) |
| Healthchecks backup URL | CI | GitHub secret `HEALTHCHECKS_BACKUP_URL` |
| Clinic PC weekly copy | receptionist PC | Task Scheduler + B2 read-only key |

Setup steps for accounts: `docs/ACCOUNTS.md` section **1.6.3 owner setup**.

## Local test (no secrets)

```bash
pnpm backup:dry-run
```

Uses `scripts/backup/fixture-dump.sql` (FAKE). Runs integrity (+ billing when bill tables exist). Encrypts if `age` is installed (`brew install age`); otherwise integrity-only. Output under `scripts/backup/.dry-out/` (gitignored). Never prints dump contents or keys.

## Pipeline (live)

1. Export remote D1 (staging first).
2. Load into throwaway SQLite: `PRAGMA integrity_check` + required tables + Phase 5 billing invariants when `bills`/`payments` exist. Bad dump → fail, no upload.
3. Encrypt with age (public recipient only in CI).
4. Upload ciphertext + sha256 of ciphertext to B2 (`d1/…`).
5. Ping Healthchecks with size, stamp, filename, checksum only (no patient data).

## Do not

- Commit age private keys, B2 keys, or decrypted dumps.
- Print plaintext SQL or secrets in workflow logs (repo may be public).
- Treat Time Travel alone as backup (7 days, same account).
- Mark backup “OK” without a restore drill.
