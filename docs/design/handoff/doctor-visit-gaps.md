# Doctor visit: gaps between docs/design/final/doctor_visit.html and the live page (audit 2026-11-26)

Method: the design HTML was opened in Chromium (1440 x 1024, fonts and Tailwind from the internet) and the live page
/app/visits/:id was opened with the same fake data (Karan Yadav, marks on 24/36/46, 1 diagnosis, 1 procedure, 3 medicines,
complaint, findings, 3 files). Both were clicked state by state and compared by eye. Screenshots were in the session
scratchpad (cmp folder), not in the repo. Nothing was changed yet. The owner wants an EXACT copy: same look, colours,
fonts and motion; what the design does not have must not be added.

Status of each item: TODO = not applied. Ask = needs an owner answer first.


## STATUS (updated 2026-11-26 night, after the apply session 1)
Rule taken from the owner: exact design, what the design does not show is not built. Frame decision (owner did not answer): the
design frame applies on the visit page only (body.vd-page, set by DoctorVisitPage); other pages are untouched.
- DONE and compared in the browser: A1 A2 A3 A4 A5 A6 A9 A10, F1 F2 F3, J6; A8 only for card 3 (green or amber pill).
  Commits: b99caaf (A1-A6) and the next one (A8 card 3, A9, A10, F1-F3, J6).
- NOT DONE (next sessions, in this order): B1-B8 (tooth chart, the big one: replace the old chart view by the design tiles,
  affected cards, tooth card, past-chart behaviour), D1-D5 + J3-J5 (prescription card: compact lines, Adjust, issued state),
  C1-C4 + J1 J2 J7 J8 (diagnosis card details), E1 E2 (files card), H1-H4 + J9-J12 (X-ray viewer look), A8 for cards 1, 2, 4, G1.
- Deliberate deviations kept until the owner says otherwise: G1 the Finalise confirm dialog stays (finalise cannot be undone);
  the design Doctor | Receptionist switch is a demo and is not built; A7 the page still reopens the card used last (first open = card 1).
- Known test debt: e2e/visit-doctor-lines.spec.ts was edited for the new sheet but was NOT run (port 8787 is the owner server).
  The unit checks (pnpm check) pass.
- The scratch test server for this work runs on port 8790 with a copy of the local DB in the session scratchpad. Stop it when done.

## A. Whole page (look)
- A1 Fonts: design = Instrument Sans (body), Wix Madefor Display (headings), Spline Sans Mono (codes). Live = Inter everywhere.
- A2 Base: design body 16 px, bg #F8F9FB, text #191C1D. Live body 14 px, text #0E1B2B.
- A3 Sidebar (design): 240 px, group labels CLINIC (Today, Patients, Appointments, Billing, Messages) and PRACTICE (Reports,
  Library, Settings), small items, active item has a soft pill, user card at the bottom without a Sign-out button.
  Live: 232 px, no group labels, bigger items, Sign out button. This is the shared app frame (Ask: all pages or only this one).
- A4 Top search bar: design has none. Live has it (shared frame, same Ask).
- A5 Header (design): back button, name, "24 yrs · Male", P-code chip, right side the text "Smart Collapsible Accordions"
  (looks like a demo label, Ask) and a "+ Add file" button. Live: no right side.
- A6 Alert chips row under the header (design): Allergy (red), BP/diabetes/blood thinner, Dues (red), Follow-up late (amber).
  Live: only a "BP: 128/82" chip.
- A7 Accordion default: design opens card 1 (Tooth Chart). Live opens the card the doctor used last (card 4 in the test).
- A8 Summary line of each card: design "3 marked · 2 today" (green pill), "1 diagnosis · 2 procedures · Rs 3,700",
  "3 meds · Draft" (amber pill), "4 files · Next: In 2 weeks". Live: plain text ("24 Caries · 36 Caries RCT ...",
  "1 diagnosis · 1 procedure", "Draft", "3 files").
- A9 Bottom bar: design "Saved 10:42 AM" with a cloud icon + green "Diagnosis done ✓" "Procedures done ✓". Live: pills without icon,
  plus a long amber "Prescription is a draft · Open it" pill that the design does not have (Ask: owner Q10 wanted a warning).
