# Data retention (9.3.10)

How long each type of data is kept, and when it is deleted.

**DRAFT — clinical retention policy (8 years) is a clinic decision. Owner / doctor to confirm before go-live.**

---

## Retention table

| Data | Table(s) | Minimum legal | Clinic policy | Delete how |
|------|----------|--------------|--------------|-----------|
| Clinical records (visits, prescriptions, diagnoses, procedures, plan items, tooth events) | `visits`, `visit_diagnoses`, `visit_procedures`, `tooth_events`, `tooth_notes`, `prescriptions`, `plan_items` | 3 years (DCI Code 3.3.1) | **8 years — DRAFT** (IDA recommends 8 years; clinic to confirm) | Soft delete (`deleted_at`); purge job after policy period |
| Patient demographics | `patients` | Same as clinical | Same as clinical | Soft delete; purge after clinical period |
| Medical history versions | `medical_history` | Same as clinical | Same as clinical | Purge with patient |
| Files (X-rays, photos, scans) | `files` + R2/B2 objects | Same as clinical | Same as clinical | Soft delete metadata; remove object from storage after period |
| Billing records (bills, payments, refunds) | `bills`, `bill_items`, `payments`, `payment_allocations`, `refunds` | 7–8 years (income tax / GST) — DRAFT CA to confirm | Same as clinical or 8 years, whichever is longer | Soft delete; keep for tax |
| Audit log | `audit_log` | No minimum set | Keep permanently | Do not purge |
| Access log | `access_log` | No minimum set | 1 year | Purge rows older than 1 year |
| Doctor breaks (Part T) | `doctor_breaks` | — | 90 days | Purge rows older than 90 days (purge job, row limit as the others) |
| Doctor requests (Part T) | `approval_requests` | — | Answered or dismissed requests: 1 year; refund requests are kept with billing; open ones are never purged. **DRAFT - owner / CA to confirm** | Purge job (rule in `retention.ts`) |
| Doctor leave days (0066) | `doctor_leaves` | — | 2 years after the row was made. | Purge job (rule in `retention.ts`) |
| Message outbox | `message_outbox` | — | 1 year | Purge finished rows older than 1 year (queued/held/sending are kept) |
| Message attempts | `message_attempts` | — | 90 days | Purge rows older than 90 days |
| Error log | `error_log` | — | 30 days (PLAN 9.2.5) | Purge rows older than 30 days |
| OTP requests | (future `otp_requests` table) | — | 1 day | Purge rows older than 1 day |
| Expired staff sessions | `staff_sessions` | — | 30 days after expiry | Purge where `expires_at` < 30 days ago |
| Webhook receipts | (future `webhook_receipts` table) | — | 3 days | Purge rows older than 3 days |
| Rate limit counters | (future `rate_limits` table) | — | 1 hour | Purge expired rows hourly |
| Day close records | `day_closes` | Same as billing | Same as billing | Soft delete with patient data |
| Consent records | `consents` | Same as clinical | Same as clinical | Soft delete; keep for legal |
| Certificates | `certificates` | Same as clinical | Same as clinical | Soft delete; gap-free number kept |
| Encrypted backup dumps (B2) | B2 bucket | — | Daily: 30 days; Monthly: 12 months; Yearly: 3 years | B2 lifecycle rules |
| Clinic PC copies | Local hard drive | — | 3 weekly copies (oldest deleted on 4th) | Automatic rotation |

---

## Purge job

A cron branch (`*/5 * * * *` Worker cron, in a low-traffic time slot) will purge rows that have passed their retention period, with a row limit per run to stay within the 10 ms CPU budget.

**Purge job status (9.3.10, implemented 2026-11-23):** daily at 02:00 IST, `packages/db/src/repos/retention.ts` + `apps/worker/src/cron/retention-purge.ts`.
- Covers only: `message_attempts` (90 days), `message_outbox` (1 year, finished rows with no attempts left), `error_log` (30 days), `doctor_breaks` (90 days), `approval_requests` (answered or dismissed, not refund, 1 year; DRAFT). Hard delete is allowed here because these are operational rows.
- **Dry run by default.** It counts what would go and writes one audit row (`retention_run`), nothing is deleted. It deletes only when the Worker var `RETENTION_MODE` is exactly `live` (set deliberately in wrangler.jsonc, then deploy).
- Max 200 rows per table per run. One audit row per run that had eligible rows (a quiet system adds none).
- Not implemented, waiting on the doctor / CA: access log (1 year; it is the view-audit trail), staff sessions, OTP / webhook / rate-limit tables (do not exist yet), `legal_hold` flag, soft-delete then purge of patients, clinical, files and billing (policy numbers above are DRAFT), B2 file removal.

Rules for the purge job:
- Only soft-deletes (`deleted_at IS NOT NULL`) or non-clinical tables (access_log, sessions, outbox, etc.).
- Clinical records (visits, patients, files, billing) are **not** auto-purged — the doctor must manually approve deletion requests.
- A `legal_hold` flag on a patient row prevents any purge of their data (for disputes or pending records requests).
- Purge rows with a row limit (e.g. DELETE 500 rows per tick) to stay within CPU budget.
- Audit entry for each run (instead of an `ops_status` summary: that table only allows fixed keys, so a new key would need a migration; dashboard line can come later).

---

## Notes

- "DRAFT" means the policy number is an agent/plan default and must be confirmed by the doctor and/or accountant before it is enforced.
- DCI Code 3.3.1: clinical records ≥ 3 years.
- IDA suggestion: 8 years (not legally binding, but widely followed).
- GST / income tax: typically 7–8 years for financial records (CA to confirm for this clinic's situation).
- DPDP Act: data must not be kept longer than necessary for the stated purpose.
