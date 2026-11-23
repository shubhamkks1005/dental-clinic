# PAGES: page-by-page observations

Evidence labels: [seen] [code] [seen+code] (see README). Screenshot paths are relative to `docs/ui-audit/screenshots/`. Problem IDs point to AUDIT.md. Widths: P 360, T 768, L 1366.

## App frame (all /app screens)
- **Purpose:** navigation and identity. Sidebar (L), top tabs (T), bottom tabs + round "+" (P). Top bar: search, Walk-in, + New patient.
- **Good [seen]:** navy sidebar matches DESIGN.md, clear active state, user card with role, "/" search shortcut.
- **Problems:** top-bar Walk-in dead (H1); "+" overlaps content on phone (H7); tablet tab row overflows (H9); no shared page container so margins differ (H5); search icon/shortcut chip slightly off-centre (L3).
- **Improve:** one `PageContainer` + `PageHeader` (title, subtitle, one primary action). Show "+" only on Today/Patients.

## Today `/app`
Screenshots: `today/doctor-laptop.png`, `today/doctor-phone.png`, `today/receptionist-laptop.png`, `today/receptionist-tablet.png`, `today/walkin-dialog-laptop.png`
- **Purpose:** doctor: what to do now. Receptionist: front-desk queue.
- **Receptionist [seen]:** closest to mockup S01. Stat cards, Walk-in/Print buttons, list with row actions (In chair, Cancel, Completed), dark "Next patient" card, Call list. Good.
- **Doctor [seen]:** no stat cards; card "1 visit not finalised" first, then "Now", then the list. Full-width "In chair" pill; "Open visit" + "Completed" side by side; "Today's patients" heading touches the card border (M11). Opening a visit currently fails (C1).
- **Both:** "Waiting 623 min" (H10); Walk-in appears twice for the receptionist (H1); the stat "Arrived 2" and the list "Waiting" disagree about the same patient (H10).
- **P:** hero header is nice but unique to Today; rows wrap names ("Manoj / Testcase"); "+" covers badges (H7). Row action "Open visit" drops to its own line, small.
- **Improve:** doctor order Now, Next, Unfinished visits; rename Completed to "Mark done"; hours format; whole row tappable.

## Patients list `/app/patients`
Screenshots: `patients/list-laptop.png`, `patients/list-phone.png`
- **Purpose:** find a patient.
- **[seen]:** filter chips (All active, New this month, Not seen in 6 months, Archived), search, table, paging "Showing 1-25 of 30". Patient chips follow DESIGN.md.
- **Problems:** second search box (M4); only 3 columns (M6); blue underlined name links everywhere read as web links not rows; content flush to sidebar and screen edge (H5); keyboard hint on phone (M13); names 21 px tall (M9); duplicate mobile numbers (seed) not flagged.
- **Improve:** whole row clickable, columns Last visit / Next appointment / Due, drop hint on touch.

## New patient `/app/patients/new`
Screenshots: `patients/new-empty-laptop.png`, `patients/new-validation-laptop.png`, `patients/new-phone.png`. See FORMS.md.
- **[seen]:** narrow 450 px column, large blank area right at L. Matches S03 (patient no. box, name, gender, DOB/age, mobile). Plain validation sentences. "More details" is collapsed (good).
- **Problems:** gender pre-selected (M3); DOB field is taller than its neighbours and has both a placeholder and a helper "DD/MM/YYYY"; checkboxes 13 px (M9); content flush left (H5).

## Patient profile `/app/patients/:id`
Screenshots: `patients/profile-laptop.png`, `patients/profile-phone.png`, `patients/profile-billing-laptop.png`
- **Purpose:** everything about one patient. Tabs: Overview, History, Appointments, Chart, Visits, Billing, Files, Messages (receptionist: no Chart/Visits).
- **[seen]:** header (name, age/sex, number chip, mobile) and a stat strip (first visit, last visit, total visits, alerts, outstanding, next appointment). One main button "New visit" (doctor).
- **Problems:** opens on History, not Overview (M5); mobile shown twice; raw ISO dates and lowercase statuses ("in_chair", green "draft") in the History feed (H10, M1); filter row uses raw date inputs and an unexplained "Tooth" box with placeholder "36" and an "Apply" button (M2); Billing tab unstyled (H2): native select, loose labels, buttons stacked without grouping, "Record payment" disabled with no hint why.
- **Receptionist [seen]:** sees no "New visit" and no "Book appointment" on the profile: to book for this patient she must leave for Appointments and search again.
- **Improve:** header actions Book, New visit, Take payment (by role). Billing tab as card: Balance, Take payment form, bills list.

## Appointments `/app/appointments`
Screenshots: `appointments/calendar-laptop.png`, `appointments/calendar-phone.png`, `appointments/book-dialog-laptop.png`, `appointments/book-dialog-phone.png`
- **Purpose:** see and book the day.
- **[seen]:** one-day timeline (S08 shows a week), date picker + Previous/Next/Today/Book. The grid auto-scrolls so the first row's label is cut off; it uses 70 % of the width at L and leaves a blank column; header controls have mixed styles (native date input with square corners).
- **P:** names truncated to "M." (H8). Slot buttons 21 px high (M9).
- **Book dialog:** patient search, visit type, date (typed text), free times, note. Empty state missing (M8). Good: one primary action, cancel, disabled Book until valid.
- **Improve:** week view at L, list view at P, empty-state message, select a patient first then show times.

