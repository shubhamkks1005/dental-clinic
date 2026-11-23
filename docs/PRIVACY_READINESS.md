# Privacy readiness (9.3.8)

Checklist for DPDP Act readiness before going live with real patient data.

**DPDP Act operational rules apply from 13 May 2027. Real patients must not go live before every "Yes" row is confirmed.**

| Item | Status | Notes / task |
|------|--------|-------------|
| Privacy notice live and versioned (8.10.1) | Waiting | DRAFT text in migration 0050; lawyer to confirm wording before version is fixed |
| Consent recorded per patient (2.1.9) | Yes | `consents` table append-only; method paper/verbal; notice version stored |
| Consent required before SMS reminders (7.7.1) | Yes | `sms_reminders` consent type gates message enqueue |
| Guardian consent for under-18 (2.1.3) | Yes (DRAFT) | Guardian save required; final DPDP wording Waiting on lawyer |
| Purpose for each data field documented (2.1.1) | Yes | `PATIENT_FIELDS` registry with `purpose` |
| Retention table written (9.3.10) | Yes (DRAFT) | See `docs/RETENTION.md`; clinical ≥3y per DCI; sister to confirm 8y policy |
| Data request / correction process (8.2.11) | Waiting | Process not yet built; paper workaround: patient calls clinic, doctor approves, developer updates |
| Breach response plan (9.3.9) | Yes (DRAFT) | See `docs/BREACH_PLAN.md`; tabletop drill not yet done |
| Published contact for data queries (Rule 9) | Waiting | Clinic phone number must appear in the privacy notice as the contact |
| Children's data — guardian consent rule | Yes (DRAFT) | Enforced in registration; actual DCI/DPDP exemption text not yet read — DRAFT |
| Processors list documented | Yes (DRAFT) | See table below |
| Data location notice | Waiting | D1 is not pinned to India; notice must state this explicitly (DRAFT line in 0050) |
| Processor DPAs / contracts reviewed | Waiting | No formal DPA with Cloudflare, B2, etc. yet — DRAFT |
| Vendor terms read (Cloudflare, B2, Brevo, GitHub) | Waiting | Owner to read and note acceptance date |
| Shown to someone who understands DPDP | Waiting | Owner to find a reviewer before go-live |

---

## Processors (who sees patient data)

| Processor | What they can see | Where |
|-----------|------------------|-------|
| Cloudflare (Workers + D1) | Encrypted traffic; D1 rows in Cloudflare infrastructure | Global (not pinned to India) |
| Backblaze B2 | Encrypted backup dump only (age-encrypted; no plaintext) | US |
| GitHub Actions | Runs CI; no patient data in repo or CI logs | US |
| Healthchecks.io | Ping bodies: size, timestamp, sha256 of ciphertext only; no PHI | — |
| Android SMS gateway (Phase 7) | Patient first name + clinic name + date/time only (no diagnosis) | On-premises clinic phone |
| Brevo (email, future) | Patient first name + email (if patient has email) | EU/US |

---

## Notes

- "Waiting" means the item must be completed before real patient data goes live.
- "Yes (DRAFT)" means code is in place but wording or policy is not yet confirmed by the doctor, lawyer, or owner.
- Review this page as part of the quarterly access review (see `docs/ACCESS_REVIEW.md`).
