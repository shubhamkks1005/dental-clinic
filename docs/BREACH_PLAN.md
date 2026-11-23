# Breach response plan (9.3.9) — DRAFT

**Lawyer to confirm notification obligations, timelines, and notice wording before go-live.**

A "breach" is any unauthorised access, disclosure, or loss of patient data.

---

## Step 1 — Contain (within 30 minutes)

| Action | Who | How |
|--------|-----|-----|
| Disable the patient portal (`/my`) | Developer | Settings → Privacy → disable portal (or deploy with portal routes returning 503) |
| Stop SMS/WhatsApp messaging | Developer | Settings → Messages → Messaging enabled: OFF (kill switch 7.2.10) |
| Rotate compromised secrets | Developer | See `docs/SECRETS_ROTATION.md` rotation procedure |
| End all active staff sessions | Developer | `pnpm staff:recover-doctor --env production` ends sessions; or deactivate the affected account in Settings → Staff |
| Preserve evidence | Developer | Do not delete logs; screenshot `audit_log` and `access_log` for the affected rows; note timestamp of discovery |

---

## Step 2 — Investigate (within 2 hours)

| Question | Where to look |
|----------|--------------|
| Which patients are affected? | `audit_log` and `access_log` — filter by time range and action |
| What data was accessed? | `access_log` resource + resource_id; `audit_log` before_json / after_json |
| How many records? | COUNT(*) on affected rows |
| How did it happen? | Worker logs, `access_log` login/failed actions, D1 export diff |
| Is the breach still ongoing? | Check active sessions; check if credentials are still valid |

Write a summary: who, what data, how many patients, how it happened, when it was contained.

---

## Step 3 — Notify

**DRAFT — lawyer to confirm exact timelines and wording.**

| Recipient | When | How | What to say |
|-----------|------|-----|-------------|
| Doctor (sister) | Immediately | Phone call | Situation summary; she decides on patient notice |
| Developer's own note (internal log) | Immediately | Private document | Full timeline |
| Affected patients | As soon as possible; plain language | Phone call or in-person; not SMS/WhatsApp (use those channels only after they are confirmed secure) | "We discovered that your records may have been accessed without authorisation. We have secured the system. Your [name, date of birth, treatment notes] may have been seen. We are sorry. Please call us at [clinic number] with any questions." |
| Data Protection Board (Rule 7, DPDP) | Within 72 hours of discovery | DRAFT — form/process not yet known | Full written notice: nature of breach, categories of data, estimated number of patients, contact person, steps taken |

---

## Step 4 — Record

Write a one-page incident report and keep it in a physical folder at the clinic:
- Date and time of discovery
- Date and time of containment
- What happened
- Who was affected and how many
- What was disclosed
- Steps taken
- Notifications sent and when
- Changes made to prevent recurrence

---

## Tabletop drill (required before go-live)

**Scenario:** An unknown IP logs in to a staff account at 2 AM and reads patient records.

Steps to practise:
1. Developer runs through contain steps (§1) in under 30 minutes using staging.
2. Write out a draft patient notice in plain English.
3. Time the full exercise.
4. Record the date and outcome in the table below.

**Target:** contain steps completed and notice draft written within 30 minutes.

| Drill | Date | Time to contain | Note |
|-------|------|----------------|------|
| First tabletop | Waiting | | |

---

## See also

- `docs/SECRETS_ROTATION.md` — how to rotate secrets
- `docs/ACCESS_REVIEW.md` — regular access audits
- `docs/PRIVACY_READINESS.md` — full privacy checklist
