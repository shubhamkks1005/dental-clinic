# Flows: run in the real browser, step by step

Each flow file says: the **aim** (written before the run), who does it, the starting state, the result, a table of measures, the problems found, what worked, what was not covered, and every step with a screenshot where the screen changed. A new AI session can read one file and understand what was done, what the screen did, and what is broken, without opening the app.

Labels: every line in a flow file was seen in the browser unless marked otherwise. Problem ids: `C#` critical bug (also in AUDIT.md), `P#`, `G2-#`, `B2-#`, `H1-#`, `A2-#`, `D2-#` flow-specific. How the flows were run: see `../runner/README.md`.

Read this first: the test clock was 8:45-10:00 PM IST on 23 Nov 2026, after clinic hours. All slots today were gone, so "the patient arrives today" was done with an emergency walk-in, and nothing real could be sent. Bug C1 (the app cannot open a visit) was repaired inside the test harness only so the doctor part could be reached.

## Done (6)
| Flow | What it covers | Result |
|------|----------------|--------|
| [G01](G01-first-patient-lifecycle.md) | New patient, booking, walk-in, doctor visit (chart, procedure, diagnosis, medicine), finalise, bill, payment, statement | BROKEN twice (C1, C3), confusing money steps |
| [G02](G02-returning-patient-second-visit.md) | Returning patient, second visit from profile, new bill, one payment over two bills | Works, confusing about where money went |
| [B02](B02-reschedule-or-cancel-a-future-booking.md) | Patient phones to cancel or move tomorrow's booking | No Cancel for future bookings; reschedule only by hidden drag |
| [H01](H01-booking-confirm-and-reminder-messages.md) | Booking without note, confirm and reminder messages, Open WhatsApp | Booking without a note FAILS (C4); messages usable but noisy |
| [A02](A02-register-edge-cases.md) | Child, no mobile, bad mobile, duplicate, long name, future date of birth | Works with confusing messages |
| [D02](D02-refund-and-cancel-a-bill.md) | Wrong bill: payment, refund, cancel | Receptionist cannot fix; balance wrong after refund |

## Not run yet (planned list from the chat, 87 flows)
The full plan has 93 flows in groups A to J. Not yet run: A1, A3 to A7 (find, edit patient, medical alert, archive), B1, B3 to B8, C1 to C10 except those inside G01/G02 (plan, addendum, files, consent print, certificate, a whole doctor day), D1, D3 to D10 (advance, split, discount approval, reprint receipt, dues reminders, day close), E (settings changes, staff), F (roles by URL, sign-out, phone and tablet full day, keyboard, offline), G03 to G15 (braces journey, emergency, no-show, correction, shared mobile, doctor holiday, two users at once, month end, day-0 setup, records request, consent life cycle, bad day), H2 to H11 (other message kinds, quiet hours, no consent), I (timings), J (data and print edge cases). Some of these were touched inside the six flows (see their "Not covered" lists).
