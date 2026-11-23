# Unified Patient History

Plan and spec only until the staged build tasks below are reached. Feature code follows docs/PLAN.md task ids.

## WHY
When a patient comes back after months or years, the doctor must understand in one minute: when they came before, what was wrong, what was done, what was prescribed, what was paid, what is still due, and what scans exist. Today the plan has these as separate screens. We want one place.

## WHERE
A "History" tab on the patient profile (S04/S17), next to Overview. It is the default tab for a returning patient who has at least one past visit.

## WHAT IT SHOWS (newest first, grouped by month/year)
Each entry is one row with: date and time, a type icon and label, a one-line summary, who did it (doctor or staff name), and a status chip. Tapping a row opens the original record (the real screen, not a copy).
1. Appointments: booked, completed, cancelled, no-show, rescheduled (show the chain: moved from X to Y). Include reason and who booked it.
2. Visits: chief complaint, diagnosis, clinical notes, attending doctor, finalised or draft.
3. Treatments: tooth number, procedure, date, status (planned, in progress, done), cost.
4. Prescriptions: medicines list, date, doctor. Open the original and reprint it with the original date.
5. Bills and payments: bill number, amount, discount, payments, refunds, advances, balance due.
6. Files: X-rays, scans, clinical photos, signed consent forms. Show a thumbnail or file type, open in the viewer.
7. Medical history and allergy changes: what changed, when, by whom (old value to new value).
8. Consents given or withdrawn (privacy notice, treatment consent), with date.
A pinned summary strip at the top: first visit date, last visit date, total visits, active allergies and medical alerts, total outstanding due, next appointment.

## FILTERS AND SEARCH
Filter chips: All, Visits, Treatments, Prescriptions, Bills, Files, Appointments. A date range filter. A tooth filter (show everything for tooth 36). Search by procedure or diagnosis text. Filters never hide the pinned summary.

## PERFORMANCE
Cursor-based pagination (load 30 entries, "load more" or infinite scroll). A patient with 10 years of history must open in under 1 second on the clinic PC. Do not load all records at once. One API endpoint returns a merged, sorted feed; add the needed indexes. Test with the seeded fake data.

## PERMISSIONS (enforced in the API, not only hidden in the UI)
Doctor: sees everything.
Receptionist: sees a read-only version with basic details, appointments, bills, payments, dues, and scan and consent files. Receptionist must NOT receive clinical notes, diagnosis, tooth chart, restricted medical information, X-rays or clinical photos, even if the UI is bypassed. The API filters these entries out before sending. Medical alerts show as an icon only. Add API permission tests that call the endpoint as receptionist and assert none of the hidden types appear.

## ARCHIVED AND INACTIVE PATIENTS
Archiving only hides a patient from default search. The full history stays viewable by the doctor (and the permitted receptionist view). Add this to the 2.1.8 acceptance criteria and add a test.

## DATA RULES
Nothing in history is ever hard-deleted. Finalised visits are read-only; corrections are shown as an amendment entry with who and when. Cancelled or voided bills still appear, marked as cancelled. Every history view of a patient by staff is written to the audit log (who opened which patient, when).

## PRINT AND EXPORT
A "Print history summary" button (doctor only) that prints a clean A4 summary: patient details, allergies, and a table of visits and treatments. English only. No export of raw data to the receptionist.

## EMPTY AND EDGE STATES
New patient with no history: friendly empty state with "Add first appointment". Patient with only an old paper record: allow a doctor-only "Add past record" note (date, text, optional scan) so old paper history can be recorded, labelled "Added later".

## BUILD IN STAGES (do not wait for Phase 6)
Stage 1 (Phase 3, next to 3.5.9): tab shell, the merged feed endpoint, pagination, summary strip, appointments, visits, treatments, files, medical changes, permissions and archived-patient test.
Stage 2 (Phase 4): prescriptions in the feed, open and reprint.
Stage 3 (Phase 5): bills, payments, refunds, dues in the feed.
Stage 4 (Phase 6 or when time allows): filters polish, tooth filter, print summary, "Add past record".
Each stage must keep working if later stages do not exist yet (a source with no data simply shows nothing).

## ACCEPTANCE
1. A patient seeded with 10 years of fake history opens the History tab in under 1 second and shows entries newest first.
2. Every type in WHAT IT SHOWS appears once its module exists, and each row opens the real record.
3. Receptionist API response contains no clinical notes, diagnosis, tooth chart, restricted medical info or X-rays (tests prove it).
4. Archived patient history is fully viewable.
5. Layout works at 360, 768 and 1366 px; keyboard accessible; English only.
6. pnpm check passes.

## PLAN TASK IDS (hours: S=1, M=3, L=6)
| Stage | Phase | Task | Size | Hours | What |
|-------|-------|------|------|-------|------|
| 1 | 3 | 3.5.11 | M | 3 | History tab shell + pinned summary strip (S04/S17); empty state |
| 1 | 3 | 3.5.12 | L | 6 | Merged feed API, cursor pagination, indexes, audit on history view |
| 1 | 3 | 3.5.13 | L | 6 | Stage-1 sources: appointments, visits, treatments, files, medical/allergy changes, consents |
| 1 | 3 | 3.5.14 | M | 3 | Receptionist API filter + permission tests |
| 1 | 3 | 3.5.15 | S | 1 | Archived patient history viewable; extend 2.1.8 acceptance + test |
| 2 | 4 | 4.2.8 | M | 3 | Prescriptions in feed; open and reprint with original date |
| 2 | 4 | 4.4.3 | L | 6 | Certificates in feed; open and reprint; receptionist cert_no only |
| 3 | 5 | 5.3.16 | M | 3 | Bills, payments, refunds, advances, dues in feed |
| 4 | 6 | 6.7.1 | M | 3 | Filters polish: chips, date range, tooth filter, text search |
| 4 | 6 | 6.7.2 | M | 3 | Print history summary A4 (doctor only) |
| 4 | 6 | 6.7.3 | M | 3 | Doctor-only "Add past record" note (Added later) |

Stage totals: Phase 3 +19 core h; Phase 4 +3; Phase 5 +3; Phase 6 +9. New core hours overall: **+34**.
