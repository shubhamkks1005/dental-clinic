# PHASE Q: quality, safety and redesign (read this before any Phase Q task)

Written 2026-11-23 from the browser audit. Phase Q comes BEFORE Phase 8. Do not start Phase 8 until the owner says so.
Evidence and reasons: `docs/product-audit/ISSUES.md` (ids like PA-F01), `docs/product-audit/IDEAL_EXPERIENCE.md` (target screens), `docs/product-audit/ROADMAP.md` (the same order, shorter), `docs/ui-audit/` (page notes, 18 flows with screenshots, runner scripts), `docs/design/proposal/` (the new screen designs).

## 0. How an AI works in this phase (read all of section 0)
1. Start: read `docs/RUN_PROMPT.md`, `docs/HANDOFF.md`, then THIS file's section for the task named under "Next task" in HANDOFF. Do not read the whole codebase or all of ISSUES.md. Find files with grep and `docs/MAP.md`.
2. Work in **PARTS** (section "The 5 Parts" below). A Part is a batch of tasks done in ONE long session. Do the tasks of the current Part in order, one after another, without waiting for the owner between tasks. Commit locally after EACH task. Stop only when the Part is finished, a task is BLOCKED, or your context is nearly full.
3. Order is fixed. Never skip ahead to the next Part. A task marked BLOCKED (needs a decision that has no answer yet) is skipped: write it under "Waiting on me" in HANDOFF.md and take the next unblocked task in the same Part. If the context ends mid-Part, the next chat resumes the SAME Part at the first task that is not Done.
4. **A task is done only when its "Done when" was run in a real browser** (Playwright, `http://localhost:8787`, as every role that can use the screen) and `pnpm check 2>&1 | tail -25` is green. Unit tests alone are not enough: the bugs C1, C3 and C4 passed every unit test.
5. After each finished task: tick `docs/ui-audit/REVIEW_CHECKLIST.md` for UI tasks, update `docs/ui-audit/AUDIT.md` status of the issues fixed, update `docs/MAP.md`, `docs/STATE.md`, `docs/HANDOFF.md` (done, next task, anything waiting), then **commit locally** with a short message that starts with the task id (example: `Q1.2 Ready to bill on receptionist Today`). Never push. Never apply migrations (list the exact command for the owner).
6. **Stop and ask (write in HANDOFF "Waiting on me", do not guess) for**: money rules (refund, advance, discount), clinical or legal wording, who may see what, anything marked BLOCKED. This is an exception to the "do not stop to ask" rule in RUN_PROMPT.md.
7. When your context is nearly full: finish or revert the current edit, update HANDOFF.md first, commit, stop. A half-finished task must say exactly which step is next.
8. Keep AGENTS.md rules: smallest change for the task, no new dependency, no refactor of untouched code, files under ~300 lines, one rule in one place, fake data only, English UI.
9. How to run the app for testing (also in `docs/ui-audit/runner/README.md`): Node 26 (`source ~/.nvm/nvm.sh; nvm use system`); migrate and seed a SCRATCH database, not the owner's local one: `pnpm wr d1 migrations apply DB --local --env='' --persist-to <scratch>` in `apps/worker`, then the staging seed in local mode; start `pnpm wr dev --env='' --ip 127.0.0.1 --port 8787 --persist-to <scratch> --test-scheduled`; browse ONLY `http://localhost:8787` (the CSRF guard allows only that origin); sign in with `/api/staff/auth/dev-login?role=doctor` or `receptionist`. The test clock is real time: slots exist only inside clinic hours, so tests must use an Emergency walk-in or tomorrow's date. Run the 5-minute cron by hand with `GET /cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*`.
10. Designs: see `docs/design/proposal/README.md` (which file is which screen and which task builds it). Read the matching `.dc.html` before writing a UI task. Rebuild it as React; do not copy markup. In the final message say which design file you followed.

