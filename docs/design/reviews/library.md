# Design review: Library

Design reviewed: attachment `library_align_dentistry (6).html` (not yet saved in docs/design/; whole HTML and script read). Brief used: docs/design/briefs/library.md (owner answers of 2026-11-25 included). Date: 2026-11-25.
Reviewer: design-review (logic only; looks and motion are out of scope).

## 0. The page in one line
Purpose: the doctor keeps the lists the rest of the app draws from (medicines, sets, procedures and fees, visit types, diagnoses, phrases, setup lists) correct.
Jobs: 1) find an item and fix it, 2) add an item, 3) confirm "Needs review" medicines, 4) hide and show again, 5) reorder, 6) see what is used (30 days) to decide what to keep.

## 1. Summary
| Group | Count | Most important |
|---|---|---|
| A. Missing (blocker) | 2 | Medicine sets cannot be built; Add/Edit has no fields for 7 of 10 lists |
| B. Missing (important) | 9 | No duplicate check, no validation messages, no DRAFT badge, no "old records never change" note |
| C. Should not be here | 4 | Delete button (owner said Hide only); invented medicine fields (route, manufacturer, Rx type, Schedule H, storage) |
| D. Wrong or inconsistent | 7 | Suggestions break the owner rule; reorder works with sort and filters; Edit does not clear Needs review |
| E. Risky | 4 | Blank days saved as "5 days"; rename or hide a medicine used in a set gives no warning |
| F. Suggestions | 4 (F1 dropped) | "in N sets" on a medicine; review progress |

## 2. What the design already does well (short)
- Lists are tabs, with counts, a hidden state in words ("Hidden"), "Show again", a "Needs review" count and pill.
- Doctor-only look (no patient data anywhere), edit-never-changes-bills help text on Procedures.
- Hide has a plain toast that says what happened; Reorder has arrows as well as drag.
- Medicine form splits dose, frequency, time of day, food timing and days into separate fields.

## 3. Findings

### A. Missing (blocker)

**A1 [Blocker] A medicine set cannot be created or edited**
- Where: Add/Edit modal for Medicine sets (`buildModalFields`, `saveModalItem`).
- What is wrong: the modal asks only for a Name. A new set is saved with a fixed medicine, `['Pantoprazole']`. There is no way to choose, add or remove medicines in a set. Nothing flags a set whose medicine is hidden, renamed or gone (brief row 12, MUST).
- Why it matters: a set exists to fill a prescription in one tap. A set with the wrong medicine, or one that points at a hidden medicine, gives a wrong prescription.
- What to do: in the set's Add/Edit, pick medicines by searching the Medicines list only (free typing not accepted; hidden medicines not offered). If the medicine is missing, offer "Add it to Medicines first", then return to the set. On the set card, mark any medicine that is hidden or not found with a word, and say the set cannot be used as-is.
- Backend impact: EXISTS (set items live in `data.items`); the "missing medicine" check is NEW but small (compare two loaded lists).

**A2 [Blocker] Add/Edit forms have no fields for most lists**
- Where: `buildModalFields` (every list except Medicines gets Name, plus Fee for procedures only).
- What is wrong: Visit types: no usual length, no colour (saved as 20 minutes, Teal). Quick phrases: no text (saved as "Custom clinical instruction."). Procedures: no short code; fee is free text with default "₹1,000". Tooth conditions: no code, colour, icon, applies-to. Allergens: no match tag. Medical history checklist: no section, alert label, restricted. Diagnoses and referral sources need only a name (fine).
- Why it matters: the doctor cannot create a usable visit type or phrase, and cannot edit what the lists are for. An allergen without its match tag will not give an allergy warning.
- What to do: show each list's own fields (the brief, table row 8 to 14). Length in minutes (5 to 240, steps of 5), a colour that also has a name, phrase text up to 500 characters with a counter, fee typed in rupees.
- Backend impact: EXISTS (`LIST_DEFS` already defines these fields).

### B. Missing (important)

**B1 [Important] No exact-duplicate check**
- Where: `saveModalItem` (adds without checking).
- What is wrong: owner rule: block only when name and every field are the same; same name with different details is allowed.
- Why: a double tap or a second add makes two identical medicines in every picker.
- What to do: on save, if all fields match an existing item, stay in the form and say "This is already in your list" with a link to that item.
- Backend impact: FIX FIRST. The table has a unique index on (list_key, label) (`0008_list_items.sql`) and the route answers 422 for a duplicate name. That blocks "same name, different details". Needs a small migration to drop the index and an exact-duplicate rule in the server.

