# ROADMAP: in what order to improve the product

Based only on the existing evidence (see [ISSUES.md](ISSUES.md) for ids, [IDEAL_EXPERIENCE.md](IDEAL_EXPERIENCE.md) for the target). Each task is small enough for one coding session. Follow `AGENTS.md` for every task: one task at a time, tests first, `pnpm check`, local commit, never push, update `docs/MAP.md` and `docs/STATE.md`, name the mockup screen followed, and tick `docs/ui-audit/REVIEW_CHECKLIST.md`.

**Rule for the whole roadmap:** a task is not "done" until it has been exercised once **in a real browser** (Playwright) on `http://localhost:8787` as every role that can use it. Unit tests alone passed while C1, C3 and C4 were present.

## The order in one list (critical path)
1. R0.1 Browser tests can run.
2. R0.2, R0.3, R0.4 The three blocking bugs (open visit, issue prescription, book without a note).
3. R0.5 Core-loop browser test in CI.
4. R0.6 Payment safety. R0.7 Refund rule (decision first).
5. R1.x Workflow and logic fixes (hand-off to billing, receipts, cancel/reschedule, messages, silent failures, phone breakages).
6. **Gate A**: re-run flows G01, G02, H01, D02, D03 and F02 in the browser without the test-harness repair. Add the not-yet-audited flows (see "Next audit").
7. R2.x Redesign (frame and shared components first, then Billing, Visit, Today, Profile, Calendar, Messages).
8. R3.x Product gaps. R4.x Polish.

## Decisions needed from people (do not guess)
| # | Decision | Who | Blocks |
|---|---|---|---|
| D1 | What should Outstanding, bill due and the statement show after a refund? Can a refund re-open the due amount? | Doctor and CA | R0.7, R1.4 |
| D2 | Can an addendum add a procedure to a finalised visit? If not, is "procedures before finalise" the rule? | Doctor | R1.1 |
| D3 | Gender: no default, or a "Not stated" choice? | Doctor | R1.8 |
| D4 | May the receptionist cancel a wrong bill, or only ask the doctor? May she see Settings > Medicines and Billing? | Doctor | R1.9, R1.11 |
| D5 | Should a bill be created already issued from a finalised visit (no draft step)? | Doctor, CA | R2.3 |
| D6 | Are reminders created the day before at 17:00 only, or earlier? Should they be hidden until due? | Doctor | R1.5 |
| D7 | Which devices do the doctor and receptionist really use (phone, tablet, laptop)? | Owner | order of R1.10 and R2.11 |
| D8 | Is advance payment wanted before treatment? | Doctor, CA | R3.1 |

---

## P0: correctness, safety and security
| Order | ID | What needs to change | Why / issues | Expected result | Depends on | Verification |
|---|---|---|---|---|---|---|
| 1 | R0.1 | Make browser tests runnable: set `playwright.config.ts` base URL to `http://localhost:8787` (matches the CSRF origin); owner runs `pnpm exec playwright install chromium`. | PA-S01 (e2e cannot start; write steps get 403 from 127.0.0.1) | `pnpm test:e2e` starts and the three existing specs run | none (owner command for the browser) | The existing staff-smoke spec passes; a new spec that POSTs (create patient) passes |
| 2 | R0.2 | Fix the double JSON encoding: in the six feature `api.ts` files (visits, prescriptions, chart, plan, history, certificates) pass plain objects to `api()`; make `api()` throw a clear developer error when given a string body. | PA-F01 (C1) | Open visit, autosave, add procedure, diagnosis, medicine, finalise, certificate all work for a real doctor | R0.1 | Browser test: Today > Open visit > type complaint > "Saved" chip; no `Invalid input: expected object` anywhere |
| 3 | R0.3 | Prescription Issue: use the version returned by the preceding save (or skip the save when nothing changed) before calling issue; show a correct message on a real conflict. | PA-F02 (C3) | Add a medicine, press Issue, status becomes issued, print works | R0.2 | Browser test: add Amoxicillin > Issue > no 409; reload shows issued |
| 4 | R0.4 | Booking without a note: stop sending `complaint: null` (or accept null in the shared schema). Also check the walk-in and reschedule bodies for the same null pattern. | PA-F03 (C4) | Receptionist can book with the note empty | R0.1 | Browser test: book tomorrow 11:15 with an empty note: toast "Booked for ..." |
| 5 | R0.5 | Add a core-loop browser test (receptionist registers, books, walk-in, doctor opens visit, procedure, diagnosis, medicine issue, finalise, create bill, issue, receptionist pays, statement shows payment) and run it in CI or in `pnpm check`. Based on `docs/ui-audit/runner/g01.mjs`. | PA-S01, PA-P01 | Regressions in the main workflow are caught automatically | R0.2-R0.4 | The test fails when any of C1/C3/C4 is reintroduced (prove by reverting one) |
| 6 | R0.6 | Payment safety: (a) server rejects an amount above the due unless the request carries an explicit `allowAdvance` after confirmation, and returns the fresh balance; (b) "Full balance" and "Half" fill the Amount field only; (c) form resets after a payment and defaults to Cash; (d) amount 0 or negative shows a sentence. UI confirm: "₹X more than the due. Record the extra as advance?". | PA-B02, PA-F09, PA-S09, PA-S02 | One slip cannot record money; a stale tab cannot overpay | R0.1 | Domain test: pay > due without flag is refused; browser test: type 20000 on 2000 due shows the confirm, Cancel records nothing |
| 7 | R0.7 | Refund rule: after decision D1, make Outstanding, bill due, statement and cancel logic follow it; show refunds on the statement and on the account header. | PA-B01 (and PA-L06) | Pay 500, refund 500: the balances match History and the bill can be cancelled | D1 | Domain test for pay-refund-outstanding; browser: statement lists payment and refund |