## The 5 Parts (the owner wants the whole phase done in about 5 sessions)
| Part | Tasks | What the clinic gets at the end | Check before the next Part |
|---|---|---|---|
| **Part 1: bugs and money safety** | Q0.1, Q0.2, Q0.3, Q0.4, Q0.5, Q0.6, Q0.7, Q0.G | Doctor can open a visit, issue a prescription, receptionist can book without a note, one slip cannot record money, refund balances are right, a browser test guards the main loop | Gate P0 |
| **Part 2: the daily workflow** | Q1.1, Q1.2, Q1.3, Q1.4, Q1.5, Q1.6 | Visit to bill has no dead end, "Ready to bill" cue, receipts, cancel and reschedule any booking, messages never wrong, no silent failures | `pnpm check` and the flows named in each task |
| **Part 3: logic, phone and rights** | Q1.7, Q1.8, Q1.9, Q1.10, Q1.11, Q1.G | Discount hand-off, data and form rules, wrong-bill path, phone screens fixed, role matrix test | Gate A |
| **Part 4: redesign, first half** | Q2.1, Q2.2, Q2.3, Q2.4, Q2.5, Q2.6 | Frame and 8-item sidebar, one vocabulary, Billing hub and Bill, Visit on one screen, both Today screens, Patients list and profile | the matching flows at 360, 768, 1366 px |
| **Part 5: redesign, second half and polish** | Q2.7, Q2.8, Q2.9, Q2.10, Q2.11, Q2.12, Q2.13, Q4.1 | Calendar and Book dialog, Messages, New patient, one input family, phone and tablet chrome, Reports, **Settings and Library**, polish | all flows re-run; phase done |
Q3.1 to Q3.6 (advance on purpose, late entry, manual charge, audit of unseen areas, portal, customer discovery) are NOT in the 5 Parts. They are a later phase, started only when the owner asks.
Honest note for the owner: a Part is big. If a chat runs out of context in the middle of a Part, start a new chat with the same prompt; it resumes at the first task not Done. So 5 Parts may take about 6 to 9 chats in practice, but the work and the order do not change.

## Proposed defaults for the decisions (so no Part waits)
The AI must not guess these itself. The owner can answer each one, or accept ALL of these at once by saying: "I accept all proposed defaults in docs/PHASE_Q.md". The AI then writes them in `docs/DECISIONS.md` with the date and marks "owner accepted".
| Id | Proposed default | Why |
|---|---|---|
| D1 | A refund re-opens the due amount: refunding ₹500 on a paid bill makes the bill due ₹500 again and Outstanding goes up by ₹500; the statement lists payments and refunds; a bill with no net payment can be cancelled | Matches how a desk thinks: money returned means the patient owes again. CA to confirm |
| D2 | An addendum cannot add a procedure; procedures must be added before Finalise (the dialog warns) | Simplest and keeps finalised records locked |
| D3 | Gender has no default and a choice is required (Male, Female, Other) | Avoids silent wrong entry |
| D4 | The receptionist can only ask the doctor to cancel a bill; she cannot open Settings > Medicines or Billing | Least access |
| D5 | A bill created from a finalised visit is issued directly; a draft only when "Review first" is chosen | One step less |
| D6 | Confirmation when booked; reminder created for 17:00 the day before and hidden until due | Matches the existing setting |
| D7 | Doctor and receptionist may use all three widths; fix phone and tablet in Part 3 and Part 5 | No information |
| D8 | Advance payments are wanted (done later in Q3.1) | Not needed for Parts 1-5 |

