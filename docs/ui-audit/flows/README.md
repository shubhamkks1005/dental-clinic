# Flows: run in the real browser, step by step

Each flow file says: the **aim** (written before the run), who does it, the starting state, the result, a table of measures, the problems found, what worked, what was not covered, and every step with a screenshot where the screen changed. A new AI session can read one file and understand what was done, what the screen did, and what is broken, without opening the app.

Labels: every line in a flow file was seen in the browser unless marked otherwise. Problem ids: `C#` critical bug (also in AUDIT.md), `P#`, `G2-#`, `B2-#`, `H1-#`, `A2-#`, `D2-#` flow-specific. How the flows were run: see `../runner/README.md`.

Read this first: the test clock was 8:45-10:00 PM IST on 23 Nov 2026, after clinic hours. All slots today were gone, so "the patient arrives today" was done with an emergency walk-in, and nothing real could be sent. Bug C1 (the app cannot open a visit) was repaired inside the test harness only so the doctor part could be reached.

## Done (18)
| Flow | What it covers | Result |
|------|----------------|--------|
| [G01](G01-first-patient-lifecycle.md) | New patient, booking, walk-in, visit, finalise, bill, payment, statement | BROKEN (C1, C3), confusing money steps |
| [G02](G02-returning-patient-second-visit.md) | Returning patient, second visit, one payment over two bills | Works, money allocation not shown |
| [G08](G08-child-with-guardian-and-shared-mobile.md) | Child with guardian, contact mobile, reminder | Registration works; reminder BROKEN for children |
| [G10](G10-two-screens-same-record.md) | Same visit and same billing in two tabs | Typing can be lost; stale payment accepted |
| [A02](A02-register-edge-cases.md) | Child, no mobile, bad mobile, duplicate, long name, future date | Works, confusing messages |
| [B02](B02-reschedule-or-cancel-a-future-booking.md) | Cancel or move tomorrow's booking | No Cancel; reschedule only by hidden drag |
| [D02](D02-refund-and-cancel-a-bill.md) | Wrong bill: payment, refund, cancel | Receptionist cannot fix; balance wrong after refund |
| [D03](D03-payments-advance-split-part-and-mistakes.md) | Advance, split, part payment, typing mistakes | Works; overpay accepted silently; no advance on purpose |
| [D05](D05-dues-reminder-and-daily-cash-close.md) | Dues reminder, day close | Works well; Cancel without confirm |
| [D06](D06-discount-request-and-approval.md) | Discount request and approval | Works; doctor not told; total drops early |
| [E01](E01-settings-timings-visit-type-medicine.md) | Timings, visit type, medicine | Works (best screens); one silent failure |
| [E02](E02-staff-add-change-role-deactivate.md) | Add, deactivate, reactivate staff | Works very well (model screen) |
| [F01](F01-receptionist-opens-doctor-only-pages.md) | Receptionist opens doctor pages and API by hand | Privacy rule holds |
| [F02](F02-phone-full-day.md) | Whole day at 360 px | BROKEN on Today (receptionist) and Chart |
| [F03](F03-tablet-full-day.md) | Whole day at 768 px | Works except Chart |
| [F04](F04-double-click-offline-back-and-reload.md) | Double click, offline, Back, half-filled form | Works (well protected) |
| [H01](H01-booking-confirm-and-reminder-messages.md) | Booking, confirm and reminder messages | Booking without note FAILS (C4) |
| [H02](H02-messages-no-consent-no-mobile-and-reschedule.md) | Messages: no consent, no mobile, moved appointment | Consent rule holds; stale messages after a move |

## Asked for but not done
- **J1 data and print edge cases** (₹0 bill, 8-line prescription, 5,000 patients, A4/A5): not run.
- **G5 no-show and call list:** not run as a flow. In D05 there was no No-show action on Today rows, so the Call list could not be filled.
- **Keyboard-only use** (Tab, Enter, Esc) from F04: not tested; only double click, offline, Back and half-filled form were.
- Everything in the chat plan that needs the C1, C3, C4 fixes or the refund rule: see the list below.

## Not run yet (the remaining ~75 of the 93)
Blocked until C1, C3, C4 are fixed: the doctor's full day, prescription issue and print, treatment plan / braces journey, addendum, certificate, past record and files, emergency walk-in start to payment. Blocked until a rule is decided: refund and bill cancel success, day close after refunds. Blocked until H11 (cancel future booking): cancel messages, no-show recall. Not built: portal, day-cancel wizard. The rest are variations of flows already run.
