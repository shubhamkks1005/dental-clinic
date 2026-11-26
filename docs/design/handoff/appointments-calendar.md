# Handoff: appointments calendar (docs/design/final/appointments_calendar.html)

Status: BACKEND DONE (2026-11-26, commits f664c15, f3f5ece and the docs commit; UI P4-P8 next session). Migration 0066 written, NOT applied.
Written: 2026-11-26. Plan by: design-plan. Next skill: design-apply.
Inputs read: the whole HTML (style lines 76-123, markup 124-803, script 804-1602), brief `docs/design/briefs/appointments-doctor.md`, review `docs/design/reviews/appointments-doctor.md` (owner answers 2026-11-26 WIN over the HTML), AGENTS.md, RUN_PROMPT.md, final/README.md, handoff/INDEX.md, HANDOFF.md, the real code named below.

## 0. How to read this file
design-apply reads ONLY this file plus the HTML. Update the status line and checkboxes as work is done. Add a line to "Log" after every step.
Owner answers already decided (review, 2026-11-26): **multiple doctors** (list from staff records; receptionist sees all, a doctor sees only their own; same page for both), **each doctor has their own chair**, **any length** (visit type gives the default), **clashes allowed** (shown side by side, no reason needed), **"+ New patient" tab kept** in the popover but on the app's rules, **duplicate = name AND mobile**, **doctor leave shown ("On leave")**, breaks stay on Today only.
Owner answers to this plan (2026-11-26, section 7): **every doctor has their own Today page** showing only their own patients; a doctor sees and books ONLY their own appointments; the receptionist sees and books for every doctor. **Breaks per doctor**: the desk sees "Dr X on break" only on its main Today page, as a warning; nothing is blocked (the desk may still send a patient in). **Approvals go to the patient's doctor.** **Each doctor has their own prescription letterhead**, which each doctor edits in Settings. **Duplicates**: warn on (first name + mobile) and on (mobile alone), never block (one mobile can belong to several family members). **Phone layout parked.** **Search in the calendar** (respects the selected doctors). **No "Free gaps" pill.** The owner adds doctors himself through Settings > Staff; the agent adds NO doctor to seeds. The right-side booking details panel stays, in the new theme.
The final HTML was NOT redrawn after the review: it still shows the reviewed mistakes. Where it does, section 6b says what the app does instead.

## 1. The screen in one paragraph
`/app/appointments` (nav "Appointments"), used by the doctor and the receptionist (`appointments.manage`). Laptop: a week grid Mon-Sun with time rows, day headers with counts, the "now" line, lunch band, closed days; a doctor filter bar (receptionist only); clicking an empty time opens a **side-anchored booking popover** next to the slot (tabs "Slot Selection" / "+ New Patient", doctor choice, visit-type chips, date + start time + any duration, note), and booking **folds the popover into the slot**. It replaces the look of `apps/web/src/features/appointments/` (AppointmentsScreen, WeekView, DayView, QuickBookDialog, DayDetails, PhoneDayList). The booking details panel (DayDetails + AppointmentActions: Start visit, Reschedule, Cancel, Missed, Open patient, Go to Today) EXISTS in the app and is not in the HTML: it stays, restyled with the HTML tokens.

## 2. States (what can be on screen)
| Area | State | What shows | HTML lines | Sub-point |
|---|---|---|---|---|
| Header | Week | "Week: 23 Nov – 29 Nov 2026 · N appointments booked" | 203-205 | P5.1.1 |
| Header | Day (tablet/phone default, or toggle) | date + "N booked" | 227-234 | P5.1.1 |
| Header | Role chip | "Doctor View" / desk: "Desk view" | 201, 157 | P5.1.2 |
| Filter bar | Receptionist | doctor chips with colour dot, name, specialty; All / Clear | 247 | P5.2.1 |
| Filter bar | Doctor | hidden (doctor sees only own) | (owner answer) | P5.2.2 |
| Filter bar | All cleared | grid shows no cards + "No doctor chosen. Choose All." | 1579-1601 | P5.2.3 |
| Day head | Normal | weekday, date, "N booked" pill | 257-290 | P5.3.1 |
| Day head | Today | tinted, top border, "TODAY" tag, filled pill | 268-275 | P5.3.1 |
| Day head | Free gaps | green pill "N booked · Free gaps" | 279 | P5.3.2 (Q8) |
| Day head | Closed / holiday | grey, "Closed" (holiday: "Closed · <name>") | 291-295 | P5.3.3 |
| Day head | Doctor on leave | "Dr X on leave" line under the pill | (owner answer) | P5.3.4 |
| Grid cell | Empty bookable | hover tint, pointer | 303 | P5.4.1 |
| Grid cell | Empty past / closed / leave | not clickable, "Closed" text in closed col | 309 | P5.4.2 |
| Grid cell | Active (popover open) | 2 px dashed outline, tint | 95-100 | P5.4.3 |
| Grid cell | Live preview block | block sized by duration, glow pulse | 102-113, 1133-1168 | P5.4.4 |
| Card | Scheduled / Confirmed | name, visit type, doctor badge, status word | 315, 351 | P5.5.1 |
| Card | Arrived / In chair | warning border + ring, "In chair" pill, code | 337 | P5.5.1 |
| Card | Completed | green tint, "Completed" pill | 319 | P5.5.1 |
| Card | Cancelled | 60 % opacity, line-through name, "Cancelled" | 348 | P5.5.2 |
| Card | Missed | 80 % opacity, "Missed" (HTML says "Missed (No-show)") | 424 | P5.5.2 |
| Card | Moved | like Cancelled, word "Moved" | (brief) | P5.5.2 |
| Card | Emergency | red left border, emergency icon, red name | 351 (2nd card) | P5.5.3 |
| Card | Medical alert / Due | alert icon "Medical alert" + word "Due" (HTML wrongly uses warning icon for Due) | 337 | P5.5.4 |
| Card | Clash (2+ at once) | side by side, equal lanes | 349-352 | P5.5.5 |
| Card | Just booked | pulse "dock-pulse-confirmed" | 120-122, 1219 | P6.3.3 |
| Now line | Today only | red line + dot + "NOW 10:45 AM" | 333-336 | P5.6.1 |
| Lunch | Open day with lunch | striped band, coffee icon, "Clinic Lunch Break (1:00 PM – 2:00 PM)" | 383-391 | P5.6.2 |
| Popover | Closed | nothing | 483 (HTML ships it open: L1) | P5.7.1 |
| Popover | Open, Slot Selection tab | patient box or search, doctor radios, chips, time adjuster, note | 508-646 | P5.7.x |
| Popover | Patient chosen / not chosen | docked box with Change / search input | 555-572 | P5.7.3 |
| Popover | New Patient tab | name, mobile, No mobile, gender, DOB/age, guardian, more details | 647-776 | P5.8.x |
| Popover | Guardian shown | age under 18 (HTML: under 10, L12) | 714-743 | P5.8.4 |
| Popover | Saving | "Booking…" button disabled | (review A3) | P5.7.8 |
| Popover | Server refused | message under time field; soft rule -> "Book anyway" + reason | (review A3) | P5.7.9 |
| Popover | Duplicate found | "Same person? Open existing / Save as new patient" | (owner Q3) | P5.8.6 |
| Popover | Unsaved close | "Discard this booking?" | (review B8) | P5.7.10 |
| Toast | Booked | "Appointment confirmed and slotted on calendar" | 1253-1268 | P6.3.4 |
| Toast | Patient saved | "<code> Patient Registered · <name> · Proceeding to Slot" | 1451-1460 | P6.4.5 |
| Details panel | Booking opened | existing DayDetails, restyled | (not in HTML) | P5.9.1 |
| Page | Loading first | skeleton grid shape | (brief §7) | P7.2.1 |
| Page | Refresh failed | last data + "Couldn't refresh. Showing the last list." + Retry | (brief §7) | P7.2.2 |
| Page | First load error | plain sentence + Retry | (brief §7) | P7.2.3 |
| Page | Empty week / day | "No appointments" + Book | (brief §7) | P7.2.4 |
| Page | Offline | banner, actions blocked with reason | (brief §7) | P7.2.5 |
| Page | Version conflict | "This appointment was changed by someone else. Reload." | (brief §7) | P7.2.6 |

