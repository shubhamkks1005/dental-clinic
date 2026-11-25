# Design review: Prescription and advice tab (visit)

Design reviewed: `doctor_visit_smart_accordions (20).html` (attached by owner, Option 4 "Smart Accordion Cards"; only accordion 3 "Prescription & Advice" and the right "Live A4 Rx" pane are judged). Brief used: `docs/design/briefs/prescription.md`. Date: 2026-11-25.
Reviewer: design-review (logic only; looks and motion are out of scope).

## 0. The page in one line
Purpose: the doctor writes, issues and prints the prescription for the patient in the chair, in well under a minute.
Jobs: 1) find a medicine by a few letters and add with one key; 2) set dose, frequency, days (see total); 3) never miss allergy, pregnancy, duplicate, incomplete row; 4) type a medicine not in the list; 5) add a set; 6) copy previous; 7) advice + follow-up date + timing + line note; 8) issue and print; 9) revise an issued one.

## 1. Summary
| Group | Count | Most important |
|---|---|---|
| A. Missing (blocker) | 5 | No allergy/pregnancy notice at all; no dose field; no advice field; free-typed medicine gets invented frequency and days; Issue/Print flow gaps |
| B. Missing (important) | 7 | No arrow-key choice in search; no "prescription issued" chip in bottom bar; no error/conflict/save-failed states; copy-previous has no "none exists" case |
| C. Should not be here | 3 | Receptionist still sees the full clinical sheet and History; dead duplicate "Issue Rx" button; Doctor/Receptionist toggle is prototype only |
| D. Wrong or inconsistent | 5 | "A4" vs A5; wrong doctor name; total ignores dose; touch targets under 44 px; Revise reuses same number and unlocks |
| E. Risky | 3 | Unescaped text goes into HTML (typing an apostrophe breaks the add button); double Issue; print prints the whole page |
| F. Suggestions | 5 | See section F |

## 2. What the design already does well (short)
- Search finds by generic or brand; "no match" offers "Add '<text>'" with Enter; Enter shows an "Added: ..." line with Undo (6 s).
- Remove line also has Undo. Notices never block Issue. Issue is one tap and the button says "(locks Rx)".
- Locked banner after issue, with Revise and Print; Revise/Print hidden before issue.
- Lines are collapsed with the key facts in one row (frequency, days, timing, total); Adjust opens timing and instruction (owner decision met).
- Sets show their medicines in small text, are found by typing, and a skipped name is told, not silent.
- Weight and patient strip are gone as the owner decided. Status is a word, not colour only. Past follow-up date is questioned.

## 3. Findings

### A. Missing (blocker)

**A1 [Blocker] Allergy and pregnancy notices do not exist**
- Where: script `computeSafetyNotices()`; lines carry `allergyTag` and `pregCaution` but nothing reads them.
- What is wrong: The header says "Allergy: Penicillin" and the starting draft already holds Amoxicillin (a penicillin), yet no notice shows. Adding Ibuprofen or Ketorolac (tagged pregnancy) never warns either.
- Why it matters: brief section 9 lists this as the first thing the user must never miss, "at the moment the medicine is added, with the medicine named".
- What to do: after each add (and on load of a draft) show a sentence naming the medicine and the cause, for example "Allergy: Penicillin (patient history) - Amoxicillin." Info only, never blocks. Receptionist never sees it.
- Backend impact: EXISTS for the tags (`prescription_items.tags`); the patient's allergy list and pregnancy alert must be passed to the panel (EXISTS in patient alerts; check it is loaded in the visit prefetch).

**A2 [Blocker] No way to edit or even see the dose**
- Where: Adjust panel has Frequency, Days, Timing, Instruction only; the collapsed row shows frequency, days, timing; the three starting lines have no `dose`.
- What is wrong: Dose is a required MUST field (up to 40 chars) in the brief and `dose` is NOT NULL in `prescription_items`. The printed sheet also has no dose.
- Why it matters: "1 tab" vs "2 tab" or "10 ml" changes the whole prescription. A line missing a dose is also not flagged, because the incomplete-row check only tests frequency and days.
- What to do: show dose in the line summary and as the first field in Adjust, before frequency; include it in the "Incomplete row" notice; offer the medicine's default plus a few usual doses (open question Q4).
- Backend impact: EXISTS (`dose` column). Usual-dose list for Q4 would be NEW (list field).

