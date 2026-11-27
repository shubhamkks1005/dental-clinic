# Handoff: Visit finished (docs/design/final/visit_finished.html)

Status: PLANNED
Written: 2026-11-27. Plan by: design-plan. Next skill: design-apply.

## 0. How to read this file
design-apply reads ONLY this file plus the HTML. Update the status lines and the checkboxes as work is done. Add a line to "Log" after every step.

**Important (owner, 2026-11-27): the HTML is NOT fixed yet.** The owner chose to plan now and correct the design during the build. Where the HTML and the owner's answers differ, the ANSWERS win. They are in docs/design/reviews/visit-finished.md section 5 (Q1-Q8) and docs/DECISIONS.md (2026-11-27, "Visit finished review" and "Visit finished, locking the invoice"). Every place where this plan departs from the HTML is marked **(review Q#)** or **(L#)**. Keep the HTML's theme, layout, copy style and motion everywhere else.

Inputs read: brief docs/design/briefs/visit-finished.md; review docs/design/reviews/visit-finished.md; backend built earlier in docs/design/handoff/doctor-visit.md section 13 (commits 26a4e1b, 05318a3, c907492, 5639f99, 17a3553).

## 1. The screen in one paragraph
The doctor's page right after "Finalise visit" on the visit page (`/app/visits/:id`). It shows the A4 prescription preview (left), "Today's details" not on the prescription (right), and below them the **invoice** made from the visit (lines, consultation fee, discount, paid at arrival, remaining or extra paid, note, take payment, pass to reception). Doctor only (`clinical.view`); a receptionist who opens the address sees "Doctor access only". New route `/app/visits/:id/finished` (lazy chunk `features/visit-finished/`). It replaces the after-finalise strip `VisitNextSteps` on the visit page. The visit page's Finalise navigates here. Laptop 1366 and tablet 768. Phone comes later; at 360 there must be no sideways scroll.

## 2. States (what can be on screen)
| Area | State | What shows | HTML lines |
|---|---|---|---|
| Page | Loading | three skeletons (Rx, details, invoice); Back to Today works | 386-392, 530-535, 640-645, 961 |
| Page | Wrong role (receptionist) | "Doctor access only. Only the doctor can see the visit. Your bill list is under Billing." + Go to Billing + Back to Today; no patient strip, no actions | 330-348, 963 |
| Header | Normal | Back to Today; title "Visit finished"; **finalised line "Visit finalised 11:40 am. The visit is now read only." (review Q3)**; patient strip name · age · gender · P-code **+ "Medical alert" mark when one exists (review Q3)**; Revise prescription + Add addendum (review Q8); Pass to reception · Prescription | 275-317 |
| Header | Rx passed | Pass button turns success colour with check pop, label "Passed to reception" | 1034-1039 |
| Rx | Issued | pill "Issued", RX number, print and download enabled | 362, 1086-1095 |
| Rx | Draft | pill "Draft", DRAFT watermark, banner "Not issued: the patient has no paper." + Issue prescription; print, download and pass disabled with the reason | 377-384, 398-400 |
| Rx | Revised | pill "Revised · RX-… v2" (review fix prompt 4) | not in HTML |
| Rx | None | "No prescription for this visit." in place of the sheet; Rx actions hidden | not in HTML (brief item 13) |
| Rx | Scaled | % chip shows the scale; click resets to 100 % (true A4) | 363, 1343-1357 |
| Details | Filled | Diagnoses (tooth chip), Procedures done (names only), Open plan items (sittings chip / Planned), Next appointment + Follow-up date, Files added today, **Addenda list + Add addendum (review Q3)** | 537-612 |
| Details | Empty | "Nothing else recorded for today." (brief item 15) | not in HTML |
| Details | Long list | first 5 + "Show all" | not in HTML |
| Details | Error | "Could not load today's details." + Retry; the rest still works | not in HTML |
| Details | Next patient | **"Next: Sunita Rao, waiting 12 min" + Open / "No one waiting." (review Q3)** | slot 614-615 |
| Invoice | Not billed (no live bill) | "Nothing to invoice on this visit." + Add consultation fee + Add line | 701-705 |
| Invoice | Draft, editing | lines editable; Add line; Add/Remove consultation fee; discount; note; main button **Save** (review Q2) | 685-836 |
| Invoice | Draft, saved | inputs read-only; buttons **Edit** and **Lock**; Pass, Print and Download also there (they confirm and lock) (review Q2) | not in HTML |
| Invoice | Confirm lock | popup "After this you cannot change the invoice." Confirm / Cancel (DECISIONS 2026-11-27) | not in HTML |
| Invoice | Locked, with reception | badge "With reception" + invoice number; lines locked; banner "Passed to reception."; **Open full invoice** (no Edit invoice, review Q2); note still editable | 1101-1103 (text changes) |
| Invoice | Paid | badge "Paid"; banner "Paid in full."; Take payment hidden | 1104-1106 |
| Invoice | Reminder | "Composite restoration (36) was done today. Add it to the invoice?" Add / Keep off (review Q3) | slot 674-675, script 1249-1260 |
| Invoice | Line with no fee | "No fee set" under the label + amount box; Save/Lock refused while 0 (L4) | 1129 |
| Invoice | Remaining | "Remaining ₹200" / "Extra paid ₹400" / "Nothing remaining" always one row (review Q3, A2) | 769-772 empty |
| Invoice | Extra paid | box "What should happen to the extra amount?" Returned / Keep as advance, **nothing pre-chosen (review Q7)** | 775-787 |
| Invoice | Earlier due | "Earlier due ₹1,500" (review Q3) | slot 789-790 |
| Invoice | Take payment | panel: amount (starts at remaining), mode, **reference**, Record payment, Cancel | 794-817 |
| Invoice | Load error | "Could not load invoice" + Retry; Rx and details still work | 647-662 |
| Invoice | Save failed | red line "Not saved. Try again." + the state stays (L9) | not in HTML |
| Invoice | Conflict | "The desk changed this invoice. Showing the latest." (brief section 7) | not in HTML |
| Toast | one element | success (green tick) only for success; errors use the red line, never the green toast (L9) | 319-328 |

