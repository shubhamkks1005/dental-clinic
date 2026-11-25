# Handoff: doctor-visit (docs/design/final/doctor_visit.html)

Status: BACKEND DONE, B1 to B10 (2026-11-25, local commits, nothing pushed). UI NOT STARTED: it waits for the owner to save the HTML as docs/design/final/doctor_visit.html (Q14). Migrations 0058, 0059, 0060 are NEW: the owner applies them.
Written: 2026-11-25. Plan by: design-plan. Next skill: design-apply (only after the owner answers section 7 and saves the HTML file, see 0).

## 0. How to read this file
design-apply reads ONLY this file plus the HTML. Update the status lines and the checkboxes as work is done. Add a line to "Log" after every step.

IMPORTANT (UNVERIFIED source): the owner pasted the design in chat as `doctor_visit_smart_accordions (28).html` (Tailwind CDN prototype, "Option 4: Smart Accordion Cards"). It is NOT yet saved in `docs/design/final/`. Before design-apply: the owner saves it as `docs/design/final/doctor_visit.html` and adds the row to `docs/design/final/README.md` (screen "Doctor visit page", built by Part U). This plan was written from the pasted text (markup, style, script all read), line numbers below are therefore given as "script: function name" or "markup: id", not as line numbers.

Layout conflict settled (Q1): the accordion design wins over the tabs in `docs/PLAN.md` Part U9 item 8. Update Part U9 item 8 when applying.

## 1. The screen in one paragraph
The doctor's visit page (`/app/visits/:id`, opened from Today "Open visit"). Doctor only (receptionist gets the existing 403 sentence). Top: back to Today, patient header (name, age, sex, P-code) and an always-visible strip (allergy, vitals, dues, follow-up). Left: four exclusive accordions: (1) Tooth chart, (2) Diagnosis and procedures, (3) Prescription and advice, (4) Files, vitals and next visit; plus a floating frosted dock with two boxes (Chief complaints, Clinical findings) that can shrink to a round bubble at bottom left. Right: resizable pane with two tabs: "Live A4 Rx" (letterhead preview) and "History" (dues, next appointment, pending treatment, previous medications, last visits, files). Bottom sticky bar: save state, "Diagnosis done", "Procedures done" chips, text "Finalise creates bill and updates plan", and Finalise visit. Replaces today's one-screen visit (features/visits: VisitOneScreen, VisitWorkColumn, VisitStickyBar, VisitContextPanel, RecentVisitsSide) and the prescription panel (features/prescriptions/VisitMedicinesPanel).

The briefs behind it: `docs/design/briefs/diagnosis-procedures.md`, `docs/design/briefs/prescription.md`; review: `docs/design/reviews/prescription-tab.md`. The page AFTER Finalise (`docs/design/briefs/visit-finished.md`) is NOT in this HTML; the design only greys out the form (see section 2, "Finalised").

## 2. States (what can be on screen)
| Area | State | What shows | HTML |
|---|---|---|---|
| Accordions | Exclusive open | Opening one closes the others (script: toggle listener on `#visit-left-pane > details`). Accordion 1 open by default | markup details 1-4 |
| Accordion 2 summary | Live text | "1 diagnosis . 2 procedures . Rs 3,700", "-" when no fee | script renderDiagProcAll |
| Diagnoses | empty | "No diagnosis yet. Search and press Enter to add." | diag-lines-container |
| Diagnoses | "none" chosen | "No diagnosis for this visit." and badge "Diagnosis done" | toggleNoDiag |
| Diagnoses | line | label, "Free text" tag if typed, Tooth input (FDI or blank), Remove | renderDiagProcAll |
| Diagnosis search | empty query | the "popular" ones; Up/Down move, Enter adds focused; no match: "Add 'x' as free text" | renderDiagDropdown, onDiagSearchKey |
| Procedures | empty / none | "No procedure yet." / "No procedure for this visit." | proc-lines-container |
| Procedures | line | name, plan tag ("From plan: RCT sitting 2"), fee in Rs or "No fee set" chip, Remove, Tooth input, surface buttons O M D B L (hidden for whole-tooth procedures), note | renderDiagProcAll |
| Procedures | duplicate | notice when same name and tooth twice (never blocks) | proc-dup-notice |
| Procedure search | no match | "Not in your procedures list", fee box, "Add to my list" then the line is added at once | addInlineProcedureToList |
| Undo toast (diag/proc) | 1 step, no timer | "Added diagnosis: X (36)" with Undo; never auto-hides (diag toast has NO timeout) | showDiagUndo |
| Prescription | Draft / Issued / Revised | pill word, lock banner, Revise, Print A5; see review file for gaps | rx-status-pill |
| Prescription | role toggle | Doctor / Receptionist view (prototype aid) | setRxRole |
| Prescription lines | collapsed or Adjust open | summary row with frequency, days, timing, total approx; Adjust: frequency, days, timing, instruction | renderRxAll |
| Prescription search | empty / matches / none / Sets only | recently used chips; rows with Enter hint on the first; "Add 'x' as new medicine line" | renderRxSearchDropdown |
| Right pane | Live Rx / History | tab switch; Live Rx shows DRAFT or RX number | switchRightTab |
| Complaint and findings dock | expanded / each box minimised / bubble | two resizable boxes, minus buttons, bubble bottom-left | toggleFloatingCF, toggleCFBox |
| Past chart date | read-only | complaint and findings shown as text in the dock; chart read-only | changeChartDate |
| Finalised | locked | "Finalise visit" button text "Finalised" and disabled; diagnosis and procedure part read only with banner "Finalised, read only. Add an addendum to correct." (demo only via finaliseVisitDemo). Prescription and chart do NOT lock in the prototype | finaliseVisitDemo |
| Bottom bar | chips | "Diagnosis done" or "Diagnosis missing" (amber word, not colour alone) | footer-diag-chip |
| Save text | Saved / Unsaved | "Saved 10:42 AM" / "Unsaved changes" (chart and notes) | markUnsaved |
| X-ray viewer | full-screen modal | zoom, rotate, compare, annotate | markup xray-viewer-modal |

Not designed in the HTML: phone (360) layout (the pane stacks under the accordions; the dock overlays), loading skeleton, server error, save failure, version conflict, receptionist screen, "visit finished" page, empty states of the right pane.

