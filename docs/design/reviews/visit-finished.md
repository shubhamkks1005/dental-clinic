# Design review: Visit finished page

Design reviewed: docs/design/final/visit_finished.html (added 2026-11-27). Brief used: docs/design/briefs/visit-finished.md (with owner answers of 2026-11-25 and 2026-11-26). Date: 2026-11-27.
Reviewer: design-review (logic only; looks and motion are out of scope).

## 0. The page in one line
Purpose: "The visit is done. What is the bill, what does the patient take away, and who collects the money?"
Jobs: 1) see and fix the bill made from the visit; 2) settle the remaining (discount) or the extra paid (returned / advance); 3) never lose a done procedure from the bill; 4) check and print the prescription; 5) glance at today's details; 6) pass the bill to the desk or take payment; 7) bill note; 8) back to Today / next patient; 9) fix a mistake (addendum, full bill). Target: under 20 seconds.

## 1. Summary
| Group | Count | Most important |
|---|---|---|
| A. Missing (blocker) | 4 | The "Add it to the bill?" reminder and the Remaining row are gone (owner decisions), and the script crashes on their missing slots |
| B. Missing (important) | 8 | Finalised notice, medical alert in the strip, bill number and save state, addenda, next patient, discount reason, take-payment reference, failure states |
| C. Should not be here | 3 | "Pass to reception: Prescription" (the desk never sees prescription content); Download PDF buttons; drag-to-resize handle |
| D. Wrong or inconsistent | 6 | "Invoice" instead of "Bill"; payments at the chair counted as "Paid at arrival"; arrival breakdown shows modes, not what it was for; the main bill action is below the fold |
| E. Risky | 6 | "Edit invoice" unlocks an issued bill; "Returned" is pre-ticked; a Rs 0 line or an empty bill can be passed; Print invoice prints the draft edit form |
| F. Suggestions | 4 | Enter = Pass bill, warn on Back with an un-passed draft, one "Done" action, auto-scroll to the reminder |

## 2. What the design already does well (short)
- Three parts on one screen as the owner asked: A4 prescription preview, today's details beside it (names only, no fees), the bill below.
- Every bill line is editable (label, quantity, amount, remove), "Add line", "Add / Remove consultation fee" (one line only, toggled).
- "Discount" is always shown (also 0) with a one-tap "Remaining as discount" that the doctor can lower by typing.
- "Extra paid" offers Returned or Keep as advance.
- Draft prescription: DRAFT watermark, "Not issued: the patient has no paper." banner, Issue button, Print disabled.
- Bill note: 200 characters, counter, "No health details here".
- States designed in the script: loading skeletons for all three parts, bill load error with retry (the rest stays usable), wrong-role view for the receptionist, With reception and Paid banners, consultation-only empty state.
- Print CSS prints only the chosen sheet, not the page.

## 3. Findings

### A. Missing (blocker): the page cannot do its job without it

**A1 [Blocker] The "Done today but not on the bill" reminder is removed**
- Where: empty slot at lines 674-675 ("Non-blocking ... Reminder" comment with nothing under it); the script still calls `bill-reminder` (line 1112) and `addSuggestedProcedure` (line 1249).
- What is wrong: the sample visit itself shows the problem: "Procedures done" lists Composite restoration #36, the bill has only the RCT line, and nothing tells the doctor.
- Why it matters: owner decision 2026-11-26 (DECISIONS) and brief item 10 / job 3: "not lose money by mistake". This is the page's main safety net.
- What to do: put back a small, non-blocking prompt above the lines: "Composite restoration (36) was done today. Add it to the bill?" with Add and Keep off; show it once more at Pass to reception.
- Backend impact: none (computed on the client from `/after` procedures and the draft lines, brief 14 (d)).

