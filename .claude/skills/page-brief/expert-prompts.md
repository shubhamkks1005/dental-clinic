# Expert prompts: what to add that the owner did not say

Use these to find missing things for ANY page. Each hit goes into the brief marked "ADDED BY AI: <reason>". Take facts from the project docs (AGENTS.md, SPEC.md, PRODUCT_DESIGN_CONTEXT.md), do not invent rules.

## Ask about every page
1. What will the user try in the first 5 minutes? Can they do each of those things from this page?
2. What is the worst thing that could go wrong on this page (wrong patient, wrong money, missed allergy, lost note)? What prevents it?
3. What does the user need to see to decide, without opening another page?
4. What would make a tired person at 6 pm make a mistake? How does the page stop it?
5. How do I find one item among many (search, filter, sort, date, status)? How do I get back to where I was?
6. What happens with zero, one, and two hundred items?
7. Who else changes this at the same time (desk and doctor), and what do they see?
8. Is there a way to undo, a confirm for risky things, and a record of who did what?
9. What is the next thing the user will want to do, and is it one tap away?
10. What does it show to a role that must not see something (receptionist and clinical data)?

## Dental-clinic domain (check against the project docs)
- Patient flow of one chair: Booked, Arrived (waiting), In chair, Done; also Missed (no-show after a delay), Cancelled, Rescheduled; walk-ins and emergencies jump the queue; late arrivals; breaks.
- A patient is identified by name, patient code (P-000123), mobile, age/gender. Duplicates and family members sharing a mobile are real.
- Medical alerts and allergies must be impossible to miss where a clinical decision or a medicine is chosen. The receptionist sees only that an alert exists, never its details.
- A visit is a draft until finalised; a finalised visit, prescription, bill and certificate are locked and corrected only by an addendum or a new version.
- Teeth use FDI numbering (11-48); treatments are per tooth and surface; there are treatment plans with phases and estimates.
- Prescriptions use the doctor's own medicine list only (no dose calculator, no interaction engine, no suggestions): search the doctor's list, add a medicine to the list from the prescription, dose, frequency, days, timing, advice, issue, print, copy the previous one.
- Money: integer paise, shown as rupees; bills are locked after issue; discount needs the doctor; refunds and voids need a reason; payments are only reversed, never edited; advance, dues, partial payment, receipt, day-close (cash expected in the drawer), numbers without gaps per financial year; GST is off by default.
- Messages: reminders and confirmations by SMS/WhatsApp must not contain health information; consent for reminders; dry run in testing.
- Consent forms (printed, Hindi with an English title), privacy notice at registration.
- Times are IST; the clinic has opening hours, lunch, holidays, a slot length and one chair; booking has limits (days ahead).
- Everything on screen is English; printed consent forms are the one Hindi exception.
- Every change to patient or money data is audited; delete is soft only.

## Common things people forget (check each)
Search; filter; sort; date picker or date strip; pagination or "show more"; counts and totals; status words with meaning (never colour alone); print/export; undo; confirm for destructive actions; "saving..." and failure messages; unsaved-changes warning; keyboard use; phone layout; empty state with a next step; error state with a retry; loading skeleton; offline notice; who did it and when; notes/comments; attachments (X-ray, photos, documents); link to the patient profile; link to the bill; reminders and follow-ups; shortcuts for the most frequent action; the "next" patient or next step; what changed since last time; permissions message for the wrong role; very long names and notes; a patient with no mobile; a patient with a balance due; a patient with an alert.