## 3. Motion inventory (from the HTML style and script)
| # | Animation | Trigger | Element | Duration | Delay | Easing | HTML | Measure how |
|---|---|---|---|---|---|---|---|---|
| 1 | Chart edit tools fade and lift (hidden on past dates) | change "Chart as of" | `#edit-tools-wrap` | 200 ms | 0 | ease-out | class `transition-all duration-200` | computed transition-duration; opacity and translateY samples |
| 2 | Dock panel scale/fade to bubble and back | close_fullscreen button, bubble click | `#complaint-findings-block`, `#cf-mini-circle` | 300 ms | 0 | cubic-bezier(0.34,1.56,0.64,1) (overshoot) | classes on both | rAF samples of scale and opacity; origin bottom-left |
| 3 | Bubble hover grow | hover | `#cf-mini-circle` | 150 ms (Tailwind default) | 0 | default | `hover:scale-110` | computed |
| 4 | Surface buttons colour change | tooth marked | `#zbtn-*` | 300 ms | 0 | default | `transition-colors duration-300` | colour sample |
| 5 | Tooth cell hover lift | hover | tooth buttons | 150 ms | 0 | default | `hover:-translate-y-0.5 transition-all` | transform sample |
| 6 | Annotation action icons fade | hover on annotation | `.xv-annot-actions` | 120 ms | 0 | ease | `<style>` | opacity |
| 7 | Resize handles colour | hover | resizers | 150 ms | 0 | default | `transition-colors` | colour |
| 8 | Save indicator "Saving" then "Saved" | any rx or diag change | `#rx-save-indicator`, `#diag-save-indicator` | rx 280 ms, diag 220 ms | 0 | none | script setTimeout | the fake timers are NOT to be copied: use the real request state |
| 9 | Undo toast hide | 6 s timer (Rx only) | `#rx-undo-toast` | instant | 6000 ms | none | showRxUndo | only the Rx toast times out; the diag toast never does (decide Q9) |
| 10 | Accordion open/close | click | `<details>` | none (native, instant) | 0 | none | markup | none |

No reduced-motion rule in the HTML: keep the app's `prefers-reduced-motion` handling (nothing overshoots; fades only).

## 4. Data and actions
| Item | In HTML | App today | Verdict | Detail |
|---|---|---|---|---|
| Visit open, header, patient strip | static text | VisitHeaderStrip, `GET /api/staff/visits/:id` | EXISTS | strip shows allergy, vitals, dues, follow-up; confirm alert source is `clinical.alert_flag` safe for doctor; strip text in HTML is fake |
| Chart (FDI, surfaces O M D B L + whole, conditions, undo, save, chart-as-of) | script CONDITIONS, SNAPSHOTS | features/chart ToothChart, VisitChartPanel; `/api/staff/patients/:id/chart` | EXISTS / FIX FIRST | condition list in HTML (Cav, Deep, Fill, RCT, Crn, Miss, Imp) must be matched to `packages/shared/src/conditions.ts`; "Save" button: today the app autosaves chart events, HTML has an explicit Save: Q3 |
| Tooth details card with timeline, files, plan, per-tooth note | TOOTH_HISTORY, TOOTH_NOTES | `tooth_events` only; no per-tooth note, no per-tooth files link in the card | NEW (note) / FIX FIRST (history read) | per-tooth clinical note: new column or table; Q4 |
| Complaint, findings | two dock boxes | `visits.chief_complaint`, `visits.exam_note`, `PATCH /visits/:id` (versioned autosave) | EXISTS | quick-add phrase chips from the older design were REMOVED here; Part U1 (hover previous notes, "Use this") must be placed on these two boxes |
| Diagnosis add (list or free text, tooth) | addDiagnosisItem | `POST /visits/:id/diagnoses` (list item or free text, `toothFdi`) | FIX FIRST | tooth is NOT validated against FDI on the server (`visit-diagnoses.ts`); add `isFdiTooth` check; also dedupe not needed |
| Diagnosis change tooth / remove / undo | updateDiagTooth, removeDiagLine, undo | none (no PATCH or DELETE route) | NEW | repo `update` and `remove` (soft delete, version check, audit, only draft), routes `PATCH` and `DELETE /visits/:id/diagnoses/:lineId`, route-matrix entries, tests. Undo of remove = restore (soft delete flag cleared) or re-add |
| Procedure add (list only, tooth, surfaces) | addProcedureItem | `POST /visits/:id/procedures` (list item, `toothFdi`, `surfaces`, `note`) | FIX FIRST | HTML adds with NO tooth and then edits; server accepts that. `surfaces` set by the HTML to []: matches. Surfaces always shown (Q6 = no whole-tooth flag). |
| Procedure change tooth, surfaces, note / remove / undo | updateProcTooth, toggleProcSurface, updateProcNote, removeProcLine | none | NEW | same as diagnosis; `PATCH` and `DELETE /visits/:id/procedures/:lineId` |
| Procedure fee on screen, total | formatRupeesFromPaise, "Rs 3,700" | `default_paise` copied on add | EXISTS | show with the app's `formatRupees` (symbol and Indian grouping), NOT the HTML's "Rs"; total computed on the client for information only; "No fee set" chip when null |
| Inline "Add to my list" for a procedure (name + fee) | addInlineProcedureToList | `POST /lists/procedures` (Library) | FIX FIRST | needs `settings.write`/lists permission: check the doctor may call it from the visit; code `NEW` is a placeholder (HTML) so real code must be optional; after add, line is added in one flow; if the list call fails, no line |
| Plan tag "From plan: ..." | OPEN_PLAN_ITEMS hard-coded | plan items match on finalise (`plan-items-from-visit.ts`) | FIX FIRST | a read of open plan items per patient for the tag (exists in the Plan panel: `features/plan`); show only when tooth and name match; do not change the match rule |
| "No diagnosis / No procedure for this visit" | toggleNoDiag, toggleNoProc | not stored; finaliseWarnings warns when none | NEW | owner decision Q2: store two flags on `visits` (migration, owner applies) so the warning goes and the bottom bar can say "done"; default stored |
| Bottom bar chips Diagnosis done / Procedures done | renderDiagProcAll | `visit-checklist.ts` + `finalise-warnings.ts` (soft, never block) | FIX FIRST | HTML has no chip for "Prescription issued" and no warning list; keep both in the app (finalise-warnings.ts stays) |
| Finalise | finaliseVisitDemo (only locks diag/proc) | `POST /visits/:id/finalise` (+ plan sync, snapshot, hash) | EXISTS | button text in HTML "Finalise creates bill and updates plan" = true; after finalise the app shows today's final view; the new "visit finished" page is a separate design (briefs/visit-finished.md) |
| Prescription search, add, sets, free text, lines, adjust, undo | script rx* | features/prescriptions (VisitMedicinesPanel 462 lines, RxLinesTable, useVisitPrescription), `/prescriptions/*` | EXISTS / FIX FIRST | see the review file (A1 to A5): allergy notice later (FUTURE_IDEAS A2); dose edit field; advice field; free-text defaults; total uses dose; arrow keys in search (owner wants it, prompt given). Total "approx" stays as is by owner |
| Copy previous | copyPreviousRx (fake) | `POST /prescriptions/copy-previous` | EXISTS | hide when none; owner Q |
| Issue / Revise / Print | issueRx, reviseRx, printRxSheet | issue, revise exist; print = `features/print/PrintPrescriptionScreen` | EXISTS | Revise in HTML just unlocks in place: the app makes a NEW linked draft (`revised_from_id`) |
| Live Rx preview (letterhead A5) | rx-meds-list etc. | `PrescriptionSample.tsx`, `PrintLayout` | FIX FIRST | reuse the print layout (PLAN U9.4: do not write a second preview); doctor name, registration, clinic header, phone, address, QR come from settings, NOT the hard-coded "Dr. Nidhi Kushwaha", Reg.No, phone, logo URLs in the HTML (fake data rule; those are real-looking details: do not copy) |
| Problem teeth on the sheet | rx-problem-teeth-strip | none on print | NEW | brief says the sheet does not list it; PLAN U9.3 asks for it; Q5 |
| History pane (dues, next appt, pending treatment, previous medications, last visits, files) | static | RecentVisitsSide, VisitContextPanel, plan, files | FIX FIRST | build from existing reads in ONE round (<= 10 queries): dues (bills), next appointment, open plan items, last 3 visits with medicines, files; previous medications = from issued prescriptions |
| Files, vitals, next visit (accordion 4) | static | files feature, vitals fields on visit, NextVisitChips | EXISTS / FIX FIRST | "BP 128/82" strip: confirm where vitals are stored (UNVERIFIED) |
| X-ray viewer (zoom, rotate, flip, compare, annotate, FDI multi-tag, tooth note, download, print) | script xv* | features/files viewer (basic) | NEW | large; annotations (pen, circle, arrow, text, measure) and saving them are NOT in the backend; the measure uses a fake 0.12 mm per px factor (clinically wrong, do not build); missing `#xv-inline-text-edit` element; split into its own task, Q7 |
| Floating dock (two boxes, bubble) | toggleFloatingCF | one-screen notes | NEW (UI only) | covers the lower left of the page; no phone behaviour defined |

