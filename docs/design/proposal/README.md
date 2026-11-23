# Design proposal (2026-11-23): screens to build in Phase Q

These are the visual designs for the screens that are missing or broken in the app. They follow `docs/DESIGN.md` and the mockup PDF `docs/design/align-dentistry-screens.pdf` (S01-S19). Where this proposal and the PDF differ, this proposal is newer and wins for the screens listed below; for every other screen the PDF still wins.

## How to read them
Each `*.dc.html` file is ONE screen as plain HTML with inline styles. Open the file in an editor and read it: the exact layout, sizes, colours, copy and states are all in the markup (grid columns, paddings, chip colours, button labels). Do not copy the markup into the app. Rebuild each screen as React components in `apps/web/src/features/<name>/` using `apps/web/src/ui/` pieces and the tokens in `apps/web/src/styles/base.css`, as `AGENTS.md` says.
These files cannot be opened directly in a browser (they need the design tool's runtime). A live copy exists as a private design canvas owned by the repo owner; ask the owner for a screenshot only if a detail in the markup is unclear.

## Which file is which screen, and which task builds it
| File | Screen | Laptop/phone | Built by task |
|---|---|---|---|
| `Sidebar.dc.html` | Shared sidebar with 8 items (Today, Patients, Appointments, Billing, Messages, Reports, **Library**, Settings), active state, role-based user card | laptop | Q2.1 |
| `Main.dc.html` | Today for the receptionist: stat strip (Booked, Waiting, In chair, Ready to bill), one state-based action per row, Next patient card, To follow up | 1366 | Q1.2, Q2.5 |
| `DoctorToday.dc.html` | Today for the doctor: Now in chair, Next, "Waiting for you" (discount, unfinished visit, unissued prescription, patient request) | 1366 | Q1.7, Q2.5 |
| `PhoneToday.dc.html` | Today on a phone: stat chips, Next patient, cards with action under the name, "+" only here | 390 | Q1.10, Q2.5 |
| `Billing.dc.html` | Billing hub, Dues tab: ageing cards, filters, rows with Take payment / Call note / WhatsApp | 1366 | Q2.3 |
| `Bill.dc.html` | Bill and payment (S09 extended): items, totals, payment card with Full balance and Half chips that only fill the field, payments list with Print receipt, receipt toast, "amount too high" confirm | 1366 | Q0.6, Q1.3, Q2.3 |
| `Visit.dc.html` | Visit on one screen (S05 extended): header with alerts, draft banner, chart, complaint and findings, procedure chips with fees, diagnosis, next visit chips, prescription panel, last visits, balance, sticky bottom bar with checklist and Finalise | 1366 | Q1.1, Q2.4 |
| `PhoneVisit.dc.html` | Visit on a phone: chart scrolls inside its own card, sticky Finalise bar above the bottom tabs | 390 | Q1.10, Q2.4 |
| `Calendar.dc.html` | Week calendar (S08) plus appointment panel with Reschedule, Open patient and a reason-first Cancel | 1366 | Q1.4, Q2.7 |
| `Messages.dc.html` | Messages grouped by patient: Confirmation, Reminder with due time, Moved, Out of date, guardian messages, No number card | 1366 | Q1.5, Q2.8 |
| `Settings.dc.html` | Settings redesigned: 4 groups and 8 items, setup progress card, clinic and doctor on one page with live prescription preview | 1366 | Q2.13 |
| `Library.dc.html` | Library (NEW page): Medicines tab, filters, table, Add button. Pass `drawer` true to see the drawer | 1366 | Q2.13 |
| `LibraryAdd.dc.html` | Library with the "Add medicine" drawer open (name, strength, form; more details collapsed; tip about adding from inside a visit) | 1366 | Q2.13 |
| `canvas.json` | Positions and titles of the boards (reference only) | | |

## Screens that have a design only in the PDF (follow the PDF)
S02 Patients list, S03 New patient, S04 Patient profile (Overview), S06 Treatment plan, S07 Book appointment, S10 Reports, S11 Messages (replaced by `Messages.dc.html`), S12 Settings (replaced by `Settings.dc.html`), S13 Prescription print, S14-S17 phone screens, S18-S19 portal. Known differences to fix when you build them (the app is not required to copy these words): the PDF has the Hinglish text "New patient banao" (use "New patient: <name>") and an "SMS phone" battery card on Messages (omit; messaging is manual WhatsApp).

## Screens with no design yet
Billing tabs Today, Bills, Day close; patient profile tabs other than Overview; dialogs and empty, error and loading states; tablet (768) layouts; print set other than the prescription; certificates; patient requests; error log; portal pages other than home and sign-in. For these, copy the closest screen in this folder or the PDF, say so in the final message (AGENTS.md rule), and follow `docs/ui-audit/DESIGN_SYSTEM.md` section 4.

## Tokens used by all boards (same as DESIGN.md)
Navy `#0F2A5C`, blue `#1E4FA3`, soft blue `#E6EEFA` (patient-number chip), page `#F3F6F7`, card `#FFFFFF` with `#E3E9EE` border and 16 px radius, controls 12 px radius and 44-48 px high, text `#0E1B2B`, muted `#5B6B7B`, status pairs from DESIGN.md. Font Inter 400/500/600/700.