- A10 Dock bubble icon: design = notes/checklist icon, live = pencil.

## B. Card 1 Tooth Chart (biggest gap, live uses the OLD chart component)
- B1 Header pill "3 marked · 2 today" and, on a past chart, "1 marked (Read-only)".
- B2 Row: "Chart as of" select, Dentition button (tune icon, "Permanent ▾"), "Mark: Deep cavity ▾" (red), Undo (icon), Save (icon),
  all 44 px high with icons. Live: small text buttons, "Saved" text, no icons.
- B3 Dentition menu: 3 rows Primary (51-85), Mixed, Permanent (11-48), selected row tinted. Live: menu did not open on click.
- B4 Condition menu: panel "Apply condition" + "Surface only (O/M/D/B/L)", chips Cavity, Deep cavity, Filling, Root canal,
  Crown, Missing, Impacted, Clear, each with a 3-letter code (Cav, Deep, Fill, RCT, Crn, ×, Imp, Clr) and its own colour.
  Live list is different (Caries, Filling, RCT, Missing, Crown, Bridge, Extracted, Implant, Fracture, Mobile, Impacted,
  Root stump, Sensitivity) shown as a legend below the chart.
- B5 Chart: a framed box "Patient's Right | Midline | FDI (Tap tooth to mark) | Patient's Left", two rows of compact tooth tiles
  (46 x 44) with the FDI number inside, 16 per row with a midline, marked tooth shows a dot, RCT shows a small badge.
  Live: "Tooth chart / R (patient's right) · FDI · Arrows move · Enter applies caries", bigger tiles with a "W" button under every tooth,
  horizontal scrollbar, legend.
- B6 "Affected teeth & findings" cards (design): one card per marked tooth with a tooth icon, FDI, "Marked today / Marked 08 Nov 2025",
  condition chips coloured (O: Cavity amber, O/D: Deep cavity red, Whole: Root canal blue, O/M: Filling blue). Live: not present.
- B7 Tooth card on tap (design): box "36 · Lower left First molar", chips "Condition: Root canal" "Marked today", line of surfaces,
  "History: ..." line, Close button (red); left a surface pad (B, M, O, D, L with the condition name under each), right "Tooth timeline"
  (rows with date + Today/Check-up link), then clinical note with Edit / Save note / Cancel, Add file, Add to plan. Live: different card.
- B8 Past chart (Chart as of 08 Nov 2025): header shows a "Read-only" pill, mark controls disappear (200 ms fade), hint changes to
  "Hover tooth to inspect", an info bar "Tooth 36 · Healthy (no marks recorded)" appears under the chart, the affected cards show only
  that day's marks, AND the whole page follows that day: Live Rx "Problem teeth" shows only 46, dock texts change
  ("Routine check-up and scaling follow-up" / "46: composite filling intact, no tenderness"), card 2 summary changes
  ("1 teeth linked · 2 procedures"). Check live does the same.

## C. Card 2 Diagnosis & Procedures
Live is close to the design here (built from it). Differences seen:
- C1 Design shows a fee on each procedure ("Rs 2,500", "Rs 1,200") and "Procedures total: Rs 3,700", also in the card summary.
  Live shows no fees (owner answer Q11 = fees only in billing). Ask: keep the owner answer or copy the design?
- C2 Design: RCT line has the badge "From plan: RCT sitting 2" and a field "Sitting 1 of 3"; composite filling has surface buttons
  O M D B L and a short-note field. Live: "Needs more sittings" checkbox (B16 rule) next to the note. Ask: keep?
- C3 Design: "Doctor view only · Manage lists in Settings" link and total at the bottom. Live: not seen.
- C4 Check the search dropdown, Undo toast (6 s), "No diagnosis for this visit" toggle states against the design (not yet clicked).

## D. Card 3 Prescription & Advice (live still uses the OLD medicines panel)
- D1 Design top row: "Draft" pill, "Saved" with icon, a Doctor | Receptionist switch (demo of two roles, Ask), "Copy previous",
  dark "Issue (locks Rx)" button. Live: just a search box and a blue "Issue" button.
