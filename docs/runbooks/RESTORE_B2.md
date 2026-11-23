# Restore drill 1: B2 full restore (9.1.7)

**Never restore real patient data onto staging or a shared machine.** Use the developer laptop only. Wipe after.

## Dry practice with FAKE data (agent / local)

```bash
pnpm backup:dry-run
# If age is installed, ciphertext is under scripts/backup/.dry-out/
# Decrypt only on an encrypted disk with the private key held offline:
#   age -d -i /path/to/clinic-backup.age -o /tmp/restore.sql scripts/backup/.dry-out/d1-….sql.age
#   # then import into a throwaway local D1 — never commit /tmp/restore.sql
rm -rf scripts/backup/.dry-out /tmp/restore.sql
```

Measure wall-clock for the live drill and replace the 4-hour estimate in `docs/BACKUP.md`.

## Live drill (staging fake DB → laptop)

1. Download latest `d1-….sql.age` + `.sha256` from B2 (HTTPS or rclone). Verify sha256 of ciphertext.
2. Decrypt with age private key (password manager / sealed envelope). Private key never enters CI.
3. `wrangler d1 execute … --local` import into a **new** local database (or `sqlite3` throwaway).
4. Run `node scripts/backup/integrity.mjs` on the SQL (or integrity already ran at backup time).
5. Run `node scripts/billing-integrity/check.mjs` if bills exist.
6. Start `pnpm dev` against that local DB; open 5 FAKE patients; note row counts vs B2 metadata.
7. Secure-delete decrypted SQL and stop using that local DB.

## Production restore steps (write actual times after first drill)

1. Create a new D1 database; apply migrations through the last known good.
2. Import decrypted dump (or use Time Travel if within 7 days — see RESTORE_TIME_TRAVEL.md).
3. Point Worker binding to the new DB; redeploy.
4. Smoke: health, one staff login, 5 patient opens, billing day total.
5. Keep the old DB until sister confirms; then delete per retention.

## Waiting on owner

- First real staging restore date + measured minutes in STATE.md.
- Confirm B2 download works with the backup key.
