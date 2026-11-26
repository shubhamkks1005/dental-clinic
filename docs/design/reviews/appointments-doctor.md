# Design review: Appointments calendar (doctor)

Design reviewed: HTML pasted in chat on 2026-11-26 ("code.html", title "Appointments Calendar — Align Dentistry"; not yet saved under docs/design/). Brief used: `docs/design/briefs/appointments-doctor.md`. Date: 2026-11-26.
Reviewer: design-review (logic only; looks and motion are out of scope).

## 0. The page in one line
Purpose: "Who is coming, when, and for what, today and over the coming days?"
Jobs: 1) see the week at a glance; 2) read one booking fully; 3) open the patient (and Today); 4) move or cancel with a reason and undo; 5) book into a free time; 6) see closed days; 7) print the day list. Plus action 9: start a visit from a booking that is today.

## 1. Summary
| Group | Count | Most important |
|---|---|---|
| A. Missing (blocker) | 4 | A booking cannot be opened, so jobs 2, 3, 4 and Start visit are impossible |
| B. Missing (important) | 8 | Cards show no time, length or status; no medical-alert mark; no search; no phone layout |
| C. Should not be here | 3 | Three doctors; a second New patient form with different rules |
| D. Wrong or inconsistent | 4 | Day counts include cancelled/missed; hours, lunch and "now" are hard-coded |
| E. Risky | 3 | Two bookings side by side on one chair with no Overbooked word; no clash check |
| F. Suggestions | 4 | Real "free gap" finder for long procedures; last-visit line; drag to move |

## 2. What the design already does well
- Week at a glance with a count per day, Today column marked, Sunday shown as Closed, lunch shown as a band.
- Clicking an empty slot opens booking next to the slot, with date and time filled in. That is fast for job 5.
- "Now" line on today. In chair, Completed, Cancelled and Missed bookings look different, and cancelled ones stay visible but quiet (brief section 7).
- An emergency booking has an icon and red styling. A "Due" word appears without an amount, which matches the money rule.
- Print and Today/previous/next/date picker are present (jobs 6-7, item 2).

## 3. Findings

### A. Missing (blocker)

**A1 [Blocker] A booking cannot be opened: no details, no actions**
- Where: every `.appointment-card` in the grid. The script only handles clicks on empty `.calendar-slot` cells.
- What is missing: there is no booking details view at all. That means no complaint note (item 11), mobile (13), moved-from (16) or last visit (17); no "Open patient", no "Go to Today", no Reschedule, Cancel (with reason and undo toast), Mark missed (with reason), and no Start visit (action 9, owner answer 2026-11-25).
- Why it matters: jobs 2, 3 and 4 and the owner's Start visit decision cannot happen. The page is read-only plus booking.
- What to do: clicking (or pressing Enter on) a booking opens a details panel with: name, code, time and length, visit type, status word, alert and Due marks, complaint, mobile or "No mobile", moved-from line, last-visit line (doctor only). It should have these actions, each shown only when allowed by status: Start visit (today only), Reschedule, Cancel, Mark missed, Open patient, Go to Today. Cancel and Missed open a reason dialog. After a cancel, a toast shows the patient name and time with Undo (about 10 s).
- Backend impact: EXISTS (cancel, undo-cancel, reschedule, chain, status routes in `apps/worker/src/routes/staff-appointments.ts`). Last-visit line is NEW (small query, doctor only).

**A2 [Blocker] Start visit is not designed, nor its "someone is already in the chair" warning**
- Where: Wed 10:00 card "Karan Yadav, In chair". No booking offers Start.
- Why: the owner allowed starting a visit from the calendar. One chair means Start must warn or be disabled while someone is in the chair. That is the same rule as Today (DECISIONS 2026-11-25 Part T (2)).
- What to do: in the details panel for today's Scheduled/Confirmed/Arrived bookings, add Start visit. When the chair is busy, it is disabled with the reason "Karan Yadav is in the chair."
- Backend impact: EXISTS (Part T start visit).

**A3 [Blocker] Booking never checks the rules or shows a refusal**
- Where: booking popover, `bookAppointmentAndFoldMorph()`. It always succeeds and draws the card locally. Manual date and time inputs accept anything, including the past (Mon 23 Nov 08:00 is clickable on Wed 25), lunch, after hours and beyond 90 days.
- Why: the server refuses clashes, past, closed, lunch and book-ahead (`packages/shared/src/booking-rules.ts`), and allows an override only with a reason (sets Overbooked). The design has no place to show "This time is taken" or ask for the override reason. That leaves a dead end.
- What to do: show the server's message under the time field. For soft rules, offer "Book anyway" plus a reason field. While saving, show "Booking…" and disable the button. On failure, keep the form filled in. Past cells should not be clickable.
- Backend impact: EXISTS.