## Status board (update after each task: Todo, Done with commit hash, Blocked)
| Task | Title | Status |
|---|---|---|
| Q0.1 | Browser tests can run | Done (see git log "Q0.1") |
| Q0.2 | Fix double JSON encoding (C1) | Done (see git log "Q0.2") |
| Q0.3 | Prescription Issue works (C3) | Done (see git log "Q0.3") |
| Q0.4 | Booking without a note works (C4) | Done (see git log "Q0.4") |
| Q0.5 | Core-loop browser test | Done (see git log "Q0.5") |
| Q0.6 | Payment safety | Done (see git log "Q0.6") |
| Q0.7 | Refund rule and balances | Done (git log "Q0.7"; D1 accepted, CA to confirm) |
| Q0.G | Gate P0 | Passed with exception (Q0.7 open, see STATE.md) |
| Q1.1 | Visit to bill chain, minimal | Done (git log "Q1.1") |
| Q1.2 | Ready to bill on receptionist Today | Done (git log "Q1.2") |
| Q1.3 | Receipts and payments list | Done (git log "Q1.3") |
| Q1.4 | Cancel, Missed, Reschedule | Done (git log "Q1.4") |
| Q1.5 | Messages hygiene | Todo (D6 accepted) |
| Q1.6 | No silent failures | Done (git log "Q1.6") |
| Q1.7 | Discount hand-off | Todo |
| Q1.8 | Data and form rules | Todo (D3) |
| Q1.9 | Dead Walk-in and wrong-bill path | Todo (D4) |
| Q1.10 | Phone breakages | Todo (D7) |
| Q1.11 | Access control in the UI | Todo (D4) |
| Q1.G | Gate A | Todo |
| Q2.1 to Q2.13 | Redesign (section 3) | Todo |
| Q3.1 to Q3.6 | Product gaps (section 4) | Todo |
| Q4.1 | Polish | Todo |

## Decisions the owner must make (the AI must not guess these)
| Id | Decision | Who | Blocks |
|---|---|---|---|
| D1 | After a refund, what must Outstanding, the bill's due and the statement show? Can a refund re-open the due amount? | Doctor and CA | Q0.7, Q1.9 |
| D2 | Can an addendum add a procedure to a finalised visit? If not, "procedures before finalise" is the rule | Doctor | Q1.1 |
| D3 | Gender field: no default, or a "Not stated" option? | Doctor | Q1.8 |
| D4 | May the receptionist cancel a wrong bill or only ask the doctor? May she see Settings > Medicines and Billing? | Doctor | Q1.9, Q1.11 |
| D5 | Should a bill be created already issued from a finalised visit (no draft step)? | Doctor, CA | Q2.3 |
| D6 | Reminders: only the day before at 17:00, or earlier? Hidden until due? | Doctor | Q1.5 |
| D7 | Which devices do doctor and receptionist use (phone, tablet, laptop)? | Owner | order of Q1.10, Q2.11 |
| D8 | Is taking an advance before treatment wanted? | Doctor, CA | Q3.1 |
When the owner answers, write the answer in `docs/DECISIONS.md` (with the date), remove it from HANDOFF "Waiting on me", and unblock the task here.

---

## 1. PHASE Q0: make fixes provable, then fix the blockers and money safety