## Visit `/app/visits/:id`
Screenshots: `visit/draft-laptop.png`, `visit/chart-tab-laptop.png`, `visit/medicines-tab-laptop.png`, `visit/finalise-confirm-laptop.png`, `visit/create-bill-error-laptop.png`, `visit/finalised-laptop.png`, `visit/draft-phone.png`
- **Purpose:** the doctor's working screen.
- **Layout [seen]:** header (name, chip, age, mobile, "Edit patient or medical history", "Past visits"), Finalise button, tabs [Today's visit, Chart, Plan, Medicines, History, Files], form, "Last visits" side card.
- **Good:** autosave chip "Saved"; the Finalise dialog states that notes become read-only and warns about gaps; quick-phrase hint (";scal"); medicine list with templates (After extraction, RCT pain).
- **Problems:** C2 (procedures hidden on Chart tab, no billing warning); H6 (not S05); text boxes in a mono font unlike the rest of the app; 9 stacked fields with equal weight, "Gums" a single line while neighbours are multi-line; no patient alerts or allergies visible on the visit [seen: none on this patient, but no slot reserved]; "Draft" chip clipped at the edge and the right card has no gutter (M7); Finalise sits at the top, far from the end of the long form; "Create bill" and "Next patient" side by side after finalising: "Next patient" is ambiguous; error text appears in a salmon bar between buttons and tabs (easy to miss but readable).
- **Chart tab [seen]:** the tooth chart works and has a legend and keyboard hint; labels tiny (L1); three native dropdowns above (M2); procedure form below the fold.
- **Medicines tab [seen]:** search field unstyled (square, native); "Issue" button grey when empty with no hint; medicine rows large, dose right-aligned small.
- **Finalised view:** M7.
- **P [seen]:** tab row clipped (M14); "+" covers fields (H7); header links wrap fine.
- **Improve:** see WORKFLOWS.md W1.

## Billing home `/app/billing` (Outstanding dues)
Screenshots: `billing/dues-laptop.png`, `billing/dues-phone.png`
- **[seen]:** heading "Outstanding dues", totals in tiny lines, a bullet list: name+number link glued to "0-30 days . 14 days . oldest ...", amount, two buttons ("Add call note", "WhatsApp reminder") per row. Below: "Find a patient", "Monthly export (CA)", "Daily cash close" with native month/day inputs.
- **Problems:** H2, H3; the ageing buckets (0-30/31-60/Over 60) are text lines, not a summary strip; no way to start a bill or see today's collection; "Close day" button greyed with the reason ("2 open appointments must be finished...") shown only above in small text; "WhatsApp reminder" and "Add call note" are the same weight as navigation.
- **P:** same structure, names wrap; bullets; "+" overlaps.

## Bill `/app/bills/:id`
Screenshot: `billing/bill-laptop.png`
- **[seen]:** title is the bill number; one line item; subtotal/total; Print bill, Cancel bill, Patient account.
- **Problems:** H4. No payments, balance, receipt link, patient name or status chip. The item name and amount touch ("Fake procedure (seed)₹2,500").

## Reports `/app/reports`
Screenshot: `reports/reports-laptop.png`
- **[seen]:** period chips, "Compare with previous period", Recompute / Print / Download CSV, four stat cards, 5 charts with "Show table" buttons, busy-hours heat map, Call lists, "Things to watch".
- **Problems:** M10; the first chart has only two values yet fills a full card; content flush left (H5); "Things to watch" has bullets that duplicate Today and Billing. Heat map and stat cards read well.
- **Improve:** doctor's first view should be 4 numbers and "Things to watch"; charts below, collapsed.

## Messages `/app/messages`
Screenshot: `messages/messages-laptop.png`
- **[seen, empty data only]:** M12. Buttons "Refresh" and "Move queued SMS to WhatsApp" are unexplained to a non-developer.

## Settings `/app/settings/*`
Screenshot: `settings/clinic-details-laptop.png`
- **[seen]:** a settings search, grouped left menu (Clinic, Lists, Templates, Users, Preferences, Number series, System), long form with helper text under every field, Save disabled until changed. Best-structured form in the app.
- **Problems:** 20 menu items, some labels are jargon ("Number series", "Tooth conditions"); Clinic details has 13 fields in one long column with no grouping (Clinic / Doctor); helper "Example:" lines on every field make it long; receptionist menu lacks Staff and some sections (correct) but unknown URLs show "Page not found" (ok).
- **Not reviewed:** other sub-pages loaded without error.

## More `/app/more` (phone)
- [seen, text only]: Messages, Reports, Settings, Patient requests, Help with Error ID + Copy. Not viewed as an image. Fine as an overflow menu.

## Print screens `/app/print/*`
Screenshots: `print/bill-print.png`, `print/consent-print.png`
- **[seen]:** letterhead (logo tile, red clinic name, doctor right, navy rule, footer with timings and address) matches DESIGN.md and is clean black-on-white. Hindi consent form is legible, structured, one signature block, fits one A4.
- **Problems:** printed bill carries internal text (H4); bill is sparse (no payment lines); date format differs between prints (16/11/2026 vs 2026-11-23, M1); consent print screen controls are a different card style from the bill print controls (Print/Back bare buttons).
- **Not reviewed:** other print pages loaded without error.

## Patient portal `/my`
- [code] placeholder only ("Your records ..."). Phase 8 not built. Not assessed.

## Dev/Support pages
- `/app/style-guide`: overflows at 360 and 768 (L5). `/app/errors`, `/app/requests`: loaded; content not reviewed.