**A4 [Blocker] Free duration ("Any min", 5-240, quick pills) does not match the system**
- Where: Time & Duration Adjuster, `handleManualDurationInput`, `setSlotDuration`.
- Why: the server takes duration from the chosen visit type (`appointment-book.ts`: "Duration comes from the visit type on the server"). The visit-type chips here are also hard-coded, but the clinic keeps its own visit-type list.
- What to do: see question 2. Default: visit types come from the clinic's list, and their length is shown, not typed.
- Backend impact: EXISTS if duration stays from the visit type. NEW (field + rules + clash maths) if any length is allowed.

### B. Missing (important)

**B1 [Important] Cards do not show time, length or status**
- Where: grid rows are one per hour. A 15-minute and a 60-minute booking fill the same cell, and two bookings at 10:00 and 10:30 cannot both show. Most cards have no status word (Scheduled/Confirmed). Only one card shows the patient code.
- Why: items 4, 5 and 7 are MUST. The doctor plans long procedures by length (job 1).
- What to do: place blocks by start and end (30- or 15-minute rows), and show name, then time. Show the status word on every block and the code in details.
- Backend impact: EXISTS.

**B2 [Important] No medical-alert mark; the warning icon is used for Due**
- Where: Karan Yadav card shows a red warning icon next to "Due".
- Why: item 8 and section 9 say a medical alert must never be missed. Here a reader would think the warning is about health.
- What to do: use a separate alert icon named "Medical alert", and the plain word "Due" for money. Both must fit in a small block.
- Backend impact: EXISTS (`alertFlags`, `hasDue`).

**B3 [Important] No search by patient across days** ("When is Mrs Verma coming?"). Add a search by name, code or mobile that lists that patient's upcoming bookings. Backend: patient search EXISTS; "next appointments for a patient" EXISTS (`appointment-next.ts`), so a small route may be NEW.

**B4 [Important] Missing states:** loading placeholder, "Couldn't refresh. Showing the last list." with retry, first-load error, offline banner, empty day and empty week with Book, version conflict "This appointment was changed by someone else. Reload." Backend: EXISTS.

**B5 [Important] Closed days are only "Sunday".** Holidays and late entries are not designed. A holiday column should say "Closed (holiday name)", still list late entries, and book only through "Late entry" with a reason. Backend: EXISTS (holidays, LateEntry).

**B6 [Important] No tablet or phone layout.** The 240 px rail and a `min-w-[980px]` grid cause sideways scroll at 768 and 360 px. Day view is the owner's default on tablet and phone (brief Q1). Phone needs a day list with a date strip (the app has `PhoneDayList`, `DateStrip`). Touch targets in the popover are 24-32 px (rule: 44).

**B7 [Important] Not kept fresh.** "Now 10:45 AM" and the counts are fixed text, and after booking the counts are hard-coded to 15 and 5. The list must refresh every 60 s, the now line follows server time, and counts are computed.

**B8 [Important] The booking popover closes silently and loses data.** A click on the backdrop or Cancel throws away a filled-in form. Ask "Discard this booking?" when something was changed. "Save only" uses a browser `alert()`.

### C. Should not be on this page

**C1 [Blocker] Three doctors (filter bar, "Assign Doctor", doctor badge on every card)**
- Why: the clinic is one doctor, one chair (PRODUCT_DESIGN_CONTEXT). The brief lists multi-doctor calendars as out of scope. Appointments have no doctor field. The badges take space that the time and status words need.
- What to do: remove the doctor filter, Assign Doctor and doctor badges. See question 1.
- Backend impact: none if removed; NEW (doctor table, column, clash per doctor, messages) if kept.

**C2 [Important] A second "New patient" form inside the popover, with different rules**
- Where: tab "+ New Patient".
- What is wrong: guardian only under 10 (app rule: under 18, `patient-guardian.ts`); gender pre-set to Male (rule Q1.8: no default); patient code shown before saving (the server gives it; two desks would see the same number); no duplicate check ("Same person? Open existing / Save as new"); field order differs from Q2.9.
- Why: one rule in one place. Registration is out of this brief's scope, and the app already has New patient with "Save and book appointment".
- What to do: see question 3. Default: "+ New patient" opens the app's existing form. "Save and book" comes back to this slot with the patient chosen.
- Backend impact: EXISTS.

**C3 [Important] Print prints the whole screen**
- Where: `onclick="window.print()"`.
- Why: the paper would carry complaint and clinical words ("Severe Tooth Fracture", "RCT 36") and the side menu. The day list print is names, times and visit type only.
- What to do: Print uses the existing day-list print for the chosen day. Backend: EXISTS.

### D. Wrong or inconsistent

- **D1** Day counts disagree with the grid and count cancelled/missed bookings. Example: Wed badge "4 booked" with 6 cards, one Missed. Thu says "2 booked" with 1 card. The rule is that cancelled, missed and moved bookings are not counted.
- **D2** Hours 08:00-20:00, lunch 13:00-14:00 and Sunday closed are fixed in the page. They must come from the clinic settings (`DayWindow`).
- **D3** "Missed (No-show)" should be the app word "Missed". Use `APPOINTMENT_STATUS_LABEL` for all status words.
- **D4** "1 chair (Room 1)" and "Room 1" in the popover add no information for a one-chair clinic. Drop them or keep one quiet mention.

