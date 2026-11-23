# Gate A (Q1.G): re-run of the daily flows, 2026-11-24

Run on a fresh scratch database for each flow (docs/ui-audit/runner/reset.sh), app built from the
local main branch, **no test-harness repair**. Evidence folders: `GATE-A-<flow>/` (result.json and
screenshots). The runner scripts were first updated for the new behaviour (Full balance only fills the
box, the procedure list and gender start empty, "Same person?", Cancel in the "..." menu, the
wrong-bill request, tomorrow computed in IST, first free time instead of a fixed time).

| Flow | What it covers | Result | Failed requests |
|------|----------------|--------|-----------------|
| G01 | New patient, booking, walk-in, visit, Rx, finalise, bill, two payments, statement | Pass, all 63 steps | none |
| G02 | Returning patient, second visit, one payment over two bills | Pass | none |
| G08 | Child with guardian, shared mobile | Pass. The message goes to the guardian ("Dear Sunita ... Kiddo's appointment") and opens WhatsApp for the guardian's number | none |
| H01 | Booking confirm and reminder messages | Pass. Booking without a note works; the confirmation is due at once (or at 08:00 in quiet hours), the reminder waits under Scheduled | none |
| H02 | No consent, no mobile, reschedule | Pass | none |
| D02 | Wrong bill: receptionist asks the doctor, doctor sees Waiting for you, Refund first, refund, cancel | Pass. After the refund the bill cancels, the statement lists payment and refund | none |
| D03 | Advance, split, part payment, typing mistakes | Pass. 20,000 on 2,000 asks first (Change amount records nothing); 0 and negative say "Enter an amount above 0"; no advance form when nothing is due (Q3.1) | none |
| D05 | Dues reminder, day close | Pass. Open rows are finished from the "..." menu with a reason | 2 on purpose: close with a difference and no note (400), payment after the day closed (400) |
| D06 | Discount request and approval | Pass. The request does not change the total; the doctor sees it on Today; approval lowers the total; issue works | none |
| F02 | Phone full day at 360 px (and the same script at 768 px) | Pass. No sideways scroll on any screen, including Today and Chart | none |

Not fixed by Part 3 and still visible in these runs (they belong to Part 4 and 5, the redesign): tap
targets under 44 px in lists and links at 360 px (list rows 21 px, dues links 17 px, Book-at-time rows);
the surface shapes inside one tooth are small (the whole-tooth button is 44 px); the Bill and profile
Billing screens are still plain (billing.css only styles the Bill screen); page gutters at 360 px.

## Flows not yet audited (from product-audit/ROADMAP "Next audit")
Not run in this gate. To do after Part 5, in a real browser and without harness repair: the doctor's
full day with two patients, prescription issue and print, treatment plan, addendum, medical
certificate, past record and file upload, emergency walk-in to payment, no-show recall, a 5,000-patient
list for speed, A4 and A5 print variants, keyboard-only use, real touch, session expiry, and the free
times text "Free times on undefined/undefined/" (PA-F20).
