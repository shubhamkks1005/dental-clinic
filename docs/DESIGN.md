# DESIGN (look and feel; the AI follows this for every screen)

Clinic: Align Dentistry, Dr. Nidhi Kushwaha (orthodontist), Jhansi. Logo: the owner uploads it in Settings; until then use the tooth mark from the mockups.
Mockups: one PDF, docs/design/align-dentistry-screens.pdf. Each screen has a caption like "S05 Visit". Live copy: https://claude.ai/artifact/CnKoEkWUgm3qe5hEDf3M4z (owner only).
All names, numbers and amounts in the mockups are fake sample data. Build screens to look like these. Do not invent a different style. If a screen is not in the mockups, copy the closest one and say so.
The mockups are reference only and will be revised later. If a newer PDF replaces the old one, the newer PDF is the source of truth.

## Screen map (caption in the PDF -> real screen)
Laptop (1366 px wide):
- S01 Today: staff home, queue, next patient. The doctor's Today follows its own final design: docs/design/final/doctor_today.html (PLAN Part T, apps/web/src/features/today/doctor/).
- S02 Patients: patient list with search.
- S03 New patient: form with the read-only patient number box.
- S04 Patient profile: tabs, payments card, braces progress.
- S05 Visit: tooth chart (FDI numbering). A visit stays a draft until the doctor finalises it.
- S06 Treatment plan: braces steps, adjustment log, fees and instalments.
- S07 Book appointment.
- S08 Appointments: week calendar.
- S09 New bill and receipt: items, payment mode, balance.
- S10 Reports: carries a "Sample data" label until real data exists.
- S11 Messages: SMS reminders, with a "Test mode is ON" bar while MESSAGING_MODE=dry_run.
- S12 Settings: clinic details, logo, doctor details.
Print:
- S13 Prescription: the printed A5 prescription (the page is also called "Parcha" in old notes; always call it "Prescription" in the app and on paper).
Phone (390 px wide):
- S14 Today. S15 Patients. S16 New patient. S17 Patient profile.
- S18 Patient portal sign in. S19 Patient portal home (read only, phone first).
Staff login is the Cloudflare Access page; do not design one.

## Patient number
- Every patient gets one unique number, format P-000412 (prefix and digits come from Settings, default "P-" and 6 digits). It comes from the counters table inside the same db.batch() as the patient insert, so two people saving at once never get the same number. It is never reused and never edited, even if the patient is deleted.
- The new patient form shows "Patient no." as a read-only box with the next number and the text "Assigned automatically when you save". The real number is assigned on save; the number shown before saving is only a preview.
- Show it as a soft-blue chip (#E6EEFA, text #163C80, bold) wherever the patient appears: list column "Patient no.", profile header, visit, bill, receipt, prescription, portal home, next-patient card on Today.
- Search accepts the number, the name and the mobile number. Typing "412" or "P-000412" finds the patient.
- Staff say "patient number" to the patient; the patient can quote it on a phone call.

## Colors
- Brand blue (from the clinic card): #1E4FA3 (buttons, links, active). Dark navy: #0F2A5C (sidebar, headings). Hover: #163C80. Soft blue: #E6EEFA (selected rows, patient number chip). Focus ring: #CFDDF5. Brand red: #C8202A (clinic name only; never for buttons). Secondary teal #0B7A75 only for calendar colour coding.
- Page background: #F3F6F7. Cards: #FFFFFF with 1px border #E3E9EE. Text: #0E1B2B. Muted text: #5B6B7B.
- Status: done green #14532D on #DCFCE7; in-room blue #1E3A8A on #E0E7FF; waiting amber #78350F on #FEF3C7; emergency orange #9A3412 on #FFE4D6; upcoming grey #334155 on #EDF1F4.
- Text must have contrast of at least 4.5:1. Never use colour alone to show a status (always a word too).

## Type and shape
- Font: Inter (400, 500, 600, 700). Page title 26px/700, card title 16px/700, body 14px, small 12px.
- Rounded corners: cards 16px, buttons and inputs 12px, badges fully round.
- Spacing in steps of 4 px (8, 12, 16, 20, 24). Input and button height 48px (44px minimum tap target).

## Layout (responsive: 360, 768, 1366 px)
- Phone (up to 767 px): one column, bottom tab bar (Today, Patients, Calendar, Billing, More), round "+" button for new patient.
- Tablet (768 px up): top tabs, two-column cards.
- Laptop (1366 px up): dark navy left sidebar 232px with 7 items (Today, Patients, Appointments, Billing, Messages, Reports, Settings), search bar and "+ New patient" at the top, content in cards.
- Every screen has one main job and one main button.
- Finalised records (visit, prescription, bill) show read-only with a "Finalised" badge and an "Add note" action instead of Edit.

## Words
- All UI text and printed documents are in English only. No Hindi, no Hinglish, no translation system. Exception: printed patient consent forms are Hindi (owner decision 2026-11-23); see DECISIONS.md.
- Short, plain labels the receptionist uses daily (Today, New patient, Walk-in, Send in, Waiting). Errors are plain sentences: what happened, what to do.
- Patient portal says "Call the clinic" for anything the patient wants changed (it is read only).

## Print
- Prescription: A5, white header (prints well in black and white): logo tile, clinic name in red, tagline in blue, doctor details on the right, a navy rule with the address and phone below. Then patient strip (patient, age and gender, patient no. in bold, mobile, date, visit type), Rx table, advice box, doctor signature at the bottom.
- Clinic name, tagline, doctor name, qualifications, registration number, address, phone and medicine names come from Settings. Nothing is hard-coded.