## 3. Motion inventory (from the HTML style and script)
| # | Animation | Trigger | Element | Duration | Delay | Easing | HTML lines | Measure how |
|---|---|---|---|---|---|---|---|---|
| M1 | toastEnter: opacity 0→1, translateY -6→0 px | showToast (every success message) | #vf-toast | 180 ms | 0 | ease-out | 168-171, 177, 987-993 | sample opacity + top each frame after the click; ≥ 8 frames would need 133 ms+, 180 ms gives ~11 frames |
| M2 | checkPop: scale .5→1.18 (65 %)→1, opacity 0→1 | Pass to reception (Rx or invoice) succeeded | the button icon | 300 ms | 0 | cubic-bezier(0.2,0,0,1) | 172-178, 1037, 1058 | sample transform scale of the icon; peak ≈ 1.18 near 195 ms |
| M3 | button colour change primary → success | same | the Pass button | instant in HTML (`transition-all` with Tailwind default 150 ms cubic-bezier(.4,0,.2,1)) | 0 | Tailwind default | 308, 831, 1035, 1056 | sample background colour; 150 ms ±20 % |
| M4 | state-change colour on hover/press | hover on buttons and inputs | buttons | 120 ms (`state-change` token) / Tailwind `transition-colors` 150 ms | 0 | ease-out | 137-147 | spot check one button |
| M5 | skeleton pulse | loading | skeleton blocks | Tailwind `animate-pulse` 2 s infinite | 0 | cubic-bezier(.4,0,.6,1) | 388-391 | computed animation-duration = 2s |
| M6 | sheet resize | drag of the corner handle | #rx-a4-sheet zoom | follows the pointer, no transition | - | - | 1412-1441 | zoom follows pointer within 1 frame; clamp 0.7-1.3 |
Reduced motion: M1 and M2 become instant (opacity only), M5 stops.

## 4. Data and actions
| Item | In HTML | App today | Verdict | Detail |
|---|---|---|---|---|
| Patient strip + alert | 289-298 | visit summary / patient read | EXISTS | alert flag from the patient (same rule as the visit page strip `strip-model.ts`) |
| Finalised time | removed | `visits.finalised_at` | FIX FIRST (small) | `/after` returns `visit.status` but not `finalisedAt`: add it (P1.2.1) |
| Rx of this visit | 396-519 | `GET /visits/:id/prescriptions`, `PrescriptionBody` + `PrintLayout` (A5) | FIX FIRST | preview and print at A4 (brief 14 e) (P1.5) |
| Issue Rx | 383 | `POST /prescriptions/:id/issue` | EXISTS | |
| Revise Rx | (review Q8) | `POST /prescriptions/:id/revise` | EXISTS | opens the visit page's Rx part on the new version (P5.4.4) |
| Print Rx | 370 | `PrintPrescriptionScreen`, print log | EXISTS | A4 change (P1.5) |
| Download Rx / invoice | 366, 629 | none (server PDF is forbidden, AGENTS.md) | EXISTS via print | Download opens the print screen with `?download=1`, which calls `window.print()`; the user picks "Save as PDF"; `print-title.ts` names the file (L7) |
| Pass Rx to reception | 308 | receptionist already has `prescriptions.print` | NEW | column `prescriptions.desk_print_requested_at` (+ `_by`), route `POST /prescriptions/:id/desk-print` (doctor), desk Today shows "Print prescription" for that patient (P1.3, P2.2, P5.8) |
| Today's details | 537-608 | `GET /visits/:id/after` | EXISTS | diagnoses, procedures, plan, next appt, follow-up, files |
| Addenda | (review Q3) | `POST /visits/:id/addenda`, `VisitAddenda` | EXISTS | reuse the component logic, new look |
| Next waiting patient | (review Q3) | `VisitNextSteps` uses `listDayAppointments` (all doctors) | FIX FIRST | filter by THIS visit's doctor (multi-doctor decision 2026-11-26) (L8) |
| Invoice lines | 685-699 | `POST /visits/:id/bill {reviewFirst:true}`, `PATCH /bills/:id` (whole list) | EXISTS | `items` min 1 (L3); fee change needs a reason (L1) |
| Consultation fee | 713-716 | create with `consultation`; setting `billing.consultation_fee_paise` | FIX FIRST | adding to an EXISTING draft: client adds an item `{procedureLabel:"Consultation", unitPaise}` through `PATCH /bills/:id` (schema allows no listItemId: checked `bill-draft.ts:5-19`). Client needs the usual fee: `/after` returns it (P1.2.2) |
| Discount | 751-760 | `POST /bills/:id/discount/apply` (amount or percent, reason enum) | FIX FIRST | reason enum `hardship, staff_family, courtesy, other` has no "Settled at visit end": add `settled` (P1.1.1) |
| Paid at arrival (what for, time, who) | 736-742 | patient advance (`payments-advance.ts`), `payments.notes` / `reference` exist; the desk form has no "for" field | FIX FIRST + Q2 | `/after` returns today's unallocated payments of the patient with amount, mode, notes, time, who (P1.2.3). The "for" label: owner Q2 |
| Remaining / Extra paid | 769-772 | computed | FIX FIRST (shared rule) | one pure function `visitMoney()` in packages/shared (total − arrival; ≥0 remaining, <0 extra) used by client and tests (P1.1.2) |
| Earlier due | removed | `/after.earlierDuesPaise` | EXISTS | |
| Save (draft) | (review Q2) | `PATCH /bills/:id` + `PATCH /bills/:id/note` + discount/apply | EXISTS | Save = up to three calls in order, each version-checked (L5) |
| Lock (issue) | (review Q2) | `POST /bills/:id/issue {version, applyAdvance}` | EXISTS + NEW wrapper | new `POST /bills/:id/lock {version, extra: "returned"/"advance"/null}`: issue with applyAdvance, then for "returned" a refund of the leftover of today's arrival payment(s), reason "Extra returned at visit end" (brief 14 g) (P1.4, P2.1) |
| Pass invoice to reception | 831-835 | derived state "With reception" (`billStateWord`) | EXISTS | Pass = Lock (if not locked) then nothing else; the desk list already shows it |
| Take payment | 794-817 | `POST /payments` (doctor allowed; reference max 80) | EXISTS | lock first if draft (confirm), then pay with `allocations:[{billId, amountPaise}]` |
| Print invoice | 633 | `PrintBillScreen` (A5) | FIX FIRST | A4, and only on a locked invoice (review E4) (P1.5.2) |
| Bill note | 720-728 | `PATCH /bills/:id/note` (bills.create: desk may write) | FIX FIRST | desk only reads (brief 14 a): `bills.adjust` (doctor) (P1.3.3) |
| Open full invoice | (review Q2) | `/app/bills/:id` | EXISTS | link |
| Invoice number format | BL-2026-27-0042 | `formatBillingNo` gives `SB-2627-000050` | EXISTS | show the app's number; never the HTML's sample (L10) |
| State word | 626 | `billStateWord` (Not billed / Draft / With reception / Paid) | EXISTS | "Saved" is a page state over Draft, not a new bill status (L5) |

