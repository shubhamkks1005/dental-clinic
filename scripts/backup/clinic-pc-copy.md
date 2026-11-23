# Clinic PC weekly copy (9.1.5)

Goal: if Cloudflare and B2 accounts are both unreachable, one encrypted copy still sits on the clinic PC.

## Owner setup

1. Create a **read-only** B2 application key for the backup bucket (list + read only).
2. On the clinic Windows PC, install [rclone](https://rclone.org/install/).
3. Configure a remote `b2backup` with that key (do not store the key in this repo).
4. Create folder `D:\clinic-backups\` (or similar). Disk holds **ciphertext only**.
5. Task Scheduler: every Sunday 22:00 local, run:

```bat
rclone copy b2backup:BUCKET/d1 D:\clinic-backups\d1 --max-age 8d --include "*.age" --include "*.sha256"
rclone copy b2backup:BUCKET/files-list D:\clinic-backups\files-list --max-age 8d
curl -fsS -m 30 -X POST -H "Content-Type: text/plain" --data "ok pc-copy" HEALTHCHECKS_PC_COPY_URL
```

6. Put `HEALTHCHECKS_PC_COPY_URL` only on the PC (not in git). Period 7 days, grace 1 day.
7. Keep 3 weekly folders; delete older ciphertext locally.

## Done when

- 3 weekly copies exist on the PC.
- One week with PC off → Healthchecks email received (note date in STATE.md).