## 3. Motion inventory (from the HTML style and script)
| # | Animation | Trigger | Element | Duration | Delay | Easing | HTML lines | Measure how | Sub-point |
|---|---|---|---|---|---|---|---|---|---|
| M1 | Popover enter: scale .96 + translateY 6px -> 1/0 | open | `.bk-popover` | transform 200 ms, opacity 180 ms | 0 (next frame) | cubic-bezier(0.16,1,0.3,1) / ease | 90-93, 1023-1029 | rAF sampler: transform scale >= 8 frames to 1 | P6.1.1 |
| M2 | Backdrop fade in/out (15 % on-surface) | open / close / book | backdrop | 200 ms | 0 | default ease | 485 | opacity samples | P6.1.2 |
| M3 | Popover exit: to scale .96 + 6px, opacity 0, then unmount | close | popover | 180 ms | unmount at 180 ms | as M1 | 1035-1062 | unmount time 180 ± 36 ms | P6.1.3 |
| M4 | Slot active outline | open | target cell | instant | 0 | none | 95-100 | class present | P5.4.3 |
| M5 | Live preview block height follows duration | duration / chip / time change | preview block | height 220 ms; opacity 200; border 200 | 0 | cubic-bezier(0.4,0,0.2,1) | 102-105, 1145-1168 | height samples, >= 8 frames | P6.2.1 |
| M6 | Preview glow pulse | while popover open | preview block | 2 s loop | 0 | ease-in-out | 107-113 | animation name present; off under reduced motion | P6.2.2 |
| M7 | Fold morph: popover translates + scales to the slot, radius 12 -> 8 px, opacity -> .9 | Book success | popover | transform 500 ms, opacity 480 ms, radius 450 ms | after server OK (L16) | cubic-bezier(0.2,0.9,0.3,1) | 1193-1209 | FLIP sampler, end rect within 8 px of slot | P6.3.1 |
| M8 | Popover hidden after morph | morph end | wrapper | — | 510 ms | — | 1236-1251 | unmount at 510 ± 100 ms | P6.3.2 |
| M9 | New card pulse (scale .96 -> 1.02 -> 1 + glow) | card appears | new card | 600 ms | 0 (with M7) | cubic-bezier(0.2,0.8,0.2,1) | 115-122, 1219 | scale samples | P6.3.3 |
| M10 | Toast in / out (translateY -8 px -> 0, opacity) | after morph / save | toast | 300 ms in, visible 3000 ms, 300 ms out | 510 ms | default | 487, 1253-1268 | visible span 3000 ± 600 ms | P6.3.4 |
| M11 | Tab pill slides | tab switch | tab indicator | 400 ms | 0 | ease-in-out | 532, 1297 | translateX samples | P6.4.1 |
| M12 | Tab text colour | tab switch | tab buttons | 400 ms | 0 | ease (colour) | 533-539 | computed colour mid-way | P6.4.1 |
| M13 | Panel slider (two panels in a 200 % track) | tab switch | track | 450 ms | 0 | ease-in-out | 545, 1296 | translateX samples, no page scroll | P6.4.2 |
| M14 | Footer actions cross-fade | tab switch | footer action groups | 300 ms | 0 | ease-in-out | 784, 791 | opacity samples | P6.4.3 |
| M15 | Input highlight ring (name, mobile) | Save & Book success | 2 inputs | 350 ms | 0, removed at 320 ms | ease | 82-87, 1429 | class on/off times | P6.4.4 |
| M16 | Flyer lift (translateY -14, scale 1.02, shadow) | Save & Book success | flyer (copy of the name+mobile box) | 320 ms | 0 | cubic-bezier(0.4,0,0.2,1) | 1432-1449 | transform samples | P6.4.4 |
| M17 | Slide back to Slot Selection (M11+M13+M14) | Save & Book | track, pill, footer | 450/400/300 ms | 320 ms | as M11-M14 | 1462-1486 | start time 320 ± 60 ms | P6.4.4 |
| M18 | Flyer docks onto the selected-patient box (left/top/width/height/padding/shadow) | Save & Book | flyer | 260 ms | 760 ms | cubic-bezier(0.4,0,0.2,1) | 1489-1507 | end rect within 4 px of box | P6.4.4 |
| M19 | "Change" fades in, input unlocked; flyer replaced by the real box (L18) | Save & Book | Change button | 200 ms | 1050 ms | default | 505, 1509-1515 | opacity; flyer gone after 1050 ms | P6.4.4 |
| M20 | Save toast in, out at 3500 ms | Save & Book | toast | 300 / 300 ms | 0 / 3500 ms | default | 1451-1460, 1517-1524 | visible span | P6.4.5 |
| M21 | Book buttons press scale .95 | :active | Book, Save & Book | 150 ms | 0 | default | 785, 795 | computed transform on press | P6.5.1 |
| M22 | Hover colours on slots, buttons, chips | hover | many | 150 ms | 0 | default | throughout | computed style | P6.5.1 |
| M23 | "More details" chevron rotates 180° | details open | chevron | 150 ms | 0 | default | 751 | transform | P6.5.2 |
| M24 | Popover re-anchors on resize | window resize | popover | instant | 0 | — | 1549-1554 | stays inside 12 px margins | P5.7.2 |

All motion off (end state at once) under `prefers-reduced-motion: reduce` (P7.3.1).

## 4. Data and actions
| Item | In HTML | App today | Verdict | Detail | Sub-point |
|---|---|---|---|---|---|
| Week list | static cards | `GET /appointments/range` (one request, `useWeek.ts`) | EXISTS | add doctor fields, doctor filter on server for doctor role | P1.4.1, P2.1.1 |
| Day list | Day toggle | `GET /appointments?date=` | EXISTS | same doctor rule | P2.1.1 |
| Doctor list (name, specialty, colour) | 3 fixed doctors | users with role doctor; no specialty, no colour | NEW | `GET /api/staff/doctors` (active doctors: id, name, specialty, colourIndex); `users.specialty` column; colour = fixed palette by doctor order | P1.2.1, P1.3.1, P2.1.2 |
| Doctor of a booking | `data-doctor`, badge | no column | NEW | `appointments.doctor_id` (+ backfill Q2), chair = the doctor's chair | P1.2.1, P1.3.2 |
| Doctor sees only own | "Doctor View" | sees all | NEW | server filter by `ctx.userId` when role = doctor | P1.4.1 |
| Doctor leave | not drawn (owner: yes) | none | NEW | table `doctor_leaves` + editor (Q4) | P1.2.1, P1.3.4, P5.3.4 |
| Holidays, hours, lunch, closed | hard-coded 8-8, lunch 1-2, Sun | `DayWindow` in day reply | EXISTS | use it (L5) | P5.6.2 |
| Any duration | 5-240 min, step 5 | duration from visit type only (`appointments-book.ts:84`) | FIX FIRST | `durationMin` optional in book + reschedule; default from visit type | P1.1.1, P1.3.3 |
| Clashes allowed | side by side | `insertAppointmentIfFree` refuses overlap | FIX FIRST | allow overlap; refuse only an exact repeat (same patient, doctor, day, start, still busy) | P1.1.2, P1.3.3 |
| Undo cancel | (toast Undo exists) | needs the time free (`appointments-undo-cancel.ts:51`) | FIX FIRST | drop the free check (clashes allowed) | P1.3.5 |
| Soft rules (past, closed, lunch, 90 days) | none | `bookingRuleViolations` + overrideReason | EXISTS | show refusal + "Book anyway" + reason (late entry) | P5.7.9 |
| Leave as soft rule | — | — | NEW | booking on a doctor's leave day = soft rule "Dr X is on leave" | P1.1.3 |
| Visit-type chips with minutes | 6 fixed chips | `getList("visit_types")` (`data.minutes`) | EXISTS | labels "Consultation (30m)" from list | P5.7.5 |
| Book | local only | `POST /appointments` | EXISTS + FIX | add `doctorId`, `durationMin` | P1.1.1, P2.1.3 |
| Reschedule | — | `POST /:id/reschedule`, QuickBookDialog reschedule mode | EXISTS + FIX | popover in move mode; `doctorId`, `durationMin` | P2.1.3, P5.7.11 |
| Cancel / Undo / Missed / Start visit / Open patient / Go to Today | not drawn | AppointmentActions, DayDetails | EXISTS | keep, restyle | P5.9.1 |
| Start visit "someone in chair" | — | chair check is per day | FIX FIRST | per doctor (their own chair) | P1.3.6 |
| Patient search in popover | input | `searchPatients` via QuickBookPatient | EXISTS | restyle as docked box | P5.7.3 |
| New patient save | local, fake code | `POST /api/staff/patients` (NewPatientForm) | EXISTS | reuse its schema and rules; code from server | P5.8.1 |
| Duplicate check | none | `POST /patients/duplicate-check`, 3 reasons (`patient-duplicates.ts:110-131`) | FIX FIRST (Q5) | owner: name AND mobile | P1.1.4, P1.3.7 |
| Medical alert / restricted / Due | warning icon next to Due | `alertFlags`, `hasDue` in reply | EXISTS | separate icon (L7) | P5.5.4 |
| Last visit line (doctor only) | — | none | NEW | `GET /patients/:id/last-visit` (doctor only) | P1.4.3, P2.1.4, P5.9.2 |
| Print list | `window.print()` | `/app/print/day?date=` | EXISTS + FIX | print the shown day; add Doctor column; doctor prints own | P2.1.5, P5.1.3 |
| Free gaps | text on Thu | `findFreeSlots` | EXISTS (rule NEW, Q8) | pure `hasFreeGap(day, minMinutes)` | P1.1.5, P5.3.2 |
| "Now" line | fixed 10:45 | `serverNow` in reply | EXISTS | from server time | P5.6.1 |
| Counts | fixed, include cancelled | `weekBooked` (GONE excluded) | EXISTS | per filter (L3) | P5.3.1 |
| Refresh every 60 s | — | `useVisibleInterval(AUTO_REFRESH_MS)` | EXISTS | keep | P7.2.2 |

## 4b. Also used on (shared pieces)
| Piece | Other pages / files | Apply there too? | Note |
|---|---|---|---|
| Sidebar (nav rail, 240 px) | all pages (`ui/shell`) | No change | Same rail as doctor_today.html (already built, Part T). The "Doctor" chip on the Appointments item (HTML 157) is NOT copied: the rail is shared and no other final page shows it. |
| Booking popover (replaces QuickBookDialog) | Today "Book", patient profile "Book appointment" (`?book=1&patient=`), NewPatientScreen "Book appointment", AppointmentActions "Reschedule" (Today rows, patient Appointments tab) | YES | One component: `features/appointments/book/BookPopover.tsx`, anchored when opened from a slot, centred (HTML 911-914) when opened from a button. QuickBookDialog is deleted after all callers move (P7.4.1). |
| Patient duplicate rule (name AND mobile) | NewPatientForm (`features/patients`), PatientEditForm | YES | One rule in `packages/shared` (Q5). |
| New patient fields in the popover | NewPatientForm | YES (same schema `patient-create.ts`, guardian under 18, no gender default) | The popover tab is a compact layout of the same fields; it imports the shared rules, never copies them. |
| Status words and card tones | Today rows, doctor Today, patient tab | No change to words (`APPOINTMENT_STATUS_LABEL`) | The card tones are scoped to `.cal-page`. |
| Doctor badge + colour | NEW, used by calendar, print day list, details panel | YES there | `ui/DoctorBadge.tsx` (name + dot, never colour alone). |
| Toast | app `useToast` | No change | Calendar passes the HTML wording. |
| Day list print | Today "Print lists" | YES: doctor column | `PrintDayListScreen.tsx`. |
| Doctor Today queue, breaks, approvals | doctor_today (FINAL), desk Today | YES (Q1, changed 2026-11-26) | Same look as doctor_today.html; only the DATA becomes per doctor (P1.5, P5.11). No layout change on that final page except the desk's break notice wording. |
| Prescription letterhead doctor | prescriptions print, certificates print, Settings > Clinic and doctor | YES (Q1, changed 2026-11-26) | Letterhead uses the visit's doctor profile (P1.6, P5.12). PrintLayout/PrescriptionBody (doctor_visit FINAL) keep their layout; only the doctor lines' source changes. |
| Calendar search box | calendar only (owner) | No | Not added to Patients or Today. |