## 4b. Also used on (shared pieces)
| Piece | Other pages / files that use it | Apply there too? | Note |
|---|---|---|---|
| Word "Invoice" (review Q4: whole app) | BillScreen, BillHeader, BillItemsCard, BillTotalsCard, BillingHomeScreen tabs, DuesTab, PrintBillScreen, desk Today "Ready to bill", WaitingPanel, PatientBillingPanel, USER_MANUAL | YES, as phase P9 (its own commit). Ask the owner before starting P9 (memory rule: only the assigned page without a go-ahead) | number prefix SB-/B- stays: Q3 |
| A4 print (PrintLayout size) | PrintPrescriptionScreen, PrintBillScreen, PrintReceiptScreen, LiveRx on the visit page | YES (brief 14 e: owner wants A4 everywhere) | the visit page's live sheet follows automatically (one layout, PrescriptionBody) |
| Prescription body | `features/print/PrescriptionBody.tsx` (print + LiveRx) | reuse here, no copy | |
| Addenda | `features/visits/VisitAddenda.tsx` on the visit page | reuse its API; new look only here | visit page keeps its own (own final design) |
| Next waiting patient | `VisitNextSteps.tsx` | it is removed from the visit page (P5.1.3); doctor filter goes into the shared helper | |
| Toast | app toast (`ui/`), one element (lessons) | use the app toast; error variant red | |
| Confirm popup | app `Dialog` / confirm (`DocBar` uses one) | reuse | |
| Desk Today row | `features/today/DeskRowActions.tsx`, `buildTodayModel.ts` | gets "Print prescription" when passed (P5.8) | desk Today has no own final design for this button: copy the existing row action style |
| Bill note permission | BillScreen note field for the receptionist | becomes read-only for the desk | |

## 5. Work plan (Phases → Sub-phases → Sub-points; backend first, then UI)

### P1 BACKEND: shared rules, data and the new pieces
#### P1.1 Shared types and pure rules (packages/shared)
- [ ] P1.1.1 `packages/shared/src/billing.ts` `DISCOUNT_REASONS`: add `"settled"`; label map (where reasons are labelled for the UI, grep `staff_family`) gets "Settled at visit end". Why: brief action 5a, review B6. Check: `billing.test.ts` parses `{reason:"settled"}`; BillDiscountPanel still lists the old four plus the new one.
- [ ] P1.1.2 new `packages/shared/src/visit-money.ts` `visitMoney({ totalPaise, arrivalPaise, receivedPaise })` → `{ kind: "remaining"|"extra"|"none", amountPaise }` and `remainingAsDiscount(subtotal, arrival)` (never < 0, never > subtotal). Why: review A2, D5. Check: `visit-money.test.ts` (0, equal, less, more, discount clamp).
- [ ] P1.1.3 `packages/shared/src/bill-lock.ts` `parseLockBill({version, extra})`, `extra ∈ {"returned","advance"} | null`; refuse when the client sends `null` but the money shows extra (server re-checks). Why: review Q7. Check: unit test.
- [ ] P1.1.4 `packages/shared/src/visit-after.ts` (or the existing type export): add `finalisedAt`, `consultationFeePaise`, `arrival: {totalPaise, items:[{paymentId, amountPaise, mode, notes, reference, receivedAt, receivedByName}]}`, `doctorId`. Why: B1, D4, Q3 next patient. Check: typecheck.
#### P1.2 Repo: the "after" read (packages/db/src/repos/visit-after.ts)
- [ ] P1.2.1 select `visits.finalisedAt`, `visits.doctorId` in the first visit read. Why: B1, L8. Check: visit-after.test.ts expects them.
- [ ] P1.2.2 add the setting `billing.consultation_fee_paise` to the batch (one more select on `settings`). Why: consultation on an existing draft. Check: test with 0 and 50000.
- [ ] P1.2.3 add "paid at arrival": payments of the patient received on the visit day (IST) whose amount is not fully allocated to OTHER bills (reuse `advanceSlices` logic as SQL in the batch; IN lists ≤ 90). Return notes, reference, mode, time, recorder name. Why: brief item 12, review D4. Check: test with one cash 500 "Consultation" and one UPI 500 → total 1,000, two items. **Queries: 9 → 10 (limit ~10, rule S).** EXPLAIN in the query-plan test.
#### P1.3 Repo / migration: prescription passed to the desk, note permission
- [ ] P1.3.1 migration **0067_rx_desk_print.sql**: `ALTER TABLE prescriptions ADD desk_print_requested_at text; ADD desk_print_requested_by text; ADD desk_printed_at text;` then `pnpm db:lock`. Owner applies. Why: review Q1 (NEW). Check: migration test / schema snapshot.
- [ ] P1.3.2 `packages/db/src/repos/prescriptions-desk-print.ts` `requestDeskPrint(id, version)` (`prescriptions.write`, doctor; issued or revised only; sets the two columns; audit row; version bump) and `markDeskPrinted(id)` (`prescriptions.print`; sets `desk_printed_at`; audit). Check: repo test incl. draft refused.
- [ ] P1.3.3 `packages/db/src/repos/bills-note.ts:19` `assertAllowed(ctx, "bills.create")` → `"bills.adjust"` (desk only reads; brief 14 a, DECISIONS 2026-11-26). Check: receptionist PATCH note → 403 test; BillScreen hides the note editor for the desk (P5.9.2).
- [ ] P1.3.5 (Q1) `bills-update-draft.ts:88`: skip the `feeChangeReasonOk` check when `ctx.role === "doctor"` (keep it for the desk); the audit row gains `before/after` unit amounts of changed lines. Check: doctor changes 2,500 → 2,000 without reason → saved; desk same → refused.
- [ ] P1.3.4 `bills-ready.ts` / desk Today read: add `rxToPrint: {prescriptionId, rxNo} | null` for rows whose visit prescription has `desk_print_requested_at` and no `desk_printed_at` (same batch, no new round trip). Check: test.
#### P1.4 Domain: lock
- [ ] P1.4.1 `apps/worker/src/domain/bills.ts` new `lockBill(repos, id, body)`: parse (P1.1.3); `repos.bills.issue(id, version, {applyAdvance: true})`; if `extra === "returned"`, compute the leftover of TODAY's arrival payments (P1.2.3 rule) and call `repos.refunds.record({paymentId, amountPaise, mode: payment mode, reason: "Extra returned at visit end"})` per slice (newest first) until the extra is covered. If the money shows extra and `extra` is null → InvalidError "Choose Returned or Keep as advance." before issuing. Double call: same pattern as `createBillFromVisit` (already issued → return it, no second refund: check refunds for this reason + bill first). Why: review Q2, Q7, brief 14 g. Check: domain tests (extra returned, kept, none, twice).
- [ ] P1.4.2 the issue and the refund are two writes (D1 has no transaction across repos). If the refund fails after the issue: reply ok with `refundError` text; the page shows "Invoice locked. The return was not recorded: record it on the full invoice." Why: honest failure (L6). Check: test with a forced refund error.
#### P1.5 Print size A4
- [ ] P1.5.1 `apps/web/src/features/print/PrintPrescriptionScreen.tsx` `size="A5"` → `"A4"`; check PrescriptionBody spacing at A4. Why: brief 14 e, owner 2026-11-26. Check: print-regression spec screenshot.
- [ ] P1.5.2 `PrintBillScreen.tsx`, `PrintReceiptScreen.tsx` → A4. Check: print-regression.
- [ ] P1.5.3 `print-title.ts`: title "Invoice SB-2627-000050 Rahul Verma" / "Prescription RX-… " so "Save as PDF" names the file. `?download=1` on the print screens calls `window.print()` after load. Why: Download (review Q6, L7). Check: unit test of the title.