**A2 [Blocker] The Remaining / Extra paid / Nothing remaining row is empty**
- Where: lines 769-772 (`sum-balance-row` has no label and no value); the script writes to `sum-balance-label` and `sum-balance-val`, which do not exist.
- What is wrong: the one number the desk or doctor still has to collect is not shown. "Extra paid" is not shown either, only the box asking what to do with it.
- Why it matters: brief items 12a and section 9 ("the remaining (or the extra paid)" must never be missed). Without it "Remaining as discount" has nothing visible to settle.
- What to do: show "Remaining Rs 200", or "Extra paid Rs 400", or "Nothing remaining" (do not hide the row at zero; the brief asks for words).
- Backend impact: EXISTS (balance from the bill; arrival advance preview is FIX FIRST, brief 14 (f)).

**A3 [Blocker] The prototype script stops on load**
- Where: `render()` line 1112 reads `bill-reminder` (removed) and throws; lines 1163-1185 also read removed elements (`sum-balance-*`, `earlier-due-row`).
- What is wrong: after the first error nothing re-renders: totals do not change when lines are edited, the consultation button label never flips, Pass to reception does not show "Passed". The static HTML is the only working view.
- Why it matters: the final-design rule says "build exactly this, read the script too". A builder cannot follow a script that does not run, and cannot tell which removed parts were on purpose.
- What to do: the owner says which parts were removed on purpose (question 3); the plan then treats the script as reference for behaviour only where it still runs.
- Backend impact: none.

**A4 [Blocker] Pass to reception does not check anything**
- Where: `passInvoiceToReception()` line 1300.
- What is wrong: it passes an empty bill (consultation-only visit with no lines), a bill with a "Custom item" at Rs 0 (Add line creates amount 0, line 1231), and a bill whose remaining is zero (the brief says that one is simply issued as paid).
- Why it matters: brief action 6 "Bill has at least one line"; action 3 "never a line with no amount"; issuing takes a gap-free number that can never be taken back.
- What to do: disable Pass with a reason in words when there are no lines ("Nothing to bill. Add a consultation fee or go back to Today.") or a line is Rs 0 ("Custom item has no amount"); when nothing remains, the button says "Issue as paid".
- Backend impact: EXISTS (issue refuses an empty bill; check that a 0-amount line is refused, else FIX FIRST: small).

### B. Missing (important)

**B1 [Important] "Visit finalised" notice with time and "read only"** — the title says only "Visit finished" (line 286). Brief item 1 (MUST): the doctor must know the lock happened and when. Add "Visit finalised 11:40 am. The visit is now read only." Backend: EXISTS (`finalised_at`).

**B2 [Important] Medical alert missing in the patient strip** — empty slot at line 297. The A4 sheet shows "Allergy: Penicillin" but the strip (beside every money action) does not. Brief item 2: "that a medical alert exists". Backend: EXISTS.

**B3 [Important] Bill number and save state are gone from the page** — header pills `hdr-bill-state`, `hdr-bill-num`, `hdr-save-state` were removed (line 287, script 1022-1028 guards them). The bill badge shows the state word, but the bill number (BL-2026-27-0042) is never shown after issue, and there is no "Saving... / Saved / Not saved, try again" anywhere. Brief items 3 and 18, section 9 "that a change was saved". Add the number next to the badge once issued, and one save line in words. Backend: EXISTS.

**B4 [Important] Addenda and "Add addendum" are removed** — slot at lines 610-611; script functions remain (1378-1410). Brief job 9 and item 16: a finalised visit is fixed only by addendum. Without it, "Edit prescription" (C/E2) becomes the only way to fix things, which breaks the lock rule. Backend: EXISTS (`visit_addenda`).

**B5 [Important] "Next waiting patient" is removed** — slot at lines 614-615. Brief item 17 (SHOULD) and job 8: "Open next waiting patient: <name>" saves a trip through Today. Owner may have dropped it on purpose (question 3). Backend: EXISTS (Today read).

**B6 [Important] Discount has no reason and no percent** — lines 751-760, amount only. Brief item 8 / action 5: "amount or percent, reason"; "Remaining as discount" should fill the reason "Settled at visit end" (editable). The reason is what the audit and the Billing page show later. Backend: EXISTS (`discount_reason`, `discount/apply`).