**B2 [Important] No validation messages**
- Where: `saveModalItem` (`if (!name) return;`, fee and length not checked).
- What is wrong: empty name does nothing and says nothing. Fee is free text ("abc" would be saved). Name length is not limited.
- Why: the doctor taps Save, nothing happens, and does not know why.
- What to do: a plain sentence beside each field; fee accepts only rupee amounts and shows Indian grouping; name up to about 80 characters.
- Backend impact: EXISTS (server validates).

**B3 [Important] No DRAFT badge**
- Where: medicine and diagnosis cards.
- What is wrong: the brief (row 15, MUST) wants "DRAFT" on seeded clinical items awaiting sign-off. The design has only "Needs review".
- Why: the doctor must see what is not yet signed off by wording, not only the review pill.
- What to do: show "DRAFT - doctor to confirm" on those items.
- Backend impact: EXISTS (seed flag and `data.reviewed`).

**B4 [Important] Nowhere says that an edit will not change old prescriptions or bills**
- Where: Edit modal and Medicines help line (only Procedures help says it).
- What is wrong: brief section 9 lists this as something the user must never miss.
- Why: the doctor fears changing a past prescription and may avoid fixing a name.
- What to do: one line inside every Edit view: "Past prescriptions, bills and visits keep their own copy."
- Backend impact: none.

**B5 [Important] No limit of 25 rows and no "Show more"**
- Where: `#opt1-list` prints every item.
- What is wrong: medicines can be 60 to 200 items; the brief says 25 rows, then "Show more" with the count left.
- Why: a long page is slow on a phone and hard to scan.
- What to do: 25 at a time, "Show more (N left)".
- Backend impact: none (client side).

**B6 [Important] Medicine fields do not match the data**
- Where: medicine modal and filters.
- What is wrong: no Instruction and no Tags (brief row 7). Category is a fixed list of 5 with no empty choice, but the brief says category and tags come from values already used in this clinic. Form is typed free but the filter offers 6 fixed forms, so a typed "Cream" can never be filtered.
- Why: tags are what allergen matching uses; a fixed category list cannot grow.
- What to do: add Instruction and Tags; Category and Tags suggest values already used; filter options come from the list's own values.
- Backend impact: EXISTS (`data.*`).

**B7 [Important] Filter chips and counts do not follow the brief**
- Where: left filter rail (Quick Views) and "Status" inside the closed "More Filters".
- What is wrong: the brief wants All, Needs review, Hidden, each with a count (row 16). Here "Hidden" is a dropdown inside a collapsed box, with no count, so hidden medicines are hard to find. Other lists use Active/Hidden pills instead.
- Why: Hidden is the way to bring an item back.
- What to do: the same three chips with counts on every list, visible without opening anything.
- Backend impact: none.

**B8 [Important] Add/Edit form has no protection**
- Where: modal.
- What is wrong: no "Leave without saving?" when something was typed (Cancel, X or tap outside closes at once); no "Saving..." and no double-submit guard; no failed-save state that keeps typed values; no conflict message "This item was changed. Reloaded."; no offline message.
- Why: a lost long phrase or a double-saved item.
- What to do: add these states (brief section 7).
- Backend impact: EXISTS (409 for stale version).

**B9 [Important] Restricted or alert items are not marked**
- Where: Medical history checklist and Allergens cards.
- What is wrong: brief section 9: an item marked restricted, or with an alert label, must never be missed. Cards show only a name and a code string.
- Why: these drive safety warnings.
- What to do: show the alert label and "Restricted" as words on the card.
- Backend impact: EXISTS.

### C. Should not be on this page

**C1 [Blocker] Delete button on every medicine (with a 7-second wait)**
- Where: `openDelModal`, `confirmDelete`; only on Medicines.
- What is wrong: owner decision 2026-11-25: Hide only, never delete. The design deletes for good, and only for medicines.
- Why: deleting a medicine breaks sets and loses the item for ever.
- What to do: remove the button and the whole delete dialog. Hide stays.
- Backend impact: none (no delete route exists; do not add one).

