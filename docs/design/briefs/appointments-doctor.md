# Design brief: Appointments calendar, as the doctor sees it

SCOPE (owner, 2026-11-25): the Appointments page (nav item "Appointments", `/app/appointments`) as seen and used by the DOCTOR. Not the doctor's Today queue (that screen is final: `docs/design/final/doctor_today.html`, PLAN Part T). Not the Book dialog's inner design beyond what the doctor needs from it. The receptionist uses the same page; this brief says what the doctor needs from it and where the doctor differs from the desk.

Written: 2026-11-25. Source: owner's notes + `docs/PRODUCT_DESIGN_CONTEXT.md` (D7, D8, flows), `docs/DECISIONS.md` (2.4.1, 2.4.2, Q1.4, Break, Queue order), `packages/shared/src/appointment-status.ts`, `packages/db/src/permissions.ts`, `apps/web/src/features/appointments/` as built. Fake data only.

## Prompt for the design AI (paste this first)
You are designing ONE page of a web app for a single dental clinic in India: the Appointments calendar as the doctor uses it. Below is a brief. It says what the page must contain, why each thing is there, and the rules behind it. It does NOT say how it looks: that is your job.
- Use only the data and actions in the brief. Do not invent fields, features or numbers. Use obviously fake sample data.
- Items marked MUST are required. SHOULD can be dropped if space is short. ADDED BY AI items are suggestions: include them only if they fit.
- Design every state in section 7 (empty, loading, error, long text, many rows), not only the happy path.
- Respect section 8 (who may see what, money, safety). The screen must work on a laptop (1366x768), a tablet (768) and a phone (360). UI text is English only.
- The doctor's other screens already exist (Today queue, Visit). This page must feel like the same product as `doctor_today.html` (same navigation, same status words, same patient chip).
- If something is unclear, list your assumption at the end of your answer instead of guessing silently.

## 1. Purpose
Answer: "Who is coming, when, and for what, today and over the coming days?" The doctor opens it to look ahead (is tomorrow heavy, is Thursday free for a long procedure), to check one patient's booking, and to move or cancel a booking when plans change. It is the doctor's planning view; the live "who is next in the chair" view is Today. A good visit: under 10 seconds to see the week, one tap to read any booking, two taps to move one.

## 2. Who, when, how
| Role | Situation | Device | How often | Time pressure | Interruptions |
|---|---|---|---|---|---|
| Doctor | Between patients, or before/after clinic, planning the days; asked by a patient "can I come Friday?" | Laptop at the chair; tablet; sometimes phone at home | 5-10 times a day, short | Medium; high when a patient is waiting | Patient in the chair, assistant, phone |
| Receptionist | Books and moves appointments all day (same page, full use) | Desk PC, phone | Many times an hour | High | Walk-ins, calls |
| Developer | Support only | Any | Rare | None | None |