## 4b. Also used on (shared pieces)
| Piece | Other pages / files that use it | Apply there too? | Note |
|---|---|---|---|
| Left navigation (dark rail) | all pages (`ui/shell`), already restyled for Doctor Today (T2) | No change | the HTML's rail is the old look: use the app's shell, do not copy |
| Status pills (Draft, Issued, Revised, Finalised) | prescription, bills, Today | Yes, same words | colours must follow the app, words fixed |
| Search-then-Enter with "Added: X" and Undo | prescription search, diagnosis, procedure search; also Library and patient search | One shared component (`useSearchAdd` or similar), no copies | HTML uses arrows in diagnosis and procedure search but NOT in the prescription search (owner wants arrows there, so one shared behaviour) |
| Money format | bills, billing, Library fee | Yes `formatRupees` | HTML shows "Rs" in one place and the rupee symbol in another |
| Tooth chart and surface pad | features/chart; patient profile chart | Yes if the chart UI changes (hover dropdowns, 3 menus) | PLAN U9.1 already agrees the 3 dropdowns and O M D B L W layout |
| Prescription preview and print | PrintPrescriptionScreen, PrescriptionSample | Yes one layout | per PLAN U9.4 |
| Saving, undo toast, locked banner | notes autosave, bills, certificates | Yes, same words | |
| Floating dock / bubble | none | no | new pattern; decide it is only on this page |

## 4c. Tooth history (the tooth card): what it shows and the logic
In the HTML (script TOOTH_HISTORY, renderZoomedCard): tapping a tooth opens a card with (a) a one-line history ("22 Nov RCT started . 08 Nov Cold sensitivity noted", the latest 2), (b) a timeline, newest first (event, surfaces, date, visit link), (c) three small boxes: Diagnosis and procedures, Files, Treatment plan for THAT tooth, (d) a per-tooth clinical note, (e) "Add file" and "Add to plan". The "Chart as of" list switches the whole chart to the state after an older finalised visit (read only).

