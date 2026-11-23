# IDEAL EXPERIENCE: what should replace the current screens

This is a specification for another coding agent. It is a proposal: none of it is approved yet (see `docs/ui-audit/DECISIONS_UI.md` rules). It builds on the owner's own design files (`docs/DESIGN.md`, mockups S01-S19) and keeps what already works (Settings > Timings and Staff, Today for the receptionist, New patient, dialogs, print letterhead). Issue ids point to [ISSUES.md](ISSUES.md).

Users: **receptionist** (daily, fast, keyboard and phone), **doctor** (not technical, wants to write and leave), **patient** (portal later). One clinic, 100-200 new patients a month, 1 chair.

## 0. Rules for every screen
1. **One job, one main button.** Secondary actions in a "..." menu. Destructive actions (cancel, void, refund) are never next to routine ones.
2. **Show what is waiting for me.** Each role lands on a screen that lists their open items (receptionist: queue, ready to bill, messages to send; doctor: now, next, unfinished, waiting approvals).
3. **Never fail silently.** Every failed save, disabled button or refused action says why in one plain sentence next to where the user is looking, and the typed text is kept.
4. **Money is boring and explicit.** No one-click payments, no surprise advances, every payment shows its receipt, every refund its effect on the balance.
5. **One vocabulary, one format.** Statuses, dates, money and times use the same words and format on every screen and on paper.
6. **Same frame everywhere.** One page container, one header, same gutters, 44 px minimum targets, Inter only, shared components only.
7. **Phone first for lists and actions, laptop first for the visit.** Everything works at 360, 768 and 1366 px without sideways scroll.

### Shared vocabulary (replaces raw system words)
| System value | Show as | Colour (DESIGN.md pairs) |
|---|---|---|
| scheduled / confirmed | Booked | grey |
| arrived | Waiting | amber |
| in_chair | In chair | blue |
| completed | Done | green |
| no_show | Missed | orange |
| cancelled | Cancelled | grey, struck text |
| visit draft | Draft | grey |
| visit finalised | Final | green |
| bill draft / issued / cancelled | Draft / Open / Paid / Part paid / Cancelled | grey / amber / green / amber / grey |
Durations: "10 h 23 min", "Under 1 min". Dates on screen: "Tue 24 Nov" (with year when not this year); on paper dd/mm/yyyy. Money: ₹2,500 and ₹649.50 (always paise when not zero). Plurals through one helper ("1 appointment").

## 1. App frame and navigation
- **Laptop (1366)**: navy sidebar, 7 items (Today, Patients, Appointments, Billing, Messages, Reports, Settings). Top bar: one search ("/" shortcut), **+ New patient**. **Walk-in** lives on Today only (receptionist). Remove the dead top-bar Walk-in (PA-F04).
- **Tablet (768)**: use the laptop sidebar (collapsed to icons + labels) so nothing is cut; no clipped tab row (PA-F16).
- **Phone (360)**: bottom tabs Today, Patients, Calendar, Billing, More. The round "+" exists only on Today and Patients, leaves 80 px of bottom space, and never covers a row (PA-F15).
- **Page container**: max width 1200, 16 px gutters on phone, 24 px on tablet/laptop, same on every screen (PA-D01). **Page header**: title (26/700 navy), one-line subtitle only when it helps, one primary button at the right.

## 2. Today
### Receptionist Today (keep S01, fix the phone)
Order: greeting + date, then stat strip **Booked / Waiting / In chair / Ready to bill** (counts; "Waiting longest 12 min"), then two columns on laptop (list left, Next patient + Call list right), one column on phone.
- **Row** (whole row opens the patient): time, name, visit type, due tag, status chip, ONE primary action that changes with the state:
  Booked -> **Arrived**; Waiting -> **Send in**; In chair -> **Done**; Done with unpaid visit -> **Take payment** (Ready to bill, PA-U01).
  Secondary "..." menu: Cancel, Missed, Reschedule, Open patient. Cancel and Missed ask for a reason in one small panel (PA-L04).
- **Walk-in** button above the list (opens the existing dialog, with "New patient" offered when the search finds nobody).
- Stats count only remaining slots from now to closing time (PA-B09).
- Phone: stat strip becomes a horizontal chip row; row actions go under the name at 44 px height (PA-F05).

### Doctor Today (the work queue)
Order: **Now** (patient in chair, big "Open visit"), **Next** (up to 3 waiting), **Waiting for you** (unfinished visits, discount requests, unissued prescriptions, patient requests, each a one-line link), **Rest of the day** (collapsed list). Greeting by name. No stat cards. "Mark done" instead of "Completed" (PA-U10, PA-M05).