### P2 BACKEND: routes, permissions, route matrix
#### P2.1 Bills
- [ ] P2.1.1 `apps/worker/src/routes/staff-bills.ts` `POST /bills/:id/lock` → `lockBill`. Permission inside the repo: issue `bills.create`, refund `bills.adjust` (doctor). Receptionist with extra "returned" → 403 from the refund (the page is doctor-only anyway). Check: route test.
- [ ] P2.1.2 route-matrix entry + body helper for `/bills/:id/lock`. Check: route-matrix test green.
#### P2.2 Prescriptions
- [ ] P2.2.1 `staff-prescriptions.ts` `POST /prescriptions/:id/desk-print` (doctor) and `POST /prescriptions/:id/desk-printed` (desk, after printing). Check: role tests (receptionist 403 on the first).
- [ ] P2.2.2 route-matrix entries.
#### P2.3 Visits
- [ ] P2.3.1 `GET /visits/:id/after` returns the new fields (no route change). Receptionist 403 kept. Check: staff-visit-finished.test.ts.

### P3 BACKEND: tests and query count
#### P3.1
- [ ] P3.1.1 `staff-visit-finished.test.ts`: brief test cases P1-P12 (doctor-visit.md section 13) still pass + new: lock with extra returned / advance / none, lock twice, note by receptionist 403, desk-print flow, after read with arrival items. Queries per request: `/after` 9 → 10; `/lock` ≤ 8.
- [ ] P3.1.2 `bills-issue-concurrency.test.ts`: two `/lock` at once → one number, one refund.
- [ ] P3.1.3 query-plan test for the new arrival select (index on payments(patient_id, received_at): check it exists, else add to 0067).
- [ ] P3.1.4 `pnpm check` green.

### P4 UI: frame, tokens, fonts, icons
#### P4.1
- [ ] P4.1.1 `apps/web/src/features/visit-finished/` new folder; `index.ts`; route `visits/:id/finished` in `apps/web/src/routes/StaffRoutes.tsx` (lazy, own chunk). Why: lessons (JS budget). Check: build shows the chunk; budget test green.
- [ ] P4.1.2 `vf-tokens.css`: scoped `.visit-fin` tokens from HTML 12-147 (colours used on this page only: success, warning, info, light-*; radii 6/8/12/16; spacing 4/8/16/24/32; type scale display-md … mono-sm; `--vf-state: 120ms ease-out`, `--vf-enter: 200ms cubic-bezier(0.2,0,0,1)`). Reuse the visit page fonts file (`visit-doc-fonts.css`: Wix Madefor Display, Instrument Sans, Spline Sans Mono, icons subset) – add the icons this page needs (arrow_back, edit_note, send, check_circle, download, print, edit_document, open_in_full, stethoscope, add, delete, payments, receipt_long, lock_person, radiology, image, warning, error, refresh, close, lock). Check: icon names render.
- [ ] P4.1.3 Left rail and app frame: the app's StaffShell already draws the rail; do NOT rebuild it (HTML 209-265 is the shared sidebar).