- D2 Search: big rounded search with a magnifier chip, plus "Sets only" button. Live: plain input, quick-set buttons
  (After extraction, RCT pain, After scaling).
- D3 Medicine lines: design = compact cards "1. Amoxicillin 500 mg Cap (Mox 500) · 1-0-1 · 5d · After food", "Total: 10 approx." chip,
  Adjust button, trash button. Live: tall blocks with dose / frequency select / days boxes and a Remove button.
- D4 Follow-up date field with a calendar icon at the bottom. Live: hidden behind "More: advice, follow-up, weight".
- D5 Advice field: where it lives in the design must be read from the markup (not yet checked).

## E. Card 4 Files, Vitals & Next Visit
- E1 Design shows only file chips (icon + "X-ray 36 (IOPA) · 22 Nov 2025", "Dummy IOPA #36", "OPG Report (PDF)") and one line
  "BP 128/82 · Follow-up in 2 weeks (6 Dec)". The header has the "+ Add file" button.
- E2 Live adds things the design does not have: "No files yet" + "+ Add file", "Next visit" chips (In 2 weeks, In 4 weeks,
  In 6 weeks, Pick date), "More: history, gums, vitals". Ask: remove or keep (owner said: not in the design = not built).

## F. Right pane
- F1 Tabs: design = small pill group "Live A4 Rx | History" (selected tab white pill) with "Issue Rx" at the right on the same row.
  Live = two full-width underlined tabs, then a row "Live preview of the prescription" + Issue Rx.
