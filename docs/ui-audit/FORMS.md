# FORMS: form-by-form review

Labels: [seen] [code]. Screenshots under `screenshots/`. IDs refer to AUDIT.md. Forms were exercised empty, partially filled, with validation errors, and filled, where listed.

## General observations
- **Good [seen]:** labels above fields; helper text under fields; errors are plain sentences in red under the field ("Enter the name.", "Enter a mobile number, or tick 'No mobile'."); first field focused; 48 px controls on the shared module; primary button at the bottom; Save disabled until something changes (Settings).
- **Problems:** two visual families of input: the shared `ui/form` (rounded, 12 px) and raw native controls (square, thin black border): date pickers, medicine search, History filters, Chart dropdowns, payment form (M2). Date entry is two different widgets (typed `DD/MM/YYYY` in New patient and Book; native picker elsewhere). Multi-line boxes use a monospace font. Error summary is absent: on a long form the first error can be off-screen after Save (not tested on phone).

## 1. New patient `/app/patients/new` (S03/S16)
Screenshots: `patients/new-empty-laptop.png`, `patients/new-validation-laptop.png`, `patients/new-phone.png`
- **Order now:** Patient no. (read-only), Full name, Gender, Date of birth or Age, Mobile, No mobile, [More details], Notice and consent (3 checkboxes), Save patient.
- **Required:** name, gender (pre-set), DOB or age, mobile or "No mobile". **Optional (hidden under More details):** other mobile, area, guardian name/relation/mobile (required under 18), contact owner, emergency contact, old register number, notes.
- **Validation [seen]:** all three errors shown at once, each under its field; age field repeats the DOB error. Duplicate check by name+mobile ran (screenshot not reviewed: no banner seen).
- **Conditional logic:** guardian "Required under 18" appears when DOB < 18 [code].
- **Problems:** gender default "Female" (M3); DOB box taller than neighbours with placeholder AND helper both saying DD/MM/YYYY; "Patient no." box occupies a whole row for a value nobody edits; consent section is three bare checkboxes with identical weight and "Promo messages (off by default)" mixed with legal acknowledgement; 13 px checkboxes (M9); narrow column leaves most of the screen empty at L.
- **Ideal:** Name, Mobile (with No mobile link), then Gender and Age/DOB on one row. Patient no. as a quiet chip in the page header. Under-18 asks guardian inline. Consent as one card: "Privacy notice given" (default unticked), "Allow SMS reminders"; promo off and moved to More details. Primary button "Save patient"; secondary "Save and book" (one flow for new walk-in).

## 2. Walk-in dialog (Today) 
Screenshot: `today/walkin-dialog-laptop.png`
- **Fields:** Patient (search), Visit type, Emergency checkbox. **[seen]:** good, small, 2 buttons. Checkbox sits above its label (M8).
- **Ideal:** if the search finds nobody, offer "New patient" inline.

## 3. Book appointment dialog
Screenshots: `appointments/book-dialog-laptop.png`, `appointments/book-dialog-phone.png`
- **Order:** Patient, Visit type, Date, Free times, Note ("What they said on the phone").
- **[seen]:** Book is disabled until valid. Empty state missing when no time is free (M8). Free times are a list below (not visible in screenshot because none free).
- **Problems:** Date is a typed text box here and a native picker on the page behind it; label "What they said on the phone" assumes a phone booking.
- **Ideal:** Patient, Visit type, then date strip (today + next 6 days) and time chips; Note labelled "Note (optional)".

## 4. Visit notes (draft visit) 
Screenshots: `visit/draft-laptop.png`, `visit/finalised-laptop.png`
- **Fields:** Chief complaint, History, Exam, Gums, Advice, Next visit note, Vitals (BP sys/dia, pulse), then Diagnosis (search + tooth + Add).
- **[seen]:** autosaves (chip "Saved"); quick phrases via ";"; all optional.
- **Problems:** C2 (procedures not here); no required field, so Finalise on an empty visit is allowed (it warns only about diagnosis); equal visual weight for rarely-used fields (Gums, Vitals); read-only finalised form still draws every empty box (M7); "Tooth (FDI)" box prefilled with 36 as a placeholder looks like a value.
- **Ideal:** Complaint and Findings side by side, chart and procedure chips beneath, Advice and Next visit as chips (In 2 / 4 / 6 weeks / Pick date), Vitals and Gums behind "More". See S05.

## 5. Finalise confirmation
Screenshot: `visit/finalise-confirm-laptop.png`
- **[seen]:** title "Finalise this visit?", sentence on read-only, warnings inline in the same sentence ("Warnings: No diagnosis is recorded yet."), buttons Keep editing / Finalise. Right pattern for an irreversible step. Warnings should be a list (so "no procedures" can be added, C2) and the destructive-looking button should say "Finalise visit".

## 6. Medicines / prescription (Medicines tab)
Screenshot: `visit/medicines-tab-laptop.png`
- **Fields:** medicine search (Enter to add), Copy previous, Issue, quick sets, table (Medicine, Dose, Freq, Days, Total), Advice, Follow-up date, Weight.
- **Problems:** unstyled search and date inputs (M2); "Issue" greyed with no reason; the table header exists with no rows, so the empty state reads as a broken table; Weight in a prescription form is unexplained.
- **Not tested:** adding a medicine, issuing (blocked by C1 for the doctor flow).

## 7. Take payment (profile Billing tab)
Screenshot: `patients/profile-billing-laptop.png`
- **Fields:** Amount, Mode (select: cash/upi/card/bank/cheque/other), Reference ("Short ref only"), "Split with a second mode", buttons Record payment / Full balance / Half.
- **[seen]:** all on one cramped line with native controls; "Full balance" and "Half" appear as sibling buttons of the primary action. Recording 500 on a 2,500 bill updated the balance to 2,000 (works); no toast seen.
- **Ideal (S09):** Amount field with "Full balance" and "Half" as chips under it, Mode as chips (Cash, UPI, Card, More), Reference appears only for non-cash, one primary "Record payment", confirmation toast with receipt link.

## 8. Daily cash close and Monthly export (Billing home)
Screenshot: `billing/dues-laptop.png`
- **Fields:** Day, counted cash, note (required if difference), Close day; Month, Download CSV.
- **Problems:** labels left of inputs in small text; native date/month pickers; "Close day" disabled; blocker reason ("2 open appointments must be finished, marked no-show, or cancelled") is above, not next to the button. A dangerous, once-a-day action sits below a long dues list.
- **Ideal:** own "Day close" tab: expected cash (big), counted cash, difference live, note appears only if difference, button states the blocker.

## 9. Settings > Clinic details
Screenshot: `settings/clinic-details-laptop.png`
- **Fields:** 13 in one column: clinic name, tagline, kind of clinic, address, phone, email, Instagram, doctor name, qualifications, speciality, extra line, registration number.
- **[seen]:** helper text with an example under every field; Save disabled until edit; registration number says "Required before Rx or certificate print".
- **Problems:** no grouping (clinic vs doctor); labels describe layout ("under the tagline"); helper lines double the form length; sample values ("Sample address - set in Settings", phone 0000000000) look like real data on a printed bill.
- **Ideal:** two cards "Clinic" and "Doctor" (6-7 fields each), two columns at L, helper text only on hover/focus except for required hints; show a live letterhead preview.

## 10. Other forms (not exercised)
Certificates new, consents, patient request close, staff add/reactivate, number series, timings, billing settings, history "Add past record", plan items, refunds, discounts: **not exercised** in this audit. Re-audit with the checklist.
