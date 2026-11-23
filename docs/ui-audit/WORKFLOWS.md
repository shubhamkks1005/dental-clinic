# WORKFLOWS: end-to-end tasks

> **Read first:** the first version of this file was written from single screens plus code reading, not from complete runs. Real runs are now in [flows/](flows/README.md) (G01 new patient to payment, G02 second visit, B02 cancel/reschedule, H01 messages, A02 registration edge cases, D02 refund/cancel). Where they disagree with this file, the flow files win. W2, W3, W5 below are partly guesses; W1 is superseded by G01.

Labels: [seen] = walked in the browser; [code] = read only. IDs refer to AUDIT.md. Two users: the **doctor** (not technical) and the **receptionist** (daily user). Steps are what the user does.

## W1 Doctor: see the patient, record, prescribe, finalise, hand over for billing
Start: Today. Goal: finish a visit so the receptionist can bill it.

**Current [seen]**
1. Today > "Open visit". **Fails today (C1: 400 "Invalid input...").** With the fix: opens the visit and marks the appointment In chair.
2. Tab "Today's visit": type complaint, history, exam, gums, advice (autosave).
3. Tab "Chart": click a tooth surface, choose a condition, choose a procedure, "Add procedure". (Procedures live only here.)
4. Add diagnosis (back on tab 1, below the fold).
5. Tab "Medicines": search, add, Issue.
6. "Finalise visit" (top). Confirm dialog.
7. Visit locks. Buttons: "Create bill", "Next patient". If no procedures were added, "Create bill" fails with an error message (C2).

**Friction:** the visit is split over 4 tabs and the order you must work in (chart before billing) is not hinted; procedures and diagnosis are in different places; Finalise is at the top while the last thing you do is at the bottom; the dialog does not warn about missing procedures; after finalising there is no obvious way to add the missing procedure (an addendum may be the answer: unverified); "Next patient" is ambiguous (next in queue? next appointment?).
**Errors likely:** finalising with no procedures; forgetting Issue after adding medicines (not verified).

**Ideal**
1. Today > tap the patient (whole row). Visit opens with alerts at the top.
2. One screen: complaint + findings, chart with procedure chips, next-visit chips (S05).
3. "Write prescription" opens the medicines panel in place; "Print" next to it.
4. A single "Finalise" bar fixed at the bottom with a live checklist: diagnosis, procedures, prescription.
5. After Finalise: "Done. Sent to billing" and the next waiting patient is offered; the receptionist's Today shows "Ready to bill".

## W2 Receptionist: patient arrives and is billed
Start: Today. **Current [seen] / [code]:**
1. Patient arrives: row on Today > "In chair" (or "Send in" on the Next patient card). (Status vocabulary clash, H10.)
2. After the visit: the doctor finalises. Receptionist opens the patient > Visits > the visit > "Create bill" (receptionist has no Visits tab on the profile: [seen] tab list is Overview, History, Appointments, Billing, Files, Messages). She must use Billing or History. Exactly where to start a bill is **not obvious**; Billing nav has no "New bill" (H3). Not walked end to end: C2 blocked the one visit tried.
3. Take payment on the profile Billing tab (cash/upi...), print receipt.
**Friction:** bill creation hides behind the doctor's visit page or the history feed; Billing nav leads to a list of debts; no "Ready to bill" cue on Today.
**Ideal:** Today row turns into "Bill" (as S01) once the visit is finalised. Bill screen = S09: items prefilled from the visit, pick mode chip, amount, "Save and print receipt". Two taps from Today.

## W3 Receptionist: take a phone booking
**Current [seen]:** Appointments > Book > search patient > visit type > date > pick time > note > Book. After booking the calendar jumps to the date and shows a toast (FIXES #3, [code]; not completed in the browser). If the patient is new: leave the dialog, New patient, save, return, Book again.
**Friction:** a new caller means leaving the dialog; no Book button on the patient profile (receptionist); date typed in a text box; no empty-state message when today has no free time (M8).
**Ideal:** Book dialog offers "New patient" inline; patient profile has "Book"; time chips for the chosen day.

## W4 Receptionist: register a new patient who is waiting
**Current [seen]:** "+ New patient" (always visible) > form (name, gender, DOB/age, mobile) > Save. The screen has a "Walk-in now" action [code: NewPatientScreen.tsx]. 4 required fields, no more than 8 interactions. Good.
**Friction:** gender pre-selected (M3); after saving, where you land was not walked (not verified).
**Ideal:** "Save and add to today's queue" as a second button.

## W5 Receptionist: collect an outstanding due
**Current [seen]:** Billing (nav) > dues list > open the patient link > Billing tab > amount > mode > Record payment. Or "WhatsApp reminder" / "Add call note" from the dues row.
**Friction:** the dues list rows do not take payment (7 clicks vs 3); WhatsApp reminder wording and effect unknown to the user; the profile Billing tab is the only place that records money and is the most unstyled screen (H2).
**Ideal:** "Take payment" button on each dues row opening the S09 payment card; chip for mode; receipt toast.

## W6 Find a patient
**Current [seen]:** top-bar search (name, mobile or number, shortcut "/") from any screen; Patients page also has its own search (M4). Search accepts the number, name and mobile per DESIGN.md. Results dropdown and empty state were captured but not reviewed.
**Ideal:** one search, result rows show number, age, mobile, last visit and a due flag.

## W7 Print a document
**Current [seen]:** buttons on bill, statement, prescription, history, consent open `/app/print/...` with Print/Back and (consent) a Template picker. Output follows the letterhead. The printed bill leaks internal text (H4).
**Friction:** the Print screens have a different chrome from the app (no sidebar): fine; "Back" returns to the previous page (not verified).
**Ideal:** one "Print" menu on patient/visit/bill pages listing every relevant document.

## W8 Doctor changes a setting (e.g. clinic details)
**Current [seen]:** Settings > left menu > Clinic details > edit > Save. Save is disabled until a change. Good. Leave-without-saving guard exists. Finding a particular setting depends on the settings search or knowing the menu name (20 items).
**Ideal:** group menu into 5 headings, show a letterhead preview beside Clinic details.

## Cross-workflow friction
- **Role context is invisible.** The two roles see different Todays, tabs and buttons with no cue. A "Signed in as Receptionist" appears only in the sidebar card.
- **Dead ends:** C1, C2, dead Walk-in (H1).
- **Back-and-forth:** every action starts from the patient, so the receptionist re-searches the same patient for booking, billing and printing.
- **Remembering:** the user must remember that procedures must be entered before finalising (C2).
- **Confirmations:** only Finalise (and Settings leave-guard) were seen. This is a light, appropriate use.
- **Feedback:** autosave chip and a toast after booking [code] are good; payment recorded showed the new balance but no toast or receipt link [seen].