**Gate P0 (do not start P1 until true):** the core-loop test passes; flows G01 and D03 run in the browser with no harness repair and no 400/409.

---

## P1: backend, business logic and workflow problems
| Order | ID | What needs to change | Why / issues | Expected result | Depends on | Verification |
|---|---|---|---|---|---|---|
| 8 | R1.1 | Visit to bill chain, minimal version: show the Procedures list on the first tab (or a clear link); Finalise dialog lists warnings (no diagnosis, no procedures, prescription not issued); "Create bill" disabled with a reason when no procedures. Check the addendum path (D2). | PA-L01, PA-L02 | The doctor cannot reach a dead end; the receptionist can always bill a finalised visit | R0.2, D2 | Browser: finalise with no procedure shows the warning; Create bill disabled with reason; with a procedure it works |
| 9 | R1.2 | "Ready to bill": when a visit is finalised, the receptionist's Today row shows **Take payment** (link to the bill/payment card) and the stat strip counts it. | PA-U01 | Hand-off needs no memory | R1.1 | Browser: doctor finalises, receptionist Today shows the action within one refresh |
| 10 | R1.3 | Receipts: after "Record payment" show a toast with receipt number and Print; add a Payments list under the bills on the profile Billing tab (date, amount, mode, reference, "applied to"). | PA-U05, PA-F09, PA-L07, PA-M03 | A receipt can be printed at the desk; allocation is visible | R0.6 | Browser: pay 500, toast and Payments row appear, print opens `/app/print/receipt/:id` |
| 11 | R1.4 | Appointments: Reschedule and Cancel/Missed (reason required) in the calendar detail panel and on the profile Appointments tab, also for future dates; Today's Cancel asks for a reason and moves into a "..." menu; add a Missed action so the Call list fills; Close-day blockers list patient names. | PA-U04, PA-L04, PA-M02, PA-B12 | A phone cancellation can be recorded; no-show recall works | R0.4 | Browser: cancel tomorrow's booking with a reason; row greyed; Call list shows missed patient |
| 12 | R1.5 | Messages: withdraw queued messages when an appointment is moved or cancelled and create one moved/cancelled message; never create confirm/remind for past appointments; do not queue for patients with no usable number; send to the contact mobile and address the guardian for children; show a "due at" time and hide until due (after D6). | PA-B03 to PA-B07, PA-M07 | No wrong-time or unsendable messages | R1.4, D6 | Browser + cron trigger: move 3:00 to 4:15 leaves only 4:15 messages; child's reminder opens WhatsApp for the mother's number |
| 13 | R1.6 | No silent failures: Timings closing-before-opening shows a sentence; version conflicts on the visit show a banner with the cause and keep the text (stop infinite retry); disabled buttons say why; offline keeps the screen and says work is kept. | PA-F07, PA-F08, PA-U14, PA-S03 | Every failed save explains itself | R0.2 | Browser: the G10 and E01 steps now show messages; typed text survives |
| 14 | R1.7 | Discount hand-off: keep the draft total at list price until approved; show "Requested ₹300 (not approved)"; add "Waiting for you: discount for Tara ₹300" to the doctor's Today with an Approve button; reason text under the disabled Issue bill. | PA-B08, PA-L05, PA-M05 | The doctor learns at once; the patient is not quoted early | R2.5 can come later (use a simple card now) | Browser: receptionist requests, doctor Today shows the item, Approve works |
| 15 | R1.8 | Data and form rules: one "next appointment" function used by Overview and History; Today counts only remaining slots; future date of birth gets its own message; procedure list starts empty; gender no default (D3); duplicate box asks "Same person?" before saving; guardian group opens when age < 18. | PA-B09, PA-B10, PA-B11, PA-F13, PA-L10, PA-L09, PA-U06 | Fewer wrong records and contradictory numbers | D3 | Browser checks for each (A02 steps) |
| 16 | R1.9 | Remove or wire the dead top-bar Walk-in; give the receptionist a wrong-bill path (Ask the doctor to cancel, with a reason) and a refund-first button in the doctor's cancel panel. | PA-F04, PA-L06 | No dead buttons; wrong bills can be corrected | D4, R0.7 | Browser: D02 steps succeed end to end |
| 17 | R1.10 | Phone breakages: receptionist Today at 360 px (single column, row actions below the name, bottom space); tooth chart fits the width (two rows, 44 px targets, scrolls inside its card). | PA-F05, PA-F06, PA-P08 | Today and Chart usable by touch | D7 | `measure` shows no sideways scroll at 360/768 on Today and Chart; teeth >= 44 px |
| 18 | R1.11 | Access-control UI: doctor-only forms (new certificate) show the same permission page as the visit; add a role-matrix browser test (pages and API) based on flow F01; document the receptionist's Settings view (D4). | PA-S04, PA-S05 | UI matches server rules | D4 | The F01 script passes and fails if a page opens that should not |