## 3. Patient profile
- **Header**: name, age/sex, patient-number chip, one contact line (mobile, or "Contact: Sunita (mother) 90000 99070"), alerts as red chips if any. **Actions by role**: receptionist: Book, Take payment, Print; doctor: New visit, Book, Print.
- **Opens on Overview**. Tabs: Overview, Visits (doctor), Appointments, Billing, Files, Messages, History. Phone: scrollable tab bar with a fade.
- **Overview** cards: Next appointment (one shared function, PA-B10), Balance (Outstanding, Advance, "Take payment"), Last visit (date, complaint, procedure), Alerts and medical history (doctor), Details (area, other mobile, guardian, notes).
- **Billing tab**: Balance card, **Take payment** card, **Bills** list (number, date, total, status chip), **Payments** list (date, amount, mode, reference, receipt Print, "applied to SB-..."), Refund as a button on a payment row (doctor).

## 4. New patient (keep, reorder slightly)
Fields, in order: **Full name**, **Mobile** (with "No mobile" link; reason box appears at once), **Gender** (no default, required), **Age or date of birth** on one row. Patient number appears as a quiet chip in the header, not a form row. If age < 18 the guardian block (name, relation, guardian mobile, whose number is the contact) **opens by itself** and focuses its first field (PA-U06). "More details" holds the rest. **Consent card**: "Privacy notice given", "Allow SMS/WhatsApp reminders" (disabled with a sentence when there is no mobile or contact). Promo moves to More details. Duplicate box: exact-mobile match first; Save then asks "Same person? Open existing / Save as new patient" (PA-L09). After save: **Open patient**, **Book appointment**, **Walk-in now** (one primary, two quiet).

## 5. Appointments and booking
- **Laptop**: week view (S08) with day view toggle; **phone**: day list, newest first, full names (PA-F17).
- **Detail panel**: patient chip, time, visit type, status, mobile, note. Buttons: **Reschedule**, **Cancel / Missed** (with reason), **Open patient**. Dragging stays as a shortcut, with a one-line hint (PA-U04).
- **Book dialog**: Patient (search, or "New patient" inline), Visit type, then a **date strip** (today + 6 days, "More dates" opens the picker), **8 time chips** with "More times", Note labelled "Note (optional)". Book button fixed at the bottom of the dialog. Empty state: "No free times on Tue 24 Nov. Try Wednesday." Booking without a note must work (PA-F03).
- Rescheduling or cancelling withdraws queued messages and creates one "moved" or "cancelled" message (PA-B03).