**A3 [Blocker] No advice field**
- Where: no element with id `rx-advice-input`, although `copyPreviousRx()` writes to it and `saveRxAdvice()` exists. The only advice is hard-coded text in the preview.
- What is wrong: The doctor cannot type advice. Brief item 12 (SHOULD), and advice must be saved when leaving the field, and must not be lost if Issue is pressed straight after.
- What to do: add an Advice text area (max 2000 characters, counter near the limit) next to follow-up date; saves on leaving the field; Issue first saves any pending field.
- Backend impact: EXISTS (`prescriptions.advice`).

**A4 [Blocker] A free-typed medicine gets invented clinical values**
- Where: `addFreeTextMed()` sets frequency `1-0-1`, days `5`, timing `After food`.
- What is wrong: Brief action 2 says dose, frequency and days start as "As directed" until the doctor writes them. Here the doctor can issue a medicine with a frequency and duration nobody chose, and no notice appears because nothing is "missing".
- Why it matters: a wrong dose or duration printed on a prescription is a clinical error.
- What to do: start dose/frequency/days as "As directed" (or empty with the incomplete-row notice), and open the line in Adjust right away so the doctor fills it.
- Backend impact: none (fields are free text).

**A5 [Blocker] The total quantity is wrong because dose is ignored**
- Where: `computeTotalQty()` = times per day x days.
- What is wrong: the brief says dose x times per day x days. A dose of 2 tablets shows half the tablets the patient must buy; a printed "approx." number that is wrong is worse than a dash.
- What to do: multiply by dose when dose is a plain number; show a dash otherwise (syrup, "As directed", SOS).
- Backend impact: none (computed on the screen and on the print sheet; keep one function, shared).

### B. Missing (important)

**B1 [Important] Search cannot be driven with the arrow keys**
- Where: `onRxSearchKey()` handles only Escape and Enter; Enter always adds the first match.
- Why it matters: brief open question 1: a tired doctor presses Enter on the wrong first match. Undo exists, but choosing is still mouse-only.
- What to do: Up/Down move a highlight; Enter adds the highlighted row; the first row is highlighted by default. When a set and a medicine both match, the highlighted row and the "Enter" hint must be the same row (today the set is listed first but Enter adds the medicine).

**B2 [Important] Added by click leaves no trace**
- Where: `addCatalogMed()` shows the Undo line only when added with Enter.
- What to do: show "Added: ..." for a click too (cheap and consistent); the new line should briefly stand out.

**B3 [Important] "Prescription issued or not" is missing from the visit's bottom bar**
- Where: footer shows Diagnosis ✓ and Procedures ✓ only.
- Why: brief section 4 and 9: the bottom bar and Finalise warn when the prescription is not issued; drafts come back to the doctor's Today as "prescriptions not issued". The only signal here is the small badge on the accordion title.
- What to do: add a "Prescription: Draft / Issued RX-..." chip in the bottom bar and a warning on Finalise. (Finalise dialog itself is not part of this tab.)
- Backend impact: EXISTS (drafts list reminder exists in `prescriptions-drafts-list.ts`).

**B4 [Important] Save state is fake and has no failure or conflict**
- Where: `flashRxSaving()` always ends in "Saved" after 280 ms.
- What to do: design "Saving", "Saved", "Could not save: <reason>, your text is kept, Retry", and "Someone saved a newer version, panel reloaded" (brief section 7). Unsaved-typing warning on leaving.
- Backend impact: EXISTS (draft has a `version` column for conflicts).

**B5 [Important] Copy previous has no "nothing to copy" case and silently replaces**
- Where: `copyPreviousRx()` always copies two hard-coded lines and replaces all current lines.
- What to do: hide or disable it (with a short reason) when the patient has no earlier issued prescription; say how many lines were copied and from which date; decide whether it replaces or adds (Q2).
- Backend impact: EXISTS (`/prescriptions/copy-previous`).

