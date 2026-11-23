# Pilot preparation (10.1.2–10.1.14)

Stage 0: everything needed before the first real patient enters the software.

---

## 10.1.2 Cutover date and calendar

Pick the shadow-start date, software-lead date, and cutover date before anything else.

**Rules:**
- Start on a Monday (developer available the whole week; Sunday backup can be checked).
- Not on a holiday, festival, or in the 6 weeks before / after a long leave by any of the three people.
- 20–30% fewer bookings in the first 2–4 weeks (see 10.1.13 load plan).

| Milestone | Target date | Confirmed by |
|-----------|------------|-------------|
| Shadow start (Stage 1) | Waiting | Doctor |
| Software-lead start (Stage 2) | Waiting | Doctor |
| Cutover (Stage 3) | Waiting | Doctor + Developer |

---

## 10.1.3 Responsibilities and backup user

| Person | Primary role | Backup |
|--------|-------------|--------|
| Receptionist | Day-to-day use; daily reconciliation | Doctor (or trusted family) |
| Doctor | Clinical data; prescriptions; settings decisions | Developer for technical |
| Developer | Fixes; monitoring; deploy | — (escalate to developer) |
| Decision maker | Doctor (sister) | — |

**Privacy rules for all staff:**
- Never show a patient's screen to another patient or visitor.
- Never send patient data on WhatsApp or personal email.
- Lock the computer screen when leaving the desk (Windows: Win+L; Mac: Ctrl+Cmd+Q).

**Backup user setup (before go-live):**
- [ ] Add backup user email to Cloudflare Access (or staff app) — Waiting on owner
- [ ] Backup user completes basic training (new appointment + take payment)
- [ ] Record backup user name in ACCOUNTS.md

---

## 10.1.4 Paper baseline measurement

Measure how long the paper workflow takes **before** switching. Take 10 patients on one day with a stopwatch.

| Task | Paper time (measured) | Software target |
|------|----------------------|----------------|
| Register new patient | _____ min | 2 min |
| Find and open returning patient | _____ min | 30 sec |
| Write a prescription | _____ min | 3 min |
| Create bill and issue receipt | _____ min | 2 min |
| Day-end cash total | _____ min | 15 min |

Also record: new patients/day _____, returning/day _____, no-shows _____.

This is the baseline to compare against after Stage 2 (see `PLAN.md` 10.2.10).

---

## 10.1.5 Hardware checklist

| Item | Status | Notes |
|------|--------|-------|
| Browser: Chrome latest, auto-update on | Waiting | |
| Browser: pop-ups allowed for clinic domain | Waiting | |
| Printer: test-print a prescription on actual paper | Waiting | |
| Printer: test-print a bill/receipt (A5 paper loaded) | Waiting | |
| UPS / inverter covers router + PC for ≥15 minutes | Waiting | Test with power off |
| Backup internet: phone hotspot tested and credentials noted | Waiting | |
| Wi-Fi password and router location noted | Waiting | |
| Spare keyboard and mouse available | Waiting | |
| PC clock set to IST | Waiting | |
| Screen lock timeout: 5 minutes idle | Waiting | |
| Windows / macOS updates: scheduled for after clinic hours | Waiting | |

---

## 10.1.6 Phone and SIM (for SMS gateway — Phase 7)

| Item | Status |
|------|--------|
| Android phone dedicated to SMS only | Waiting |
| Separate SIM, recharge plan noted in calendar | Waiting |
| Charger always plugged in at clinic | Waiting |
| Battery optimisation disabled for gateway app | Waiting |
| App auto-start on boot enabled | Waiting |
| Phone in a secure, fixed location; signal checked | Waiting |
| Dashboard shows "gateway online" for 3 days straight | Waiting |

---

## 10.1.7 Pre-existing patients decision

**Recommended approach: A + B (not C)**

- **Option A:** Enter existing patients only at their next visit (no pre-load, minimum effort).
- **Option B:** Pre-load only: patients with an appointment in the next 30 days + patients with active ongoing treatment.
- **Option C:** Pre-load the full patient list (high effort, high error rate — not recommended).

**Decision:** Waiting — doctor to confirm A+B approach and estimate how many cards fall in B.

| Item | Count / status |
|------|---------------|
| B: patients with appointment in next 30 days | _____ |
| B: patients with active ongoing treatment | _____ |
| B: total to pre-load before cutover | _____ |

---

## 10.1.8 Pre-load data preparation

Pre-load data for Option B patients. **Only on the developer's encrypted laptop — never in cloud services, WhatsApp, or email.**

Columns needed in the pre-load sheet:

| Column | Rule |
|--------|------|
| Full name | As on paper card |
| Mobile | 10-digit; normalised (see `normaliseMobile`); or "no mobile" |
| Age or date of birth | Date preferred |
| Area | Optional |
| Ongoing treatment (one line) | e.g. "RCT tooth 36 — 2 sittings pending" |
| Next appointment date and time | YYYY-MM-DD HH:MM |
| Privacy notice given? (Y/N) | Without Y, SMS reminders are off |

**Rules:**
- Mobile must be valid or explicitly "no mobile."
- Duplicates: same mobile = same person; check carefully.
- Secure delete the sheet from the laptop after import is confirmed.

---

## 10.1.9 Pre-load dry run and sample check

1. Import the sheet into the **local** database (`pnpm db:seed` variant or manual import script).
2. Check for errors: invalid mobiles, duplicate mobiles, names longer than 100 characters, special characters.
3. Fix errors in the sheet and re-import.
4. Sample check: pick 50 random rows; compare mobile numbers with the paper cards — 100% must match.
5. Import into production via the staff app (import route, with audit).
6. Confirm production count = sheet row count.
7. Secure-delete the sheet and local copy.