## 5. Work plan (Phases -> Sub-phases -> Sub-points; backend first, then UI)

### P1 BACKEND: doctors on bookings, any length, clashes allowed (shared rules, migration, repos)
#### P1.1 Shared types and pure rules (packages/shared)
- [x] P1.1.1 `packages/shared/src/appointment-book.ts` `bookAppointmentSchema`: add `doctorId: z.string().trim().min(1,"Choose a doctor.").max(40)` and `durationMin: z.number().int().min(5,"At least 5 minutes.").max(240,"At most 240 minutes.").multipleOf(5,"Use steps of 5 minutes.").optional()`. Same two fields in `appointment-reschedule.ts` (both optional there: keep old doctor and length when absent). Update the file comment ("Duration comes from the visit type" -> "visit type gives the default"). Why: owner answer 2 (any minutes), HTML 617 (min 5 max 240 step 5). Check: `appointment-book.test.ts` new cases 4, 5, 245, 37 refused; 30 ok; missing doctor refused.
- [x] P1.1.2 `packages/shared/src/appointments.ts`: replace the "One chair" comment; add `chairForDoctor(doctorId) = "doc:" + doctorId` (each doctor own chair, owner 1b). Keep `DEFAULT_CHAIR_ID` for old rows. Check: unit test.
- [x] P1.1.3 `packages/shared/src/booking-rules.ts` `bookingRuleViolations`: new optional input `leaveDays: string[]` and `doctorName`; violation code `doctor_leave`, message "Dr <name> is on leave that day." (soft, overridable like closed day). Why: owner answer 5. Check: booking-rules.test.ts.
- [x] P1.1.4 `packages/shared/src/patient-duplicate-rule.ts` (new, pure) (changed 2026-11-26: Q5 answer): `duplicateReason(probe,row)` -> `"first_name_mobile"` when the FIRST name word is equal (case, extra spaces, dots ignored) AND a mobile matches (primary or secondary either side); else `"mobile_only"` when only a mobile matches; else null. No name+age rule. Warning only, never blocks. Used by P1.3.7. Why: Q5, L20. Check: test "Aakash Verma"/"aakash K" same mobile = first_name_mobile; "Ritu Verma" same mobile = mobile_only; same name other mobile = null.
- [ ] ~~P1.1.5 `free-gaps.ts` hasFreeGap~~ (dropped 2026-11-26: Q8, owner does not want the Free gaps pill; the desk judges gaps by eye).
- [x] P1.1.6 `packages/shared/src/clash-lanes.ts` (new): `clashLanes(rows)` -> `{id, lane, lanes}` per row: overlapping busy rows of one day share the width in equal lanes (HTML 351: two lanes 50/50, gap 6 px). Gone rows (cancelled/missed/moved) take a lane only if they overlap nothing busy. Check: test 1, 2, 3 overlapping, chain A-B-C where A and C do not touch (2 lanes).
- [x] P1.1.7 `packages/shared/src/doctor.ts` (new): `Doctor = {id,name,specialty:string|null,colourIndex:number}`, `DOCTOR_COLOURS` (6 fixed accessible pairs; first three from HTML 1561-1565: #054D61, #5E35B1, #C25E00 on #D0E6F0, #EDE7F6, #FFF3E0), `doctorShortName("Dr. Arvind Mehta") -> "Dr. Mehta"`, `doctorLeaveSchema` (date, optional note 100). Check: test.
- [x] P1.1.8 `packages/shared/src/day-view.ts` `AppointmentDayReply`: add `leaves: {doctorId,doctorName}[]` per day. Check: types compile.
#### P1.2 Migration 0066 (owner applies; never applied by the agent)
- [x] P1.2.1 `packages/db/migrations/0066_doctors_on_appointments.sql`: (a) `ALTER TABLE appointments ADD COLUMN doctor_id TEXT` (nullable for old rows); backfill per Q2 (default: `UPDATE appointments SET doctor_id = (SELECT id FROM users WHERE role='doctor' AND status='active' ORDER BY created_at LIMIT 1) WHERE doctor_id IS NULL`), `chair_id` of backfilled rows stays "1"; index `appointments_doctor_day_start_idx (doctor_id, date_local, start_min)`. (b) ~~`users.specialty`~~ (changed 2026-11-26: specialty lives in the doctor profile, P1.6.1). (c) table `doctor_leaves (standard columns, doctor_id NOT NULL, date_local NOT NULL GLOB check, note TEXT)`, unique live (doctor_id, date_local) where deleted_at IS NULL; growth cap: retention rule purges rows older than 2 years (`repos/retention.ts`). (d) per-doctor Today (P1.5): `DROP INDEX doctor_breaks_one_open_uidx`; `ALTER TABLE doctor_breaks ADD COLUMN doctor_id TEXT` (backfill = the user who started it, `created_by`); new `CREATE UNIQUE INDEX doctor_breaks_one_open_uidx ON doctor_breaks (doctor_id, date_local) WHERE ended_at IS NULL AND deleted_at IS NULL`; `ALTER TABLE approval_requests ADD COLUMN doctor_id TEXT` (backfill from the appointment's doctor, else first doctor) + index `(doctor_id, status)`; `appointments_day_queue_idx` replaced by `(doctor_id, date_local, queue_order)`. (e) table `doctor_profiles` (standard columns, `user_id` unique, `name_on_rx`, `qualifications`, `speciality`, `registration_no`, `extra_line`, all short text with length checks); seed one row for the first active doctor copied from settings `doctor.name`, `doctor.qualifications`, `doctor.speciality`, `doctor.registration_no`, `doctor.extra_line` (the settings rows stay, unused, for history). Then `pnpm db:lock`. Schemas: `schema/appointments.ts` (doctorId), new `schema/doctor-leaves.ts`, `schema/doctor-profiles.ts`, `schema/doctor-breaks.ts` and `schema/approval-requests.ts` (doctorId). Check: migration test applies on a copy of the seed DB; EXPLAIN uses the new index (P3.1.2).
#### P1.3 Repos (packages/db), one `db.batch` per write, version-checked, audit row
- [x] P1.3.1 `packages/db/src/repos/doctors.ts` (new): `listActive()` -> Doctor[] ordered by created_at (colourIndex = position mod 6; specialty from `doctor_profiles.speciality`, null when no profile); `requireActiveDoctor(id)` (NotFound "That doctor"). (changed 2026-11-26: specialty comes from the doctor profile, not users.) Check: doctors.test.ts (a doctor added in Settings > Staff appears at once, with no profile).
- [x] P1.3.2 `appointments-book.ts`, `appointments-reschedule.ts`, `appointments-walk-in.ts`: take `doctorId` (walk-in: the doctor chosen in the walk-in dialog; default the only active doctor), set `doctorId` and `chairId = chairForDoctor(doctorId)`, `endMin = startMin + (durationMin ?? snap.durationMin)`, audit `after` gets `doctorId`, `durationMin`. Move the duplicated `loadVisitType` into one helper `repos/visit-type-load.ts` (it is copied in book and reschedule today). Check: book/reschedule tests updated.
- [x] P1.3.3 `appointment-insert.ts`: replace overlap guard with `insertAppointmentUnlessRepeat` = NOT EXISTS (same patient_id, doctor_id, date_local, start_min, busy status). Keep `insertAppointmentAllowingOverlap` for walk-in emergencies. Error text on repeat: "This patient is already booked at that time." Why: owner answer 2 (clashes allowed), L21 (double click must not make two rows). Check: test "50 parallel same patient same slot -> one row"; "two patients same slot same doctor -> two rows".
- [x] P1.3.4 `packages/db/src/repos/doctor-leaves.ts` (new): `list(from,to)`, `add(doctorId,date,note)`, `remove(id,version)`; who may: per Q4 (default: a doctor for self, settings.write for anyone). Audit each. Check: tests incl. duplicate day refused, receptionist refused (default).
- [x] P1.3.5 `appointments-undo-cancel.ts:44-55`: drop the "time still free" NOT EXISTS; keep the 120 s window and version check. Comment why (clashes allowed 2026-11-26). Check: test "undo when another booking took the time -> back on".
- [x] P1.3.6 Start visit / in_chair: `appointments-status.ts` and `doctor-breaks.ts:68-92`: the "someone is in the chair" check filters by the same `doctor_id` (rows with NULL doctor count for everyone). Check: test two doctors each with a patient in chair.
- [x] P1.3.7 `patient-duplicates.ts:110-131` `matchReason` (changed 2026-11-26: Q5): use `duplicateReason` (P1.1.4); reasons become `first_name_mobile` and `mobile_only`; `name_age` removed; candidates come only from the mobile index (name-word candidates no longer needed). Rank first_name_mobile before mobile_only; cap stays 3 but an exact first_name_mobile is never cut. Never blocks save. Check: patient-duplicates.test.ts rewritten; New patient page e2e (data-rules.spec) updated.
#### P1.4 Domain (apps/worker/src/domain)
- [x] P1.4.1 `domain/appointments-list.ts` `listDayAppointments` / `listRangeAppointments`: role doctor -> `WHERE doctor_id = ctx.userId OR doctor_id IS NULL`; receptionist -> all. Each row gets `doctorId`; each day gets `leaves` (one extra query for the range, `doctor_leaves` IN date range). Check: queries per request before -> after (P3.1.1).
- [x] P1.4.2 `domain/appointments.ts` book/reschedule: load leave days for the doctor + date (one query), pass to `bookingRuleViolations` (P1.1.3).
- [x] P1.4.3 `domain/patient-last-visit.ts` (new): latest `visits` row with status final for the patient: date + procedure labels (max 3, joined ", "). Doctor only (clinical). Audit view like other clinical reads. Check: test receptionist 403.
- [x] P1.4.4 `domain/appointments-search.ts` (new) (added 2026-11-26: Q7): `searchUpcomingAppointments(q, doctorIds)`: patient search (existing patient search index: name words, code, mobile; max 20 patients) then their bookings from today on with busy status (one query, `patient_id IN (...)` <= 20, plus `doctor_id IN (...)` <= 90), max 30 rows sorted by date/time: patient name, code, date, start, doctor name, visit type, status. Doctor role: `doctorIds` forced to self. Check: test (doctor B's bookings never in doctor A's results; cancelled not listed; 2 queries).

#### P1.5 Per-doctor Today, breaks, approvals (added 2026-11-26: Q1)
- [x] P1.5.1 `domain/appointments-list.ts` day reply used by Today: doctor role -> own rows only (same rule as P1.4.1); receptionist -> all rows, each with `doctorId`. `doctor-model.ts`/queue rules work on the doctor's own rows only. Check: staff-appointments-day.test (doctor A's Today has no B rows).
- [x] P1.5.2 Queue order per doctor: `appointments-queue-plan.ts` loads `WHERE date_local = ? AND doctor_id = ?` (the booking's doctor); skip / pull forward / step out / late swap only inside that doctor's list; `queue-newcomer.ts` puts a walk-in at the back of ITS doctor's list. Check: appointments-queue tests with two doctors (A's skip never moves B's rows).
- [x] P1.5.3 `doctor-breaks.ts`: break belongs to the signed-in doctor (`doctor_id = ctx.userId`); one open break per doctor per day; the in-chair check is that doctor's chair (P1.3.6). `appointments-queue-extras.ts` `currentBreak` -> for the doctor role their own break; for the desk the list of open breaks `[{doctorId, doctorName, endsAt}]`. Check: two doctors on break at once allowed; one doctor two breaks refused.
- [x] P1.5.4 Breaks never block the desk: no server refusal on "Send in"/status change when the booking's doctor is on break (confirm the current code has none; if it has, remove it). Why: owner "kuchh block na ho". Check: test send-in during break = 200.
- [x] P1.5.5 `approval-requests.ts`: create sets `doctor_id` = the appointment's doctor; no appointment -> the desk must choose a doctor (`doctorId` in the create body, `approvals.ts` schema); list/answer for the doctor role only `doctor_id = ctx.userId`. Check: tests (A cannot answer B's request: 404).
- [x] P1.5.6 Discount approvals and bill-cancel requests (`bills-discount.ts listPendingDiscounts`, `bills-cancel-request.ts`): shown to the visit's doctor (`visits.doctor_id`). Check: tests.

#### P1.6 Per-doctor prescription letterhead (added 2026-11-26: Q1)
- [x] P1.6.1 `packages/shared/src/doctor-profile.ts` (new): `doctorProfileSchema` with the same limits as today's `doctor.*` settings (`settings-help.ts:49-54`, schema lines 91+): nameOnRx (required, "Dr. ..."), qualifications, speciality, registrationNo, extraLine. Check: test.
- [x] P1.6.2 `packages/db/src/repos/doctor-profiles.ts` (new): `getMine()`, `saveMine(input, version)` (doctor role only, own row, insert on first save, version-checked, audit), `getFor(userId)` (any staff, used by print). Check: tests (doctor A cannot write B's profile).
- [x] P1.6.3 Print source: `print/clinic-header.ts` and the prescription/certificate print data take the doctor lines from `doctor_profiles` of `prescriptions.doctor_id` / `certificates.doctor_id` (visit doctor), falling back to the old `doctor.*` settings when the doctor has no profile yet. Check: print test two doctors -> two different names on the Rx.
- [x] P1.6.4 Routes `GET/PUT /api/staff/doctor-profile/me` (doctor only); route-matrix. Check: receptionist 403.

#### P1.7 Local testing as another doctor (added 2026-11-26: owner adds doctors himself)
- [x] P1.7.1 `apps/worker/src/dev/dev-login.ts`: accept `?email=<staff email>` (existing ACTIVE user only, localhost + dev-stub only, same guards); without it, behaviour unchanged. NO doctor is added to any seed. Check: dev-guard.test still passes; e2e logs in as a second doctor created through Settings > Staff in the test.

### P2 BACKEND: routes, permissions, route-matrix
#### P2.1 Routes
- [x] P2.1.1 `routes/staff-appointments.ts` GET day + range: no new params; reply shape adds `doctorId` per row, `leaves` per day. Check: staff-appointments-range.test.ts (doctor A does not see doctor B's rows).
- [x] P2.1.2 `routes/staff-doctors.ts` (new): `GET /api/staff/doctors` (appointments.manage), `GET/POST/DELETE /api/staff/doctor-leaves` (permission per Q4). Register in `route-matrix.ts`. Check: route-matrix test, staff-doctors.test.ts.
- [x] P2.1.3 POST book / reschedule / walk-in accept `doctorId`, `durationMin`; doctor role: `doctorId` must equal self unless Q3 says otherwise (403 "You can book only for yourself."). Check: tests.
- [x] P2.1.4 `GET /api/staff/patients/:id/last-visit` (clinical.view, doctor only). Check: route-matrix + test.
- [x] P2.1.5 Print day list data (`PrintDayListScreen` source) adds doctor name per row; doctor role sees own. Check: print test.
- [x] P2.1.6 `GET /api/staff/appointments/search?q=&doctors=id,id` (appointments.manage; q 2-60 chars) -> P1.4.4. Route-matrix. Check: test.
- [x] P2.1.7 Breaks, approvals routes keep their paths; bodies/replies gain `doctorId` (P1.5). Route-matrix unchanged except P1.6.4.
#### P2.2 Permissions
- [x] P2.2.1 `packages/db/src/permissions.ts`: no new action unless Q4 needs `leave.manage`; doctor-sees-own is a list filter, not a permission. permissions.test.ts unchanged or +1 action.

### P3 BACKEND: tests and query count
#### P3.1
- [x] P3.1.1 Counting test (`testing/counting-d1.ts`) for GET range: today N (write the number found), after <= N+1 (leaves). Book: <= 6 round trips. Rule: <= ~10 per request.
- [x] P3.1.2 EXPLAIN test: range query for a doctor uses `appointments_doctor_day_start_idx`; receptionist range uses `appointments_day_status_idx` (existing `appointments-index.test`).
- [x] P3.1.3 (changed 2026-11-26: owner adds doctors himself) Seeds: add NO doctor to `apps/worker/scripts/seed-local-*.mjs`. Test-only fixtures (`apps/worker/src/testing/appointments-seed.ts`, db test helpers) may create a second fake doctor inside the test DB. Local seed bookings get the first active doctor. NOTE: seed scripts are modified in the working tree by someone else: do not overwrite them.
- [x] P3.1.4 `pnpm check 2>&1 | tail -25` green.

### P4 UI: frame, tokens, fonts, icons
#### P4.1
- [ ] P4.1.1 `apps/web/src/features/appointments/cal-tokens.css` (new, scoped `.cal-page`): copy the HTML colour tokens 13-60 as CSS vars (`--cal-primary:#054D61`, `--cal-surface:#F8F9FB`, `--cal-outline-variant:#C0C8CC`, success/warning/error containers...). Fonts: reuse `styles/design-fonts.css` (Wix Madefor Display, Instrument Sans, Spline Sans Mono already shared with visit + Library). Check: no Tailwind, no CDN.
- [ ] P4.1.2 Icons: add to the existing inline SVG icon subset (as Library `LibraryIcon`): chevron_left/right, print, add, groups, calendar_add_on, person_search, person_add, schedule, coffee, emergency, close, check, task_alt, arrow_forward, event_available, tune, expand_more, family_restroom, search, plus `medical_alert` (distinct from warning, L7). Check: no font icon download.
- [ ] P4.1.3 Page background: gradient `secondary-container/15 -> surface -> success-container/10` (HTML 192); header white, 1 px bottom border, sticky top 0 (194).

### P5 UI: components and states
#### P5.1 Header (`CalHeader.tsx`)
- [ ] P5.1.1 Title "Appointments" (keep the app's nav word; HTML says "Appointments Calendar", 200: use HTML wording "Appointments Calendar" for the h1). Summary line: "Week: <d Mon> – <d Mon yyyy> · <N> appointments booked" (week) / "<Weekday d Mon yyyy> · <N> booked" (day); N from `weekBooked` on the filtered rows (L3). Drop "· 1 chair (Room 1)" (L9).
- [ ] P5.1.2 Role chip after the title: "Doctor View" for doctor, "Desk View" for receptionist (HTML 201, mono 11 px).
- [ ] P5.1.3 Controls in order (HTML 211-244): [‹ | Today | ›] group (38 px min, tooltips "Previous week"/"Next week" or day), date input, Week/Day toggle (aria-pressed), "Print list" -> `/app/print/day?date=<shown day or today in week>` (C3), primary "Book Appointment" (opens popover centred, prefill today + next free 15-min start, not a fixed 12:00, L19).
#### P5.2 Doctor filter bar (`DoctorFilter.tsx`, receptionist only)
- [ ] P5.2.1 HTML 247: "Doctors:" + one checkbox chip per doctor from `GET /doctors` (dot colour, name, specialty in brackets if set), "All | Clear". Filter is client side, kept in URL `?doctors=id,id` (default all).
- [ ] P5.2.2 Doctor role: bar not rendered; server already sends own rows only.
- [ ] P5.2.3 None checked: grid with no cards + line "No doctor chosen." with button "Show all".
#### P5.3 Day heads (`WeekHead.tsx`)
- [ ] P5.3.1 Weekday 12 px, date 16 px bold, pill "N booked" (mono 11). Today: tinted bg, 2 px top border primary, "TODAY" tag, filled pill (HTML 268-275).
- [ ] ~~P5.3.2 Free gaps pill~~ (dropped 2026-11-26: Q8). Thursday's head looks like every other day ("N booked").
- [ ] P5.3.3 Closed: grey head + "CLOSED" pill; holiday "Closed · <holiday name>" (review B5). Show all 7 days (HTML shows Sunday as a column; today the app hides Sunday unless it has bookings: change `WeekView.tsx:37`).
- [ ] P5.3.4 Leave: under the pill "Dr Mehta on leave" (one line per doctor, filtered); the cells of that doctor are not bookable for that doctor (popover warns via soft rule).
#### P5.4 Grid and cells (`WeekGrid.tsx`, `DayGrid.tsx`)
- [ ] P5.4.1 Rows per hour, 64 px per hour (HTML min-h 64), positioned by minutes (keep the app's absolute positioning from `WeekView.tsx`, PX_PER_HOUR 56 -> 64). Hours from `DayWindow` of the shown days (L5). Time column "Time (IST)" header, mono 11 px; drop "1 Chair" (L9). Grid scrolls inside its card, `max-height: calc(100vh - 270px)` (HTML 298); no page horizontal scroll at 1366.
- [ ] P5.4.2 Clickable empty time = 15-minute target (snap with `snapToSlot`), not clickable: past (before server now), closed, lunch band. Closed column cells show "Closed" (HTML 309).
- [ ] P5.4.3 Active target: dashed 2 px outline primary, offset -2, tint (M4).
- [ ] P5.4.4 Live preview block (`SlotPreview.tsx`) in the clicked day column at the chosen start: height = max(34, duration/60*64 - 8) px; shows patient name, visit type, "10:00 AM - 10:30 AM (30m)", duration badge (ids referenced by HTML 1149-1154; the element itself is missing in the HTML, L2). Moves when date/time changes (HTML 1104-1120).
#### P5.5 Cards (`CalCard.tsx`)
- [ ] P5.5.1 Content order (review B1): name (bold, truncate), time "10:00 AM" (mono 9-10), visit type, doctor badge (receptionist only; doctor sees only own so no badge), status pill with the word from `APPOINTMENT_STATUS_LABEL` on every card. Tones: Scheduled/Confirmed neutral white with primary/50 border (351); In chair warning border 2 px + ring + code line (337); Completed success tint (319). Whole card is a button -> opens details (P5.9.1). aria-label "<day> <time> <name>, <status>".
- [ ] P5.5.2 Gone rows: Cancelled line-through + 60 % (348), Missed 80 % word "Missed" (L8), Moved like Cancelled with "Moved". Not counted.
- [ ] P5.5.3 Emergency: red left border 2 px, emergency icon, red name, word "Emergency" in the pill row (icon never alone). Overbook flag (soft-rule override): word "Overbooked".
- [ ] P5.5.4 Marks row: medical-alert icon with accessible name "Medical alert" (doctor and desk both see the mark only), restricted icon "Restricted history" (doctor only), word "Due" (L7). Receptionist sees due amount only in the details panel.
- [ ] P5.5.5 Clashes: lanes from `clashLanes` (P1.1.6), gap 6 px, min lane width 64 px; more lanes than fit -> "+N more" button that opens the day view.
- [ ] P5.5.6 Tiny cards (< 34 px tall): name only + time in title; full text in details.
#### P5.6 Now line and lunch
- [ ] P5.6.1 Now line on today's column only: 2 px error colour + 8 px dot + label "NOW 10:45 AM" (mono 9), position from `serverNow` + elapsed, updated each minute (HTML 333-336).
- [ ] P5.6.2 Lunch band from `DayWindow` intervals: striped (HTML 383 gradient), pill with coffee icon "Clinic Lunch Break (1:30 PM – 2:30 PM)"; drop "· One chair clinic schedule paused" (L9). Days with different lunch: band only in those columns.
#### P5.7 Booking popover, Slot Selection tab (`book/BookPopover.tsx`, `book/SlotPanel.tsx`, `book/place-popover.ts`)
- [ ] P5.7.1 Starts closed (L1). Wrapper fixed inset 0 z 50; backdrop 15 % on-surface, click = close (with guard P5.7.10). Popover 440 px wide, max `100vw-24px`, max-height `100vh-24px`, radius 12, shadow-2xl.
- [ ] P5.7.2 `place-popover.ts` (pure, tested): columns Thu-Sun (index >= 4) open to the LEFT of the cell, Mon-Wed to the RIGHT, gap 12, fall back to the other side, top = cell top - 24, clamp 12 px on all sides; no anchor -> centred (HTML 897-949). Re-place on resize (M24) and when the date/time input moves the target (1115).
- [ ] P5.7.3 Header: icon tile, "Schedule Appointment" (move mode: "Move appointment"), date line "Wednesday, 25 Nov 2026" (drop "Room 1" and "· Align Dentistry", L9), close X (44 px hit area). Patient: docked box (initials, name, code chip, mobile via `displayMobile`, "Change") or search input "Search patient name, code or phone..." (existing patient search API). "+ Register New Patient" link switches tab.
- [ ] P5.7.4 "Assign Doctor *" radios (HTML 573), 3-column grid, one per active doctor (dot + short name). Doctor role: preselected self and hidden or locked per Q3. Receptionist: preselected when the filter shows exactly one doctor, else none (must choose; error "Choose a doctor.").
- [ ] P5.7.5 "Visit Type & Procedure Preset" chips from the clinic list: "<label> (<minutes>m)"; choosing one sets duration to its minutes (HTML 1122-1131).
- [ ] P5.7.6 "Time & Duration Adjuster": Date (date input), Start Time (time input, 15-min steps shown but any minute allowed), Duration (Min) number 5-240 step 5 with "Any min" hint; quick pills 15m 30m 45m 60m 90m; the active pill follows the number (HTML 1081-1093). Summary right side "12:00 PM – 12:30 PM (30m)" (element 593-596 and 634-637 are empty in the HTML; fill them as the script's `active-duration-label` does, 1167).
- [ ] P5.7.7 "Reason for visit / Chief complaint (Optional)" textarea, 2 rows, max 500 (existing schema).
- [ ] P5.7.8 Footer: "Cancel" left; "Book Appointment" primary right. Click: button text -> "Booking…", disabled, `useSubmitOnce` (first visible change < 100 ms). Server OK -> morph (P6.3). 
- [ ] P5.7.9 Server says no: popover stays, form kept, message under the time fields (role=alert). Soft rule (past, closed, lunch, more than 90 days, doctor on leave): message + "Book anyway" which shows a reason field (existing `LateEntry` logic, sent as `overrideReason`). Hard errors (patient archived, version) as text.
- [ ] P5.7.10 Unsaved guard: any field changed -> backdrop click, X, Cancel, Esc ask "Discard this booking?" (Keep editing / Discard). Unchanged -> close at once.
- [ ] P5.7.11 Move mode (Reschedule from details, Today, patient tab): same popover, patient locked (no Change, no New Patient tab), doctor and duration prefilled from the booking, button "Move appointment", sends `version`. Replaces QuickBookDialog reschedule mode.
- [ ] P5.7.12 Focus: opens with focus on the patient search (or first chip when a patient is set); Tab stays inside; Esc = close with guard; focus returns to the cell or button that opened it.
#### P5.8 New Patient tab (`book/NewPatientPanel.tsx`)
- [ ] P5.8.1 Uses the NewPatientForm schema (`packages/shared/src/patient-create.ts`), not its own: Full Name *, Mobile * with "No mobile" checkbox + reason (HTML 667-680; check the reason field exists in the schema; if not, keep the app's existing no-mobile handling and record it), Gender * Female/Male/Other with NO default (L12), DOB / Age (existing `BirthAgeFields` logic, read-only age when DOB set).
- [ ] P5.8.2 Top bar: replace "Auto-Generated Patient ID: P-000409" with "Patient number is given on save" + green "New Registration" dot (L11).
- [ ] P5.8.3 "+ Additional Patient Details" `<details>`: Whose mobile is this?, Locality / City, Medical Alert / Remarks (map to existing patient fields; any field that does not exist in the patient schema is left out and listed in the Log; never a new clinical field from this popover without the owner).
- [ ] P5.8.4 Guardian box when age < 18 (`patient-guardian.ts`), fields Guardian Name, Relationship, Guardian Phone (L12).
- [ ] P5.8.5 Footer: "Save only" (saves, toast "Patient saved: <code> <name>", closes; no `alert()`, L13) and "Save & Book" (saves, then M15-M19 flyer sequence, then Slot Selection with this patient chosen).
- [ ] P5.8.6 Before saving: duplicate check (P1.3.7). (changed 2026-11-26: Q5) `first_name_mobile` hit -> card "Same person? <name> <code> <mobile>" with "Open existing" (choose that patient and go to Slot Selection) and "Save as new patient". `mobile_only` hits -> one quiet line "Same mobile: Ritu Verma P-000124" with "Open" per name; saving is never blocked (L35). Same component on the New patient page (P7.4.2).
- [ ] P5.8.7 Privacy notice and reminders consent: NewPatientForm has "Privacy notice given" and "Allow reminders" (HANDOFF runner notes). The HTML drops them. Keep both in the tab (compact) since they are legal; listed as L22.
#### P5.9 Booking details panel (not in the HTML; existing; owner 2026-11-26: "click a patient -> details on the right, in the new theme")
- [ ] P5.9.1 `DayDetails.tsx` restyled with cal tokens (radius 12, header like the popover header: icon tile, name 15 px Wix Madefor Display, close X; body 13 px Instrument Sans; chips mono; buttons like the popover footer). Click on any card (week or day) opens it on the RIGHT of the grid on laptop and tablet (grid narrows, no overlap of the clicked card; selected card gets the active outline); a second click or X closes: name, code chip, time + length, visit type, status word, doctor (receptionist), marks, complaint, mobile or "No mobile", "Moved from …" (existing chain route), Due (doctor: word; desk: amount). Actions unchanged (AppointmentActions: Start visit today only, Reschedule -> P5.7.11, Cancel, Missed, Open profile, Go to Today). Laptop: side panel right of the grid; tablet/phone: bottom sheet (existing PhoneDayList pattern).
- [ ] P5.9.2 Doctor only: "Last visit 12 Nov: Scaling" or "First visit" (P1.4.3), loaded on open with a 1-line skeleton.
#### P5.10 Settings pieces
- [ ] P5.10.1 Settings > Staff: optional "Specialty" on add/edit doctor (P1.3.1).
- [ ] ~~P5.10.1 Specialty in Settings > Staff~~ (changed 2026-11-26: specialty is in the doctor's own letterhead profile, P5.12.1).
- [ ] P5.10.2 Doctor leave editor (Q4 answered): Settings > Timings, section "Doctor leave": doctor (a doctor sees only self; a doctor with settings.write may choose any doctor), date, optional note; list of coming leave days; remove with confirm. Receptionist: read only.
#### P5.11 Per-doctor Today (added 2026-11-26: Q1; design = doctor_today.html, unchanged layout)
- [ ] P5.11.1 Doctor Today (`features/today/doctor/`): data from P1.5.1 is already own-only; check counts, Now, Next, Waiting for you (P1.5.5-6) show only own items. No visual change.
- [ ] P5.11.2 Desk Today (`features/today/TodayScreen.tsx`, `DeskDoctorLinks.tsx`): every row shows the doctor badge (ui/DoctorBadge); a doctor filter like the calendar's (P5.2) at the top; break notice on the desk's main Today page only: "Dr Mehta is on break until 11:15 AM." per doctor (amber line, no blocking: "Send in" stays enabled). Not shown on other desk pages.
- [ ] P5.11.3 Desk "Ask the doctor" (`AskDoctorDialog.tsx`): with a booking, sent to that booking's doctor (shown as text "To: Dr Mehta"); without one, a required doctor choice.
#### P5.12 Per-doctor letterhead (added 2026-11-26: Q1)
- [ ] P5.12.1 Settings > Clinic and doctor (`ClinicDetailsSettings.tsx`): the "Doctor" part edits the SIGNED-IN doctor's own profile (P1.6.4): name on prescriptions, qualifications, speciality, registration no., extra line; the live preview (ClinicPreview) shows that doctor. Clinic part unchanged. Receptionist: no Doctor part. Heading "My prescription details".
#### P5.13 Calendar search (added 2026-11-26: Q7)
- [ ] P5.13.1 `CalSearch.tsx` in the header row (left of the date controls; HTML has no box, so copy the doctor_today search look: `DoctorSearch.tsx`): placeholder "Find a booking: name, code or mobile", 250 ms debounce, min 2 letters, sends the selected doctors (desk) or none (doctor). Results dropdown: "Sunita Verma · P-000123 — Fri 28 Nov, 11:00 AM · Dr Mehta · Root canal · Confirmed" (doctor name only for the desk). Empty: "No coming bookings for "<q>"." Enter/click: jump to that date (week or day as now), open the details panel (P5.9.1) for that booking. "/" focuses the box (as doctor Today). Check: T33-T35.

#### P5.14 Patient Appointments tab doctor ticks (added 2026-11-26: Q9)
- [x] P5.14.1 Backend: `listForPatient` and the move chain rows carry `doctorId` (all doctors' rows still come; the filter is on screen).
- [ ] P5.14.2 `PatientAppointmentsTab.tsx`: doctor chips with tick (same look as the calendar filter P5.2, ui/DoctorBadge, name never colour alone), from GET /doctors. Doctor: only own ticked at start; desk: all ticked. Not kept in the URL. None ticked: "No doctor chosen." + "Show all". Old rows with no doctor always show. Check: e2e doctor A sees only A rows, ticks B, B rows appear.

### P6 UI: motion (one sub-point per row of section 3)
#### P6.1 Popover in and out (`book/book-motion.css`)
- [ ] P6.1.1 M1: `.bk-popover` enters from `scale(.96) translateY(6px)` to none, transform 200 ms cubic-bezier(.16,1,.3,1), opacity 180 ms ease; set the start style, then the end style on the next animation frame.
- [ ] P6.1.2 M2: backdrop opacity 200 ms.
- [ ] P6.1.3 M3: close = reverse styles, unmount after 180 ms.
#### P6.2 Preview
- [ ] P6.2.1 M5: preview height transition 220 ms cubic-bezier(.4,0,.2,1), opacity/border 200 ms.
- [ ] P6.2.2 M6: `@keyframes cal-live-glow` 2 s infinite ease-in-out (border #054D61 <-> #0F5266, ring 0 -> 4 px rgba(5,77,97,.12)).
#### P6.3 Book fold morph (`book/fold-morph.ts`)
- [ ] P6.3.1 M7: after server OK, measure the popover and the NEW card's rect (render the card first, invisible), transform popover with translate3d + scale(x,y) (scaleX >= .18, scaleY >= .12, target height 48-90 px, HTML 1198-1202), transform-origin top left, 500 ms cubic-bezier(.2,.9,.3,1), opacity .9 over 480 ms, radius 8 px over 450 ms; backdrop fades (M2) at the same time.
- [ ] P6.3.2 M8: unmount the popover at 510 ms; clear the active outline.
- [ ] P6.3.3 M9: the new card (real server row, put into the list state at once) gets class `cal-card-docked`: keyframes scale .96 -> 1.02 -> 1 + glow, 600 ms cubic-bezier(.2,.8,.2,1). Then the normal refresh confirms it.
- [ ] P6.3.4 M10: toast "Appointment confirmed and slotted on calendar" with task_alt icon at 510 ms, 300 ms in, 3000 ms shown, 300 ms out (app Toast with these timings, or its default if it cannot: record). Booked on another week: no morph (target not on screen); jump to that date and toast `bookedMessage` (existing behaviour, AppointmentsScreen.tsx onBooked).
#### P6.4 Tabs and Save & Book flyer
- [ ] P6.4.1 M11/M12: tab pill translateX 0 / 100 %, 400 ms ease-in-out; text colour 400 ms.
- [ ] P6.4.2 M13: two panels in a 200 % track, translateX 0 / -50 %, 450 ms ease-in-out; each panel scrolls on its own (overscroll contain).
- [ ] P6.4.3 M14: footer groups cross-fade 300 ms, the hidden one `pointer-events:none` and `inert`.
- [ ] P6.4.4 M15-M19 (after the server saved the patient and returned its code): t=0 name+mobile ring 350 ms, flyer (fixed copy of the inputs box with initials, name, code from the server, mobile) lifts 320 ms; t=320 slide back (M11-M14); t=760 flyer docks onto the selected-patient box 260 ms; t=1050 remove the flyer, show the real box (opacity 1) with "Change" (fixes L18: the HTML leaves the flyer on top and the real box at opacity 0). Keep all timers in one cleanup list (HTML 808-818) and clear on unmount.
- [ ] P6.4.5 M20: toast "<code> Patient Registered · <name> · Proceeding to Slot" 300 ms in, out at 3500 ms.
#### P6.5 Small motion
- [ ] P6.5.1 M21/M22: `:active` scale .95 on the two primary buttons; colour transitions 150 ms.
- [ ] P6.5.2 M23: details chevron rotate 180°, 150 ms.

### P7 UI: phone/tablet, keyboard, reduced motion, states, shared pieces
#### P7.1 Widths
- [ ] P7.1.1 1366: week grid, no horizontal page scroll; grid min width 980 px only inside its own scroll box (HTML 299) when the main area is narrower.
- [ ] P7.1.2 768 (tablet): Day view by default (brief Q1), grid of one day with the same cards and popover (popover anchored right or left of the column, clamped).
- [ ] ~~P7.1.3 360 (phone) redesign~~ (parked 2026-11-26: Q6 "leave phone design for now"). Phone keeps today's `DateStrip` + `PhoneDayList`, which must still work with the new data (doctor badge for the desk, own rows for the doctor) and open the new popover as a plain full-width dialog. No new phone styling.
#### P7.2 States
- [ ] P7.2.1 First load: skeleton in the grid shape (head row + 6 hour rows with 3 grey blocks).
- [ ] P7.2.2 Refresh fail: keep data, `refreshFailure` line + Retry (existing ui/refresh-fail.ts).
- [ ] P7.2.3 First-load error: "Could not load the week. Check the connection, then try again." + Retry.
- [ ] P7.2.4 Empty day / week: "No appointments" + "Book" (opens popover at the first open time).
- [ ] P7.2.5 Offline: existing offline banner; Book, Move, Cancel buttons disabled with "You are offline."
- [ ] P7.2.6 409 on any action: "This appointment was changed by someone else. Reload." + Reload button; list refreshes.
#### P7.3 Access and motion
- [ ] P7.3.1 `prefers-reduced-motion`: M1-M23 off (end state at once), toast still shows.
- [ ] P7.3.2 Keyboard: every card and every bookable cell reachable (roving tabindex per column: arrows move, Enter opens; review F4), popover focus trap (P5.7.12).
#### P7.4 Shared pieces (section 4b)
- [ ] P7.4.1 Move every QuickBookDialog caller to BookPopover (Today Book, Today Reschedule, patient profile book, patient tab Reschedule, NewPatientScreen, `?book=` URL params). Then delete QuickBookDialog.tsx, QuickBookPatient.tsx (if unused), quick-book.css, BookPickers TimeChips if unused, useBookSlots if unused; update MAP.md.
- [ ] P7.4.2 New patient page uses the shared duplicate rule (P1.1.4) and the "Same person?" card text.
- [ ] P7.4.3 Print day list: Doctor column; doctor prints own.
- [ ] P7.4.4 Update e2e helpers (`e2e/calendar-helpers.ts`, booking.spec, calendar-booking, calendar-late-undo, appointment-actions): new button names ("Book Appointment", "Schedule Appointment" dialog, "Assign Doctor").

### P8 Docs and measurement
#### P8.1
- [ ] P8.1.1 Motion probe (as Library/visit): Playwright rAF sampler for M1, M3, M5, M7, M9, M11, M13, M16-M18 at 1366; numbers in the Log.
- [ ] P8.1.2 Screenshots 360/768/1366, doctor and receptionist, into `docs/ui-audit/screenshots/redesign/calendar/`.
- [ ] P8.1.3 Docs: MAP.md (new files), STATE.md, USER_MANUAL.md (calendar section: doctors, popover, leave), HANDOFF.md (migration 0066 for the owner; next free 0067), DECISIONS.md, final/README.md row, handoff/INDEX.md status, PRODUCT_DESIGN_CONTEXT.md "one doctor, one chair" -> several doctors, own chair each (review C1 note).

Migration number: **0066_doctors_on_appointments** (the owner applies it on staging; never applied by the agent).

## 6. Logic changes (frontend)
- State: `useCalendarData(view, date, doctors)` holds the week or day reply, the doctor list (loaded once), filter (URL), selected booking id, popover state `{mode: book|move, anchor, draft}`.
- Optimistic: none for book, move, cancel (money/clinical safe rule: optimistic only for status and order). The first visible change is the button state ("Booking…") within 100 ms; the morph runs only after the server reply. On success the server row is inserted into state at once (so the morph has a target), then the next refresh replaces it.
- Server decides: doctor (doctor role = self), duration bounds, soft rules (past, closed, lunch, 90 days, leave), repeat booking, patient code, duplicate hits.
- Server says no: popover stays, form kept, message shown; 409 -> conflict text + reload.
- Refresh: every 60 s while visible (existing), after every action, and when the tab comes back. A refresh never closes an open popover and never moves it.
- Guards: one submit at a time (`useSubmitOnce`), unsaved-change guard, past cells not clickable, doctor filter none -> no cards.

## 6b. Logic problems and design issues (checked against the real code)
| # | Problem | Proof (file:line or screen) | Fix (in plan) or owner question |
|---|---|---|---|
| L1 | The HTML ships with the popover OPEN (`display:block`, fixed left/top) | HTML 483, 508 | App starts closed (P5.7.1) |
| L2 | `#slot-preview-box` and its children are used by the script but do not exist in the markup, so the live preview never shows in the HTML | HTML 1135, 1146-1154 (no such id in 1-803) | Built from the CSS + script intent (P5.4.4, M5, M6) |
| L3 | Counts are fixed text, count cancelled/missed, and jump to "15"/"5" after a booking | HTML 204, 274, 1273-1274 | `weekBooked` on filtered rows (P5.1.1, P5.3.1) |
| L4 | One card per hour cell: a 15-min and a 60-min booking look the same; 10:00 and 10:30 cannot both show | HTML 301-470 | Position by minutes, 64 px per hour (P5.4.1) |
| L5 | Hours 8-8, lunch 1-2, Sunday closed are hard-coded | HTML 297, 383-389, 309 | From `DayWindow` (P5.4.1, P5.6.2) |
| L6 | Cards in the 3 PM row have no `data-doctor`, so the filter never hides them | HTML 406-415, 1587 | Every row carries `doctorId` (P1.4.1) |
| L7 | The red warning icon sits next to "Due": reads as a health warning; no real medical-alert mark | HTML 337 | Separate "Medical alert" icon, plain word "Due" (P5.5.4) |
| L8 | "Missed (No-show)" is not the app word | HTML 424 | `APPOINTMENT_STATUS_LABEL` (P5.5.2) |
| L9 | "1 chair (Room 1)", "1 Chair", "Room 1", "One chair clinic schedule paused" contradict the owner's several-doctors-own-chairs answer | HTML 204, 255, 518, 388 | Dropped (P5.1.1, P5.4.1, P5.7.3, P5.6.2) |
| L10 | Print prints the whole screen with complaint text ("Severe Tooth Fracture") | HTML 236, 351 | Existing day-list print, names/times/visit type only (P5.1.3) |
| L11 | Patient code shown before save; two desks would see the same number | HTML 653, 1391 | "Patient number is given on save"; code from server (P5.8.2) |
| L12 | Guardian only under 10; gender preset to Male | HTML 714-719, 853, 692 | Under 18 (`patient-guardian.ts:13`), no default (P5.8.1, P5.8.4) |
| L13 | "Save only" uses `alert()` | HTML 1329 | Toast (P5.8.5) |
| L14 | Backdrop click or Cancel throws away a filled form | HTML 485, 781 | "Discard this booking?" (P5.7.10) |
| L15 | Book opens twice: inline `onclick` plus `addEventListener` on the button and on every slot | HTML 241 + 1533-1547, 303 + 1541 | One handler (P5.7.8) |
| L16 | Booking always "succeeds" locally; past cells and any date/time accepted | HTML 1173-1278, 303 (Mon 08:00 on Wed) | Wait for server; soft rules + Book anyway; past cells off (P5.4.2, P5.7.8-9) |
| L17 | Server takes length only from the visit type | `appointments-book.ts:84-85`, `appointment-book.ts:4` | `durationMin` (P1.1.1, P1.3.2) |
| L18 | After Save & Book the flyer stays on top (fixed position) and the real patient box stays at opacity 0; scrolling the panel would misalign it | HTML 1420-1423, 1509-1515 (flyer never removed) | Remove flyer at 1050 ms, show real box (P6.4.4) |
| L19 | Top "Book Appointment" always prefills Wed 25 Nov 12:00 PM | HTML 241, 1536 | Today + next open 15-min start (P5.1.3) |
| L20 | Current duplicate rule: ANY shared name word + same mobile, or same second mobile alone, or shared word + age within 1 year. Owner: name AND mobile | `patient-duplicates.ts:110-131` | Q5 |
| L21 | Clashes allowed means the overlap guard goes; then a double click or two desks could book the same patient twice at the same time (today the guard prevents it; test "50 parallel -> one win") | `appointment-insert.ts:72-85`, `appointments-book.test` | Refuse only an exact repeat (P1.3.3) |
| L22 | The popover's new-patient tab drops "Privacy notice given" and "Allow reminders" that the app's New patient form has (consent) | HANDOFF.md runner notes; HTML 647-776 | Kept in the tab (P5.8.7) |
| L23 | Undo cancel refuses when the time was taken meanwhile; with clashes allowed that refusal is wrong | `appointments-undo-cancel.ts:44-55` | Drop the free check (P1.3.5) |
| L24 | "Someone is in the chair" checks are per day, not per doctor; with several doctors, doctor B could not start a visit while doctor A has a patient | `doctor-breaks.ts:68-92`, status repo | Per doctor (P1.3.6) |
| L25 | Today queue order, breaks and approvals are per DAY (one queue, one open break per day); with several doctors they mix doctors | `schema/appointments.ts:43` (day_queue index), `0057_doctor_today_queue.sql:36` (one open break per date) | Q1: per doctor (P1.5, P5.11) |
| L26 | Old bookings have no doctor; the "doctor sees only own" filter would hide them all | `schema/appointments.ts` (no doctor column) | Q2: all are demo data; backfill to the first active doctor (P1.2.1) |
| L27 | Prescription letterhead and the "Clinic and doctor" settings hold ONE doctor | `settings-help.ts:49-54` (`doctor.*` keys) | Q1: per-doctor profile (P1.6, P5.12) |
| L28 | A doctor who sees only their own bookings cannot see the chair is free for another doctor; booking for another doctor from a filtered view makes no sense | owner answer 1 | Q3: only for self (P2.1.3, P5.7.4) |
| L29 | Leave has no place to be entered in the HTML | owner answer 5; HTML has none | Q4: Settings > Timings (P5.10.2) |
| L30 | "Free gaps" has no rule; on Thu it is just text | HTML 279 | Q8: dropped |
| L31 | No search "when is Mrs Verma coming?" (brief §12, review B3) and no phone layout in the HTML | HTML whole | Q7: calendar search (P5.13); Q6: phone parked |
| L34 | Local dev-login signs in as one fixed fake doctor, so "doctor sees only own" cannot be tried with a second doctor the owner adds in Settings > Staff | `apps/worker/src/dev/dev-login.ts:21-22` | `?email=` for existing staff, localhost only (P1.7.1) |
| L35 | Duplicate on mobile alone will fire for every family member sharing one phone; it must stay a soft line, never a "Same person?" stop | owner Q5 answer | `mobile_only` shown as a quiet "Same mobile: Ritu Verma P-000124" line; only `first_name_mobile` shows the "Same person?" card (P1.1.4, P5.8.6) |
| L36 | Per-doctor breaks: the desk's Today today hides "Send in" or warns per day; with several doctors the warning must name the doctor and must not block | owner Q1 answer | P1.5.4, P5.11.2 |
| L32 | HTML popover anchors by weekday name; in Day view there is one column | HTML 922 | Anchor by space available (P5.7.2) |
| L33 | Doctor colours are the only difference between doctor badges in the HTML at 9 px; colour alone is not allowed | HTML 315 | Badge shows the short name too (P5.5.1, ui/DoctorBadge) |

## 7. New things that need the owner's answer
| # | Question | Options | Default if no answer | Owner's answer |
|---|---|---|---|---|
| Q1 | Several doctors: should Today (queue, breaks, approvals) and prescriptions also become per doctor in THIS plan? (L24, L25, L27) | A Calendar only now; B all in this plan | A | YES, in this plan. Each doctor has their own Today showing only their patients; a doctor sees only their own appointments; reception sees and books for all; a doctor books only for self. Breaks per doctor: the desk sees the break on its main page only, as a warning, nothing blocked. Approvals go to the patient's doctor. Each doctor has their own prescription details, edited in Settings. |
| Q2 | Old bookings have no doctor (L26) | A first doctor; B Unassigned | A | All current bookings are demo data. The owner adds doctors himself through Settings > Staff; add no doctor to seeds. -> backfill to the first active doctor. |
| Q3 | May a doctor book or move a patient for ANOTHER doctor? (L28) | A Only for self; B any doctor | A | A: only for self. |
| Q4 | Doctor leave: where entered, by whom? (L29) | A Settings > Timings, doctors; B receptionist too | A | A. |
| Q5 | Duplicate rule exactly (L20) | A full name AND mobile; B plus quiet hint | A | First name + mobile, AND mobile alone also shows a match; never block (one number can have several patients). |
| Q6 | Phone 360 layout (not in HTML) | A day list + sheet; B week grid scroll | A | Leave the phone design for now (parked). |
| Q7 | Search a patient's bookings across days | A not now; B header search | A | YES, in the calendar only, showing results for the selected doctors. Also: clicking a booking opens its details on the right, in the new theme. |
| Q9 | Patient profile Appointments tab: a doctor sees only own bookings, or all? (Log deviation 11) | A own only; B all; C tick to choose | — | C (2026-11-26): doctor chips with ticks on the tab; a doctor starts with only their own ticked and ticks another doctor to see theirs. The desk starts with all ticked. |
| Q8 | "Free gaps" pill rule (L30) | A 60 min; B 90 min; C drop | A | Drop it; the desk judges gaps. |

## 8. Decisions already taken (also in docs/DECISIONS.md)
- Owner answers 2026-11-26 from the review (section 0).
- Booking details panel, Start visit, Cancel/Missed/Undo stay as built (not in the HTML) and get the calendar's look.
- No optimistic booking; morph after the server OK; "Booking…" is the instant feedback.
- Exact repeat booking (same patient, doctor, day, start) is refused; other clashes allowed.
- Duration bounds 5-240 min in 5-min steps (HTML 617).
- Doctor colours from a fixed 6-colour palette by doctor order; always with the name.
- Each doctor's chair id = "doc:<doctorId>"; old rows keep "1".
- Live preview block is built from the HTML's CSS and script although its markup is missing (L2).
- Title "Appointments Calendar", role chip "Doctor View" / "Desk View".
- The rail's "Doctor" chip on the nav item is not copied (shared rail).
- QuickBookDialog is replaced by the popover everywhere (one booking UI).
- (2026-11-26, owner answers Q1-Q8) per-doctor Today, breaks (warn, never block), approvals to the patient's doctor, per-doctor prescription profile; old bookings -> first active doctor; doctor books only for self; leave in Settings > Timings; duplicates on first name + mobile ("Same person?") and on mobile alone (quiet line), never blocking; phone parked; calendar-only search over the selected doctors; no Free gaps pill; no doctors in seeds; dev-login `?email=` for local testing.

## 9. Design apply checklist
- [ ] tokens/colours (scoped `.cal-page`), icons, CSS files
- [ ] components (one per file, small: CalHeader, DoctorFilter, WeekHead, WeekGrid, DayGrid, CalCard, SlotPreview, NowLine, LunchBand, book/BookPopover, SlotPanel, NewPatientPanel, place-popover, fold-morph)
- [ ] every motion in section 3
- [ ] reduced motion
- [ ] phone 360 / tablet 768 layout
- [ ] shared pieces from 4b applied on the other pages (and checked there)
- [ ] docs: MAP.md, STATE.md, USER_MANUAL.md, handoff INDEX.md

## 10. Test cases (state x interaction x edge)
| # | Case | Steps | Expect (look) | Expect (numbers) |
|---|---|---|---|---|
| T1 | Week loads (desk) | open /app/appointments at 1366 | 7 day heads, filter bar, cards with status words | 1 range request, <= N+1 queries |
| T2 | Week loads (doctor) | dev-login doctor A | only A's bookings, no filter bar, "Doctor View" | API has no B rows |
| T3 | Filter | desk unticks doctor B | B cards gone, counts drop | count = live rows of A |
| T4 | Clear / All | Clear then All | "No doctor chosen" then all back | |
| T5 | Open popover Mon cell | click Mon 10:00 | popover right of the cell, outline, preview | enter 200 ± 40 ms |
| T6 | Open popover Fri cell | click Fri 17:00 | popover left of the cell, inside 12 px margins | |
| T7 | Header Book | click Book Appointment | centred, prefilled today next open time | |
| T8 | Duration | chip RCT 60, then type 75 | preview grows, pill none active, summary "…(75m)" | height 220 ms |
| T9 | Book OK | fill, Book | "Booking…", morph into slot, card pulses, toast | first change < 100 ms with 300 ms server; morph 500 ms; toast 3 s |
| T10 | Book refused (past) | type past time, Book | message under time, Book anyway + reason | no row created |
| T11 | Book anyway | give reason | booked, "Overbooked" word | audit has overrideReason |
| T12 | Clash | book B over A same doctor same time | both side by side, 2 lanes | 2 rows |
| T13 | Double click | click Book twice fast / 5 times | one booking | 1 row |
| T14 | Leave day | book on doctor's leave | soft-rule message "Dr X is on leave that day." | |
| T15 | New patient Save & Book | tab, fill, Save & Book | flyer lift, slide back, dock, Change appears, toast with server code | timeline 0/320/760/1050 ms ± 20 % |
| T16 | Duplicate | same name + mobile as seed | "Same person?" card; Open existing picks them | no new patient |
| T17 | Unsaved close | type note, click backdrop | "Discard this booking?" | |
| T18 | Move | details > Reschedule, new time | popover move mode, old card "Moved" | chain kept |
| T19 | Cancel + Undo | Cancel with reason, Undo in 10 s | card back to Scheduled even if time now clashes | |
| T20 | Start visit two doctors | A has someone in chair; B starts | B allowed | |
| T21 | Last visit line | doctor opens a booking | "Last visit …" or "First visit"; desk sees none | desk 403 on route |
| T22 | Repeat 3-5 times | open/close popover 5 times, switch tabs 5 times | no stuck outline, no leftover flyer, no double toast | |
| T23 | First / last / only | only booking of the week; booking at day start; at day end | positioned right, popover clamped | |
| T24 | Empty week | no bookings | "No appointments" + Book | |
| T25 | Refresh fail | block network after load | data stays, line + Retry | |
| T26 | 409 | desk moves while doctor has panel open; doctor cancels | conflict text + Reload | |
| T27 | Slow server 300 ms | all actions | button state at once, no double rows | |
| T28 | Widths | 360, 768, 1366, both roles | phone list + sheet, tablet day, laptop week; no page side scroll; 44 px targets | |
| T29 | Keyboard only | Tab to a cell, Enter, fill, Enter; Esc | focus trap, focus returns | |
| T30 | Reduced motion | emulate reduce | no animation, same end state | |
| T31 | Closed day / holiday | Sunday, a holiday | "Closed" / "Closed · Diwali"; cells not clickable; late entries still listed | |
| T32 | Print | Print list, desk and doctor | day list with Doctor column; doctor only own; no complaint text | |
| T33 | Search (desk) | type "verm" with doctors A+B ticked, then only A | lists both doctors' coming bookings, then only A's | 2 queries |
| T34 | Search (doctor) | doctor B types A's patient name | nothing from A | |
| T35 | Search jump | Enter on a result in another week | calendar goes to that week, details panel open on the right | |
| T36 | Per-doctor Today | A and B each with 3 bookings today | A's Today shows 3, B's shows 3; desk shows 6 with badges | |
| T37 | Breaks | A on break; desk sends A's patient in | desk sees "Dr A is on break until …", Send in still works | 200 |
| T38 | Approval | desk asks about B's patient | only B sees it in Waiting for you | |
| T39 | Letterhead | A and B save different details; print Rx of each | each Rx shows its own doctor | |
| T40 | Duplicate | new patient same first name + mobile; other name same mobile | "Same person?" card; quiet "Same mobile" line; both can still save | |
| T41 | New doctor | owner adds doctor C in Settings > Staff; dev-login `?email=` C | C appears in filter and Assign Doctor; C's calendar empty | |

## 11. Measurement targets
- first visible change within 100 ms of the click, even with a 300 ms server;
- each transition spans >= 8 frames over its HTML duration, no 1-3 frame jump larger than 24 px (the fold morph M7 is measured on its transform values, not on layout);
- no layout jump of other elements, no page scroll movement;
- durations within ±20 percent of the HTML value.

## 12. Log
- 2026-11-26 design-plan: plan written from the full HTML, brief, review and code. 33 logic/design findings (L1-L33), 8 owner questions (Q1-Q8), migration 0066 planned. Seed scripts are modified in the working tree by someone else: do not overwrite them (P3.1.3).
- 2026-11-26 design-plan: owner answered Q1-Q8 in chat. Added P1.4.4, P1.5 (per-doctor Today/breaks/approvals), P1.6 (per-doctor letterhead), P1.7 (dev-login email), P2.1.6-7, P5.11-P5.13; changed P1.1.4, P1.2.1, P1.3.1, P1.3.7, P3.1.3, P5.9.1, P5.10.2; dropped P1.1.5, P5.3.2, P5.10.1, P7.1.3 (phone parked). New findings L34-L36. Scope is now large: design-apply should run backend P1-P3 as one session and UI P4-P8 as the next.
- 2026-11-26 design-apply Phase A (backend P1-P3) DONE. Commits f664c15 (shared rules, migration 0066, repos, lists), f3f5ece (routes, letterhead, dev-login, web bridge, tests), then docs. pnpm check green: shared 436, web 246, db 515, worker 618 tests.
  - Measured: GET day list 10 round trips (plain day was 9, busiest stays 10: the leave read is batched with the open-breaks read in ONE D1 batch); POST book 8 round trips (the doctor read is the one new read). Query plans: doctor week, doctor queue day and leave range have no full scan.
  - Deviations, with reasons: (1) DELETE leave is `POST /doctor-leaves/:id/remove` with {version} (the app's other closes are POSTs, e.g. /breaks/:id/end). (2) Leave add/remove permission = `breaks.manage` (doctor only) plus settings.write to manage another doctor's days (Q4 A); no new permission. (3) Day reply keeps `currentBreak` (the doctor's own, or the desk's first) and adds `openBreaks[]` (desk: every doctor, with name) and `leaves[]`. (4) Undo-cancel still refuses an EXACT repeat (same patient, doctor, start) besides dropping the free-time check. (5) A move to the same doctor and start (only the length changes) is not counted as a repeat of itself. (6) Walk-in without doctorId: a doctor takes it themself; the desk gets the only active doctor, else "Choose a doctor.". (7) Approval without a booking or bill and several doctors: "Choose the doctor to ask." (body doctorId). (8) Old rows with doctor_id NULL are shown to every doctor (lists, breaks, approvals) instead of being hidden. (9) Last visit read writes no access-log row (no other clinical read does). (10) P2.1.5: each day-list row carries doctorId; the print screen maps names from GET /doctors in the UI phase (P7.4.3). (11) Patient Appointments tab: owner answered Q9 = tick to choose doctors (P5.14); backend part done.
  - Web bridge (so the app keeps working until the UI phase): QuickBookDialog sends doctorId (self, or the desk's first active doctor) via `defaultDoctorId` in features/appointments/api.ts, marked BRIDGE; DuplicateWarnings use the new reasons and only first_name_mobile asks "Same person?". Prescription/certificate print use the doctor's profile with the old settings as fallback.
  - Not done here (UI phase): P4-P8, Settings screens for leave (P5.10.2) and "My prescription details" (P5.12.1), desk "Ask the doctor" doctor choice (P5.11.3), docs/DECISIONS.md and handoff/INDEX.md (both have the owner's uncommitted edits, so not touched).