**B6 [Important] Newly added medicine is collapsed, so Tab-through is impossible**
- Where: lines render collapsed; Adjust must be clicked.
- Why: brief: "search, Enter, Tab through dose, frequency, days". For the normal case (defaults right) collapsed is good; for a line with missing fields it hides the problem.
- What to do: auto-open any line that is incomplete; keep others collapsed. Put the incomplete mark on the line itself, not only in a list above.

**B7 [Important] Many sets: only one is offered when the search is empty**
- Where: empty-search dropdown shows `MED_SETS[0]`; the others only through "Sets only".
- Why: brief item 3: sets are offered while the search is empty, the most used first. "Sets only" is an extra control the owner did not ask for.
- What to do: show the few most-used sets in the empty state; keep finding the rest by typing; consider dropping "Sets only".

### C. Should not be on this page (role, privacy, clutter)

**C1 [Important] The receptionist still sees clinical data**
- Where: the right pane (Live A4 Rx with medicines, problem teeth, advice) and the History tab (previous medications, notes, pending treatment) stay visible when "Receptionist" is chosen; only the left panel changes.
- Why: project rule: the receptionist never sees prescription content or notes on the visit; she prints issued ones from History.
- What to do: for the desk, hide the whole visit panel and right pane, show only the message and, if one is issued, the number and Print. In real build the receptionist normally never opens the visit at all.

**C2 [Nice] Dead duplicate "Issue Rx" button in the right pane**
- Where: top right of `visit-right-pane`, no handler; the real one is "Issue (locks Rx)" in the panel. Two controls for one action, one does nothing.
- What to do: keep one Issue action.

**C3 [Nice] "Doctor / Receptionist" switch is a prototype aid**
- What to do: remove from the final design (role comes from login); keep a separate design frame for the receptionist.

### D. Wrong or inconsistent

**D1 [Important] Preview says "Live A4", brief says A5.** Also the preview shows a "Problem Teeth" block and a hard-coded doctor and clinic, which the brief's print sheet (letterhead, patient, medicines, advice, follow-up, doctor registration) does not list. Ask the owner whether problem teeth belong on the paper (Q3). Also the doctor on the paper (Dr. Nidhi Kushwaha) differs from the doctor in the left menu (Dr. Arvind Mehta): the paper must show the doctor who writes.

**D2 [Important] Revise keeps the old number and just unlocks.** `reviseRx()` sets status "revised" with the same number and edits the same record. Brief: Revise makes a NEW draft linked to the old; the old stays on record unchanged. Show both: "Revising RX-2026-27-0001 (old stays on record)". Whether the revision gets a new number is not decided in the docs (Q4).
Backend impact: EXISTS (`revised_from_id`, `/revise`).

**D3 [Important] Touch targets are under 44 px.** Adjust and delete buttons are 32 px, Copy previous and Issue are 36 px, role switch is smaller. Project rule is 44 px on tablet and phone, and Remove sits close to Adjust (a mis-tap deletes a line).

**D4 [Nice] Statuses.** "Revised · Draft (RX-...)" mixes two statuses; use the shared words Draft / Issued / Revised.

**D5 [Nice] Dates.** Follow-up check compares against a fixed date (`2025-11-22`); real build must use today in IST. Dates show "22-Nov-2025" in one place and "22 Nov 2025" in another; use the app's one format (day-month-year).

### E. Risky

**E1 [Important] Typed text is put into the page unescaped.** Instruction, a free-typed name and the search text go into HTML and into `onclick='...'`. Typing `Children's gel` breaks the "Add" button; typing markup can run code. In the build every value must be escaped (React does this by default; the prototype should not be copied literally).

**E2 [Important] Issue pressed twice / stale version.** `issueRx()` has no guard. Two quick taps must not make two numbers, and issuing a stale version must be told to the doctor. Add "Issuing..." disabled state and a message on conflict.
Backend impact: FIX FIRST: confirm `/issue` is idempotent per draft (check `prescriptions-issue.ts` has a version check and gap-free numbering inside one transaction).

**E3 [Nice] Print prints the whole page.** `printRxSheet()` calls `window.print()` on the visit screen. It must print only the A5 sheet and write a print-log row; printing a draft must be clearly marked DRAFT (the preview badge does this; keep it).