### P5 UI: components and states
#### P5.1 Entry and exit
- [ ] P5.1.1 `features/visit-doctor/DocBar.tsx` `onFinalised`: navigate to `/app/visits/${id}/finished` (replace). Why: brief section 4. Check: e2e finalise → URL.
- [ ] P5.1.2 `DoctorVisitPage.tsx:251-254`: remove `VisitNextSteps` (moves here). Addenda on the visit page stay.
- [ ] P5.1.3 `features/visits/VisitNextSteps.tsx`: delete after its "next waiting" logic moves to `visit-finished/next-waiting.ts` (filter `a.status === "arrived" && a.patientId !== patientId && a.doctorId === visit.doctorId`) (L8). Update MAP.md.
- [ ] P5.1.4 Receptionist on the URL: `BlockedView.tsx` (HTML 330-348 text exactly). Check: e2e as desk.
#### P5.2 Data hook
- [ ] P5.2.1 `useVisitFinished.ts`: on open, in ONE round: `GET /visits/:id/after` + `GET /visits/:id/prescriptions`; if `after.bill == null` and procedures > 0 → `POST /visits/:id/bill {reviewFirst:true}` once (brief 14: the page makes the draft on open). Consultation-only: no call; show "Nothing to invoice". Rule S: no waterfall beyond this.
- [ ] P5.2.2 refresh every 30 s while `document.visibilityState === "visible"` (after only); stale-refresh guard (lessons: count local changes); on failure keep data and show "Last updated 10:42 am". Never overwrite fields the doctor is typing in (dirty lines kept; show "The desk changed this invoice. Showing the latest." only when the server version moved AND nothing is dirty; if dirty: keep typing, Save will hit a conflict → reload with that message).
#### P5.3 Header
- [ ] P5.3.1 `VfHeader.tsx`: Back to Today (`/app/today`), title, finalised line "Visit finalised {h:mm a}. The visit is now read only." (B1), patient strip with "Medical alert" chip (words + icon) (B2).
- [ ] P5.3.2 Right: "Revise prescription" (Rx issued/revised) and "Add addendum" (scrolls to and opens the addendum form in Details) (review Q8). Then "Pass to reception · Prescription" (HTML 308-314 look).
- [ ] P5.3.3 Rx pass: `POST /prescriptions/:id/desk-print`; button busy "Passing..."; success → check pop (M2) + label "Passed to reception" + toast "Prescription passed to reception."; disabled with reason when Rx is draft/none ("Issue the prescription first."). Already requested (reload) → shows passed state.
#### P5.4 Prescription part
- [ ] P5.4.1 `RxPreview.tsx`: toolbar (title, status pill Issued/Draft/Revised + number, % chip, Download, Print prescription) HTML 358-375; sheet = `PrintLayout size="A4"` + `PrescriptionBody` (same as print). **Default scale = true A4 size (100 %), not fit-to-width (review Q6)**; the sheet area scrolls inside its own box if wider than the column.
- [ ] P5.4.2 Resize (review Q6): corner handle (diagonal) as in HTML 1412-1441, plus a right-edge handle (horizontal) and bottom-edge handle (vertical); all three set one zoom value (0.7-1.3, HTML clamp) – horizontal uses dx/420, vertical dy/420, corner (dx+dy)/420 (HTML 1433); 44 px hit area each (visible icon can stay 28 px); `touch-action:none`; keyboard: handle focus + arrow keys ±0.05; % chip click → 1.0. Persist the scale per user in localStorage (try/catch). (L11)
- [ ] P5.4.3 Draft: watermark, banner, "Issue prescription" (`POST /prescriptions/:id/issue`), print/download/pass disabled with the reason. None: "No prescription for this visit.".
- [ ] P5.4.4 "Revise prescription": `POST /prescriptions/:id/revise` then navigate to `/app/visits/:id` with the Rx part open on the new draft (the visit page handles revise editing). Check: e2e.
- [ ] P5.4.5 Print: open `/app/print/prescriptions/:id` (existing print route) in a new tab; Download: same with `?download=1`.
#### P5.5 Today's details
- [ ] P5.5.1 `TodayDetails.tsx` sections as HTML 538-608: diagnoses (tooth chip `#46`), procedures (names, tooth), open plan items ("1 / 2 sittings" or "Planned"), next appointment "03-12-2026 · 10:30 am" + follow-up, files (icon by kind). Empty parts hidden; all empty → "Nothing else recorded for today."; > 5 in a list → first 5 + "Show all".
- [ ] P5.5.2 `AddendaBlock.tsx`: list (text, reason, who, when) + "Add addendum" form (text + reason, Save), reusing the API of `VisitAddenda.tsx`. Toast "Addendum added to visit record." (HTML 1393).
- [ ] P5.5.3 `NextWaiting.tsx` under the details card: "Next: {name}, waiting {n} min" + Open (opens/reuses that visit, `openOrReuseVisit`), or "No one waiting.".
- [ ] P5.5.4 Error: "Could not load today's details." + Retry (only this card).
#### P5.6 Invoice part: lines and controls
- [ ] P5.6.1 `InvoiceCard.tsx` header: "Visit invoice" + state badge (words) + number once locked + save line ("Saving...", "Saved", "Not saved. Try again.") (B3); Download + Print invoice only enabled when locked, else they confirm-and-lock (Q2 decision).
- [ ] P5.6.2 `InvoiceLines.tsx`: rows label / qty / amount (₹, integer rupees in the box → paise ×100 on send) / remove; header row Item · Qty · Amount (₹). Qty min 1 (L12). (changed 2026-11-27: Q1 answered a) no reason field for the doctor; the server skips the check for the doctor (P1.3.5).
- [ ] P5.6.3 "Add line" → new row "Custom item", amount empty with "No fee set" until typed (never ₹0 saved, L4). "Add consultation fee" adds `Consultation` with `after.consultationFeePaise` (if 0: empty amount + "No fee set"); toggles to "Remove consultation fee"; at most one.
- [ ] P5.6.4 `DoneNotBilled.tsx` reminder (review Q3, A1): compute on the client: `after.procedures` whose id is not any line's `visitProcedureId` and whose label+tooth is not a line label → list. Text "{label} ({tooth}) was done today. Add it to the invoice?" Add (adds the line with its Library fee) / Keep off (hides that one for this page session). Shows again beside the Lock/Pass confirm when still missing.
- [ ] P5.6.5 Empty: "Nothing to invoice on this visit." + "Add a consultation fee or a custom line below if needed." First line added on a consultation-only visit → `POST /visits/:id/bill {reviewFirst:true, consultation:true, consultationPaise}` (creates the draft).
- [ ] P5.6.6 Last line removed on a draft → Save disabled: "An invoice needs at least one line." (server `items.min(1)`, L3).
#### P5.7 Invoice part: money, Save / Edit / Lock, pass, pay
- [ ] P5.7.1 `MoneySummary.tsx` order as HTML 735-791: Paid at arrival (+ breakdown line "Consultation ₹500 · X-ray ₹500 · 10:05 am · Priya", from notes, else mode – see Q2), Subtotal, Discount (amount or %; "Remaining as discount" button; reason select incl. "Settled at visit end", auto-picked by the button), Invoice total, ONE row from `visitMoney()`: "Remaining ₹200" / "Extra paid ₹400" / "Nothing remaining", extra box (nothing pre-chosen, Q7), Earlier due. After lock the arrival row reads "Received ₹X of ₹Y" (D3). Totals on screen are a preview; the server numbers replace them after each save (money: never optimistic for the saved value).
- [ ] P5.7.2 Discount bigger than subtotal → message under the field "Discount cannot be more than ₹1,200." and Save disabled (E6).
- [ ] P5.7.3 `InvoiceActions.tsx` – flow (review Q2 + DECISIONS 2026-11-27):
  - editing → primary **Save**: sends in order `PATCH /bills/:id` (lines), then `POST /bills/:id/discount/apply` if the discount changed, then `PATCH /bills/:id/note` if the note changed; each uses the version from the previous reply. Toast "Invoice saved." Inputs become read-only.
  - saved → **Edit** (back to editing, nothing sent) and **Lock**.
  - **Lock**, **Pass to reception**, **Print invoice**, **Download** on a not-locked invoice: (Save first if dirty) → confirm dialog "After this you cannot change the invoice." [Confirm] [Cancel]; the missing-procedure reminder repeats inside the dialog if any; extra paid with no choice → the dialog does not open, the extra box shows "Choose Returned or Keep as advance." → Confirm calls `POST /bills/:id/lock {version, extra}`, then the action (Pass: nothing more; Print/Download: open print route).
  - locked → Pass is just a state (badge "With reception"); the button shows "Passed to reception" (M2/M3) and is disabled; "Open full invoice" link; note still editable with its own small "Save note".
  - every button: `useSubmitOnce` (double tap), busy word ("Saving...", "Locking..."), on refusal the server sentence in the red line and the screen as before.
