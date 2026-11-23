# Data retention (9.3.10)

How long each type of data is kept, and when it is deleted.

**DRAFT — clinical retention policy (8 years) is a clinic decision. Owner / doctor to confirm before go-live.**

---

## Retention table

| Data | Table(s) | Minimum legal | Clinic policy | Delete how |
|------|----------|--------------|--------------|-----------|
| Clinical records (visits, prescriptions, diagnoses, procedures, plan items, tooth events) | `visits`, `visit_diagnoses`, `visit_procedures`, `tooth_events`, `prescriptions`, `plan_items` | 3 years (DCI Code 3.3.1) | **8 years — DRAFT** (IDA recommends 8 years; clinic to confirm) | Soft delete (`deleted_at`); purge job after policy period |
| Patient demographics | `patients` | Same as clinical | Same as clinical | Soft delete; purge after clinical period |
| Medical history versions | `medical_history` | Same as clinical | Same as clinical | Purge with patient |
| Files (X-rays, photos, scans) | `files` + R2/B2 objects | Same as clinical | Same as clinical | Soft delete metadata; remove object from storage after period |
| Billing records (bills, payments, refunds) | `bills`, `bill_items`, `payments`, `payment_allocations`, `refunds` | 7–8 years (income tax / GST) — DRAFT CA to confirm | Same as clinical or 8 years, whichever is longer | Soft delete; keep for tax |
| Audit log | `audit_log` | No minimum set | Keep permanently | Do not purge |
| Access log | `access_log` | No minimum set | 1 year | Purge rows older than 1 year |
| Message outbox | `message_outbox` | — | 1 year | Purge rows older than 1 year |
| Message attempts | (future `message_attempts` table) | — | 90 days | Purge rows older than 90 days |
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

**Purge job status:** Not yet implemented. Needed before data volume grows large.

Rules for the purge job:
- Only soft-deletes (`deleted_at IS NOT NULL`) or non-clinical tables (access_log, sessions, outbox, etc.).
- Clinical records (visits, patients, files, billing) are **not** auto-purged — the doctor must manually approve deletion requests.
- A `legal_hold` flag on a patient row prevents any purge of their data (for disputes or pending records requests).
- Purge rows with a row limit (e.g. DELETE 500 rows per tick) to stay within CPU budget.
- Write a summary to `ops_status` after each purge run.

---

## Notes

- "DRAFT" means the policy number is an agent/plan default and must be confirmed by the doctor and/or accountant before it is enforced.
- DCI Code 3.3.1: clinical records ≥ 3 years.
- IDA suggestion: 8 years (not legally binding, but widely followed).
- GST / income tax: typically 7–8 years for financial records (CA to confirm for this clinic's situation).
- DPDP Act: data must not be kept longer than necessary for the stated purpose.