**Gate A (after P1):** re-run in the browser, without any repair, the flows G01, G02, G08, H01, H02, D02, D03, D05, D06, F02. Every problem marked fixed must show in the flow file; update `docs/ui-audit/AUDIT.md` statuses.

---

## P2: UI/UX redesign and professional design
| Order | ID | What needs to change | Why / issues | Expected result | Depends on | Verification |
|---|---|---|---|---|---|---|
| 19 | R2.1 | Foundation: `PageContainer`, `PageHeader`, `Card`, `ListRow`, `EmptyState`, `StatusLabel` (one map), `formatDate`, `formatMoney`, `formatDuration`, plural helper in `apps/web/src/ui/`. | PA-D01, PA-D05, PA-L03, PA-D07 | One frame, one vocabulary, one format | Gate A | Unit tests for the helpers; the style guide shows them |
| 20 | R2.2 | Apply the status vocabulary, date and money formats to Today, Calendar, Profile, History, Billing, print. | PA-L03, PA-D05, PA-D07 | Same words everywhere | R2.1 | Browser: the same appointment reads the same on Today, Calendar and History |
| 21 | R2.3 | Billing hub (Today, Dues, Bills, Day close), Bill screen and Payment card to mockup S09 (IDEAL §7); remove internal sentences from screen and print; decide draft step (D5). | PA-U02, PA-D02, PA-D04, PA-L08, PA-D08, PA-M04 | Billing looks like the rest of the app and is the place for money | R2.1, R1.3, D5 | Browser: Billing flows D03, D05, D06 run on the new screens; screenshots match the mockup |
| 22 | R2.4 | Visit screen: one-screen layout, sticky Finalise bar with checklist, read-only final view, alerts at the top (IDEAL §6). | PA-U03, PA-F10, PA-F11, PA-U17, PA-D09 | Doctor writes and finishes on one screen | R2.1, R1.1, R0.3 | Browser: fewer clicks and tab switches than the G01 baseline (30 clicks and 5 tab switches for the whole chain; proposed target: no tab switch for the normal case) |
| 23 | R2.5 | Today for both roles (IDEAL §2): state-based single action per row, doctor's "Waiting for you" card, reasons for Cancel/Missed, phone layout. | PA-U10, PA-U01, PA-M05, PA-F15 | Each role sees what is waiting | R2.1, R1.2, R1.7 | Browser: both roles' Today match IDEAL §2 at 360/768/1366 |
| 24 | R2.6 | Patient list columns (Last visit, Next appointment, Due) and profile (opens on Overview, role actions, Overview cards). | PA-U07, PA-U08, PA-F19 | Money and visits visible at a glance | R2.1 | Browser: due patients identifiable on the list without opening |
| 25 | R2.7 | Appointments: week view, phone day list, new Book dialog (date strip, 8 chips, fixed footer, empty states). | PA-F12, PA-F17, PA-M06 | Booking is short and readable on every device | R1.4 | Browser: book and move on phone and laptop |
| 26 | R2.8 | Messages page redesign (IDEAL §8). | PA-U09, PA-L11, PA-N04 | Staff send the right message to the right person | R1.5 | Browser: H01/H02 flows readable at a glance |
| 27 | R2.9 | New patient form changes (IDEAL §4), consent card, After-save actions. | PA-L10, PA-N05, PA-U08 | Short, safe registration | R1.8 | Browser: A02 cases |
| 28 | R2.10 | Form-control enforcement: lint rule against raw `<input>/<select>/<textarea>` in `features/`; migrate remaining screens in batches (start with History filters, payment form, Medicines, Chart dropdowns). | PA-D03, PA-D06 | One input family | R2.1 | Lint passes; screenshots show no square inputs |
| 29 | R2.11 | Phone and tablet chrome: sidebar from 768, "+" only on Today and Patients, tab bars with fade, 44 px targets, hide keyboard hint. | PA-F14, PA-F15, PA-F16, PA-F18 | No cut-off navigation | R2.1 | `measure`: 0 targets under 44 px on the main lists |
| 30 | R2.12 | Reports: four numbers + "Things to watch"; charts collapsed with min-data states; Payments and Refunds separate. | PA-U15, PA-N01, PA-B13 | Reports readable with little data | R2.1 | Browser on the small fake DB |