- [ ] P5.7.4 Take payment here (HTML 794-817 + Reference field, max 80): amount starts at remaining (hidden when nothing remains); on a draft → confirm-and-lock first; then `POST /payments {patientId, amountPaise, mode, reference, allocations:[{billId, amountPaise}]}`; toast "Payment of ₹X (UPI) recorded." + "Print receipt" link; state from the reply ("Paid" or still "With reception"). More than remaining → refuse in the form "More than the remaining. Record the extra as advance on the full invoice." (no silent advance).
- [ ] P5.7.5 Note: 200 chars, counter, helper "No health details here. The desk can read it." (HTML 727 text says "visible on billing & receipts": the note is not printed on receipts today (UNVERIFIED in PrintReceiptScreen) – use the brief's words) (L13).
#### P5.8 Desk Today: prescription to print
- [ ] P5.8.1 `features/today/DeskRowActions.tsx`: when the row has `rxToPrint`, a button "Print prescription" opens `/app/print/prescriptions/:id`; after the print screen loads it calls `POST /prescriptions/:id/desk-printed`; the button disappears on the next refresh. The desk sees only the print screen, no preview on Today (Settings option later, Q4).
#### P5.9 Other pages touched by rules
- [ ] P5.9.1 `features/billing/BillScreen.tsx`: note editor hidden for the receptionist (read only) (P1.3.3).
- [ ] P5.9.2 `DocBar.tsx:101` text "Finalise creates bill & updates plan" → "Finalise opens the invoice & updates plan" (the bill is now made on this page).

### P6 UI: motion (one sub-point per row of section 3)
#### P6.1
- [ ] P6.1.1 M1 toast 180 ms ease-out, -6 px → 0, one toast element. Check: probe (section 11).
- [ ] P6.1.2 M2 check pop 300 ms cubic-bezier(0.2,0,0,1), keyframes .5 → 1.18 (65 %) → 1. Check: probe peak scale.
- [ ] P6.1.3 M3 Pass button colour 150 ms cubic-bezier(.4,0,.2,1). Check: sampled colour.
- [ ] P6.1.4 M4 hover 120 ms ease-out. Check: computed transition.
- [ ] P6.1.5 M5 skeleton pulse 2 s. Check: computed animation.
- [ ] P6.1.6 M6 resize follows the pointer, no transition; first paint at 100 % with `transition:none` (lessons).
- [ ] P6.1.7 reduced motion: M1, M2 instant; M5 off.

### P7 UI: tablet, keyboard, shared pieces
#### P7.1
- [ ] P7.1.1 768 px: Rx and details stack (HTML `lg:grid-cols-12` → one column under 1024); invoice lines stack (label full width, qty/amount/remove row) as HTML 686-698. 1366: 8/4 split (xl) and invoice 7/5.
- [ ] P7.1.2 360 px: no sideways scroll (sheet scrolls inside its box). Phone layout itself is parked.
- [ ] P7.1.3 Keyboard: Enter in an invoice field = Save (editing) / Lock (saved); Esc closes confirm and take-payment; focus returns to the opener; all buttons 44 px.
- [ ] P7.1.4 Shared from 4b: A4 prints (P1.5), note permission (P5.9.1), desk row (P5.8).

### P10 BACKEND + UI: invoice made at arrival by the desk (owner Q2, 2026-11-27)
#### P10.1 Setting and data
- [ ] P10.1.1 tunable `billing.invoice_timing` = `"after_visit"` (default, today's flow) | `"at_arrival"`; shared entry, seed in migration 0067, tests (tunables-guard). Doctor edits it (`settings.billing`). The Settings UI for it comes with the Settings page (reminder saved); until then a plain select in the existing Billing settings part.
- [ ] P10.1.2 migration 0067 also: `ALTER TABLE bills ADD appointment_id text;` + index; a draft made at the desk has `appointment_id` and no `visit_id`.
- [ ] P10.1.3 repo `bills-from-appointment.ts` `createForAppointment(appointmentId)` (`bills.create`; only when the setting is `at_arrival`; appointment arrived or in chair; one live invoice per appointment: return the existing one on a second call). Desk may add lines (Library items, consultation) with the desk fee rule (reason needed when a fee differs).
- [ ] P10.1.4 attach: when the doctor opens the visit (`visits` open with that appointment) OR at `POST /visits/:id/bill`, a live draft with that `appointment_id` and no `visit_id` gets `visit_id` set (one batch, audit). `createFromVisitOnce` then ADDS the visit's procedure lines that are not already on it (match on `visitProcedureId` / Library item) instead of making a new bill. Keep the unique "one live bill per visit" index (0063).
- [ ] P10.1.5 Q5 default: the desk can NOT issue a draft that has an `appointment_id` while its visit is open or not finalised ("The doctor will finish this invoice."). After Finalise the doctor locks it on this page.
#### P10.2 Routes
- [ ] P10.2.1 `POST /appointments/:id/invoice` (desk + doctor) → `createForAppointment`; route matrix; role tests.
#### P10.3 UI
- [ ] P10.3.1 desk Today row (`DeskRowActions.tsx`): "Start invoice" when the setting is `at_arrival` and the patient has arrived; opens the existing Bill screen (`/app/bills/:id`) on the draft; the arrival payment form there has the "For" choice (P10.3.3).
- [ ] P10.3.2 Billing page: "New invoice" for a patient with an arrived appointment today (search box → patient → today's appointment) → same Bill screen.
- [ ] P10.3.3 Payment form (`PaymentTakeForm.tsx`): "For" chips Consultation / X-ray / Other (Other → short text), stored as `notes` "For: Consultation" (owner Q2a). Shown on this page's "Paid at arrival" line.
- [ ] P10.3.4 This page: when the invoice came from the desk, the lines the desk added show a small "Added at desk" word; everything else as in P5.
#### P10.4 Tests
- [ ] P10.4.1 at_arrival: desk starts invoice, takes ₹500 "Consultation", doctor finalises → this page shows the same invoice with desk lines + visit lines, Paid at arrival ₹500 Consultation; lock gives one number. after_visit: no "Start invoice" anywhere.

### P8 Docs and measurement
#### P8.1
- [ ] P8.1.1 e2e `e2e/visit-finished.spec.ts`: section 10 cases; port `visit-to-bill.spec.ts` (it uses VisitNextSteps "Create bill").
- [ ] P8.1.2 motion probe (copy `.claude/skills/design-apply/motion-probe.template.ts`), 300 ms API delay, M1-M3, numbers in the Log; delete the tmp spec.
- [ ] P8.1.3 MAP.md (new folder, files removed), STATE.md, USER_MANUAL.md (doctor: after Finalise; desk: Print prescription), handoff INDEX.md status, DECISIONS (Q answers).

### P9 Word "Invoice" across the app (review Q4) – start only after the owner says go
#### P9.1
- [ ] P9.1.1 grep `\bBill\b|\bbill\b` in user-visible strings of `apps/web/src/features/{billing,today,print,patients}` and USER_MANUAL; replace the WORD only (routes, code names, API, table names stay `bill`). Bill number prefix stays (Q3). Check: e2e selectors updated; print-regression.

Migration number: **0067_rx_desk_print** (owner applies; never applied by the agent). If P3.1.3 needs an index, it goes in the same file.

## 6. Logic changes (frontend)
- State: `{ after, rx, bill (server), draft: {lines, discount, note} | null, mode: "editing"|"saved"|"locked", saveState, extraChoice: null|"returned"|"advance", dismissedReminders: Set<visitProcedureId> }`. `mode` comes from the server (`bill.status === "issued"` → locked) plus the client (saved vs editing for a draft). A fresh open of a draft that was saved before → "saved".
- Money is never optimistic: the on-screen preview total uses `computeBillTotals` from packages/shared (same function as the server) while typing; the saved numbers come from the reply.
- Rx pass and status words may be optimistic (status), with rollback and one sentence on refusal.
- Refresh: one quiet refresh 1-1.5 s after a successful action (lessons), and the 30 s timer.
- Server decides: totals, number, advance applied, refund amount, state word.

## 6b. Logic problems and design issues (checked against the real code)
| # | Problem | Proof | Fix / Q |
|---|---|---|---|
| L1 | Changing a line amount away from the Library fee needs a reason on the server; the design has no reason field, so Save would fail with "Give a reason when the fee … differs from the list." | `packages/shared/src/bill-draft.ts:37-45`, `bills-update-draft.ts:88-93` | **Q1** |
| L2 | "Paid at arrival: what for" – the desk's payment form has no "for" field; only free `notes` (200) and `reference` (80) exist | `packages/shared/src/payments.ts:17-18`; Billing brief T5 lists no "for" | **Q2** |
| L3 | A draft must keep ≥ 1 line (`items.min(1)`); the design lets the doctor remove the last line | `bill-draft.ts:23` | Decided: Save disabled with "An invoice needs at least one line." (P5.6.6) |
| L4 | "Add line" makes a ₹0 "Custom item" and Pass accepts it; ₹0 lines are allowed by the schema (`unitPaise min 0`) | HTML 1231, `bill-draft.ts:9` | Decided: client refuses Save/Lock while a line has no amount; a deliberate free line is typed as 0 after a "No charge" tick – not in scope; plain refusal now (P5.6.3) |
| L5 | "Saved" is not a bill status; only draft/issued/cancelled exist | `staff-bills` domain `BILL_STATUSES` | Decided: Saved = client mode over Draft; desk sees "Draft" as before (no migration) |
| L6 | Lock with "Returned" = issue + refund = two writes; a failure in between leaves a locked invoice without the refund | D1 has no cross-repo transaction (AGENTS) | Decided: P1.4.2 honest message + link to full invoice |
| L7 | Download as a server PDF is forbidden (AGENTS: no server-side PDF) | AGENTS.md:30 | Decided: browser print → Save as PDF, file named by print-title (P1.5.3) |
| L8 | "Next waiting patient" today takes ANY doctor's arrived patient; with several doctors the doctor would open another doctor's patient | `VisitNextSteps.tsx:33-35` | Decided: filter by the visit's doctor (P5.1.3) |
| L9 | One green toast for every message (HTML 320): an error would show a green tick | HTML 320-327 | Decided: errors in a red line, never the green toast |
| L10 | HTML numbers `BL-2026-27-0042` do not match the app's `SB-2627-000050` | `numbering.test.ts:108` | Decided: the app's format; Q3 for the prefix under "Invoice" |
| L11 | Resize handle is 28 px; the owner wants horizontal + vertical + diagonal | HTML 516, review Q6 | Decided: three handles, 44 px hit area, one zoom value (P5.4.2) |
| L12 | Qty input allows 0 in script (`Math.max(0…)`) though `min="1"` | HTML 1213 | Decided: clamp 1-99 (server limit) |
| L13 | Note helper says "visible on billing & receipts"; receipts do not print the note (UNVERIFIED) | HTML 727 | Decided: brief text "No health details here. The desk can read it." |
| L14 | The desk opening the print screen sees the full prescription on screen before it prints | `prescriptions.print` includes receptionist (`permissions.ts:19`) | **Q4** |
| L15 | Take payment above the remaining silently becomes "paid at arrival" in HTML; server refuses above due without `allowAdvance` | HTML 1330; `payments.ts:27` | Decided: refuse in the form (P5.7.4) |
| L16 | HTML script crashes on removed elements (`bill-reminder`, `sum-balance-*`, `earlier-due-row`) | HTML 1112, 1163, 1184 | Build from this plan, not the script, for those parts |

## 7. New things that need the owner's answer
| # | Question | Options | Default if no answer | Owner's answer |
|---|---|---|---|---|
| Q1 | Line amount changed from the Library fee: the server needs a reason (old rule 5.3.1). Keep it? | a) Doctor: no reason needed (desk still needs one) b) Small reason field appears under the changed line | a | **a** (2026-11-27): the doctor changes fees without a reason; the desk keeps the rule; the audit keeps old and new amounts → P1.3.5, P5.6.2 changed |
| Q2 | "Paid at arrival: what for": the desk records no purpose today | a) Add a "For" choice (Consultation / X-ray / Other) to the desk's payment form, stored in notes b) Show the payment mode only | a | **a**, plus (2026-11-27): many clinics make the whole invoice at the desk first and the doctor adds to it. A **Settings option (doctor chooses)**: invoice made **after the visit** (today's flow) or **at arrival by the desk**. In "at arrival" the desk can start the invoice from BOTH the desk Today row and the Billing page; the doctor's flow stays the same (this page opens that invoice and the doctor adds lines). → P10 |
| Q3 | With "Invoice" everywhere, the number prefix (SB-2627-000050)? | a) Keep the number as is b) Change the prefix (new year only) | a | **a** (2026-11-27): number unchanged, only the word |
| Q4 | Desk printing a passed prescription: the print screen shows the sheet on screen | a) Fine (print screen only, no preview on Today) b) Print without showing (hard; browser shows a preview anyway) | a | **a** (2026-11-27); a "desk may preview" option comes with the Settings page |
| Q5 | Desk-made invoice in "at arrival" mode: may the desk LOCK it, or does it stay a draft until the doctor locks? | a) Stays a draft; the doctor adds lines and locks b) Desk may lock; the doctor's lines then go on a second invoice | a | Not answered directly (owner said: Settings decides before/after). **Plan uses a)** because the doctor "adds to it"; confirm at apply time |