### F. Suggestions: extra logic that would help
1. **Recently used** (brief item 18, COULD): the design shows "Recently used" but from a flag. Real source: the doctor's last issued prescriptions. Cost: small (usage counts already exist in `prescriptions-usage.ts`, 30-day counts by generic name).
2. **Notice sits on the line**, not in a list above it: a small mark and sentence under the medicine concerned. Cost: none beyond A1.
3. **Remember last used dose/days per medicine for this doctor** as the starting value instead of the list default. Reason: saves edits. Cost: medium, and the owner must agree (it is a default, not a suggestion of medicines).
4. **Save a free-typed medicine to the list** with one optional tap on the line ("Keep in my list"), never required (brief Q3). Cost: small, uses existing list add.
5. **Show "Issued by / at"** and a one-tap "Print" right after Issue (focus moves to Print). Cost: none.

## 4. States and flows not designed
- Loading skeleton while list, sets and patient alerts load: missing.
- Medicine list empty (new clinic): not shown; the search would show nothing, so the "add typed text" row must appear from the first letter.
- Save failed / network lost / newer version saved: missing (B4).
- Receptionist: partly done (C1).
- 30 lines reached: a notice appears, but adding is blocked silently; the search should say why.
- Very long medicine name or long advice: not shown; check Issue stays on screen.
- Zero lines: shown ("No medicines yet..."), Issue disabled, good. One line and 30 lines: not shown.
- Phone 360: lines are stacked cards, which is good; the right preview pane sits under everything, so the doctor must scroll far to see it; the Issue button must stay reachable.
- Draft left from an earlier session: not shown (should open as a draft with its saved lines).
- Patient with no allergy: nothing should show; fine.
- A past follow-up date: warning exists.

## 5. Questions for the owner
| # | Question | Why | Suggested default |
|---|---|---|---|
| 1 | Dose for a free-typed medicine: start empty or "As directed"? | A4 | "As directed" and open the line |
| 2 | Copy previous: replace the current lines or add to them? | B5 | Add to them, with Undo; tell how many came |
| 3 | Should problem teeth be printed on the prescription? | D1; brief does not list it | Not printed, unless the owner wants it |
| 4 | After Revise, does the new version get a new number, or keep the old? | D2; docs do not say; I am not sure | New number at issue, linked to the old |
| 5 | Keep "Sets only" button? | B7 | Remove; sets are found by typing and shown when empty |
| 6 | Should the paper say who the doctor is from the logged-in doctor? | D1 | Yes |
| 7 | Show "Recently used" at all (COULD)? | F1 | Yes, from real last issued |

## 6. Backend and data summary
- EXISTS: prescriptions and items tables (dose, frequency, days, timing, instruction, tags, advice, follow_up_on, status, rx_no, revised_from_id), create, add items, draft update, issue, revise, copy-previous, drafts reminder list, 30-day usage counts, print permission.
- FIX FIRST: confirm issue is safe against double tap and stale version; make sure the visit loads the patient's allergy list and pregnancy alert for the panel (for A1).
- NEW (small): usual-dose list per medicine (only if Q4 of the brief is yes); "Keep in my list" for a free-typed medicine (optional); print-log row on print if not already written.
- Rough size: design fixes are small to medium; backend is mostly in place.

## 7. Next step
Fix the design (A1 to A5 first), answer the questions above, then run design-plan on the final file. This review did not change the design or the code.

## 8. Owner decisions after this review (2026-11-25)
- Total "approx." stays as it is for now (A5 not changed yet).
- Allergy and pregnancy notice (A1): later. Written in docs/FUTURE_IDEAS.md A2.
- AI on the visit page and a "ask AI about this patient" (RAG): later. Written in docs/FUTURE_IDEAS.md A3.
- Arrow keys in the medicine search (B1): to be added; prompt given to the owner for the designer.
- History tab (C1, History part): owner says it is right; the History tab stays. The receptionist part of C1 (the right pane and role switch) still needs the owner's word.
- Dose (A2): owner says it is editable; the reviewer could not find a dose input in file (21) (Adjust has Frequency, Days, Timing, Instruction). To be checked again with the owner.