**B7 [Important] Take payment has no reference and a fake default** — panel lines 794-817. No short reference field (UPI ref / card last digits, brief action 7). When nothing remains the amount defaults to Rs 500 (line 1322), which is invented. Default to the remaining; when nothing remains, hide "Take payment here". Backend: EXISTS (`POST /payments`).

**B8 [Important] Failure and freshness states not designed** — only "could not load invoice" exists. Missing: a save that fails (line edit, discount, pass, payment) must say so in words and keep the state; never show "Passed to reception" falsely (brief section 7); "Today's details" error and empty ("Nothing else recorded for today."), "Show all" for long lists; the 30-second refresh of the desk's payment with "last updated"; two people on the same bill. The single toast is always green with a tick (line 320), so an error would look like a success. Backend: none (client).

### C. Should not be on this page

**C1 [Important] "Pass to reception: Prescription" button (header, line 308)**
- What is wrong: a new action not in the brief, and it is the biggest, first button on the page. The rule (checklists C, brief section 8) is that the receptionist never sees prescription content.
- Why it matters: if it sends the prescription to the desk, it breaks privacy; if it only means "patient is ready to leave", it is a second "Pass to reception" next to the bill's one and the doctor will press the wrong one (the bill is then never issued).
- What to do: remove it; the doctor prints the prescription here (question 1).
- Backend impact: NEW if kept (a desk print queue or a flag; no route today).

**C2 [Nice] "Download" PDF buttons** for the prescription (line 366) and the invoice (line 629). Not in the brief; the app prints through the browser (PrintPrescriptionScreen, PrintBillScreen) and has no PDF route. The browser's print dialog already offers "Save as PDF". Remove, or treat as NEW (question 6).

**C3 [Nice] Drag-to-resize handle and zoom chip on the preview** (lines 363, 516). Adds a control the doctor does not need in a 20-second page; the handle is 28 px (touch target rule is 44 px). Keep the sheet at fit-to-width, or keep the chip only as "Fit / 100%" (question 6).

### D. Wrong or inconsistent

**D1 [Important] "Invoice" instead of "Bill"** — "Visit Invoice", "Invoice total", "Invoice note", "Nothing to invoice", "Print invoice", "Edit invoice". The app, the brief, Billing, the BL- number and the desk's screens all say "bill". In India "invoice" also reads as a GST tax invoice (GST is off). One word in one place (question 4).

**D2 [Important] The main bill action is below the fold** — the bill is the third block (line 619), under a full A4 sheet. On 1366 x 768 the doctor must scroll to reach "Pass to reception" and the totals; the header's primary button is the prescription one (C1). Brief: default path "look, Pass to reception, Back to Today" in under 20 s; "the bill total must stay in view". Put the bill (or at least total, remaining and Pass) in view without scrolling (question 5).

**D3 [Important] Payments at the chair are added to "Paid at arrival"** — `recordInlinePayment` adds to `arrivalPaid` (line 1330); the Partial and Paid samples also show desk payments as "Paid at arrival". After the bill is issued the row should be "Received" (or "Paid Rs 2,000 of Rs 3,700. With reception." as in the brief), otherwise the doctor reads the wrong story.

**D4 [Important] Arrival breakdown shows payment modes, not what it was for** — "Rs 600 Cash · Rs 400 UPI" (line 741). Brief item 12 (owner, 2026-11-26): "Paid at arrival: Rs 1,000 (Consultation Rs 500, X-ray Rs 500)", with time and who took it. The purpose is what tells the doctor whether to add the consultation line (no double charge). Backend: FIX FIRST (where the desk records the purpose is UNVERIFIED, brief 14 (f)).

**D5 [Important] "Nothing remaining" hidden instead of shown** — the script hides the balance row at zero (line 1167). Brief: "Zero: Nothing remaining". Words, not absence.

