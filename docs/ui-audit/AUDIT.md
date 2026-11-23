# AUDIT: overall findings (2026-11-23)

Status column: Open unless changed. Evidence labels are explained in [README.md](README.md).
"A" = deviation from the owner's mockups/DESIGN.md. "B" = my independent recommendation (the mockup itself could be better).

## Verdict
The shell, Today (receptionist), New patient, dialogs and print output are tidy and follow DESIGN.md. Everything else drifts. Roughly half the screens (Billing, Bill, Reports, Messages, the profile Billing tab, Medicines, History filters) look like unstyled HTML, and page margins differ from screen to screen. Two defects stop the core daily loop (open visit, bill the visit). The product does not yet feel like one system, and it is not ready for a receptionist usability test until C1 and C2 are fixed. The design intent is good. The gap is consistency and a few broken connections, not taste.

## Critical

| ID | Problem | Why it matters | Fix | Evidence |
|----|---------|----------------|-----|----------|
| C1 | **[FIXED Q0.2]** **Opening a visit fails.** Tapping "Open visit" (Today, profile) shows "Invalid input: expected object, received string" and nothing opens. Cause: the shared `api()` client already calls `JSON.stringify(body)`; six feature `api.ts` files (visits, prescriptions, chart, plan, history, certificates) stringify first, so the body is double-encoded and the Worker returns 400. | The doctor cannot start any visit, prescription, chart or plan write. Unit tests with mocks do not see it. | Pass plain objects to `api()` in those six files (or make `api()` reject strings). Add one browser test that opens a visit. | [seen+code] POST /api/staff/visits 400. Other five files [code] only. Visit screens in this audit were reached by a harness that un-doubles the body. |
| C2 | **Visit to bill is a dead end.** Procedures can only be added on the **Chart** tab. The first tab ("Today's visit") never mentions them. The Finalise dialog warns only "No diagnosis is recorded yet". After finalising, "Create bill" answers "Add procedures on the visit before creating a bill." and the visit is locked. | Doctor finalises, receptionist cannot bill, nobody can say where to go. It is the clinic's revenue path. Not verified: whether an addendum can add procedures. | Show Procedures on the first tab (as mockup S05 does). Add "No procedures: this visit cannot be billed" to the Finalise warnings. Disable Create bill with a reason when none. | [seen] `screenshots/visit/create-bill-error-laptop.png`, `finalise-confirm-laptop.png`. Tab location [code]: VisitChartTab.tsx |
| C3 | **[FIXED Q0.3]** **The prescription can never be issued.** Pressing Issue saves the advice first (the record's version goes up), then issues with the old version still in memory, so the server answers 409 "Someone else changed this record while you were editing. Reload...". Reloading does not help. Finalise still goes through with the prescription unissued and no warning. | The doctor cannot give the patient a printable prescription; the message blames a person who is not there. | Use the version returned by the save, or skip the save when nothing changed. Add an Issue test in a browser. | [seen+code] flows/G01 step 40; VisitMedicinesPanel.tsx onIssue() |
| C4 | **[FIXED Q0.4]** **Booking an appointment without a note fails.** The Book dialog sends `complaint: null` when the optional note is empty; the schema accepts only a string, so the dialog shows "Invalid input: expected string, received null". With any note typed it works. | Most bookings have no note. The receptionist sees a technical message and does not know what to fix. | Send nothing or an empty string, or accept null. Add a booking-without-note test. | [seen+code] flows/H01 step 12; QuickBookDialog.tsx:100, appointment-book.ts:20 |

## High

| ID | Problem | Fix | Evidence |
|----|---------|-----|----------|
| H1 | **"Walk-in" in the top bar does nothing** (no click handler). It sits on every tablet/laptop screen for both roles. The working Walk-in is on the receptionist's Today page, so the receptionist has two. | Wire it to the dialog, or remove it. Keep one Walk-in. | [seen+code] TopBar.tsx has no onClick; click produced no dialog and no request |
| H2 | **Half the app is unstyled.** Billing, Bill, Messages, Reports tables, profile Billing tab and History filters show bullets, glued text ("Vikram Testcase · P-0000220-30 days"), native selects, square input borders, bare labels. | Rebuild these with `ui/form`, `DataTable`, Card and StatCard. See DESIGN_SYSTEM.md. | [seen] `billing/dues-laptop.png`, `billing/bill-laptop.png`, `patients/profile-billing-laptop.png`, `messages/messages-laptop.png` |
| H3 | **"Billing" in the nav opens only "Outstanding dues".** No list of bills or payments, no way to start a bill, no today's collection (mockup S01 shows one). "Monthly export (CA)" and "Daily cash close" sit under the dues list with no heading hierarchy. | Billing home with tabs: Today's collection, Dues, Bills, Day close. Move CA export to Reports/Settings. | [seen] `billing/dues-laptop.png` |
| H4 | **Bill screen shows almost nothing** versus S09: no patient name or number, no payments or balance, no status chip, no items table. Internal text leaks: "gst_mode off — DRAFT accountant" on screen and on the printed bill; "Doctor registration number missing in Settings." on the patient's printed bill. "Cancel bill" sits beside "Print bill" with equal weight. | Build to S09. Move config warnings to staff-only banners. Make Cancel a quiet menu action with a reason prompt. | [seen] `billing/bill-laptop.png`, `print/bill-print.png` |
| H5 | **Inconsistent page margins.** At 360 px the page title sits at x = 0 on Patients, Billing, Messages, Reports (text touches the screen edge); Today has 72 px (hero), Appointments and Settings 16 px. At 1366 px Patients, New patient, Billing, Messages and Visit start flush against the sidebar while Today, Appointments and Settings have 24 px. | One `PageContainer` with fixed gutters (16 phone / 24 laptop) used by every screen. | [seen] measured h1 left edge; screenshots in `patients/`, `billing/` |
| H6 | **Visit screen deviates from S05 (A) and is hard to use (B).** Mockup: tooth chart, complaint, findings, procedure chips, next-visit chips and an alerts card on one screen, "Write prescription" and "Finalise" together, a yellow draft banner. Built: 6 tabs, 9 text boxes first, chart and procedures on tab 2, medicines on tab 4, no alerts card, Finalise at the top far from where writing ends. | Adopt S05's one-screen layout for the common case. Keep tabs for plan/history/files. Put alerts at the top of the visit. | [seen] `visit/draft-laptop.png`, `visit/chart-tab-laptop.png`; mockup S05 (PDF p.8) |
| H7 | **Phone: round "+" (new patient) covers content** (list rows, status badge, P-number chips) and also appears on screens where it makes no sense (visit form, appointments which already has Book, billing). | Show it only on Today and Patients, and add bottom padding so it never covers a row. | [seen] `today/doctor-phone.png`, `patients/list-phone.png`, `visit/draft-phone.png` |
| H8 | **Phone calendar cuts patient names** to "M." and "T..". The appointment is unreadable. | On phone use a list (time, full name, status) not a grid. | [seen] `appointments/calendar-phone.png` |
| H9 | **Tablet (768) top tab row overflows**: "Messages" is cut, Reports and Settings are off-screen with no scroll hint; user name truncated ("Dev Rec…"); search placeholder truncated. | Collapse to a "More" tab at 768 or use the laptop sidebar from 768. | [seen] `today/receptionist-tablet.png` |
| H10 | **Status words are system words.** "in_chair", "draft", "scheduled" in lowercase; "draft" and "scheduled" in green (looks like success); Today says **Waiting** while the calendar says **Arrived** for the same appointment; "Waiting 623 min" instead of hours. | One status-label map used by Today, calendar and history; show "10 h 23 min". | [seen] `patients/profile-laptop.png`, `today/doctor-laptop.png`, `appointments/calendar-laptop.png` |
| H11 | **No Cancel or No-show for a future appointment.** The calendar detail panel has only "Open profile" and "Close"; the profile Appointments tab only lists. Cancel exists only on today's rows. Reschedule is possible only by dragging a block (nothing says so; same day only). Why it matters: A patient who phones to cancel cannot be recorded; the slot stays blocked and reminders may still be created. | Reschedule and Cancel (with reason) in the detail panel and on each profile row. | [seen] flows/B02 |
| H12 | **Money after a refund looks wrong.** After a ₹500 refund the History shows the refund, but Outstanding stays ₹2,000, the statement lists the payment and no refund, and the bill still cannot be cancelled. The receptionist has no way to fix or even ask to cancel a wrong bill. Why it matters: The balance quoted at the desk disagrees with history; the money screens cannot be trusted until the rule is decided and tested. | Decide the refund rule, show refunds on the statement, test pay-refund-outstanding. | [seen] flows/D02 |
| H13 | **"Full balance" and "Half" record a payment immediately** (no confirm, mode cash). After a payment there is no toast, no receipt number and no Print receipt; receipts appear only on the printed statement. Why it matters: A mis-click records money that was not received; the patient gets no receipt at the desk. | Make them fill the amount only; after payment show a toast with Print receipt and list payments. | [seen] flows/G01 steps 54-59 |
| H14 | **Receptionist's Today does not say a visit is ready to bill.** After the doctor finalises, the row still says "In chair / Completed" with only a small "Due ₹1,500" tag. Why it matters: The busiest hand-off relies on memory. | "Ready to bill" with a Take payment button (S01 has Bill). | [seen] flows/G01 step 47 |
| H15 | **Receptionist Today is broken on a phone.** At 360 px the page is 441 px wide: stat cards and the Next patient card are cut off, and the row buttons "In chair" and "Cancel" are off-screen or under the round "+". Why it matters: on a phone the receptionist cannot mark a patient In chair. | Stack cards, full-width Next patient, row actions under the name, bottom space for "+". | [seen] flows/F02 steps 1-2 |
| H16 | **Chart tab is wider than the screen** on phone (774 px at 360) and tablet (838 px at 768); teeth are about 32 by 8 px with 193 tiny tap targets. Why it matters: unusable by touch. | Fit the chart to the width, 44 px tap areas. | [seen] flows/F02, F03 |
| H17 | **[PARTLY FIXED Q0.6: confirm done, Take advance deferred to Q3.1]** **Overpaying is accepted without a warning.** ₹20,000 against ₹2,000 due, or ₹9,999 against ₹2,500, is recorded at once and becomes "Advance". With no bill the payment form is hidden, so an advance cannot be taken on purpose. Why it matters: one extra digit records money never received; the doctor must reverse it. | Confirm "₹18,000 more than due: record as advance?", add a "Take advance" option. | [seen] flows/D03 |
| H18 | **Cancel on a Today row cancels at once** (no confirm, no reason, no undo) and sits beside "In chair"; there is no No-show action, so the Call list stays empty. Why it matters: one slip removes a waiting patient. | Confirm with a reason (cancelled / no-show), move Cancel into a menu. | [seen] flows/D05 step 22 |
| H19 | **Discount hand-off.** The doctor is not told that a discount is waiting (nothing on Today), and the draft total already drops to the discounted amount before approval. Why it matters: the patient is quoted a price the doctor has not agreed. | Doctor sees "Discount waiting" on Today; keep the total until approved. | [seen] flows/D06 |
| H20 | **Moved appointments leave old messages in the queue.** After 3:00 PM was moved to 4:15 PM, the 3:00 PM confirm and reminder stay next to the new ones; no "reschedule" message is made. Why it matters: staff can send the wrong time. | Withdraw old messages, use the reschedule template. | [seen] flows/H02 |
| H21 | **Children cannot get reminders.** The profile shows "Contact 90000 99070 (mother)", but Open WhatsApp says "This patient has no mobile number for WhatsApp." Why it matters: children are many in an orthodontic clinic. | Send to the contact mobile, address the guardian. | [seen] flows/G08 |
| H22 | **Typing can be lost in a second tab.** A tab holding an old copy of a visit shows "Not saved — retrying" for ever; after reload the typed exam note is gone, with no explanation. | On conflict explain and keep the text for merge. | [seen] flows/G10 |
| H23 | **Closing time before opening time fails silently** in Settings > Timings: Save does nothing, no message. | Show a sentence beside the row. | [seen] flows/E01 |
| H24 | **A wrong bill cannot be fixed by the receptionist** (no Cancel, no "ask the doctor"); the doctor must first refund; after a refund the balance and statement do not move back. (Same as H12, from the receptionist's side.) | See H12 and flows/D02. | [seen] flows/D02 |

## Medium

| ID | Problem | Fix | Evidence |
|----|---------|-----|----------|
| M1 | Three date styles: `2026-11-23` (profile, visit, bills, history), `16/11/2026` (print, pickers), `23 November` (Today). Times were unified (FIXES #4); dates were not. | One `formatDate` helper, `23 Nov 2026` everywhere on screen, dd/mm/yyyy on print. | [seen] |
| M2 | Native controls everywhere the shared form module is skipped. 40 feature files use raw `<input>/<select>`; 8 import `ui/form`. Result: square date inputs, unstyled "Search medicine", filters, Chart tab dropdowns. | Make `ui/form` the only way (lint rule). | [seen+code] |
| M3 | New patient: **Gender defaults to "Female"**. A rushed receptionist saves the wrong gender silently. | Start on "Select" and require a choice. (Clinical data rule: confirm with doctor.) | [seen] `patients/new-empty-laptop.png` |
| M4 | Two search boxes on Patients (top bar and in-page). | Keep the top-bar search; in-page search only filters the list if it has a different job, otherwise remove. | [seen] `patients/list-laptop.png` |
| M5 | Patient profile opens on **History** while **Overview** is the first tab. Mobile number is shown twice in the header ("90000 00119" and "Contact 90000 00119 (self)"). | Open on Overview. Show contact once, only when it differs from the patient. | [seen] `patients/profile-laptop.png` |
| M6 | Patients list has three columns (name, number, mobile). No last visit, dues or next appointment: the receptionist must open each patient to see if money is due. | Add Last visit, Next appointment, Due. | [seen] |
| M7 | Finalised visit shows every field including empty ones, drawn as editable inputs. The addendum form is permanently open and contains "Mark whole visit as entered in error". The side card still says **Draft / No complaint noted** after finalising. The "Finalised"/"Draft" badge is clipped at the right edge and the right column has no gutter. | Read-only text view (hide empty fields). Addendum behind an "Add addendum" button. Refresh the side card. | [seen] `visit/finalised-laptop.png`, `visit/create-bill-error-laptop.png` |
| M8 | Book dialog: when no time is free it shows the heading "Free times on 23/11/2026" with nothing under it. Walk-in dialog: checkbox sits above its label, centred. "What they said on the phone" is the wrong label for a walk-in. | Add "No free times left today. Pick another date." Fix checkbox row. | [seen] `appointments/book-dialog-laptop.png`, `today/walkin-dialog-laptop.png` |
| M9 | Tap targets under 44 px at 360: patient names 21 px high, calendar slot links 21 px, dues links 17 px, consent checkboxes 13 px. Violates AGENTS.md. | Make the whole row the link; 44 px min height. | [seen] measured |
| M10 | Reports: with one day of data each chart is one giant bar; "Collected" chart is empty with a "-50 ₹" caption; chart labels are large. S10 says it must carry a "Sample data" label until real data exists; none was seen. | Minimum-data state ("Not enough data yet") instead of a chart. Cap chart height. | [seen] `reports/reports-laptop.png` (data-dependent) |
| M11 | Today (doctor): "Today's patients" heading touches its card; the "In chair" pill stretches the full card width; "Completed" beside "Open visit" is ambiguous (completes what?); the "1 visit not finalised" card is above "Now" and not obviously clickable. | Rename "Mark done". Put Now first. Make the unfinalised row a link. | [seen] `today/doctor-laptop.png` |
| M12 | Messages: four empty columns of "None.", the subtitle "DRAFT - doctor to confirm" shown as page text, test-mode bar unstyled. | Single list with filter chips. Show DRAFT as a badge on the template, not the page. | [seen] `messages/messages-laptop.png` |
| M13 | Patients list on phone: keyboard hint "Use the arrow keys and Enter..." is shown to touch users. Each card repeats the labels "Patient no." and "Mobile". | Hide the hint below 768 px; drop repeated labels. | [seen] `patients/list-phone.png` |
| M14 | Visit phone: tab row runs off the right edge (History and Files cut, no cue). | Scrollable tabs with fade, or fewer tabs. | [seen] `visit/draft-phone.png` |

## Low
- L1 Tooth chart labels are about 7 px, the "W" button under each tooth is unexplained, "R/L" tiny. [seen] `visit/chart-tab-laptop.png`
- L2 Chart tab says "click a tooth surface on the chart first" even for procedures that need no tooth (Scaling). [seen]
- L3 Search shortcut chip "/" and magnifier icon slightly misaligned inside the search box. [seen]
- L4 Settings sub-nav item "Messages" repeats the main nav name; clinic-details labels "Kind of clinic (under the tagline)", "Extra line under speciality" read like layout notes. [seen]
- L5 `/app/style-guide` is reachable by staff and scrolls sideways at 360 and 768. [seen] (developer page)
- L6 Receptionist can open `/app/errors` (menu hides it); the API returns 403. Not seen how the page reports it. [seen console only]

## Test and tooling notes (found during the audit)
- T1 [FIXED Q0.1: config uses localhost and a scratch DB] `playwright.config.ts` uses `http://127.0.0.1:8787`, but `APP_ORIGIN` is `http://localhost:8787`, so any e2e step that writes data gets 403 "blocked for safety". [seen]. Use localhost in the config.
- T2 Installed Chromium is build 1248, Playwright 1.65 wants 1255. Run `pnpm exec playwright install chromium`.
- T3 The local D1 in `apps/worker/.wrangler/state` is half-migrated (migration 0016 hits a UNIQUE error). This audit used a scratch DB. Reset local state before the next session.

## A. Deviations from DESIGN.md and the mockups
| Screen | Mockup says | Built | Ref |
|--------|-------------|-------|-----|
| S01 Today | 4 stat cards incl. "Today's collection"; row actions Bill/Finish/Send in | 3 cards for receptionist, none for doctor; no collection | M11, H3 |
| S05 Visit | One screen, chart + findings + procedures + alerts, yellow draft banner, Write prescription + Finalise | Tabs, no alerts, no banner | H6 |
| S09 Bill | Items table, totals card, payment chips, "Save and print receipt", account progress | Plain list | H4 |
| S10 Reports | "Sample data" label | Not seen | M10 |
| S11 Messages | "Test mode is ON" bar | Present but unstyled | M12 |
| Layout | Content in cards, 24 px gutters, 48 px controls | Mixed, see H5/M2 | |
| Phone | Bottom tabs with round "+" for new patient | Present, but covers content and shows everywhere | H7 |

## B. Independent recommendations (beyond the mockups)
1. **Doctor Today should be the work queue**: Now, Next, Unfinished visits, in that order. Today it has no stats and the unfinished-visit card on top.
2. **Collapse the visit to the three things a dentist does**: what the patient says (complaint, findings), what was done (chart + procedures), what happens next (prescription, next visit). Everything else is a side panel.
3. **Billing is a place, not a page of debts.** Bills, payments, dues, day close are tabs under one nav item.
4. **One vocabulary** for appointment and visit status, used in every screen, in plain words (Booked, Arrived, In chair, Done, Missed, Cancelled; Draft, Final).
5. **Show only what has a value.** Read-only screens hide empty fields.
6. **Confirm only irreversible things.** The Finalise dialog earns its place (it locks the record). Keep confirmations for that kind of action only. (A "Leave without saving?" guard exists on Settings forms; not tested whether it fires when nothing changed.)

## Highest-priority redesign targets (next phase)
1. Fix C1 and C2 first (no design needed, they are bugs).
2. Page frame: one container, gutters, headings (H5).
3. Billing home + Bill screen to S09 (H2, H3, H4).
4. Visit screen to S05 (H6, M7).
5. Phone chrome: "+" button, calendar list, tablet nav (H7, H8, H9).
6. Shared status labels and date format (H10, M1).
7. Form module enforcement (M2).
