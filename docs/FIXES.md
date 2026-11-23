# FIXES (bug and polish list, owner adds points as he finds them)

Rule: one point at a time, tests first, `pnpm check`, local commit. Mark Done with the commit hash.
Backend stays as is; change it only where a point below says so.

## Today (2026-11-23), in this order
| # | Point | Status |
|---|-------|--------|
| 1 | **DONE locally.** **Doctor Today is a dead end.** Show the whole day's list; every row is clickable and opens the patient's visit. Doctor must never be blocked because the receptionist did not press Arrived / In chair. "Now" card = in chair, else next arrived, else the next upcoming patient. | Open |
| 2 | **DONE locally.** **Clicking a patient starts the visit flow:** one screen where the doctor sees the patient (alerts, medical history, past visits, files) and can write the prescription from there (Medicines tab). Opening a visit from Today also moves the appointment to In chair if still Scheduled/Confirmed/Arrived (owner confirmed 2026-11-23: yes, do it). | DONE locally: Today list + open visit + In chair (c04c1ad); visit screen shows patient facts, Edit patient link, real History tab, Create bill only after Finalise with inline errors, Next patient button. Not checked in a browser at 360/768/1366 (Playwright browsers missing). |
| 3 | **Booking must show up.** After booking, jump the calendar to the booked date, highlight it, toast "Booked for 25 Nov, 10:30 AM". Patient profile shows Upcoming appointment. Book works for today (only times not yet passed) and any future day; let the receptionist pick any free time of a date, not only 5 suggestions. | Open |
| 4 | **DONE locally** (shared formatClockTime, used in Today, calendar, book dialog, patient appointments, history strip, day list print; messages already had am/pm; Settings > Timings keeps the browser time picker). Show AM/PM in every time shown to staff (now 24-hour like 14:30). One shared helper replaces the 7 copies (appointments, today, patients, history, print day list, messages). | Open |
| 5 | **Age from DOB:** typing DOB fills the age box live (read-only); age-only entry keeps working and grows each year; duplicate check must send the DOB (NewPatientForm.tsx:58 sends null). Check every screen shows computed age, never the stored one. | Open |

## Later (from review, not yet confirmed by owner)
- Visit screen: one main action bar (Finalise, then Create bill); History tab stub shows "(3.5.11)"; bill error replaces whole page.
- Status words: "Draft" / "Finalised" are technical for the doctor.
- **Consent forms (owner sent 6 PDFs 2026-11-23): DONE locally.** Hindi defaults for extraction, filling, root canal, scaling, crown and bridge, orthodontic; structured print (headings, bullets, tick boxes, header on page 1, A4, several pages); auto-fills patient name, age, mobile, patient no., date, doctor; tooth line and signatures stay blank; one signature block for all forms (patient or thumb, guardian if applicable, doctor, witness). The Template drop-down on the print screen picks the form. Details: DECISIONS.md. Still open: owner prints one on the clinic printer and checks the Hindi font; doctor proofreads the Hindi; lawyer confirms. Maybe later: choose the form from the visit procedure, "mark consent as taken" after signing.
- **Letterhead / prescription paper (owner sent PDF):** fill Settings with the clinic details from the letterhead (in the app, not in the repo), upload logo, footer with timings, address, Instagram; print layout follows it (S13). Owner answered: the app prints the header, A4. Needs new settings keys (email, Instagram) so a migration 0055; not started.
- Letterhead typo to confirm with the doctor: "Bangaluru" (Bengaluru).
- One Book appointment button on Today for the receptionist (now 3 places).
- VisitMedicinesPanel.tsx is 462 lines: split before adding more.