## 3. Jobs to be done (in order of importance)
1. See the week at a glance: how many patients each day, where the gaps are, which days are closed. (Owner: this is the page the doctor looks at to know the schedule.)
2. Read one booking fully without leaving the page: patient, time, visit type, status, the complaint the patient gave on the phone, alert and due marks.
3. Reach the patient: open the patient's profile in one tap (and, for a booking that is today, go to the doctor's Today queue).
4. Move a booking (reschedule) or cancel one, with a reason, and undo a cancel for a short time.
5. Book a new appointment into a free time (the doctor may do it when the desk is busy).
6. See whether the clinic is open on a day (closed days, holidays, doctor's leave) before promising a time.
7. Print the day list (paper backup).

## 4. How they arrive and where they go next
- Arrive: nav item "Appointments"; "Next appointment" link from a patient's profile; the toast after booking (jumps to the booked date); the Today page's "Appointments" shortcut.
- Go next: patient profile; Today (for today's bookings); Book dialog; Reschedule dialog; Cancel or Missed dialog; print day list.

## 5. Data catalogue
Source for every appointment row: `GET /api/staff/appointments?date=` (day) and `GET /api/staff/appointments/range?from=&to=` (week, max 7 days, one request).
| # | Item | Why it is here | Source | Fresh how fast | Who sees it | Format | If empty / long / missing | Priority | Added by AI? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Date range shown and its summary ("14 appointments this week" / "6 booked") | Tells the doctor which days are on screen and how heavy they are | computed from the list (cancelled, missed and moved ones are not counted) | every 60 s while visible | Doctor, receptionist | Dates like "25 Nov 2026"; plural words | 0 shows "0 booked", not blank | MUST | No |
| 2 | Day or week choice, previous, next, today, date picker | Move through time fast; "Today" always one tap away | URL params `date`, `view` | n/a | Doctor, receptionist | IST dates | Date in the past or beyond book-ahead limit still opens | MUST | No |
| 3 | Appointment: patient name | The doctor recognises people by name | `patients.name` via `appointments.patient_id` | 60 s | Doctor, receptionist | Full name; may be 40+ chars; shows in full on phone | Never blank; truncate with full name on open | MUST | No |
| 4 | Appointment: patient code | Two patients can share a name | `patients.code` | 60 s | Doctor, receptionist | P-000123 | n/a | MUST | No |
| 5 | Appointment: time and length | Where it sits in the day; how long it blocks the chair | `appointments.start_min`, `end_min` (IST) | 60 s | Doctor, receptionist | 10:30 AM to 11:00 AM | Short bookings (15 min) must stay readable | MUST | No |
| 6 | Visit type (Consultation, Root canal, Scaling ...) | Doctor plans the day by treatment type; a long procedure needs a long gap | `appointments.visit_type_label` (copied at booking) | 60 s | Doctor, receptionist | Label; a kind colour is allowed but never alone | Long label shortens, full text on open | MUST | No |
| 7 | Status in words (Scheduled, Confirmed, Arrived, In chair, Completed, Cancelled, Missed, Moved) | Doctor sees what already happened today | `appointments.status` + `APPOINTMENT_STATUS_LABEL` | 60 s | Doctor, receptionist | Word, never colour alone | Cancelled, Missed, Moved stay visible but quiet | MUST | No |
| 8 | Medical-alert mark | A doctor should know a risky patient is coming (blood thinner, allergy) before the day | `alertFlags.hasAlert` (icon only, from patient history) | 60 s | Doctor sees mark; receptionist sees only that an alert exists | Icon plus accessible name "Medical alert" | None = nothing shown | MUST | No |
| 9 | Restricted-history mark | Some history is doctor-only | `alertFlags.hasRestricted` | 60 s | Doctor only meaning; desk sees nothing about contents | Icon plus name | None = nothing | SHOULD | No |
| 10 | "Due" mark (unpaid balance exists) | Doctor knows a patient owes, without handling money | `hasDue` | 60 s | Doctor sees the mark only; the AMOUNT is for the receptionist only | Word "Due" | None = nothing | SHOULD | No |
| 11 | Complaint / note from the phone call | Doctor prepares: "tooth pain upper right since 3 days" | `appointments.complaint` | on open | Doctor, receptionist | Text, up to a few lines | Empty = row hidden | MUST | No |
| 12 | Priority and emergency flag, overbook | An emergency or an overbooked time changes the day's feel | `appointments.priority`, `overbook` | 60 s | Doctor, receptionist | Word "Emergency", "Overbooked" | None = nothing | SHOULD | No |
| 13 | Mobile number (on open only) | Doctor may want to call a patient | `patients.mobile` | on open | Doctor, receptionist | `+91 98765 43210` style via `displayMobile` | Missing = "No mobile" | SHOULD | No |
| 14 | Open hours, lunch gap, closed days | Shows where booking is possible and why a day is empty | `DayWindow` (dayStartMin, dayEndMin, intervals, closed) from settings | on load | Doctor, receptionist | Hours; a closed day says it is closed | Closed day with late entries lists them | MUST | No |
| 15 | Doctor's break and queue order notice (for today) | If the doctor is on a break or the order was changed, the calendar should not confuse | `currentBreak`, `lastOrderChange` | 60 s | Doctor, receptionist | "On break until 11:15 AM" | None = nothing | COULD | ADDED BY AI: the data already comes with the day reply; keeps this page consistent with Today |
| 16 | Rescheduled-from chain | A booking that was moved: where from | `appointments.rescheduled_from` | on open | Doctor, receptionist | "Moved from 24 Nov, 10:00 AM" | None = nothing | COULD | ADDED BY AI: doctor can tell a patient "you were moved once already" |
| 17 | Last visit (date and one-line what was done) in the booking details | Doctor wants context for a recurring patient without opening the profile | latest finalised `visits` row for the patient (date, procedure labels) | on open | Doctor only (clinical) | "Last visit 12 Nov: scaling" | New patient = "First visit" | SHOULD | ADDED BY AI: clinical context at the moment of planning; hidden from receptionist |
| 18 | Count of patients per day on the week header | Spot a heavy day without reading every block | computed | 60 s | Doctor, receptionist | Number | Closed day = "Closed" | SHOULD | ADDED BY AI: the planning job (3.1) |
| 19 | Print day list | Paper backup when the system is down | `GET` day list rendered for print (existing "day" print template) | on press | Doctor, receptionist | A4 list | Closed or empty day prints "No appointments" | SHOULD | No |

## 6. Actions catalogue
| # | Action | Who | Needs to be true first | What changes in the data | Other effects | Undo? | Confirm? | Must NEVER happen |
|---|---|---|---|---|---|---|---|---|
| 1 | Open a booking's details | Doctor, receptionist | none | none | none | n/a | No | Opening must not change status |
| 2 | Open patient profile | Doctor, receptionist | none | none | none | n/a | No | n/a |
| 3 | Book appointment (pick patient, visit type, date, free time, optional note) | Doctor, receptionist (`appointments.manage`) | Patient exists; time is free; within book-ahead days (90); closed day only by late entry with a reason | New appointment, source "phone" | Audit row; "booked" WhatsApp message queued; reminder for 17:00 the day before | Cancel (below) | No (final button) | Double-booking the one chair silently; a message that contains health information |
| 4 | Reschedule (button, or drag a block on laptop) | Doctor, receptionist | Status is Scheduled or Confirmed; new time is not in the past; new time is free | Old booking becomes "Moved", new booking created, chain kept | Old messages withdrawn, one "moved" message queued; audit | Move again | Yes when dragging (confirm); dialog is its own confirm | Moving a patient who is already in the chair or finished |
| 5 | Cancel appointment | Doctor, receptionist | Status is Scheduled, Confirmed or Arrived; reason chosen ("Other" needs a note) | Status Cancelled, reason stored | Audit; queued messages withdrawn; one "cancelled" message queued | Undo toast about 10 s (server allows 120 s if the time is still free) | Reason is required | Cancelling without a reason; cancelling a finished or in-chair visit |
| 6 | Mark Missed (no-show) | Doctor, receptionist | Status Scheduled or Confirmed; at least 15 minutes after the start (tunable) | Status Missed, reason stored | Audit; patient appears in the desk's "To follow up" | Put back on schedule within the undo hours (tunable) | Reason is required | Marking Missed before the delay |
| 7 | Print day list | Doctor, receptionist | none | none | none | n/a | No | Printing patient health details on the paper (names, times, visit type only) |
| 8 | Choose day or week view, move dates | Doctor, receptionist | none | none (URL only) | none | n/a | No | n/a |

| 9 | Start visit (OWNER ANSWER 2026-11-25: the doctor may start a visit from the calendar too) | Doctor only | The booking is TODAY and its status is Scheduled, Confirmed or Arrived | Opens the visit (one live visit per appointment, reused if it exists); patient moves to In chair, arrived time stamped if missing | Audit; Today queue updates for the desk | A started visit is continued, not duplicated | No | Starting a visit for a cancelled, missed, moved, finished or future booking; starting while another patient is in the chair without a warning (same rule as Today) |

Not on this page: Arrived, Send in, Done, Take payment, Skip, Pull forward, Late, Break. Those belong to Today (desk and doctor). A doctor who opens a booking that is today also sees a link "Go to Today".

## 7. States and edge cases
- Loading: last data stays; first load shows a placeholder shaped like the page, not a spinner alone.
- Refresh fails: keep the last list and say "Couldn't refresh. Showing the last list." with a retry. Never blank the page.
- Error on first load: say what failed in plain words and give a retry.
- Empty day: "No appointments" and a way to book into this day (open hours are known).
- Empty week: same, at week level.
- Closed day (Sunday, holiday, doctor's leave): say it is closed; late entries still list; booking only through "Late entry" with a reason.
- Past days: readable, actions limited (no new booking in the past, no drag to past).
- Very many rows: a clinic with one chair sees 20-40 patients a day, up to 6-8 per hour in the busiest week; tiny 15-minute blocks must stay readable (name first, time second).
- Overlapping or overbooked bookings (emergency): show both; do not hide one behind another.
- Very long name or note: shorten in the grid, show in full in details.
- Patient with no mobile: details show "No mobile".
- Someone else changed it at the same time (desk moved it while the doctor had the panel open): the action fails with a clear "This appointment was changed by someone else. Reload." and the list refreshes (version check exists).
- Offline: banner "You are offline"; reading shows last data; actions blocked with a reason.
- No permission (a role without `appointments.manage`): the page is not reachable.
- Cancelled, Missed and Moved bookings: still on the calendar but quiet, and not counted in totals.
- Phone width: a day list (full names) with a date strip; the week grid is laptop only.

## 8. Rules and constraints
- Roles: doctor and receptionist both have `appointments.manage`. Differences on this page: the receptionist sees the due AMOUNT and the "ready to bill" mark; the doctor sees only the "Due" word. The receptionist sees only that a medical alert exists, never its content. The doctor sees the last-visit line (item 17); the receptionist does not.
- Money: no amounts on the doctor's version of this page. Never show money the doctor does not need.
- Clinical: alert marks are icons with names, never colour alone; alert details only after opening the patient.
- Privacy: print list and messages carry no health information. A message to a patient never names the treatment.
- Audit: every book, move, cancel, missed is audited with who and when.
- Time: all times IST; the clinic has opening hours, lunch, holidays, slot length, one chair.
- Language: English only on screen.
- Accessibility: touch targets 44 px or more; status never by colour alone; keyboard can reach every block and action; empty cells that are too small on tablet and phone are replaced by the Book button.

## 9. Things the user must never miss
- A medical alert on a patient who is coming (before the doctor plans a long procedure).
- A booking that is an emergency or overbooked.
- Today's date and "now" position when looking at today.
- That a day is closed.
- That a cancel can be undone, for a few seconds, and what exactly was cancelled (patient name and time in the toast).

## 10. Time and freshness
- The list refreshes by itself every 60 s while the page is visible and pauses when hidden.
- The "now" line moves with server time, not the device clock.
- Statuses change from the desk during the day (Arrived, In chair, Completed); the doctor sees them within a minute without pressing anything.
- If a refresh fails, the old list stays and a short message says so.

## 11. Related pages and shared pieces
- Doctor Today (`docs/design/final/doctor_today.html`): same status words, patient chip, alert icon, navigation.
- Receptionist Today and Appointments (same page, fuller actions).
- Patient profile, tab Appointments (same "..." actions: Reschedule, Cancel, Missed).
- Book dialog and Reschedule dialog (shared).
- Messages (booked, moved, cancelled messages are created by this page's actions).
- Print day list.

## 12. Things a designer would forget (expert checks)
- Search by patient name or code across days ("when is Mrs Verma coming?") — ADDED BY AI: the first thing a patient asks on the phone.
- Jump to a date quickly (picker) and back to Today in one tap.
- A free-time view for the doctor's question "when can I fit a 90-minute root canal?" — ADDED BY AI: show where a long gap exists (open hours minus bookings).
- Patient with two bookings on one day (two sittings) must not look like a duplicate.
- Family members sharing a mobile: the code and age keep names apart.
- Walk-ins and emergencies appear without a prior booking; they look different from booked ones.
- A patient with a balance due and an alert at the same time: both marks fit in one small block.
- Doctor on break: nothing is rescheduled automatically; the page must not suggest it.
- Undo feedback after cancel; failure feedback when a save fails; unsaved choices in the Book dialog.
- Date and time wording for old people: "Friday 28 Nov" beats "28/11".

## 13. Open questions for the owner
| # | Question | Why it matters | Suggested default |
|---|---|---|---|
| 1 | Should the doctor open on the Week or the Day view? | First impression of the page | ANSWERED: Week on laptop, Day on tablet and phone |
| 2 | May the doctor start a visit from a booking here, or only from Today? | Starting a visit moves the patient to In chair | ANSWERED: from the calendar too (action 9; note: today's bookings only) |
| 3 | May the doctor book, move and cancel from here? | The permission exists | ANSWERED: yes, all three |
| 4 | Should the doctor's own leave and breaks be visible as blocked time? | Prevents promising a time the doctor is away | OPEN. Default: show closed days only; breaks stay on Today |
| 5 | Show "Last visit: what was done" in the booking details (item 17)? | Useful context, but it is new data on this page | ANSWERED: yes, one line, doctor only |

## 14. Out of scope
Queue actions (Arrived, Send in, Skip, Late, Break), payments and dues amounts, prescriptions, visit notes, patient registration, reports, multi-doctor calendars, patient self-booking (the portal is read only).