## 8. Decisions already taken (also in docs/DECISIONS.md)
- Review Q1-Q8 and the auto-lock confirm (2026-11-27), brief section 13 (2026-11-25/26).
- Plan decisions L3-L16 above (this file); recorded in DECISIONS with this plan.

## 9. Design apply checklist
- [ ] tokens/colours (scoped), icons, CSS files
- [ ] components (one per file, small)
- [ ] every motion in section 3
- [ ] reduced motion
- [ ] phone 360 / tablet 768 layout
- [ ] shared pieces from 4b applied on the other pages (and checked there)
- [ ] docs: MAP.md, STATE.md, USER_MANUAL.md, handoff INDEX.md

## 10. Test cases (state x interaction x edge)
| # | Case | Steps | Expect (look) | Expect (numbers) |
|---|---|---|---|---|
| T1 | Finalise opens the page | finalise a visit with RCT 46 + composite 36 | URL /finished, finalised line, draft invoice | draft with 2 lines |
| T2 | Reminder | remove composite line | reminder for composite | Add puts it back with Library fee |
| T3 | Keep off | Keep off, then Lock | reminder shows again in confirm | - |
| T4 | Save / Edit / Save | change amount, Save, Edit, change, Save (×3) | read-only after each Save | version +1 each, server total shown |
| T5 | Lock via Pass | Pass on a saved draft → Confirm | badge With reception, number | 1 number, counter +1 |
| T6 | Cancel confirm | Pass → Cancel | nothing changes | no number |
| T7 | Print draft | Print invoice on draft → Confirm | locks, print opens A4 | 1 number |
| T8 | Double tap Lock | tap twice fast | one dialog, one lock | one number |
| T9 | Extra paid returned | arrival 1,600, bill 1,200, choose Returned, Lock | "Received ₹1,200" | refund 400, reason text |
| T10 | Extra no choice | arrival > bill, Lock | "Choose Returned or Keep as advance." | nothing sent |
| T11 | Remaining as discount | arrival 1,000, bill 1,200 | Discount 200, reason Settled, "Nothing remaining" | discount audited twice |
| T12 | Discount too big | type 5,000 on 1,200 | message, Save disabled | - |
| T13 | Consultation only | visit with no procedures | "Nothing to invoice"; Add consultation creates draft | consultation line = setting |
| T14 | Last line removed | remove all | Save disabled + message | - |
| T15 | Take payment | draft, take 200 UPI ref 1234 | confirm-lock, Paid | payment allocated to bill |
| T16 | Note after lock | edit note | saved, still locked | money unchanged, audit |
| T17 | Rx draft | Rx not issued | watermark, banner, Rx pass disabled | - |
| T18 | Rx pass | pass | check pop, desk Today shows Print prescription | columns set |
| T19 | Revise | Revise prescription | visit page on new draft | revised_from_id set |
| T20 | Receptionist URL | desk opens /finished | Doctor access only | /after 403 |
| T21 | Server refuses Save (stale version) | desk edits meanwhile | "The desk changed this invoice. Showing the latest." | doctor's typing kept until reload |
| T22 | Slow server 300 ms | every button | first change < 100 ms (busy word) | - |
| T23 | Next waiting other doctor | another doctor's arrived patient only | "No one waiting." | - |
| T24 | 360 / 768 / 1366 | each width | no sideways scroll | - |
| T25 | Keyboard only | Tab to lines, Enter saves, Enter locks, Esc closes | focus returns | - |
| T26 | Resize | drag right edge, bottom edge, corner; click chip | zoom 0.7-1.3, back to 100 % | - |

## 11. Measurement targets
- first visible change within 100 ms of the click, even with a 300 ms server;
- each transition spans >= 8 frames over its HTML duration, no 1-3 frame jump larger than 24 px;
- no layout jump of other elements, no page scroll movement;
- durations within +-20 percent of the HTML value.

## 12. Log
- 2026-11-27: owner answered Q1 a, Q2 a + desk-first invoice by Settings option (new phase P10, migration 0067 grows: bills.appointment_id, setting billing.invoice_timing), Q3 a, Q4 a. Q5 (may the desk lock a desk-made invoice) not answered directly: plan uses "stays a draft, doctor locks". Status: PLANNED, ready for design-apply after the owner confirms Q5.
- 2026-11-27: plan written from visit_finished.html (not yet corrected) + review answers Q1-Q8 + lock confirm. Code read: visit-after.ts, bills-update-draft.ts, bill-draft.ts, payments.ts, payments-advance.ts, bills-note.ts, domain/bills.ts, staff-bills.ts, VisitNextSteps.tsx, DocBar.tsx, print screens (A5), permissions. Nothing built. Open: Q1-Q4.