| Step | Status |
|------|--------|
| Local dry run | Waiting |
| Error count | 0 (required before production import) |
| 50-row sample check | Waiting |
| Production import | Waiting |
| Sheet secure-deleted | Waiting |

---

## 10.1.10 Mock day scenarios

30 scenarios to run during the dress rehearsal (10.1.11). Each has an expected result.

| # | Scenario | Expected result |
|---|----------|----------------|
| 1 | Register a new patient (adult) | Patient saved with P-XXXXXX code; can book appointment |
| 2 | Register a new patient (child, with guardian) | Saved with guardian details; SMS off until consent given |
| 3 | Register a patient with no mobile | "No mobile" reason accepted; SMS consent N/A |
| 4 | Duplicate mobile — different names | Soft warning shown; receptionist can override and save |
| 5 | Book an appointment for a returning patient | Appointment appears on the day view |
| 6 | Walk-in patient (no appointment) | Walk-in added to the top of the Today list |
| 7 | Emergency patient (walk-in, overbooks) | Emergency added even if the slot is full |
| 8 | Patient arrives — mark Arrived | Status updates on Today screen for the doctor |
| 9 | Patient in chair — mark In chair | Status updates; doctor sees "Now" patient |
| 10 | Complete a visit | Status = Completed; visit is locked |
| 11 | No-show — mark No-show | Patient moves to call list |
| 12 | Reschedule a no-show to another day | Old appointment shows Rescheduled; new one created |
| 13 | Cancel an appointment with a reason | Appointment marked Cancelled with reason |
| 14 | Same mobile, two patients (mother and child) | Both profiles link to the same number; shown as "N others on this number" |
| 15 | Same name, different mobile | Both saved; no duplicate warning |
| 16 | Patient arrives late (after in-chair block) | Status change still allowed |
| 17 | Doctor opens a visit and fills notes | Notes autosave; Saved chip appears |
| 18 | Doctor issues a prescription | Rx printed; cannot be edited after issue |
| 19 | Doctor finalises a visit | Visit locked; addendum option visible |
| 20 | Partial payment — patient pays half | Bill issued; partial receipt; balance shows as Due |
| 21 | Full payment | Receipt prints automatically |
| 22 | Split payment (cash + UPI) | Receipt shows both payment modes |
| 23 | Advance payment (more than the bill) | Leftover shows as Advance on patient billing tab |
| 24 | Discount request by receptionist | Discount saved as pending; doctor gets notification |
| 25 | Doctor approves discount | Bill can be issued with the approved discount |
| 26 | Cancel a draft bill | Bill cancelled; number retained; cannot be re-issued |
| 27 | Reprint a receipt | Duplicate stamp on reprint; original not changed |
| 28 | Day close — cash matches | Day closed; no note required |
| 29 | Day close — cash does not match (intentional ₹10 difference) | Day close requires a note; still closes |
| 30 | Power goes out — paper mode drill | Staff use printed day list; enter late records after power returns with "Late entry" label |

---

## 10.1.11 Dress rehearsal

**Staging with fake data. Developer watches only — no help.**

- [ ] 30 scenarios run (see table above)
- [ ] Timer recorded for each scenario
- [ ] Real clinic printer used for prescriptions, bills, receipts
- [ ] SMS in `dry_run` mode (no real messages sent)
- [ ] Day close done at the end
- [ ] Stuck points noted as bugs or manual gaps

**Pass criteria:** 28/30 scenarios pass without developer help. Remaining 2: fix or document workaround.

| Result | Status |
|--------|--------|
| Scenarios passed | ___ / 30 |
| Bugs filed | ___ |
| Rehearsal date | Waiting |

---

## 10.1.12 Patient and staff notice

Before go-live:
- [ ] Printed notice at the reception desk: "We are starting a new computer system. It may take a little extra time. Thank you for your patience."
- [ ] 15-minute staff briefing: what is changing, when, who to ask if something is wrong.
- [ ] Receptionist has a one-line script for patients asking about the system.

---

## 10.1.13 Booking load plan

Reduce the booking load for the first 2–4 weeks to allow time for learning and fixes.

**Plan (doctor to approve):**
- [ ] Every 3–4 appointments: one empty slot (buffer for extra time per patient).
- [ ] Or: 20–30% fewer bookings per day for the first 2 weeks.
- [ ] New patients: allow 10 extra minutes (registration takes longer in the software initially).
- [ ] Doctor decides when to return to normal booking pace.

| Item | Status |
|------|--------|
| Load reduction plan agreed with doctor | Waiting |
| Appointment book adjusted for first 2 weeks | Waiting |

---

## 10.1.14 Privacy and consent preparation

| Item | Status |
|------|--------|
| Privacy notice version fixed (8.10.1) | Waiting |
| Privacy notice printed on A5 with QR code (if any) | Waiting |
| Receptionist has the consent script: "May I note your consent for SMS appointment reminders?" | Waiting |
| `consents` table entry method: paper or verbal, notice version recorded | Waiting |
| Guardian consent flow tested for under-18 patients | Waiting |
| 5 mock patients processed with consent in the dress rehearsal | Waiting |
| Notice version number on paper and in system match | Waiting |

---

## See also

- `docs/GO_NO_GO.md` — go/no-go criteria
- `docs/PAPER_KIT.md` — paper backup kit
- `docs/TRAINING.md` — training sessions
- `docs/USER_MANUAL.md` — staff manual