What is real in the app today: every one of these things already carries a tooth number (all check the FDI range 11-48 and 51-85): `tooth_events` (append-only; tooth, surface, condition, visit_id, noted_at, index on patient+tooth+time), `visit_diagnoses.tooth_fdi`, `visit_procedures.tooth_fdi`, `files.tooth_fdi`, `plan_items.tooth_fdi`. "Chart as of" exists (`GET /patients/:id/chart?asOfVisitId`, `tooth-events-chart.ts`: events up to that visit's finalised time). What does NOT exist: ONE read that gives the history of one tooth, and the per-tooth note (B7).

Logic to build (new read `GET /api/staff/patients/:id/teeth/:fdi/history`, doctor only, `clinical.view`; receptionist 403):
1. Input: patient, tooth FDI (validated with `isFdiTooth`), optional `before` cursor. Output newest first, at most 20 entries per call, plus `next` cursor ("Show older").
2. Entries come from five sources, each already filtered by patient and tooth, soft-deleted rows and void visits left out:
   - chart changes (`tooth_events`): "Deep cavity marked, O D" with the condition label and surfaces, grouped when several surfaces were set in the same visit;
   - procedures (`visit_procedures`): "RCT started" with surfaces and its note; ONLY from final visits and from today's draft visit;
   - diagnoses (`visit_diagnoses`): "Irreversible pulpitis";
   - files (`files`): name and type only (X-ray, photo), opens the viewer;
   - plan (`plan_items`): current status (Planned, In progress, Done) shown in the Treatment plan box, not as a timeline row.
   The tooth note (B7) shows in the card, not in the timeline; its past versions are in the audit.
3. Each timeline row carries its date (IST, day-month-year), the visit id and a flag `isToday` for the open draft. A row from a final visit links to "Chart as of" that visit (the link in the HTML is hard-coded to two fake dates: build it from `visit_id`; no link when the row has no visit).
4. One-line history = the first 2 timeline entries from the same read (no second request). Empty tooth: "No prior treatment recorded on this tooth."
5. Counting rule: today's unsaved chart marks are NOT in the server history until saved; the card shows them with the label "Not saved yet" (client state), so the doctor does not think they were recorded.
6. Baby tooth and the permanent tooth that replaces it are LINKED (owner decided, 2026-11-25). Rule (shared pure function, packages/shared/src/teeth.ts, with tests): baby quadrants 5, 6, 7, 8 map to permanent quadrants 1, 2, 3, 4 with the same position digit for positions 1 to 5 (51 to 11, 52 to 12, 53 to 13, 54 to 14, 55 to 15; 61 to 21 ... 85 to 45). Permanent positions 6 to 8 (molars) have no baby predecessor. Viewing a permanent tooth (say 14) also reads the history of its baby tooth (54): those rows are merged by date into the same timeline and carry the tag "Baby tooth 54" (field `fromTooth`). Viewing a baby tooth does NOT pull the successor's rows but shows a small link "Permanent tooth 14" when the successor has any record, which opens that tooth's card. The one-line history uses the merged timeline. Cost: the history batch reads two tooth numbers instead of one (still about 5 queries, `IN (a, b)`); the cursor stays by date.
7. Speed: opening the card must not wait: prefetch the history for the selected tooth when the pointer rests on or focuses a tooth (like the Part U1.3 idle prefetch); results are cached per tooth in the request scope and dropped when a new chart event, procedure, diagnosis or file for that tooth is saved. Budget: the five sources in ONE `db.batch` (about 5 queries), each limited to 20 rows; check EXPLAIN: `tooth_events` has the index, but `visit_diagnoses` and `visit_procedures` have no tooth index and reach the patient through `visits`, so the plan must check the query plan and add `(tooth_fdi, visit_id)` indexes only if EXPLAIN shows a scan (migration, owner applies).
8. Role and privacy: doctor only; this is clinical data. No access-log change unless the existing chart read logs access (check `access-log.ts`; follow the same rule).
9. Locked data: history of a tooth is read only everywhere except "Add file", "Add to plan" and the per-tooth note, which are allowed only on today's draft visit (same rule as other edits).
10. Wording rule: event words come from the lists (condition label from `conditions.ts`, procedure and diagnosis labels copied on the line), never raw codes (`Deep`, `RCT`) on screen.

Prototype problems NOT to copy: the timeline mixes "Sensitivity noted" (a note) with chart events; the "visit" link maps any "Check-up" to one fixed date; TOOTH_NOTES and TOOTH_HISTORY are hard-coded for teeth 36, 24, 46 only.

## 5. Backend work (do first, in this order)
- [x] B1 shared: `isFdiTooth` guard reused by diagnosis and procedure add/update (packages/shared teeth.ts exists). No `whole_tooth` field (Q6 = no). Add `babyPredecessor(fdi)` and `permanentSuccessor(fdi)` (section 4c item 6) with a test table for all 20 baby teeth and all 32 permanent teeth (molars return null).
- [x] B2 repo: `visit-diagnoses.ts` and `visit-procedures.ts`: add `update` (tooth, surfaces, note; version-checked), `remove` (soft delete, draft only), `restore` (undo within the session). One `db.batch` each with the audit row. Validate FDI on add.
- [x] B3 domain + routes in `apps/worker/src/routes/staff-visits.ts` and `domain/visits.ts`: `PATCH` and `DELETE` per line; `route-matrix.ts` entries (`clinical.edit`); role tests (receptionist 403).
- [x] B4 migration (owner applies, never applied by the agent; next number from docs/HANDOFF.md): `visits.no_diagnosis`, `visits.no_procedure` integer 0/1 (Q2). Update `finalise-warnings.ts` and the checklist to use them.
- [x] B5 read: one "visit page" read that returns, in one round, visit + diagnoses + procedures + open plan items for the tag + last 3 visits (with `exam_note`, per Part U1.1) + next appointment + dues + files metadata; target <= 10 D1 queries; EXPLAIN checked (query-plan test).
- [x] B6 lists: confirm the doctor can add a procedure to the list from the visit (permission), return the new item; fee required to be a whole number of paise; code optional.
- [x] B7 (REQUIRED, Q4) per-tooth clinical note: a table `tooth_notes` (patient, tooth FDI, text, version, audit) or a column on the chart event store; doctor only (`clinical.edit`); finalised visits keep the text at the time (copy on finalise); retention rule; migration (owner applies); show in the tooth card, edit with Save.
- [x] B8 (REQUIRED, Q7) X-ray annotations: store as versioned JSON on the file row (pen, circle, arrow, text, measure; coordinates 0-400 x 0-300 of the viewer), audit row on save, doctor only (`files.clinical`), size cap. Measure in mm (Q13, owner decided): the HTML 0.12 mm per px is invented and must NOT be built. The doctor first calibrates each image by entering a known length for a drawn line; the scale is stored with the annotations; without calibration the measure shows pixels only. Migration if a column is needed.
- [x] B10 tooth history read (section 4c): repo `tooth-history.ts` (five sources, one batch, cursor), domain, route `GET /patients/:id/teeth/:fdi/history`, route-matrix (`clinical.view`), receptionist 403 test, query-plan test, tests for: empty tooth, void visit left out, soft-deleted line left out, today's draft rows flagged, 21 rows gives a cursor, primary tooth number accepted, bad FDI 4xx.
- [x] B9 Save button for the chart (Q3): the chart keeps autosave; the button forces an immediate save and shows "Saved hh:mm".
Queries per request: visit page read before 4 rounds (S3.3.1 made it 2) -> target 2 rounds, <= 10 queries each.

### What was built (backend, 2026-11-25) and where it differs from the plan
| Item | Commit | Result |
|---|---|---|
| B1 | c6e442b | `babyPredecessor`, `permanentSuccessor` in packages/shared/src/teeth.ts; `isFdiTooth` now also checked on diagnosis and procedure add and update (packages/db/src/repos/visit-line-parts.ts) |
| B2 | 5eefaeb | repo `update`, `remove` (soft delete), `restore` for both line kinds; each is one batch with a version-checked audit row; procedures edit code is in visit-procedure-edit.ts (file size rule) |
| B3 | d1cf693 | `PATCH`, `DELETE` (body: version), `POST .../restore` on /visits/:id/diagnoses/:lineId and /procedures/:lineId; the visit id in the URL must own the line (404 otherwise); matrix, role and 409 tests |
| B4 | 0fbd526 | migration **0058_visit_none_flags** (visits.no_diagnosis, no_procedure); PATCH visit takes `noDiagnosis`/`noProcedure`; "none" while lines exist is refused; adding or restoring a line clears the flag (no version bump); web finalise-warnings and checklist count "none" as done |
| B5 | 4c211f2 | `GET /api/staff/visits/:id/page`: 1 visit read + 1 batch of 9 = 10 queries, 2 round trips, query-plan tested. Returns visit with lines and addenda, open plan items, last 3 visits (with exam note), next appointment, dues, 12 newest files, medicines of the latest issued prescription. `issuedBillPaidSql(patientId)` now has a per-patient form (the dues list is unchanged) |
| B6 | 2151229 | Doctor already had `settings.write`; fee already whole paise and required. Changed: `code` may now be left out (default empty) and `POST /lists/:key` also returns `item` (the new one) |
| B7 | 0d9f8df | migration **0059_tooth_notes**; `PUT /patients/:id/teeth/:fdi/note` {visitId, body, version?}: only on a draft visit of that patient, empty text clears, version-checked, audited; live notes are copied into the finalise snapshot; added to docs/RETENTION.md |
| B8 | c8119fd | migration **0060_file_annotations** (files.annotations_json, JSON, max 64 KB); `GET` and `PUT /files/:id/annotations` (files.clinical, version = the file version, 409 on a stale save, audit keeps counts only). Marks: pen, circle, arrow, text, measure, viewer box 400 x 300. `scale` {mmPerUnit, knownMm, lineUnits} must match known / units within 1 percent; without scale the screen shows pixels (`measureLength` in packages/shared) |
| B9 | ad29904 | No server part was needed for "Save": every chart mark is already stored the moment it is posted. Added `POST /patients/:id/chart/events/batch` (max 40 marks, one batch, order kept) so autosave groups and the Save button are ONE request. The "Saved hh:mm" text is UI work |
| B10 | d6730f4 | `GET /patients/:id/teeth/:fdi/history?before=`: 6 queries in one batch (7 for a baby tooth, which also answers "has the permanent tooth any record" as `permanentTooth`); merge, grouping and cursor are the pure function `mergeToothHistory` (packages/shared/src/tooth-history.ts). No new index: the query-plan test shows no scan. No access-log row (the chart read does not write one either) |

Things the UI must know:
- Chart entries carry `title` = the condition CODE; show the label from the conditions list (already loaded for the chart).
- Procedure lines in the page read have `surfacesJson`; use `JSON.parse` or ask the repo list (VisitProcedureRow has `surfaces`).
- A tooth history page can hold fewer than 20 entries when a table was cut short; "Show older" is shown whenever `next` is not null.
- Not built (not in section 5): FDI multi-tag of an X-ray (files have one `tooth_fdi`); the "Not saved yet" row is client state.
- The 10-query count for B5 excludes the session and permission check of the request itself.


## 5c. Design 30 (2026-11-25): what is new and what was built
The owner pasted a newer file (`doctor_visit_smart_accordions (30).html`) and will save it as docs/design/final/doctor_visit.html. The B1 to B10 backend was NOT redone. Only what (30) needs and B1 to B10 did not give:
| # | New in (30) | Verdict | Done |
|---|---|---|---|
| B11 | X-ray line thickness slider | `width` (0.5 to 8) added to every mark in `file-annotations.ts`; older saves stay valid | built |
| B12 | X-ray: several teeth tagged + one note per image | stored INSIDE the annotations document (`teeth`: FDI list, `note`: 500 letters), no migration; the `files.tooth_fdi` column stays as the main tooth | built |
| B13 | Strip: "Follow-up: 4 days late (18 Nov due, meds finished)" | `GET /visits/:id/page` now returns `followUp` {dueOn, daysLate, medsFinishedOn, state} from the latest ISSUED prescription (pure `followUpStatus` in packages/shared/src/visit-strip.ts); still 10 queries | built |
| B14 | Strip: "No diabetes / No blood thinner" | NO new read: the screen uses the existing medical history read; `historyAnswer(items, STRIP_CODES.diabetes)` gives yes / no / unknown; the screen prints "No diabetes" ONLY for "no" (never for unknown) | built (helper) |
| B15 | "Popular" diagnoses and procedures in the search; "Recently used" medicines | `GET /api/staff/library/line-usage` (counts per name in 30 days, doctor only, `repos.visitDiagnoses.diagnosisProcedureUsage30d`); medicines use the existing `/library/medicine-usage` | built |
| - | "Chart as of" list, and the complaint and findings of an older visit | exists: visits list of the patient + `GET /visits/:id`; no change | none needed |
| - | Letterhead tagline, qualifications, speciality, registration, extra line, email, Instagram, timings | exist in settings (`clinic.*`, `doctor.*`) | none needed |
| B16 | Pending treatment "2 sittings remaining" | Owner: the doctor decides. Migration **0061_plan_sittings** (owner applies): `plan_items.sittings_done`, `visit_procedures.more_sittings`. Each procedure line has a yes/no "needs more sittings" (add and PATCH body `moreSittings`, default no = finished, as before). On finalise every matched plan item counts one sitting: "more sittings" keeps it In progress, otherwise Completed; an unplanned procedure with "more sittings" makes an In progress item (2 sittings, 1 done). `GET /visits/:id/page` returns `moreSittings` per line and `sittingsDone` per open plan item (left = sittings - sittingsDone). The screen needs a small "more sittings" switch on each procedure line | built |
| - | QR picture on the prescription | Owner chose: the doctor uploads a QR image. NOT built: it needs an image upload (R2 store, file type and size check, print) and the logo has no upload yet either (`clinic.logo` is only a text setting), so both should be one separate task | waits for a task |

## 6. Logic changes (frontend)
- State: replace the prototype's globals (`state`, `rxState`, `diagProcState`) with the app's data hooks (`useVisitData`, `useVisitPrescription`, new `useVisitDiagnosesProcedures`). Server is the truth; HTML objects are demo data.
- Optimistic (status-like only): add/remove diagnosis and procedure lines may appear at once and roll back with one plain sentence if the server refuses; they carry NO money decision (fee is a copy). Never optimistic: Issue, Finalise, anything on a bill.
- Undo: the prototype undo is a client snapshot. Real undo of a remove = server restore; undo of an add = server remove. Keep one step; add a short timeout (6 s like Rx) so the toast does not stay for ever.
- Tooth prefill: the HTML tries to read the tooth from `#zoom-tooth-num`, which does not exist, so it never fills. Real behaviour: the tooth selected in the chart (`selectedTooth`) pre-fills new lines.
- Completion state: "done" when at least one line or the doctor chose "none"; choosing "none" while lines exist is refused with one sentence; adding a line clears "none".
- Accordion exclusivity: keep, but remember per-visit which accordion was open (localStorage, try/catch) so a reload does not jump to accordion 1.
- Refresh: after a save take the new version from the reply; one quiet refresh later; stale-refresh guard (see design-apply lessons).
- Conflicts: version mismatch shows the existing VisitConflictBanner; typing is not lost.
- Receptionist: never reaches this page (403 sentence exists); remove the in-page role toggle.
- Print: print only the A5 sheet (print stylesheet), never the whole page.
- Prototype bugs NOT to copy (UNVERIFIED because the page was not run; found by reading): `renderSummaryAndRx()` writes `diagChips.innerHTML` for `#diag-proc-chips`, which no longer exists in this markup, so it throws and may stop the later script (everything after the first `renderAll()`); `acc2-summary` is overwritten by the chart text until `renderDiagProcAll()` runs; unescaped text goes into HTML and into `onclick` strings (an apostrophe breaks "Add"); the hard-coded date 22 Nov for "Marked today" and the follow-up past check; fake timers for saving.

## 7. Questions for the owner (answered in chat, 2026-11-25)
| # | Question | Owner's answer |
|---|---|---|
| Q1 | Accordions or tabs? | Accordion design wins |
| Q2 | Store "No diagnosis / No procedure for this visit" on the visit? | Yes, store it (migration) |
| Q3 | Chart: Save button or autosave? | BOTH: autosave runs, and a Save button stays so the user feels safe (button shows the saved state; pressing it forces a save now) |
| Q4 | Per-tooth clinical note? | Build NOW |
| Q5 | Problem teeth on the prescription? | Yes, print them (chart of affected teeth + short list, as PLAN U9.3) |
| Q6 | "Whole tooth" flag per procedure? | No: surfaces O M D B L are ALWAYS shown (doctor leaves empty for whole-tooth work) |
| Q7 | X-ray viewer with annotations? | In this build (not a separate task) |
| Q8 | Dock on tablet and phone? | Bubble only; tap opens a bottom sheet |
| Q9 | Diagnosis/procedure undo toast? | Hides after 6 s |
| Q10 | Finalise with a draft prescription? | Warning plus a link that opens the prescription accordion |
| Q11 | Procedure fee and total on the visit screen? | NO: fees only in billing |
| Q12 | Procedure with no fee set: any sign on the visit screen? | Yes, only the words "No fee set" (no amount) |
| Q13 | X-ray measure in mm? | Calibrate first (known length per image); pixels only until calibrated |
| Q14 | The HTML file | Owner saves it as docs/design/final/doctor_visit.html and adds the README row (not yet done) |

Consequences to apply (changes from the HTML):
- Remove the fee text, "No fee set" amount chip and "Procedures total" from accordion 2 and from its summary line; the summary shows counts only. Owner decided (Q12): a line whose fee is not set shows only the plain words "No fee set" (no amount), so the bill is not silently low.
- The inline "Add procedure to my list" still needs a fee (the list needs it); keep the fee field there only.
- Remove the `wholeTooth` logic: always render the five surface buttons.
- Tooth note and X-ray annotations are in scope: see section 5 (B7, B8 are now required).

## 8. Decisions already taken (also in docs/DECISIONS.md)
- Total "approx" on the prescription stays as it is (owner, 2026-11-25).
- Allergy and pregnancy notice: later (docs/FUTURE_IDEAS.md A2).
- AI help and "ask AI about this patient": later (FUTURE_IDEAS A3).
- Arrow keys in the medicine search: to be added (owner, 2026-11-25).
- History pane (previous medications, last visits, dues): kept.
- Procedures are chosen from the doctor's list only; diagnoses may be free text (brief).
- Visit page decisions of 2026-11-25 (Q1 to Q11 above) are written in docs/DECISIONS.md.

## 9. Design apply checklist
- [ ] tokens/colours (scoped class like `.visit-doc`), icons, CSS files (no Tailwind, no CDN, no copied class names)
- [ ] components (one per file, under 200 lines; break VisitMedicinesPanel first)
- [ ] every motion in section 3 (dock overshoot included), measured
- [ ] reduced motion
- [ ] phone 360 / tablet 768 layout (not in the HTML: copy the nearest existing screen: the Q2.4 one-screen visit phone layout)
- [ ] shared pieces from 4b applied on the other pages (and checked there)
- [ ] docs: MAP.md, STATE.md, USER_MANUAL.md, handoff INDEX.md, final README row

## 10. Test cases (state x interaction x edge)
| # | Case | Steps | Expect (look) | Expect (numbers) |
|---|---|---|---|---|
| 1 | Add diagnosis from list | type "pulp", Enter | line with the list name, "Added" toast with Undo | 1 POST, line count 1 |
| 2 | Add free-text diagnosis | type unknown, Enter | "Free text" tag | server stores `listItemId` null |
| 3 | Tooth validation | type 19 or 99 in a tooth box | refused with a sentence | server also returns 4xx for a bad FDI |
| 4 | Remove then Undo (repeat 5 times) | Remove, Undo | line returns in the same place | count unchanged; audit rows 5 + 5 |
| 5 | Procedure with no fee | add item with null fee | "No fee set" chip, total shows "-" | bill later shows the same |
| 6 | Same procedure same tooth twice | add twice | notice, both kept | 2 rows |
| 7 | Procedure not in list, add to my list with fee | type, fill fee, add | line appears at once | list item created, fee in paise |
| 8 | "No procedure" with lines present | tap none | refused sentence | flag stays 0 |
| 9 | Finalise with draft Rx | Finalise | soft warning, can continue | visit status final |
| 10 | Locked after finalise | open final visit | all fields read only, banner text | write calls return 4xx |
| 11 | Receptionist opens the visit | open URL | 403 sentence, no clinical data | API 403 |
| 12 | Version conflict | edit in two tabs | conflict banner, typing kept | no lost text |
| 13 | Server refuses add | stub 4xx | line rolls back, one sentence | |
| 14 | Slow server 300 ms | add a line | line shows within 100 ms | |
| 15 | Keyboard only | search, arrows, Enter, Tab to tooth and surfaces | full flow | |
| 16 | 30 prescription lines, 20 procedures | add many | stays usable, Finalise reachable | |
| 17 | 360 / 768 / 1366 | each state | no sideways scroll, targets 44 px | |
| 19 | Tooth history: tooth with chart events, a procedure, a diagnosis, a file in 3 visits | tap the tooth | timeline newest first, one-line history matches the first 2 rows, row link opens "Chart as of" that visit | one history request, <= 6 queries |
| 20 | Tooth history: tooth with nothing | tap a healthy tooth | "No prior treatment recorded on this tooth." | still one request |
| 21 | Tooth history: 25 entries | tap, then "Show older" | 20 then 5 more | cursor works, no duplicates |
| 22 | Tooth history: mark today then open card | mark a surface, do not save | row shows "Not saved yet" | not in server history until saved |
| 24 | Tooth history: permanent tooth 14 whose baby tooth 54 has a filling | open card 14 | the 54 row is in the timeline tagged "Baby tooth 54", sorted by date | one request, tooth list [14, 54] |
| 25 | Tooth history: molar 16 | open card | no baby rows, no link | |
| 26 | Tooth history: baby tooth 54 with a record on 14 | open card 54 | link "Permanent tooth 14", 14's rows are NOT in this timeline | |
| 23 | Tooth history: receptionist | call the API | 403 | |
| 18 | First paint | open page | no animation on first paint | queries <= 10 per request |

## 11. Measurement targets
- first visible change within 100 ms of the click, even with a 300 ms server;
- each transition spans >= 8 frames over its HTML duration, no 1-3 frame jump larger than 24 px;
- no layout jump of other elements, no page scroll movement;
- durations within +-20 percent of the HTML value.

## 13. Backend plan for the page AFTER the visit (visit finished: prescription preview, bill, back to Today)
Design for it: not drawn yet. Its brief is `docs/design/briefs/visit-finished.md` (owner decisions in section 13 of that brief). This section lists the backend so it can be built with, or right after, the visit page. Verdicts come from reading the repos on 2026-11-25.

Owner decisions that shape it (chat, 2026-11-25):
- The doctor can take the payment himself OR pass the money part to the desk. The page then just SHOWS that it is with the desk. The desk already sees every finalised visit with an unpaid bill as "Ready to bill" (`bills-ready.ts`, `readyToBillByAppointment`), so NO new "handed over" column is needed: "with reception" is derived (bill issued with a balance). Take back: not needed (a mistake is a bill cancel, which exists).
- Consultation fee: the doctor decides each visit whether to charge; it is one bill line.
- A bill note stays with the bill and can be edited even after the bill is issued.
- A "today's details" side part (what is not on the prescription).
- Discount: the doctor gives it before the bill is issued, with no second approval.

| Item | App today | Verdict | Work |
|---|---|---|---|
| Make the bill from the visit | `POST /visits/:id/bill` (`createBillFromVisit`: draft, then issue at once unless `reviewFirst`) | EXISTS | Use `reviewFirst: true` when the doctor wants a discount or a consultation line (stays a draft), then issue; plain "Pass to reception" = create and issue as today |
| "Pass to reception" | none; the desk "Ready to bill" is already derived | EXISTS (derived) | The page shows one of: Not billed / Draft (not passed) / With reception (issued, balance due) / Paid. One small function in `domain/bills.ts` returns this state word from bill status, paid and total (one rule in one place, also usable by the desk). No migration |
| Doctor takes payment on this page | `POST /payments` (`bills.create`, doctor allowed), allocates to open bills | EXISTS | Reuse; mode, amount, reference; receipt print exists |
| Discount by the doctor, before issue, no approval step | `requestDiscount` (draft only, `bills.create`) then `approveDiscount` (`bills.adjust`, doctor) | FIX FIRST | New domain function `applyDoctorDiscount(billId, amountOrPercent, reason, version)` that runs request then approve for a doctor in ONE db.batch (audit rows for both, version checked); refuses when the bill is not a draft or the discount is more than the subtotal; the receptionist path is unchanged (request only). Route `POST /bills/:id/discount/apply` (`bills.adjust`), route-matrix entry, tests |
| Consultation fee line | draft items are edited with `updateDraft` (the client sends the whole item list; items may come from the list or have a label and a unit price) | FIX FIRST / UNVERIFIED | Check `parseUpdateDraftBill` accepts an item with no `listItemId` and an integer `unitPaise`; add the "Consultation" line without losing the procedure lines. Add a usual consultation fee setting `billing.consultation_fee_paise` (shared tunables entry, seed migration, tests; `settings.billing`, doctor) so one tap adds it; if unset the doctor types the amount |
| Bill note | `bills.notes` column exists | FIX FIRST | Draft: part of `updateDraft` (check). Issued: new `PATCH /bills/:id/note` (`bills.create`, version-checked, up to 200 characters, audit row with old and new text; money columns untouched; cancelled bills refused). The desk can read it, so the field says "No health details"; the server does not scan the text |
| Prescription preview and print | `PrintPrescriptionScreen`, `GET /prescriptions/:id` (`prescriptions.print`), print log | EXISTS | Reuse the same layout; `GET /visits/:id/prescriptions` finds the prescription of this visit |
| Today's details side part | pieces exist separately: diagnoses and procedures, open plan items, next appointment, follow-up date (prescription), files, dues | NEW (one read) | `GET /visits/:id/after` (`clinical.view`, doctor only): diagnoses with tooth, procedures with tooth and surfaces (names only, no fees: owner decision), next appointment, open plan items left, follow-up date, files added this visit (names), earlier dues (paise). One `db.batch`, 8 queries or fewer, EXPLAIN checked; receptionist 403 |
| Next waiting patient | doctor Today read ("Next") | EXISTS (UNVERIFIED which call) | Reuse the Today read through the request scope; no new endpoint |
| Addendum | `POST /visits/:id/addenda` | EXISTS | Link only |
| Bill cancel after pass | `POST /bills/:id/cancel` (`bills.adjust`) | EXISTS | Link to the bill screen |
| Double tap on pass or issue | `bills-issue-concurrency.test.ts` exists | VERIFY | Re-run, and add a test that two quick "Pass" calls give one bill and one number |
| Consultation-only visit (no procedures) | `createFromVisit` with no procedures: UNVERIFIED (may refuse or make an empty bill) | FIX FIRST | Define: with a consultation line the bill is made; with nothing billable no bill is made and the page says so |

Order: (1) the shared state-word function and tests, (2) `applyDoctorDiscount`, (3) consultation fee setting and line check, (4) the note route, (5) the "after" read, (6) route-matrix, role tests, query-plan test, (7) docs (MAP, STATE). No migration except the consultation fee setting seed. Queries: the page opens with one visit/bill read and the "after" read in the same round.

### Section 13 built (2026-11-25, local commits, nothing pushed)
| Step | Commit | Result |
|---|---|---|
| P1 state word | 26a4e1b | `billStateWord` and `isReadyToBill` in packages/shared/src/bill-state.ts (Not billed, Draft, With reception, Paid; a cancelled bill counts as Not billed). The desk list `bills-ready.ts` now uses it: one rule |
| P2 doctor discount | 05318a3 | `POST /api/staff/bills/:id/discount/apply` (bills.adjust = doctor): request and approve in ONE batch, two audit rows, draft only, not above the subtotal; the desk path (request only) is unchanged |
| P3 consultation, one bill | c907492 | `POST /visits/:id/bill` body `{reviewFirst?, consultation?, consultationPaise?}`: Consultation line from the typed amount or the usual fee; nothing billable is refused with "There is nothing to bill on this visit. Add a procedure or a consultation fee."; a second tap returns the same bill (status 200, `created: false`), also two at the same time. Migration **0062_consultation_fee** (setting `billing.consultation_fee_paise`, 0 = not set, doctor only) and migration **0063_bills_one_live_per_visit** (unique index: one live bill per visit). Both are NEW: the owner applies them. If 0063 fails there are two live bills on one visit (test data): cancel one. A change you will see: a visit can no longer have two live bills; the old test that made two on one visit uses two visits now |
| P4 note | 5639f99 | `PATCH /api/staff/bills/:id/note` {version, note <= 200}: draft or issued, cancelled refused, bumps the bill version, audit has old and new text, money columns untouched. The desk may write it too (bills.create) |
| P5 after read | 17a3553 | `GET /api/staff/visits/:id/after`: diagnoses and procedures (names, teeth, surfaces, no fees), next appointment, open plan items with sittings done, follow-up of this visit's prescription, files added since the visit opened, earlier dues, the live bill with paid and due, and `billState`. 1 visit read + 1 batch of 8 = 9 queries, 2 round trips, query-plan tested |
| P6 checks | each step | route-matrix entries and role tests for every new route; the matrix body helper knows them |
| Not built | - | the doctor taking payment needs nothing new (`POST /payments` already allows the doctor, tested end to end in staff-visit-finished.test.ts); prescription of this visit: `GET /visits/:id/prescriptions` exists; next waiting patient: the UI reuses the Today read |

Test cases for this part:
| # | Case | Expect |
|---|---|---|
| P1 | Pass with procedures | one bill issued, one gap-free number, state "With reception", the desk list shows the patient |
| P2 | Pass twice quickly | one bill |
| P3 | Doctor discount 10 percent then pass | request and approve audited, total recalculated on the server |
| P4 | Discount after issue | 4xx, bill unchanged |
| P5 | Receptionist calls apply-discount | 403 |
| P6 | Consultation line added then pass | bill has procedure lines plus Consultation, total matches |
| P7 | Doctor takes full payment on the page | bill paid, state "Paid", receipt prints |
| P8 | Note on an issued bill | saved, money columns unchanged, audit row |
| P9 | Note on a cancelled bill | refused |
| P10 | No procedures, no consultation | no bill made, the page says so |
| P11 | Receptionist opens the "after" read | 403 |
| P12 | Procedure without a fee | billing shows "No fee set" for that line; the visit page lists the name only |


## 12. Log
- 2026-11-25: plan written from the pasted HTML (file not yet saved in docs/design/final/). Nothing built.
- 2026-11-25: Phase A (backend) done, B1 to B10, one local commit each (c6e442b, 5eefaeb, d1cf693, 0fbd526, 4c211f2, 2151229, 0d9f8df, c8119fd, ad29904, d6730f4). New migrations 0058, 0059, 0060 (owner applies, never applied by the agent). UI waits for the HTML (Q14).
- 2026-11-25: design (30) compared with B1 to B10. Built B11 to B15 (see 5c). Open for the owner: sittings rule, QR picture.
- 2026-11-25: B16 sittings rule built (migration 0061, owner applies). QR upload left as its own task.
- 2026-11-25: section 13 backend built, P1 to P5 (26a4e1b, 05318a3, c907492, 5639f99 17a3553). New migrations 0062 and 0063 (owner applies, never applied by the agent). Tests P1 to P12 are in apps/worker/src/domain/bills.test.ts, apps/worker/src/staff-visit-finished.test.ts, packages/db/src/repos/bills-*.test.ts and visit-after.test.ts. Next: the UI, which waits for the saved HTML.