**D6 [Nice] Earlier dues removed** — slot at line 789-790. Brief item 12b (SHOULD): "Earlier due Rs 1,500" explains why the desk will ask for more. Backend: EXISTS (`/after`).

### E. Risky

**E1 [Blocker] "Edit invoice" unlocks an issued bill** — `editInvoice()` line 1309 sets an issued (With reception) bill back to Draft and unlocks the lines; typing in the note does the same (line 1285).
- Why it matters: project rule: an issued bill is locked, changed only by cancel with a reason (full bill screen); gap-free numbers; owner 2026-11-25 "no take-back; a mistake is a bill cancel". The desk may already be taking money on that bill.
- What to do: remove "Edit invoice"; after pass, show "Open full bill" (cancel lives there). The note stays editable after issue without changing the bill's state (brief action 8) (question 2).
- Backend impact: none if removed; NEW and against the rules if kept.

**E2 [Important] "Edit prescription" in the header (line 304)** — opens the visit page to edit. The visit is finalised and an issued prescription is locked; the correction is Revise (new version) or an addendum. Label it "Revise prescription" and open the revise flow, or remove it. Backend: EXISTS (Revise).

**E3 [Important] "Returned to patient" is pre-ticked** (line 779). If the doctor does nothing, a refund (cash out in the day close) is recorded for money that may still be in the drawer. Brief: "Returned (one tick)", i.e. the doctor chooses. Start with nothing chosen and block Pass until one is chosen, or default to Keep as advance (safer: no cash leaves) (question 7). The toast on change (line 1278) says "Marked" as if saved; it must save only on Pass.

**E4 [Important] Print invoice prints the draft edit form** — `printInvoice()` line 1372 prints `#bill-section`: input boxes, the "What should happen to the extra amount?" box, a Draft bill with no number. Brief: the bill print shows only "Total, Received" and is a locked sheet. Enable Print only after issue and use the shared bill print sheet (PrintBillScreen, A4). Backend: EXISTS (A4 is FIX FIRST, brief 14 (e)).

**E5 [Important] Double tap on Pass** — the button is not disabled while saving and has no "Passing..." state. Brief section 12: a double tap must never make two bills. Server side EXISTS (one live bill per visit); the button must also lock while the call runs.

**E6 [Nice] Discount larger than the subtotal** — the total is clamped at 0 (line 1154) with no message. Show "Discount cannot be more than Rs 1,200" next to the field. Backend: EXISTS (server refuses).

### F. Suggestions: extra logic that would help

**F1 Enter = Pass bill to reception** — brief section 8 "keyboard first: Enter on the main action". Cost: small.

**F2 Back to Today with an un-passed draft** — show a one-line note on Today ("Bill not passed: Rahul Verma") instead of a confirm. Brief says the draft shows in "Waiting for you"; just make sure this page's Back says nothing scary. Cost: none (exists on Today).

**F3 One "Done" path** — when the bill is passed (or paid) and the prescription is printed, turn "Back to Today" into the primary button ("Done, next: Sunita Rao"). Cost: small.

**F4 Scroll to the reminder** — if the doctor presses Pass with a done procedure still off the bill, show the reminder once more next to the button (brief action 6), not at the top of the bill. Cost: small.

## 4. States and flows not designed
- Save failure for line edit, discount, pass, payment, note (B8). No-network on Pass.
- Today's details: error, nothing recorded, "Show all" for long lists.
- Prescription: none for this visit ("No prescription for this visit."), Revised.
- Remaining = 0 ("Nothing remaining", "Issue as paid").
- Line with no fee from the Library ("No fee set" exists in script only for Add line).
- Refresh every 30 s and "last updated"; the desk paying while the doctor edits.
- Many lines (15) with the total in view; very long medicine list scrolling inside the sheet.
- Old finalised visit from History: still open (brief Q7), not designed, correctly.
- Phone: out of scope (brief).

