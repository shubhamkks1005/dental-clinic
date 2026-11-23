# Product audit: answers, register, ideal experience, roadmap

Written 2026-11-23 from the existing evidence only (`docs/ui-audit/`: 18 browser flows, 32 screenshots, page/form/workflow notes). No exploration was repeated, no application code was changed. Test limits: fake data, a clock at 9-10 PM on a Monday (clinic closed), a small database, and bug C1 repaired inside the test harness to reach the doctor's screens.

| File | What it holds |
|---|---|
| [ISSUES.md](ISSUES.md) | Master register: about 107 entries in 8 categories, each with severity, confidence (Verified / Observed / Code-based / Hypothesis), evidence and fix; verification gaps |
| [IDEAL_EXPERIENCE.md](IDEAL_EXPERIENCE.md) | What should replace the current screens: layout, hierarchy, actions, forms, workflows, vocabulary |
| [ROADMAP.md](ROADMAP.md) | P0 to P4 tasks in implementation order with dependencies and verification; decisions needed from people; gates |

## 1. What is wrong with the current product?
- **The daily loop does not work for a real user.** Three verified bugs stop it on day one: the doctor cannot open a visit (double-encoded request, PA-F01), cannot issue a prescription (stale version, PA-F02), and the receptionist cannot book without typing a note (null sent for an optional field, PA-F03).
- **Money screens cannot be trusted yet.** Overpayments are accepted silently and become "advance", "Full balance" records a payment in one click, no receipt is offered, and after a refund the balance, bill and statement do not move back (PA-B01, B02, F09, U05).
- **Hand-offs between people are missing.** The receptionist is not told a visit is ready to bill; the doctor is not told a discount is waiting; future bookings cannot be cancelled; no-shows cannot be recorded; moved appointments leave wrong-time messages; children cannot be reminded (PA-U01, L05, U04, L04, B03, B05).
- **The product looks half finished.** About half the screens (Billing, Bill, Messages, parts of Reports, profile Billing tab) are unstyled, margins differ per screen, three date formats and raw system words are shown, and internal notes are printed on the patient's bill (PA-D01, D02, D04, D05, L03).
- **Phone and tablet break on two core screens** (receptionist Today, tooth chart) and many tap targets are under 44 px (PA-F05, F06, F14).
- **Silent failures** (Timings Save, autosave in a stale tab, disabled buttons) make users believe data is saved when it is not (PA-F07, F08, S03).
- **Nothing in the test setup watches the core loop**, so these bugs passed `pnpm check` (PA-S01).

## 2. Why is it wrong (technical, logical, usability, business)?
- **Technical**: a client/server contract mismatch (double JSON encoding; `null` versus optional string), a stale-state bug (version held in a closure), missing server rules (no overpayment check, no queue clean-up on reschedule, no contact-number fallback), and a test suite that only uses mocks.
- **Logical**: rules contradict each other (a visit must have procedures to be billed but procedures hide on tab 2 and Finalise does not warn; discount pending changes the total; refund does not change the due; Today and Calendar name the same status differently).
- **Usability**: required steps are hidden (guardian, procedures), consequences are invisible (allocation, receipts), and risky actions are one click (Cancel, Full balance).
- **Business**: money mistakes cost cash and trust, wrong messages cost patients, the first-day failure would end a trial, and the doctor is non-technical, so extra tabs and silent steps become skipped steps.

## 3. What should the ideal product look and behave like?
See [IDEAL_EXPERIENCE.md](IDEAL_EXPERIENCE.md). In short: each role lands on a "what is waiting for me" screen; one frame and one vocabulary everywhere; the visit is one screen with a sticky Finalise bar and checklist; Billing is a hub with an S09-style bill and a safe payment card; messages are grouped by patient and never wrong; every failure explains itself.

## 4. In what exact order should we improve it?
See [ROADMAP.md](ROADMAP.md). Browser tests first, then the three blocking bugs, a core-loop test, payment safety and the refund rule (P0); then workflow and logic fixes (P1); Gate A re-run of the key flows without the test repair; then the redesign (P2); then product gaps (P3) and polish (P4).

## What is NOT claimed
No product-market fit is claimed or disproved. Section 7 of the register lists only hypotheses and how to test them. Items marked Observed were seen once; Code-based items were not seen in a browser; unverified items are listed under "Verification gaps" in ISSUES.md.
