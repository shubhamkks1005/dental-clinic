# Alarms (1.6.4 / 9.1.10)

Dead-man and uptime only. No third-party error tracker (patient data risk).

| Check | Tool | Period / grace | On fail |
| --- | --- | --- | --- |
| Nightly D1 backup ping | Healthchecks.io | 24 h / grace 2–3 h | Email developer |
| Weekly R2→B2 files copy | Healthchecks.io | 7 d / grace 1 d | Email developer |
| Weekly clinic PC copy | Healthchecks.io | 7 d / grace 1 d | Email developer (PC was off) |
| Staff API up | UptimeRobot | every 5 min | Email on down |
| Billing integrity (5.4.1) | Healthchecks.io | weekly | Email on fail ping |

Ping bodies may include size, UTC stamp, filename, sha256 of **ciphertext** only. Never patient names, mobiles, or dump contents.

## Owner setup (Waiting)

### Healthchecks (backup)

1. Create account at healthchecks.io (free).
2. New check: name `clinic-backup-d1`, period 24 h, grace 2 h, email = developer.
3. Copy the ping URL into GitHub secret `HEALTHCHECKS_BACKUP_URL` (the ping URL, not the login password).
4. Optional: separate checks for files backup and PC copy; put URLs in secrets when those workflows go live.

### UptimeRobot (1.6.4)

1. Create UptimeRobot account (free).
2. Monitor type HTTP(s), URL = staging then production `https://…/api/staff/health`, interval 5 minutes.
3. Alert contact = developer email.
4. No repo secret needed (account only). Note the monitor id in ACCOUNTS.md “Not secret” table when created.

### Alarm test (Done when)

1. Temporarily pause the backup workflow or miss one night → confirm Healthchecks emails within grace.
2. Point UptimeRobot at a URL that 503s (or use Healthchecks fail URL) → confirm down email.
3. Write the date of both tests in STATE.md.

Agent cannot create these accounts or store ping URLs. Until then, local `pnpm backup:dry-run` and unit tests cover the pipeline without live pings.