- F2 Live Rx sheet (design): full-width letterhead, logo left, clinic block (name red, tagline green italic, "Orthodontic and Dental
  Clinic", phone, email), doctor right (name teal bold, degrees, speciality, former post, Reg.No), DRAFT pill top right,
  patient line with date at the right, "Problem Teeth (only affected teeth printed):" with small tooth icons + numbers, a line per
  tooth, medicines as numbered lines with "℞", Advice, "Consultation Timings" and address with a small QR/logo at the bottom right.
  Live = A5 print layout (grey patient band, "Rx" mark, medicine table, advice box). Made in the session of 2026-11-26 (step 2); it
  does not look like the design. Ask: design sheet for the live view.
- F3 History tab (design): cards. Red "Outstanding Dues ₹1,500", blue "Next Appointment Thu, 27 Nov · 11:00 AM · RCT Sitting 2",
  "Pending Treatment" with pills In progress / Planned, "Previous Medications", "Last Visits" cards (date · tooth, procedure tag,
  Med line, italic Note) and "Files (X-ray & Photos)" chips. Live: plain headings (Dues, Next appointment, Pending treatment,
  Previous medications, Last visits, Files) with one line each.

## G. Finalise
- G1 Design: click "Finalise visit" and the button turns into a grey "Finalised" at once, no dialog.
  Live: a confirm dialog "Finalise this visit?" with warnings and Keep editing / Finalise. Ask: owner Q10 asked for a warning;
  the HTML has none.

## H. X-ray viewer (opened with a file)
- H1 Layout: design = one toolbar row with icons (zoom +/-, 100%, Fit, Full, rotate, Flip H/V, Compare, Undo, Redo, Reset All,
  Download, Print, Save Annotations), header with chip "IOPA · Periapical (JPG)" and date + time, Prev / "1 / 4" / Next, red Close.
  Live: toolbar in two rows, no icons, plain text header with file name.
- H2 Side panel: design = section titles in caps (IMAGE ADJUSTMENT, DENTAL ANNOTATION TOOLS), teal sliders, a compact FDI
  selection with groups "Right (Upper) / Left (Upper) / Right (Lower) / Left (Lower)" and round chips; Live: Permanent/Primary
  toggle and a grid of square buttons, blue default sliders.
- H3 Picture is shown inside a dark rounded frame with margin; live fills the whole area (check with a real image).
- H4 Check not done yet: marks (pen, circle, arrow, text, measure), compare mode, calibrate (owner Q13: mm only after calibration).

## I. Motion (from handoff section 3 and 11; measured 2026-11-26 on the OLD look, re-measure after the rebuild)
Dock 300 ms overshoot, bubble hover 150 ms, edit tools fade 200 ms, X-ray mark buttons 120 ms, tooth lift 150 ms,
tooth-colour change 300 ms (design uses transition-colors duration-300 on tooth buttons), "Saved" flash, Undo toast 6 s.

## J. Second pass (states clicked on 2026-11-26 night: search dropdowns, Undo toast, Adjust, Issued, X-ray compare/measure)
- J1 Undo toast (card 2): design = slim one-line bar (12 px text, small dark "Undo" pill). Live = taller bar with a big Undo button.
- J2 Card 2 status row: design "Draft" pill + cloud icon + "Saved". Live "Draft" + "Saved 2:11 am" without icon.
- J3 Medicine search dropdown (card 3): design = one bordered box, compact rows "Amoxicillin 500 mg Cap (Mox 500) · 1-0-1" with
  an "Enter" hint on the highlighted row. Live = tall bordered cards, bold name left and "500 mg · 1-0-1" right, quick-set buttons below.
- J4 "Adjust" (card 3): design opens an inline row with four labelled fields Frequency / Days / Timing / Instruction and the button
  turns into "Done". Live shows dose, frequency and days fields all the time and has no Adjust button.
- J5 After Issue (card 3): design = green pill "Issued · RX-2026-27-0001", Revise button, dark "Print A5" button with printer icon,
  blue bar "Issued & locked — corrections require creating a new version via Revise.", read-only lines with the Total chip on the right,
  card summary shows "3 meds · RX-2026-27-0001" in a green pill, search box gone. Live = search box stays, plain Revise / Print buttons,
  no info bar, "Status: Issued · RX..." text line.
- J6 Live Rx sheet after Issue: the RX number pill is at the top right in the design, top left in live.
- J7 Procedure dropdown row: design shows the fee at the right ("Rs 1,200"), live shows "Enter" hint (fee rule, see C1).
- J8 "No procedure for this visit" pressed while procedures exist: design shows no red banner (only the pressed look). Live shows a
  red banner "This visit has a procedure. Remove it first..." with Dismiss. Check the design script (toggleNoProc) for the exact rule.
- J9 X-ray viewer: active tool (Pan, Measure) = dark teal filled button in the design; live = light grey filled button.
- J10 X-ray compare: design = two dark rounded frames with pill captions "Previous · 14 Sep 2025" and "Current · 22 Nov 2025 (Sync Zoom & Pan)",
  toolbar button stays teal. Live = plain white text captions, no frames, full-bleed images.
- J11 X-ray measure: design hint "Drag between two points on the X-ray to measure distance (mm)." Live has a calibration block
  ("Set scale from last line", "Known mm") from owner answer Q13. Ask: keep (owner rule) or remove (design).
- J12 X-ray side panel: design note box is dark with light text and a monospace-looking note; live note box is white. Sliders teal in the
  design, default blue in live. Section titles in capitals in the design.
- J13 Not yet checked and still open: X-ray pen/circle/arrow/text marks look, X-ray Prev/Next, tooth hover tooltip text,
  receptionist view of the Rx lock, the "locked banner" of card 2 after Finalise, the dup-procedure notice, keyboard use of the chart.

## Owner questions (answers needed before applying)
1. Shared frame (sidebar and search bar): change all pages or only the visit page?
2. "Smart Collapsible Accordions" text: keep exactly?
3. Live Rx: the design sheet (suggested) or the print layout?
4. Fees on procedure lines and total (C1), "Needs more sittings" (C2), Next-visit chips and vitals (E2), confirm dialog on
   Finalise (G1), Doctor | Receptionist switch (D1): the design has some, the owner earlier said otherwise. Exact design or owner answers?
5. Order of work (suggested top to bottom: A fonts/colours, frame and header with chips, card 1, cards 2 to 4, right pane, X-ray, bottom bar).
