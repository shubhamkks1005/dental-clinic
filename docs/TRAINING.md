# Training plan (9.5.3)

Two 90-minute sessions + a mock day + a cheat sheet.

---

## Session 1 — Receptionist basics (90 minutes)

**Audience:** Receptionist (and doctor if available)
**Location:** Clinic, on the actual clinic computer
**Prerequisite:** Staging is live with fake data; clinic printer is set up

| Time | Topic | Activity |
|------|-------|----------|
| 0–10 min | Sign in and Today screen | Sign in with Google; walk through Today layout |
| 10–25 min | New patient registration | Register 3 fake patients (new, with guardian, without mobile) |
| 25–40 min | Appointments | Book, reschedule, cancel, walk-in, change status |
| 40–55 min | Billing | Create bill, take payment (cash, UPI, split), print receipt |
| 55–65 min | Day close | Count cash, close the day, reconcile |
| 65–75 min | Print day list | Print today's and tomorrow's list; file it |
| 75–80 min | Messages / WhatsApp | Open a WhatsApp reminder; explain what to type (nothing clinical) |
| 80–90 min | Paper mode drill | App "goes down" (dev closes staging); receptionist runs 5 appointments from paper |

**Goals:** Receptionist can run a full day on the software without help.

---

## Session 2 — Doctor + advanced (90 minutes)

**Audience:** Doctor + Receptionist
**Location:** Clinic

| Time | Topic | Activity |
|------|-------|----------|
| 0–10 min | Doctor Today view | Now + Next 3; open a visit from Today |
| 10–25 min | Visit notes | Chief complaint, vitals, diagnoses, quick phrases |
| 25–40 min | Dental chart | Click surfaces, keyboard navigation, record conditions |
| 40–55 min | Prescriptions | Add medicines, allergen warnings, issue, print, revise |
| 55–65 min | Treatment plan | Add plan items, mark as told, link to visit |
| 65–75 min | Settings | Edit medicines list, timings, consent templates |
| 75–85 min | Reports | Dashboard, range, CSV export |
| 85–90 min | Privacy + consent | Privacy notice, consent at registration, withdrawal |

**Goals:** Doctor can run a full consultation, prescribe, plan, and check reports without help.

---

## Mock day (after Session 2)

**Audience:** Receptionist + Doctor (developer only watches — no help)
**Duration:** Half a working day (~4 hours) on staging with fake data
**Goal:** 28 out of 30 scenarios pass without developer help (see `docs/PILOT_PREP.md` §mock-scenarios)

What the developer does:
- Keeps time
- Notes every stuck point (bug or manual gap)
- Does not intervene unless safety is at risk

After the mock day: fix bugs and add manual gaps to `docs/USER_MANUAL.md`.

---

## Cheat sheet (print and keep at the desk)

**Align Dentistry — Software quick reference**

```
SIGN IN          → Open clinic site → Sign in with Google
TODAY            → See appointments → click name to open
NEW PATIENT      → Press + → fill name + mobile + gender → Save
WALK-IN          → Today → Walk-in button → search / new
APPOINTMENT      → Appointments tab → click empty slot or + New
STATUS           → Click patient card → Arrived / In chair / Completed / No-show
VISIT (doctor)   → Today → patient name → Notes tab
PRESCRIPTIONS    → Patient → Medicines tab → New prescription
BILLING          → Patient → Billing tab → Create from visit → Issue → Pay
RECEIPT          → Prints automatically; Reprint: Billing tab → Print receipt
DAY CLOSE        → Billing → Day close → count cash → Close
PRINT DAY LIST   → Today → Print tomorrow's list (do every evening)
SEARCH           → Press / → type name or last 4 digits of mobile
SIGN OUT         → Top right → Sign out (or just close the tab after the session)

PAPER MODE       → App unavailable → use printed day list from desk folder
PROBLEM          → Report a problem button (bottom of screen)
                   or call: [DEVELOPER PHONE]
```

Print one copy and laminate it. Keep it next to the clinic computer.

---

## Done when

- [ ] Receptionist ran a full mock day without help (28/30 scenarios pass)
- [ ] Doctor ran a 10-minute consultation on fake data without help
- [ ] Cheat sheet printed and on the desk
- [ ] Bugs from the mock day filed and fixed (or workaround documented)