---

## P3: product gaps and feature improvements
| Order | ID | What | Why / issues | Expected result | Depends on | Verification |
|---|---|---|---|---|---|---|
| 31 | R3.1 | Take advance on purpose (visible form when nothing is due), apply advance to the next bill, receipt for advance. | PA-M01, D8 | Pre-payment possible | R0.6, D8 | Browser: advance then bill uses it |
| 32 | R3.2 | Late entry on a closed day and doctor reopen, in the UI. | PA-B12, PA-M06 | The closed-day message points to something real | R0.7 | Browser: D05 step 42 path works |
| 33 | R3.3 | Manual charge on an account (no visit) if the doctor wants it. | PA-M04 | Balances and corrections without a fake visit | D4 | Browser |
| 34 | R3.4 | Audit then improve the unseen areas: treatment plan / braces journey, files, certificates, consent history, recall and incomplete-treatment lists. | PA-M08 | Evidence before design | Gate A | New flows in `docs/ui-audit/flows/` |
| 35 | R3.5 | Patient portal (Phase 8) after the staff app is stable; design from IDEAL rules; reuse the shell at 360 px. | PA-P07 | Read-only portal | Gate A, owner go-ahead | Separate plan |
| 36 | R3.6 | Customer discovery (not code): watch a receptionist run the 10 tasks in `docs/TESTING.md`; time the doctor's visit; interview other clinics on language, GST, login. | PA-P01 to PA-P09 | Real evidence on PMF | R0.5 and Gate A | Written notes, times per task |

## P4: visual polish and optimisation
Plural helper everywhere; search icon and "/" chip alignment; monospace removal from inputs; Settings wording ("Reset Google link", "Kind of clinic"); medicine row tokens ("after_food"); medicine add form grouping; chart labels and "W" button; style guide only in development; Settings list Add-at-top and reorder mode; medicine and visit type lists friendly words (PA-F20, PA-D06, PA-D08b, PA-D09, PA-D10, PA-U12, PA-U13, PA-N06). Verification: screenshot compare on the pages touched.

---

## Next audit (only after Gate A; do not do it now)
Run, in a real browser and without the harness repair: doctor's full day (two patients), prescription issue and print, treatment plan, addendum, certificate, past record and file upload, emergency walk-in to payment, no-show recall, 5,000-patient list speed, A4/A5 print variants, keyboard-only use, real touch, session expiry. Also re-check "Free times on undefined/undefined/" (PA-F20) and the certificate form write as receptionist (PA-S04).

## Definition of done for the whole roadmap (proposed targets, to be agreed with the owner)
A new receptionist can do the 10 tasks in `docs/TESTING.md` without help in under 20 minutes; the doctor can run a visit from Today to "Ready to bill" on one screen in under two minutes; the core-loop browser test passes in CI; no screen has sideways scroll at 360, 768 or 1366 px; no failed save is silent.
