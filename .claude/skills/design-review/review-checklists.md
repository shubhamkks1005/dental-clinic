# Review checklists

Use the sections that match the page. Every question is "does the design allow this, and if not, is it needed for this page's purpose?" Do not list a point unless it matters here.

## A. By page type

### List or queue pages (patients, appointments, bills, messages, requests)
Search (name, mobile, code); filters that match how staff think (status, date, who); sort; counts and totals; paging or limits (never an endless unbounded list); row shows enough to decide without opening; one main action per row and a place for the rest; empty state with a next step; error and retry; loading skeleton; "what changed" or last updated; bulk actions only if really needed; keyboard and phone layout; open the record from the row; the patient's alert or due mark where it matters.

### Detail pages (patient profile, a bill, a visit)
Who and what this is (name, code, status) always visible; the most used action at hand; related records (visits, bills, prescriptions, files); history/audit (who changed what and when); locked/finalised state shown and why; back to where they came from; print/export if the paper world needs it; alerts and dues visible; what to do next.

### Forms (register, book, add medicine, record payment)
Required vs optional clear; the right input for each field (Indian mobile, age or date of birth, money); validation message next to the field in plain English; duplicate check where duplicates are likely; save, cancel and "saving..." states; protection against double submit; unsaved-changes warning; defaults that save time; what happens after save (where do they land); error from the server shown plainly; keyboard order; phone keyboard type.

### Dashboards and reports
Each number: what it means, over which dates, compared to what; click to see the rows behind it; date range; empty period; money in rupees from paise; who may see it (doctor full, receptionist today's summary only); loading and failure per block.

### Scheduling (calendar, booking, queue)
Clinic hours, lunch, holidays, slot length, one chair; double booking prevented; overbook only for emergencies with a reason; past times; reschedule keeps history; cancel and missed need a reason and can be undone for a time; walk-ins; late arrivals; breaks; "today" at a glance; how far ahead booking is allowed.

### Clinical pages (visit, prescription, tooth chart, plan, certificate)
Patient identity and medical alerts always in view; draft vs finalised; finalise is deliberate and says what locks; corrections by addendum; doctor-only data hidden from the receptionist; the doctor's own lists (medicines, procedures, diagnoses) with search and "add to my list"; prescription: medicine search, dose, frequency, days, timing, advice, copy previous, issue, print, "written but not issued" visible; tooth chart FDI numbering and surfaces; plan items with estimate and phase; certificate with dates and signature method.

### Billing and money pages
Totals recomputed on the server; discount asks the doctor; issued bills are locked and cancelled only with a reason (receptionist asks the doctor); payments by mode with a short reference; part payment and advance; dues list with last call; refund path; receipt and bill print; day close with cash expected; numbers shown without gaps; never edit a payment, only reverse; every figure traceable.

### Search and pickers
Debounce, no results, many results, recent items, keyboard navigation, selecting by Enter, clear, the right fields searched, the item shows enough to avoid choosing the wrong person (name and code and mobile).

### Settings and lists
Who may edit; versioned values; validation; what changes after saving; reorder and active/inactive instead of delete; history of changes.

## B. By situation
First visit of a new user; the busiest hour; a tired user at the end of the day; a wrong click (how to undo); a slow or lost connection; two people on the same record; a patient with no mobile, a very long name, many alerts, a big balance; a closed day; the doctor on a break; a finalised record that needs a fix.

## C. Project rules that a design must not break (read AGENTS.md and docs/DECISIONS.md for the full list)
- The receptionist never sees clinical data (diagnosis, notes, tooth chart details, prescription content). She may see that an alert exists.
- No health information in SMS or WhatsApp text.
- Money is integer paise and shown as rupees; totals are computed on the server; finalised records are never edited; payments are reversed, never edited; delete is soft only; every change to patient or money data is audited.
- English only on screens and printed documents (the printed consent forms are the Hindi exception).
- Prescriptions use only the doctor's own medicine list; no dose calculator, no interaction checker, no automatic suggestions.
- No public website, no online payment, no multi-clinic, no third-party analytics.
- Every screen works at 360, 768 and 1366 px; touch targets 44 px; no sideways scroll; status is never only a colour.
- One rule in one place: the same status words, patient code, money and date formats as the rest of the app.
- The status machine of appointments is fixed: Stepped out, Late and queue order are flags, not new statuses.

## D. Typical logic mistakes to look for
A page that shows a number nobody can act on; an action with no result message; a destructive button next to a harmless one; the main action hidden; a list with no search; a form that cannot be cancelled; data that cannot be found again; a flow that ends nowhere; two controls that do the same; a control that does something the user's role may not do; a status that cannot be reached or left; a money figure with no source; a count that does not match its list; text that assumes data that may be empty.
