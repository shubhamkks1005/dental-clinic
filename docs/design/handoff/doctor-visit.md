# Handoff: doctor-visit (docs/design/final/doctor_visit.html)

Status: PLANNED (owner answered Q1-Q13 in chat on 2026-11-25, see section 7 and 8; ready for design-apply after the HTML is saved)
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

## 5. Backend work (do first, in this order)
- [ ] B1 shared: `isFdiTooth` guard reused by diagnosis and procedure add/update (packages/shared teeth.ts exists). No `whole_tooth` field (Q6 = no).
- [ ] B2 repo: `visit-diagnoses.ts` and `visit-procedures.ts`: add `update` (tooth, surfaces, note; version-checked), `remove` (soft delete, draft only), `restore` (undo within the session). One `db.batch` each with the audit row. Validate FDI on add.
- [ ] B3 domain + routes in `apps/worker/src/routes/staff-visits.ts` and `domain/visits.ts`: `PATCH` and `DELETE` per line; `route-matrix.ts` entries (`clinical.edit`); role tests (receptionist 403).
- [ ] B4 migration (owner applies, never applied by the agent; next number from docs/HANDOFF.md): `visits.no_diagnosis`, `visits.no_procedure` integer 0/1 (Q2). Update `finalise-warnings.ts` and the checklist to use them.
- [ ] B5 read: one "visit page" read that returns, in one round, visit + diagnoses + procedures + open plan items for the tag + last 3 visits (with `exam_note`, per Part U1.1) + next appointment + dues + files metadata; target <= 10 D1 queries; EXPLAIN checked (query-plan test).
- [ ] B6 lists: confirm the doctor can add a procedure to the list from the visit (permission), return the new item; fee required to be a whole number of paise; code optional.
- [ ] B7 (REQUIRED, Q4) per-tooth clinical note: a table `tooth_notes` (patient, tooth FDI, text, version, audit) or a column on the chart event store; doctor only (`clinical.edit`); finalised visits keep the text at the time (copy on finalise); retention rule; migration (owner applies); show in the tooth card, edit with Save.
- [ ] B8 (REQUIRED, Q7) X-ray annotations: store as versioned JSON on the file row (pen, circle, arrow, text, measure; coordinates 0-400 x 0-300 of the viewer), audit row on save, doctor only (`files.clinical`), size cap. Measure in mm (Q13, owner decided): the HTML 0.12 mm per px is invented and must NOT be built. The doctor first calibrates each image by entering a known length for a drawn line; the scale is stored with the annotations; without calibration the measure shows pixels only. Migration if a column is needed.
- [ ] B9 Save button for the chart (Q3): the chart keeps autosave; the button forces an immediate save and shows "Saved hh:mm".
Queries per request: visit page read before 4 rounds (S3.3.1 made it 2) -> target 2 rounds, <= 10 queries each.

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
| 18 | First paint | open page | no animation on first paint | queries <= 10 per request |

## 11. Measurement targets
- first visible change within 100 ms of the click, even with a 300 ms server;
- each transition spans >= 8 frames over its HTML duration, no 1-3 frame jump larger than 24 px;
- no layout jump of other elements, no page scroll movement;
- durations within +-20 percent of the HTML value.

## 12. Log
- 2026-11-25: plan written from the pasted HTML (file not yet saved in docs/design/final/). Nothing built.