## 5. Questions for the owner
| # | Question | Why | Suggested default | Owner's answer |
|---|---|---|---|---|
| 1 | The header "Pass to reception: Prescription" button: what should it do? | The desk must not see prescription content; two "Pass" buttons confuse | Remove it; doctor prints the prescription here | KEEP (2026-11-27): the doctor chooses each time: print it, download it, or pass it to the desk to print. Whether the desk may SEE the content (preview) or only print it is a Settings option (reminder saved for the Settings brief); build the backend now if this page needs it |
| 2 | "Edit invoice" after Pass (unlocks an issued bill): keep? | Issued bills are locked; mistake = cancel | Remove; show "Open full bill" | REPLACED (2026-11-27): the bill gets a **Save** button first. After Save two choices show: **Edit** (back to editing; the bill is still a draft, no number) and **Lock** (issue: number given, locked). Then the doctor passes it to the desk, or downloads or prints it. Recorded reading: Pass, Print and Download work on a locked bill (Pass locks it if not yet locked); after Lock a mistake is a cancel with reason on the full bill screen (rule unchanged). "Edit invoice" that un-issues a bill goes away |
| 3 | Which removed parts were removed on purpose? | The script still uses them; brief marks most as MUST | Bring all back | NONE: bring all back (reminder, Remaining row, addenda, next waiting patient, earlier dues, finalised notice; also alert in the strip, bill number, save state) (2026-11-27) |
| 4 | "Invoice" or "Bill"? | One word across the app | Bill | INVOICE, across the whole app (Billing page, desk screens, print), 2026-11-27. A rename task for the rest of the app; GST stays off, so the print must not read as a GST tax invoice |
| 5 | Bill below the A4 sheet (needs a scroll): ok? | Main action and total must be in view | Bill in view first | Keep as designed: the doctor scrolls (2026-11-27) |
| 6 | Download PDF buttons and drag-to-resize: keep? | Not in the brief; no PDF route | Remove both | KEEP both (2026-11-27). Preview opens at true A4 size by default (so it looks like the print); the doctor can resize it vertically, horizontally and diagonally. Download is one of the doctor's choices (Q1, Q2). Builder: handles 44 px; PDF route is NEW or the browser's Save as PDF |
| 7 | Extra paid: what is chosen by default? | Pre-ticked "Returned" records cash out | Nothing chosen; doctor must pick | Nothing chosen; the doctor must pick before passing (2026-11-27) |
| 8 | "Edit prescription" in the header | Issued Rx is locked | Rename to "Revise prescription" | BOTH (2026-11-27): "Revise prescription" (new version) when the prescription itself must change, and "Add addendum" for a note when nothing needs rewriting |

## 6. Backend and data summary
- EXISTS: `GET /visits/:id/after` (staff-visits.ts:78), `POST /visits/:id/bill` (staff-bills.ts:163), `PATCH /bills/:id`, `POST /bills/:id/issue`, `POST /bills/:id/discount/apply`, `PATCH /bills/:id/note` (staff-bills.ts:113), `POST /refunds` (staff-bills.ts:219), `POST /payments`, cancel on the full bill, addenda, Revise prescription, print screens.
- FIX FIRST (already listed in the brief 14): note route must refuse the receptionist; consultation line on an existing draft; Finalise navigates here; arrival advance preview and its "what for" label; A4 print; one "Returned" call (refund with automatic reason).
- NEW only if the owner keeps them: prescription hand-over to the desk (C1), PDF download (C2), un-issue a bill (E1, against the rules).
- Size: the page itself is medium (client work on existing routes); the FIX FIRST list is small to medium.

## 7. Next step
Owner answered all questions in chat on 2026-11-27 (table above; also docs/DECISIONS.md). Findings changed by the answers: C1 kept (with a Settings option), C2/C3 kept, D1 reversed (Invoice everywhere), D2 accepted as designed, E1 replaced by Save, then Edit or Lock. Then the designer or owner fixes the HTML (bring back the removed MUST parts, remove the forbidden ones), then run design-plan on the final file.