**C2 [Important] Invented medicine fields (owner answered: keep Added by, Last updated by, Combination; drop the rest)**
- Where: filters "Route", "Manufacturer", "Rx type (Prescription / OTC)", "Schedule type (H, H1, X)", "Storage type", "Added by"; "Combination Only" view; expanded card "Route & Mfg" and "Storage".
- What is wrong: the brief says do not invent fields. None of these exist in the medicine data. Schedule H also reads like a legal classification, and nobody has checked it.
- Why: the doctor would have to fill more fields on 100+ medicines, and the filters would show nothing real.
- What to do: remove Route, Manufacturer, Rx type, Schedule, Storage (filters and card lines) and the "Advanced" box. Keep Added by and Last updated by (as words, from the item's record) and Combination.
- Backend impact: Added by and Last updated by EXISTS (`created_by`, `updated_by`). Combination is NEW (one yes/no field in the medicine data, small).

**C3 [Important] "Search Medicine Sets only" switch inside the Medicines tab**
- Where: left rail toggle; changes the page into a sets list titled "Medicine sets (Search mode)".
- What is wrong: it duplicates the Medicine sets tab; the Add button then adds a set while the tab says Medicines.
- Why: two controls for the same thing; a click can add the wrong kind of item.
- What to do: remove; use the tab.
- Backend impact: none.

**C4 [Nice] Date filters and "Recently added / updated / Frequently used / Combination" views (owner: only All, Needs review, Hidden)**
- Where: "Added / Changed" select with custom date and time; quick views.
- What is wrong: not in the brief; "Frequently used" uses a hard-coded 25. The doctor's task is "find in under 10 seconds".
- Why: clutter hides the three filters that matter.
- What to do: remove; only All, Needs review, Hidden remain. Combination stays as a field, not a view.
- Backend impact: none.

### D. Wrong or inconsistent

**D1 [Important] Suggestions break the owner's rule**
- Where: `showMedSuggestions`, `pickMedSuggestion`.
- What is wrong: with nothing typed, focus shows the first 6 medicines (owner: never a list on focus). Picking a suggestion fills only the name, with a comment "never auto-fill" (owner: it fills form, strength, dose, frequency, days and food, each editable). Suggestions exist only for the medicine name, not for procedures, visit types, diagnoses, phrases or referral sources (brief 5b). Procedure fee must not be suggested.
- Why: the point of suggestions is a shorter typing job.
- What to do: follow brief 5b table exactly.
- Backend impact: NEW (a bundled dental list, offline, no outside service) as in the brief.

**D2 [Important] Created and updated details shown on the expanded card**
- Where: expanded card ("Created by / Created on / Last updated").
- What is wrong: owner: last changed and who, inside the Edit view only.
- What to do: move to the Edit view.
- Backend impact: EXISTS (audit and version rows).

**D3 [Important] Where a new item goes**
- Where: `DATA.medicines.unshift`.
- What is wrong: the brief says at the end of the list. After adding, nothing shows where it went and there is no "Add another" (brief section 12).
- What to do: confirm with the position and a "Show it" link; offer "Add another".
- Backend impact: none.

**D4 [Important] Edit does not clear "Needs review"**
- Where: `saveModalItem` edit branch.
- What is wrong: the rule is that a medicine the doctor saves in the Library is marked reviewed. Here it stays "Needs review" unless the extra Confirm button is used.
- What to do: saving clears it; say so in the toast.
- Backend impact: EXISTS.

**D5 [Important] Empty list and no-match show the same text**
- Where: `opt1-list` empty branch.
- What is wrong: it always says "Nothing matches your current filter". An empty list should say what the list is for and offer Add.
- What to do: two separate states (brief section 7).
- Backend impact: none.

**D6 [Important] Reorder works with sort, search and filters**
- Where: `toggleReorder`, `moveItem`, `getFilteredList`.
- What is wrong: the brief says search and filters are off while reordering. Here Reorder can be opened with A to Z sort on (the order shown never changes), or with a filter on, and an arrow swaps with the neighbour in the filtered list, which may be far apart in the real order. No "moved to position 3" message.
- Why: the doctor sets an order and the pickers show a different one.
- What to do: Reorder turns search, filters and sort off, shows the full active list, and announces the new position.
- Backend impact: EXISTS (move route).

**D7 [Nice] The tab "Medicines" has two different Hidden ways and the "More" lists show only name and code string**
- Where: tabs and sub-bar.
- What is wrong: see B7 and B9; also the design has no phone navigation (no "‹ More" back link, no bottom tabs) and the left filter rail stacks above the list on a phone, so the list starts far down.
- What to do: put filters behind one "Filters" button on phone.
- Backend impact: none.

### E. Risky

**E1 [Important] The form invents clinical values**
- Where: `saveModalItem`.
- What is wrong: empty Days is saved as "5 days". Category preselects Antibiotic (no empty choice), so a painkiller added without changing it becomes an antibiotic. Empty fields are saved as the text "-".
- Why: these flow into prescriptions.
- What to do: required fields stay required; empty dose, frequency, days read "As directed" (already decided, DECISIONS Q2.13); Category starts empty.
- Backend impact: none.

**E2 [Important] Renaming or hiding a medicine that is in a set gives no warning**
- Where: Edit name, Hide.
- What is wrong: sets keep medicine names, so a rename or hide silently breaks the set.
- What to do: before Hide or rename, say which sets use it; the set then shows the warning (A1).
- Backend impact: NEW rule (small).

**E3 [Important] Allergen and checklist edits look like any other edit**
- Where: Allergens, Medical history checklist.
- What is wrong: a wrong match tag can miss an allergy warning (brief section 8).
- What to do: a short caution line and a clear view of the tag.
- Backend impact: none.

**E4 [Important] One-tap "Confirm" on a clinical draft (owner answered)**
- Where: `confirmMed`.
- What is wrong: not in the brief. One tap marks a seeded medicine as doctor-reviewed without opening it, and 100+ could be confirmed in a row.
- What to do (owner): Confirm opens the card with its fields filled; Save there marks it reviewed. Needs review holds the medicines the doctor wrote in a visit that were not in the Library. Add to each medicine a counter: every time the doctor issues it the count rises, and the card says who wrote it how many times.
- Backend impact: EXISTS for the 30-day count. An all-time count per doctor is NEW (small; today's usage is 30 days only). Note: counts must come from issued prescriptions only.
- Backend impact: none.

### F. Suggestions: extra logic that would help

**F1 (dropped by owner) "Not used in 30 days" view.** Not wanted; the written-N-times counter on each card serves job 6.
**F2 "Used in N sets" on a medicine.** Helps E2 and avoids broken sets. Cost: small.
**F3 Review progress, "12 of 112 reviewed".** Gives the first-time doctor a finish line. Cost: small.
**F4 Keep list and filter in the page address.** The brief asks for it (Back and shared links). Cost: small (web only).

## 4. States and flows not designed
- Loading (skeleton under the tabs), error with Retry (other lists still work), usage count failing ("-"), offline, no permission page for the receptionist.
- Save failing, conflict (409), very long name or phrase, many rows, "All medicines reviewed" when Needs review is 0.
- Empty per list (D5). Phone: no bottom tabs or back link; Save reachable on 360 px; tab strip scrolls sideways inside itself (fine, but the last tabs are hidden).
- Hidden item that is still shown on old records (not shown here, fine).

## 5. Questions for the owner
| # | Question | Why | Suggested default | Owner's answer |
|---|---|---|---|---|
| 1 | Drop the invented medicine fields (route, manufacturer, Rx type, Schedule H, storage, combination, added by)? | C2 | Drop all | KEEP Added by, Last updated by and Combination. DROP Route, Manufacturer, Rx type, Schedule, Storage. |
| 2 | Rename or hide a medicine used in a set: what should happen? | E2 | Allow it, but warn first and mark the set | Warn first, show which sets use it, mark the set. |
| 3 | Which quick views for medicines? | C4, F1 | All, Needs review, Hidden, plus "Not used in 30 days" | Only All, Needs review, Hidden. |
| 4 | Keep the one-tap "Confirm" button on a medicine card? | E4 | Remove; saving after opening the item marks it reviewed | Confirm stays, but it OPENS the card (edit view) filled in; Save there = reviewed (same as any save). Needs review = medicines the doctor wrote in a visit that were not in the Library. Every time the doctor issues a medicine its counter rises, and the Library shows "Dr X wrote this N times". |

### Owner answers on the medicine card form (2026-11-25)
| Question | Answer |
|---|---|
| Required fields | Name only. Empty strength, form, dose, frequency, days and timing read "As directed" (never "5 days"). |
| Combination | A Yes/No switch in the form; it starts ON as a suggestion when the name has a "+". |
| Written-N-times counter | Both the total and the last 30 days: "Dr X wrote this 48 times (6 in the last 30 days)". Counts come from issued prescriptions only. |
| Added by and Last updated by | Inside the Edit form, at the bottom (who and when). Not on the card. |

Effect on findings: B2 (name is the only required field; no other validation sentence needed for dose/days), E1 ("As directed" for every empty clinical field), D2 (who and when only in Edit), E4 (counter shows total and 30 days; total per doctor is NEW, small).

## 6. Backend and data summary
- EXISTS: `list_items` (label, data_json, active, sort_order, version, created_by/updated_by), list routes (add, update, hide, move, 409 stale version), `GET /api/staff/library/medicine-usage`, `LIST_DEFS` fields, `data.reviewed`.
- FIX FIRST: unique index (list_key, label) and 422 "duplicate name" contradict the owner's duplicate rule (B1). Small migration.
- NEW (small): set-versus-medicine check (A1, E2); bundled dental suggestion list (D1, offline).
- NEW (small): Combination yes/no field; an all-time "written N times by this doctor" count from issued prescriptions.
- Not built (owner): route, manufacturer, Rx type, schedule, storage.
- Never build: delete.

## 7. Next step
Fix the design (the designer or the owner) for A1, A2, C1 and the Important items, then run design-plan on the final file. Save the fixed HTML in docs/design/proposal/ or final/ first (it is not on disk yet).