### Q0.1 Browser tests can run
- **Issues:** PA-S01. **Why:** every later task is verified in a browser, and today `pnpm test:e2e` cannot start or write.
- **Do:** in `playwright.config.ts` use `http://localhost:8787` as the base URL and health-check URL (the Worker's `APP_ORIGIN` is `http://localhost:8787`; with `127.0.0.1` every write returns 403 "blocked for safety"). Keep the Worker started with `--ip 127.0.0.1`. Tell the owner to run `pnpm exec playwright install chromium` (installed build is 1248, Playwright 1.65 wants 1255); do not run installs yourself. Add one spec `e2e/write-smoke.spec.ts` that signs in as receptionist (dev-login), creates a patient through the form and expects the "Patient saved" screen.
- **Done when:** `pnpm test:e2e` starts; `staff-smoke` and `write-smoke` pass in a real browser. If Chromium is missing, write the exact command in HANDOFF "Waiting on me" and stop.
- **Depends on:** none.

### Q0.2 Fix double JSON encoding (C1)
- **Issues:** PA-F01 (AUDIT C1). **Why:** the doctor cannot open a visit, autosave, add a procedure, diagnosis or medicine, finalise, or create a certificate: the Worker answers 400 "Invalid input: expected object, received string".
- **Cause:** `apps/web/src/api/client.ts` already does `JSON.stringify(init.body)`. Six feature API files stringify first: `features/visits/api.ts`, `features/prescriptions/api.ts`, `features/chart/api.ts`, `features/plan/api.ts`, `features/history/api.ts`, `features/certificates/api.ts` (grep `body: JSON.stringify`).
- **Do:** pass plain objects in those files. In `api()` throw a clear error if `init.body` is a string (developer message, not shown to staff). Do not change other API files that already pass objects. Add a unit test for the client guard.
- **Done when (browser):** doctor opens Today > Open visit, types a complaint, sees "Saved", adds a procedure, a diagnosis and a medicine, finalises; the network log has no 400. Remove the "repair C1" block from `docs/ui-audit/runner/lib.mjs` and note it in `docs/ui-audit/runner/README.md`.
- **Depends on:** Q0.1.

### Q0.3 Prescription Issue works (C3)
- **Issues:** PA-F02 (AUDIT C3). **Why:** pressing Issue always answers 409 "Someone else changed this record while you were editing", even after a reload.
- **Cause:** `features/prescriptions/VisitMedicinesPanel.tsx` `onIssue()` calls `saveMeta()` (a PATCH that raises the record version, then `setRx(saved)`), then `issuePrescription(rx.id, rx.version)` with the old `rx` still in the closure.
- **Do:** make `saveMeta` return the saved prescription and pass its `version` to `issuePrescription` (or skip the save when advice, follow-up date and weight did not change). Keep the 409 message for a real conflict.
- **Done when (browser):** add Amoxicillin on a draft visit, press Issue, status becomes issued and there is no 409; reload shows issued; the print page opens for the issued prescription.
- **Depends on:** Q0.2.

### Q0.4 Booking without a note works (C4)
- **Issues:** PA-F03 (AUDIT C4). **Why:** the Book dialog shows "Invalid input: expected string, received null" when the optional note is empty.
- **Cause:** `features/appointments/QuickBookDialog.tsx` sends `complaint: note.trim() || null` (about line 100); `packages/shared/src/appointment-book.ts` accepts only an optional string (about line 20).
- **Do:** send `undefined` when empty, or accept null in the schema (pick one, apply to the shared schema once). Check the walk-in and reschedule bodies for the same null-for-optional-string pattern (grep `|| null` in `features/appointments` and `features/today`).
- **Done when (browser):** receptionist books tomorrow 11:15 with the note empty and sees the toast "Booked for ...". Add a shared-schema test for the empty note.
- **Depends on:** Q0.1.

### Q0.5 Core-loop browser test
- **Issues:** PA-S01, PA-P01. **Why:** nothing watches the main workflow.
- **Do:** write `e2e/core-loop.spec.ts` following `docs/ui-audit/runner/g01.mjs`: receptionist registers a patient, books tomorrow, adds an emergency walk-in (works after hours), marks In chair; doctor opens the visit, types, adds a procedure, a diagnosis, a medicine and issues it, finalises; creates and issues the bill; receptionist pays part, then the rest; the statement shows both payments. Compute dates in the test (tomorrow); do not depend on the clock. Run it in `pnpm check` or the CI job.
- **Done when:** the test passes; prove it can fail by temporarily reverting the Q0.2 fix (then restore it).
- **Depends on:** Q0.2, Q0.3, Q0.4.

### Q0.6 Payment safety
- **Issues:** PA-B02, PA-F09, PA-S09, PA-S02. **Design:** `docs/design/proposal/Bill.dc.html` (payment card and "IF THE AMOUNT IS TOO HIGH" panel).
- **Why:** an amount above the due (₹20,000 on ₹2,000) is recorded silently and becomes "Advance"; "Full balance" and "Half" record a payment on one click; the mode keeps the last choice; zero and negative amounts show no sentence.
- **Do:** (a) server: reject an amount above the current due unless the request carries `allowAdvance: true` (add it to the shared schema; find the domain code with `grep -rn "advance" apps/worker/src/domain packages/shared/src`); the error answer includes the fresh balance. (b) web: `features/billing/PaymentTakeForm.tsx`: "Full balance" and "Half" only fill the Amount field; on an amount above the due show "₹X is ₹Y more than the balance. Record the extra as an advance?" with Change amount (default) and Record as advance; amount 0 or negative shows "Enter an amount above 0"; reset the form after a payment and default the mode to Cash. Do NOT add a "take advance when nothing is due" option yet (that is Q3.1, decision D8).
- **Done when:** domain tests (above due refused without the flag, accepted with it, stale-tab case returns the fresh balance); browser: typing 20000 on a 2000 due shows the confirm and Cancel records nothing; Full balance only fills the field.
- **Depends on:** Q0.1.

### Q0.7 Refund rule and balances (BLOCKED until D1)
- **Issues:** PA-B01. **Why:** after a ₹500 refund the History shows it, but Outstanding stays ₹2,000, the bill still shows "Due ₹2,000", the statement lists the payment and no refund, and the bill cannot be cancelled.
- **Do (after D1 is answered and written in DECISIONS.md):** make Outstanding, bill due, statement and cancel logic follow the rule; show refunds on the statement and in the account header; add the domain test "pay 500, refund 500, outstanding returns to the original".
- **Done when:** domain test plus browser run of `docs/ui-audit/runner/d02.mjs` steps: refund, then cancel succeeds, statement lists payment and refund.
- **If D1 is not answered:** write it in HANDOFF "Waiting on me" and take the next task.

### Q0.G Gate P0 (do not start Q1 before this is true)
Run the core-loop test and the flows G01 and D03 (`docs/ui-audit/runner/`) with NO test-harness repair. Every step must pass with no 400 or 409. Write the result in STATE.md as "Gate P0: passed" or "passed with exceptions" and list them.

---

## 2. PHASE Q1: workflow, business-logic and phone fixes

### Q1.1 Visit to bill chain (minimal)
- **Issues:** PA-L01, PA-L02. **Design:** `Visit.dc.html` (procedures chips and the checklist), but build only the minimum here; the full screen is Q2.4.
- **Do:** show the Procedures list on the first visit tab (or a clear link to it); the Finalise dialog lists warnings (no diagnosis, no procedures, prescription not issued; see `features/visits/finalise-warnings.ts` and its test); "Create bill" is disabled with a reason when there are no procedures. Check whether an addendum can add a procedure and write the answer in DECISIONS.md (D2); if it cannot, say so in the Finalise dialog.
- **Done when (browser):** finalise with no procedure shows the warning; Create bill disabled with the reason; with a procedure it works; add a test to finalise-warnings.
- **Depends on:** Q0.2, D2.

### Q1.2 Ready to bill on the receptionist's Today
- **Issues:** PA-U01. **Design:** `Main.dc.html` (stat "Ready to bill", row with Take payment).
- **Do:** after the doctor finalises a visit that has an unpaid bill or no bill, the receptionist's Today row shows a primary **Take payment** action (opens the bill/payment card) and the stat strip counts it. Keep the existing row actions for other states.
- **Done when (browser):** doctor finalises, receptionist Today shows Take payment on that patient after one refresh; click opens the payment card.
- **Depends on:** Q1.1.

### Q1.3 Receipts and payments list
- **Issues:** PA-U05, PA-F09, PA-L07, PA-M03. **Design:** `Bill.dc.html` (Payments card, receipt toast).
- **Do:** after Record payment show a toast "₹500 recorded. Receipt SR-... [Print]" (print route exists: `/app/print/receipt/:id`); add a Payments list under the bills on the patient's Billing tab and on the bill (date, amount, mode, reference, "applied to SB-...", Print receipt).
- **Done when (browser):** pay 500; toast and a Payments row appear; Print opens the receipt page.
- **Depends on:** Q0.6.

### Q1.4 Cancel, Missed, Reschedule
- **Issues:** PA-U04, PA-L04, PA-M02, PA-B12. **Design:** `Calendar.dc.html` (panel), `Main.dc.html` (row menu).
- **Do:** in the calendar detail panel (`features/appointments/DayDetails.tsx`) and on the patient's Appointments tab add **Reschedule** (reopens the Book dialog with the patient filled) and **Cancel / Missed** with a required reason; on Today move Cancel into a "..." menu and ask for the reason; add a **Missed** action so the Call list fills; the Close-day blockers list shows patient names with a link. Dragging stays as a shortcut with a one-line hint.
- **Done when (browser):** cancel tomorrow's booking with a reason; the row is greyed; mark a patient Missed; they appear in the Call list; the Close-day panel names the blocking patients.
- **Depends on:** Q0.4.

### Q1.5 Messages hygiene (needs D6 for the due-time part)
- **Issues:** PA-B03 to PA-B07, PA-M07. **Design:** `Messages.dc.html`.
- **Do (server, find with `grep -rn "message" apps/worker/src/cron apps/worker/src/domain`):** when an appointment is moved or cancelled, mark its queued messages "out of date" and create one "moved" or "cancelled" message using the existing reschedule/cancel templates; never create confirm or reminder messages for past appointments; do not queue messages for a patient with no usable number; use the contact mobile when the patient has none and address the guardian ("Dear Sunita, a reminder for Kiddo's appointment ..."); add a "due at" time to each reminder and hide it until due (after D6).
- **Done when:** domain tests for each rule; browser + cron: move 3:00 to 4:15 leaves only 4:15 messages; a child's reminder opens WhatsApp for the contact's number; no messages for past appointments.
- **Depends on:** Q1.4, D6.

### Q1.6 No silent failures
- **Issues:** PA-F07, PA-F08, PA-U14, PA-S03. **Why:** Timings Save does nothing with a closing time before the opening time; a visit tab holding an old version shows "Not saved, retrying" for ever and loses the typing; disabled buttons give no reason; offline gives an empty page.
- **Do:** Timings: a sentence beside the row and Save disabled with a reason. Visit autosave: on a version conflict show a banner ("This visit was changed in another tab or by someone else. Your text is kept below. Reload and merge") and stop retrying. Disabled primary buttons show their reason beneath. Offline: keep the current screen and say the work is kept.
- **Done when (browser):** the E01 and G10 steps (`docs/ui-audit/runner/e01.mjs`, `g10.mjs`) now show messages and the typed text survives.
- **Depends on:** Q0.2.

### Q1.7 Discount hand-off
- **Issues:** PA-B08, PA-L05, PA-M05. **Design:** `DoctorToday.dc.html` ("Waiting for you"), `Bill.dc.html` (Discount card).
- **Do:** a requested discount does not change the draft total until approved (show "Requested ₹300, not approved"); the doctor's Today shows "Waiting for you: discount for <patient>" with an Approve button; the receptionist's disabled Issue bill shows "Waiting for the doctor to approve the discount."
- **Done when (browser):** `docs/ui-audit/runner/d06.mjs` passes with the new behaviour.
- **Depends on:** Q0.2.

### Q1.8 Data and form rules (needs D3)
- **Issues:** PA-B09, PA-B10, PA-B11, PA-F13, PA-L10, PA-L09, PA-U06.
- **Do:** one "next appointment" function used by Overview and History; Today counts only slots from now to closing time; a future date of birth shows "The date of birth is in the future."; the Procedure list starts empty with Add disabled; gender follows D3; the duplicate box asks "Same person? Open existing / Save as new patient" before saving; the guardian group opens by itself when the age is under 18.
- **Done when (browser):** each case in `docs/ui-audit/runner/a02.mjs` and G01 steps 25 and 61.
- **Depends on:** Q0.2, D3.

### Q1.9 Dead Walk-in and the wrong-bill path (needs D4, D1)
- **Issues:** PA-F04, PA-L06.
- **Do:** the top-bar "Walk-in" button has no click handler (`ui/shell/TopBar.tsx`): wire it to the walk-in dialog or remove it, and keep one Walk-in. Give the receptionist an "Ask the doctor to cancel" action (with reason) on an issued bill; in the doctor's cancel panel add "Refund first" when the bill has payments.
- **Done when (browser):** `docs/ui-audit/runner/d02.mjs` succeeds end to end.
- **Depends on:** Q0.7, D4.

### Q1.10 Phone breakages (order depends on D7)
- **Issues:** PA-F05, PA-F06. **Design:** `PhoneToday.dc.html`, `PhoneVisit.dc.html`.
- **Do:** the receptionist's Today at 360 px: one column, row actions below the name, 80 px bottom space for the "+". The tooth chart fits the width (two rows, 44 px tap areas, scrolls inside its own card).
- **Done when:** `docs/ui-audit/runner/f02.mjs` shows no sideways scroll on Today and Chart at 360 and 768 px, and tooth targets of 44 px or more.
- **Depends on:** none (can run right after Q0.G).

### Q1.11 Access control in the UI (needs D4)
- **Issues:** PA-S04, PA-S05.
- **Do:** doctor-only forms (new medical certificate) show the same permission page as the visit; add a role-matrix browser test from `docs/ui-audit/runner/f01.mjs` (pages and API); write the receptionist's Settings view into `docs/AUTH_PLAN.md`.
- **Done when:** the F01 script passes and fails if a doctor-only page opens for the receptionist.
- **Depends on:** D4.

### Q1.G Gate A (do not start Q2 before this)
Re-run flows G01, G02, G08, H01, H02, D02, D03, D05, D06, F02 with the scripts in `docs/ui-audit/runner/`, with no harness repair. Update `docs/ui-audit/flows/<id>.md` verdicts and `docs/ui-audit/AUDIT.md` statuses. Write "Gate A: passed" (or exceptions) in STATE.md. Add the flows not yet audited (see ROADMAP "Next audit") as new flow files.

---

## 3. PHASE Q2: redesign (build the screens in `docs/design/proposal/`)
**Phone is part of every task below.** Each Q2 task builds the laptop screen AND its phone screen (the `Phone*.dc.html` files; the table is in `docs/design/proposal/README.md`). A task is done only when the screen also passes at 360 px: no sideways scroll, targets of 44 px or more, the action under the name, bottom tabs and the "+" button as drawn. Run `docs/ui-audit/runner/f02.mjs` (phone) and `f03` (tablet 768) for the screens touched.
Each task: read the design file, rebuild with shared components, run the matching flow script, check 360, 768 and 1366 px, save a few screenshots under `docs/ui-audit/screenshots/<feature>/` only if they change a finding, tick REVIEW_CHECKLIST.

| Task | Build | Design file | Issues | Depends on |
|---|---|---|---|---|
| Q2.1 | Foundation: `PageContainer`, `PageHeader`, `Card`, `ListRow`, `EmptyState`, `StatusLabel` (one status map: see IDEAL_EXPERIENCE section 0), `formatDate`, `formatMoney`, `formatDuration`, plural helper in `apps/web/src/ui/`; sidebar with **8 items** (add Library); page gutters 16/24 px | `Sidebar.dc.html` | PA-D01, PA-D05, PA-L03, PA-D07 | Q1.G |
| Q2.2 | Apply status words, date and money formats to Today, Calendar, Profile, History, Billing, print | n/a | PA-L03, PA-D05, PA-D07 | Q2.1 |
| Q2.3 | Billing hub (Today, Dues, Bills, Day close tabs), Bill screen, Payment card; remove internal sentences from screen and print (gst_mode, missing registration number) and decide the draft step (D5) | `Billing.dc.html`, `Bill.dc.html` | PA-U02, PA-D02, PA-D04, PA-L08, PA-D08 | Q2.1, Q1.3, D5 |
| Q2.4 | Visit on one screen with the sticky Finalise bar and checklist, read-only final view, alerts at the top | `Visit.dc.html`, `PhoneVisit.dc.html` | PA-U03, PA-F10, PA-F11, PA-U17, PA-D09 | Q2.1, Q1.1, Q0.3 |
| Q2.5 | Both Today screens | `Main.dc.html`, `DoctorToday.dc.html`, `PhoneToday.dc.html` | PA-U10, PA-U01, PA-M05, PA-F15 | Q2.1, Q1.2, Q1.7 |
| Q2.6 | Patients list columns (Last visit, Next appointment, Due) and profile (opens on Overview, role actions) | PDF S02, S04 | PA-U07, PA-U08, PA-F19 | Q2.1 |
| Q2.7 | Calendar week view, phone day list, new Book dialog (date strip, 8 time chips, fixed footer, empty states) | `Calendar.dc.html`, PDF S07, S08 | PA-F12, PA-F17, PA-M06 | Q1.4 |
| Q2.8 | Messages page | `Messages.dc.html` | PA-U09, PA-L11, PA-N04 | Q1.5 |
| Q2.9 | New patient form changes and consent card | PDF S03, S16 | PA-L10, PA-N05, PA-U08 | Q1.8 |
| Q2.10 | Lint rule against raw `<input>/<select>/<textarea>` in `features/`; migrate remaining screens in batches | n/a | PA-D03, PA-D06 | Q2.1 |
| Q2.11 | Phone and tablet chrome: sidebar from 768 px, bottom tabs and "More" page, "+" only on Today and Patients, tab bars with a fade, 44 px targets | `PhoneTabs.dc.html`, `PhoneMore.dc.html` | PA-F14, PA-F15, PA-F16, PA-F18 | Q2.1 |
| Q2.12 | Reports: four numbers and "Things to watch" first, charts collapsed with a "Not enough data yet" state | PDF S10 | PA-U15, PA-N01, PA-B13 | Q2.1 |
| Q2.13 | **Settings redesign (4 groups, 8 items, setup progress card, live prescription preview) and the new Library page** (Medicines first, then Medicine sets, Procedures and fees, Visit types, Diagnoses, Quick phrases, More). Add "Add to my list" inside the visit's medicine search | `Settings.dc.html`, `Library.dc.html`, `LibraryAdd.dc.html` | PA-U12, PA-U13, PA-D10, PA-N02 | Q2.1 |

---

## 4. PHASE Q3 and Q4: gaps and polish
- **Q3.1** Take an advance on purpose (form visible when nothing is due, applied to the next bill, receipt). Needs D8. PA-M01.
- **Q3.2** Late entry on a closed day and doctor reopen, in the UI. PA-B12.
- **Q3.3** Manual charge on an account without a visit, only if the doctor wants it. PA-M04.
- **Q3.4** Audit then improve the areas not audited: treatment plan and braces journey (PDF S06), files, certificates, consent history, recall and incomplete-treatment lists, prescription print, A4/A5 prints, 5,000-patient list speed, keyboard-only use. Output: new flow files in `docs/ui-audit/flows/`.
- **Q3.5** Patient portal (old Phase 8) only after Gate A and the owner's go-ahead.
- **Q3.6** Customer discovery, not code: watch the receptionist do the 10 tasks in `docs/TESTING.md`, time them; observe the doctor's visit. Write notes in `docs/product-audit/`.
- **Q4.1** Polish: plural helper everywhere, search icon and "/" chip alignment, monospace removal from inputs, Settings wording, medicine row tokens, chart labels and the "W" button, style guide only in development, "New patient banao" text in the PDF is not to be copied.

## 5. Definition of done for the phase (proposed targets, owner to confirm)
A new receptionist does the 10 tasks in `docs/TESTING.md` without help in under 20 minutes; the doctor takes a patient from Today to "Ready to bill" on one screen in under two minutes; the core-loop test passes in CI; no screen scrolls sideways at 360, 768 or 1366 px; no failed save is silent.