## 6. Visit (doctor): one screen for the common case
Layout at 1366: left 2/3 work area, right 1/3 context panel; at 360 stacked with a sticky bottom bar.
1. **Header strip**: name, age/sex, number chip, allergies and medical alerts (red chips, always visible), status chip (Draft/Final). Links: Patient details, Past visits.
2. **Work area (top to bottom)**: **Complaint** and **Findings** side by side; **Chart** (two rows of 16 teeth, 44 px tap areas, condition chips, legend) with **Procedures done** chips directly beneath (pick from the clinic's procedure list; added items show fee); **Diagnosis** chips; **Next visit** chips (In 2 weeks, 4 weeks, 6 weeks, Pick date); **Advice**. Rare fields (history, gums, vitals) under "More".
3. **Prescription**: a compact panel, not a tab: "Medicines" with search, quick sets, table, **Issue** (works, PA-F02) and Print. Tabs remain only for Plan, History, Files.
4. **Context panel**: Last visits (3 short cards, refresh on save, PA-F10), balance due, next appointment.
5. **Sticky bottom bar** (the only place for Finalise): left "Saved 10:42" (or a banner with the reason when saving fails, PA-F07), centre a live checklist **Diagnosis ✓  Procedures ✓  Prescription issued ✗**, right **Finalise visit**. The Finalise dialog lists unmet items as warnings (PA-L02) and says what happens next.
6. **After Finalise**: read-only text view (empty fields hidden), banner "Final. Ready to bill", buttons **Create bill** (disabled with reason if no procedures), **Next waiting patient: <name>**. Addendum behind "Add addendum", with "Mark entered in error" inside that panel (PA-F10 and AUDIT M7).
7. **Phone**: same order, bar fixed above the bottom tabs, chart scrolls inside its own card with zoom.

## 7. Billing, bill and payment (build to S09)
### Billing hub (nav item "Billing")
Tabs: **Today** (collection total, by mode; payments list), **Dues** (ageing strip 0-30 / 31-60 / 60+ as three chips; rows: name + number, amount, days, last call note; actions: **Take payment**, Call note, WhatsApp reminder), **Bills** (search, filters), **Day close** (own tab, see below). CA export moves to Reports or Settings.
### Bill screen
Header: bill number, **patient name and number chip**, status chip. Cards: **Items** table (item, qty, rate, amount), **Totals** (subtotal, discount, total, paid, balance), **Payment** (see below), **Discount** (request/approve), actions: **Save and print receipt** (primary), Print bill, "..." menu with Cancel bill (doctor) or "Ask the doctor to cancel" (receptionist). Bills created from a finalised visit are issued directly (a draft state only when the user chooses "Review first"). No internal sentences on screen or paper (PA-D04).
### Payment card (identical on the bill and the profile)
Amount field with **Full balance** and **Half** as chips that only fill the field; Mode as chips (Cash, UPI, Card, More); Reference appears for non-cash; one **Record payment**. Rules: amount 0 or negative shows "Enter an amount above 0"; amount above the due opens "This is ₹18,000 more than the due. Record the extra as advance?" with Cancel as default (PA-B02); after recording: toast "₹500 recorded. Receipt SR-... [Print]", the Payments list updates, mode resets to Cash. A patient with nothing due still sees the card with the label **Take advance** (PA-M01).
### Refund and cancel
Refund opens from a payment row, amount prefilled, reason required, and shows the effect "Outstanding will become ₹2,500" (rule to be decided, PA-B01). Cancelling a part-paid bill offers "Refund first" inside the panel. Cancelled bills stay visible with a grey chip and the reason.
### Day close
Own tab: expected cash (large), counted cash, difference updates live, note appears only when different, blockers list shows **patient names** with a link to each row and a Missed action (PA-L04); after closing: "Closed. Counted ₹450, difference -₹50" with Print.

## 8. Messages
One list with filter chips **To send / Opened / Cancelled / Out of date**, grouped by patient: heading "Riya Flowtest · P-000031 · Tue 24 Nov 11:15", then lines "Confirmation", "Reminder (due Mon 5 PM)", each with **Open WhatsApp** and "Mark sent". Out-of-date and no-number items are greyed with the reason ("Appointment moved", "No mobile: tell in person"). Messages go to the contact mobile and address the guardian for children (PA-B05). Messages for past appointments are never created (PA-B04). Test-mode bar styled as a notice, "DRAFT" shown as a badge on the template. After booking, the toast says when the confirmation will appear.

## 9. Settings (keep; apply the Timings and Staff pattern everywhere)
Group the 20 sections under 5 headings (Clinic, Lists, Messages and forms, People, System). Every form: validation sentence beside the field, Save disabled with a reason, toast on success (PA-F08). Medicine add: name and strength first, "More details" for the rest (PA-U12). Lists: Add at the top, reorder mode instead of arrows per row (PA-U13). Placeholders in English (PA-N04). Doctor-only sections hidden from the receptionist menu, and the policy written down (PA-S04).

## 10. Reports (doctor)
Top: four numbers (Arrived today, New this month, Collected this month, Outstanding) and a short "Things to watch" list with links. Charts below, collapsed, each with a "Not enough data yet" state; Payments and Refunds on separate lines (PA-B13, PA-N01).

## 11. Print
Keep the letterhead and layout. Remove every internal sentence (gst_mode, missing registration number) from patient prints; show those as staff-only warnings before printing. Add the payment lines and balance to the bill print. One date format, "Duplicate copy" on reprints.

## 12. Phone and tablet checklist
No sideways scroll; one column; actions under the name; 44 px targets for rows, links, checkboxes; tabs scroll with a fade; dialogs have a fixed footer; the chart fits the card; the "+" never covers content; keyboard hint hidden on touch.

## 13. What to remove or merge
Remove: dead Walk-in button, duplicate Walk-in entries, in-page patient search duplicate, style guide from staff builds, keyboard hint on phones, "Next free times" long list, Hinglish placeholder names, internal notes on screen and paper.
Merge: Billing nav + Dues + Bills + Day close into one hub; visit first tab + chart + procedures + prescription summary into one screen; "Completed" and Today row actions into one state-based button.
Simplify: draft bill step, 11-field medicine form, 20 settings sections, five-chart report page.