### E. Risky

- **E1 [Blocker] Two bookings side by side on one chair** (Wed 11:00, Meera Iyer and Vikram Patel) with no "Overbooked" word. One chair means this can only be an override with a reason. The block must say "Emergency" and "Overbooked" in words (item 12).
- **E2 [Important] Two people at once.** The desk moves a booking while the doctor has it open. That needs the conflict message (B4).
- **E3 [Important] A book click can fire twice** (the button plus the extra `addEventListener` on `btn-top-book` and on every slot both call `openBookingModal`). In the app: one handler, button disabled while saving.

### F. Suggestions (extra logic)

- **F1** Thu "Free gaps" is a good idea: make it real. The question is "where can I fit 90 min?": choose a length and highlight gaps that fit. Data EXISTS (`/appointments/slots`); small UI cost.
- **F2** Last-visit line in details, doctor only (owner answered yes). Small NEW query.
- **F3** Drag a block to move it on laptop, with a confirm ("Move Karan Yadav to Thu 26 Nov, 4:00 PM?"). Reschedule EXISTS; medium UI cost.
- **F4** Keyboard: arrow keys move between blocks, Enter opens one, N books at the focused slot.

## 4. States and flows not designed
Loading, refresh failed, first-load error, offline, empty day, empty week, holiday, late entry, past day (actions limited), version conflict, server refusal on book, long name or note, patient with no mobile, two bookings for one patient on one day, walk-in look, phone and tablet layouts. Booking details, reschedule, cancel, missed and undo are not designed at all.

## 5. Questions for the owner
| # | Question | Why | Suggested default | Owner's answer (2026-11-26) |
|---|---|---|---|---|
| 1 | Remove the three-doctor parts (filter, Assign Doctor, badges)? | One doctor, one chair; no doctor field | Remove | KEEP. Doctors can be added; the list comes from the doctors on record. Receptionist sees all doctors, a doctor sees only their own. Same page for desk and doctor. |
| 1b | Chairs with several doctors? | Decides whether two doctors can work at once | Each doctor own chair | Each doctor has their own chair. |
| 2 | How is a booking's length set? | Server takes it from the visit type | From the visit type; no free minutes | ANY MINUTES (visit type gives the default). Clashes are allowed: avoiding them is the desk's job. |
| 3 | What does "+ New patient" in the popover do? | A second form breaks the guardian, gender and duplicate rules | Open the app's existing New patient form, then return | Keep the tab in the same look, adjusted to the app's rules. Duplicate = name AND mobile both match (not name alone). |
| 4 | Send this design back to the designer, or save it as final now? | design-plan needs a final file | Back to the designer with this review | Back to the designer. |
| 5 | Brief Q4: show the doctor's leave and breaks as blocked time? | Prevents promising a time when the doctor is away | Closed days only; breaks stay on Today | Leave yes ("On leave" for that doctor), breaks no (Today only). |

### What the answers change in the findings
- **C1 is withdrawn.** Doctors stay. The design should still add: the doctor list from records (not three fixed names); a doctor sees only their own bookings, so the doctor filter is for the receptionist only; a doctor's leave column/day shows "On leave". Backend: NEW and large (doctor list, `doctor_id` and per-doctor chair on appointments, the "doctor sees own" rule in the list routes, per-doctor slots and clash, Today queue per doctor, messages naming the doctor). That needs its own plan before design-apply, and PRODUCT_DESIGN_CONTEXT must be updated.
- **A4 is withdrawn.** Any length is allowed. Backend: NEW (book and reschedule take `endMin` or duration; the visit type gives the default).
- **E1 and the clash part of A3 change.** Overlaps are allowed without a reason and are shown side by side. A3 still stands for past time, closed day, holiday, lunch and the 90-day limit, plus the save error and "Booking…" state. Backend: FIX (the server's clash refusal becomes allowed; the overbook override reason is no longer needed for a clash).
- **C2 changes.** Keep the tab, but use the app's rules: guardian under 18, no default gender, code given after save, duplicate check on name + mobile with "Same person? Open existing / Save as new patient". Backend: EXISTS, except the duplicate match rule, which must be checked against the current one (FIX if it differs).

## 6. Backend and data summary
- EXISTS: day and range lists, book, walk-in, cancel and undo, reschedule and chain, status, slots, holidays, book-ahead and closed-day rules, alert and Due flags, patient search, New patient form, day-list print.
- FIX FIRST: none known.
- NEW (small): last-visit line for the details panel; maybe "this patient's upcoming bookings" for search.
- NEW (large, only if the owner chooses): multiple doctors; free-minute durations.

## 7. Next step
The designer fixes the design (A1-A4, B1-B2, C1-C3, E1 first), and the owner puts the final file in `docs/design/final/`. Then run design-plan on it.
