# Design brief: Library

Written: 2026-11-25. Source: owner's request, PRODUCT_DESIGN_CONTEXT D15, PHASE_Q Q2.13, `apps/web/src/features/library/`, `packages/shared/src/lists.ts`. Fake data only.

## Prompt for the design AI (paste this first)
You are designing ONE page of a web app for a single dental clinic in India. Below is a brief. It says what the page must contain, why each thing is there, and the rules behind it. It does NOT say how it looks or where anything goes: layout, grouping, order on screen, components, colours, type and motion are all yours.
- Use only the data and actions in the brief. Do not invent fields, features or numbers. Use obviously fake sample data.
- Items marked MUST are required. SHOULD can be dropped if space is short. ADDED BY AI items are suggestions: include them only if they fit.
- Design every state in section 7 (empty, loading, error, long text, many items), not only the happy path.
- Respect section 8 (who may see what, money, safety). The screen must work on a laptop (1366x768), a tablet (768) and a phone (360). UI text is English only.
- If something is unclear, list your assumption at the end of your answer instead of guessing silently.

## 1. Purpose
The Library is the doctor's own set of lists that the rest of the app draws from: medicines, medicine sets, procedures with usual fees, visit types, diagnoses, quick phrases, and a few setup lists. The doctor opens it to keep those lists correct, so that prescriptions, bills, booking and visit notes offer the right choices. A good visit: find one item in under 10 seconds, change it in under 30, and leave knowing it is saved.

## 2. Who, when, how
| Role | Situation | Device | How often | Time pressure | Interruptions |
|---|---|---|---|---|---|
| Doctor | First-time setup: reviewing the seeded medicines and fees before the pilot | Laptop | Once, 1-2 hours | None | Few |
| Doctor | After clinic hours: add a new medicine, fix a fee, rename a diagnosis | Laptop or tablet | Weekly | Low | None |
| Doctor | Between patients: quick fix because a medicine or fee was wrong in a visit | Phone or laptop | Occasional | High (patient waiting) | High |
| Receptionist | Not allowed. The page and its sidebar item are hidden (doctor only). | | | | |
| Developer | Config access only | Laptop | Rare | None | None |

## 3. Jobs to be done (in order)
1. Find an item in a list (by name) and fix it.
2. Add a new item (most often a medicine, then a procedure or phrase).
3. Review medicines that were seeded or added during a visit and confirm them ("Needs review").
4. Hide an item that is no longer used, and bring it back later.
5. Put the items in the order the doctor uses them most (Reorder).
6. See which medicines are actually used (last 30 days) to decide what to keep.

## 4. How they arrive and where they go next
In: sidebar "Library" (laptop and tablet), More > Library (phone), Settings search hits, Settings setup-progress card, and "Add to my list" from the visit's medicine search. Out: back to the visit or Today, or to Settings. Which list and which filter are open is kept in the page address so Back works and a link can be shared.

## 5. Data catalogue
Each list shows: a title with a one-line help sentence, a count per filter, and its items with their details.

| # | Item | Why it is here | Source | Fresh | Who | Format | Empty / long / missing | Priority | Added by AI? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | The lists to switch between: Medicines, Medicine sets, Procedures and fees, Visit types, Diagnoses, Quick phrases, More | Move between lists; Medicines first because it is edited most | fixed config (`LIST_DEFS`) | static | Doctor | Plain words | "More" holds Tooth conditions, Allergens, Referral sources, Medical history checklist; it counts as the current list when one of those is open | MUST | No |
| 2 | List title + help sentence | Tells the doctor what the list is used for and what an edit does (e.g. "Edits never change already-issued prescriptions") | `LIST_DEFS[key].title/help` | static | Doctor | One sentence | n/a | MUST | No |
| 3 | Item name | The item's identity. Medicines: generic name | `list_items.label` | on load | Doctor | Text, max about 80 chars | Long names must stay readable | MUST | No |
| 4 | Medicine: form and strength | Tell two similar medicines apart | `data.form`, `data.strength` | on load | Doctor | "Tablet · 500 mg" | "-" if missing | MUST | No |
| 5 | Medicine: usual dose and frequency | What gets filled into a prescription | `data.default_dose`, `default_frequency` | on load | Doctor | "1 tablet · 3 times a day" | "-" | MUST | No |
| 6 | Medicine: used in last 30 days | Decide what to keep or hide | `GET /api/staff/library/medicine-usage` (count of issued prescriptions) | on load | Doctor only | Whole number | "-" while loading or if it fails; 0 if unused | SHOULD | No |
| 7 | Medicine: brand, days, with food, instruction, tags, category | Full prescription defaults | `data.*` | on load | Doctor | Plain words, never raw tokens like `after_food` | Optional ones hidden when empty | SHOULD (in edit view) | No |
| 8 | Procedure: usual fee | The fee a bill starts with | `data.default_paise` (integer paise) | on load | Doctor | Rupees with Indian grouping, "₹1,50,000"; the form must not ask for paise | "₹0" is valid | MUST | No |
| 9 | Procedure: short code | Chart and bill shorthand | `data.code` | on load | Doctor | Up to 20 chars | "-" | SHOULD | No |
| 10 | Visit type: usual length | Fills the appointment length when booking | `data.minutes` (5 to 240, steps of 5) | on load | Doctor | "30 minutes" | n/a | MUST | No |
| 11 | Visit type: colour | Marks the calendar | `data.color` | on load | Doctor | A colour that is also named or labelled (never colour alone) | n/a | MUST | No |
| 12 | Medicine set: medicines in it | One click adds them to a draft prescription | `data.items` (generic names separated by \|) | on load | Doctor | Names as a list | A name that no longer exists in Medicines must be flagged | MUST | Flag is ADDED BY AI: a set silently pointing at a hidden or renamed medicine would give a wrong or incomplete prescription |
| 13 | Quick phrase: short name and full text | Short name expands into the note on the visit | `label`, `data.text` (max 500) | on load | Doctor | Text | Long text shortened with a way to see it all | MUST | No |
| 14 | "More" lists: tooth conditions (code, colour, icon, applies to), allergens (match tag), referral sources, medical history checklist (section, alert label, restricted) | Setup lists used on the chart, history form and new-patient form | `LIST_DEFS` | on load | Doctor | Each list has its own title and help sentence | n/a | SHOULD | No |
| 15 | DRAFT badge | Some seeded clinical items wait for doctor or lawyer sign-off | seed flag | on load | Doctor | Word "DRAFT" | n/a | MUST | No |
| 16 | Filter counts: All, Needs review (medicines only), Hidden | Show where the work is | computed from the list | live after each change | Doctor | "All 42", "Needs review 7", "Hidden 3" | Zero shown, not removed | MUST | No |
| 17 | Search within the list | Find by name | client-side on the loaded list | instant | Doctor | Case-insensitive match on name | "Nothing matches. Clear the search or filter." | MUST | No |
| 18 | Hidden state of an item | An item is never deleted, only hidden; it must be visible that it is hidden | `list_items.active` | live | Doctor | A text label "Hidden" | n/a | MUST | No |
| 19 | Last changed and who edited, inside the edit view only | Trust and recovery after a mistaken edit | audit / version rows | on load | Doctor | "Changed 24 Nov, 4:10 pm by Dr Sharma" (IST) | "-" | SHOULD | No (owner answer) |

How many items: medicines 60 to 200, procedures 20 to 60, visit types 5 to 15, diagnoses 30 to 100, quick phrases 10 to 40, medicine sets 5 to 20, others under 30. The page loads 25 rows and then offers "Show more".

## 5b. Suggestions while typing (owner request, 2026-11-25)
The clinic is dental only. When the doctor types in a field, the page suggests matching dental choices so typing stays short. Rules:
- Suggest ONLY when what is typed matches something. Nothing typed or no match: show no list at all (never a full list on focus).
- Suggestions come from a list bundled with the app (no outside service, nothing leaves the clinic, works offline). The doctor reviews the bundled list before pilot.
- A suggestion is a help, never forced: the doctor can still type their own value.
- Reachable by keyboard and touch; each suggestion is large enough to tap.

| Field | Suggests | When a suggestion is picked |
|---|---|---|
| Medicine name | Generic and brand names of common dental medicines (antibiotics, painkillers, mouthwash, gels) | Form, strength, usual dose, frequency, days and with-food fill in; the doctor can change each |
| Form, frequency, days, with food | Common values (tablet, capsule, gel; 1-0-1; 5 days; after food), words not raw tokens | Value is filled |
| Tags and category | Tags and categories already used in this clinic's list | Value is filled |
| Procedure name | Common dental procedures (scaling, extraction, RCT, filling, crown...) | Name and optional short code fill in. The FEE is never suggested: the doctor types it (money is never guessed) |
| Visit type | Common types (consultation, follow-up, RCT sitting...) | Name and usual length fill in |
| Diagnosis | Common dental diagnoses (caries, pulpitis, gingivitis...) | Name fills in |
| Quick phrase | Common dental note templates | Full text fills in; editable |
| Referral source | Common sources (Google, friend or family, Instagram, walk-in) | Name fills in |
| Medicine in a Medicine set | Only medicines already in this clinic's Medicines list (see rule below) | Medicine is added to the set |

**Medicine set rule (MUST):** a set can contain only medicines that already exist (and are not hidden) in the Medicines list. The doctor picks them by search; free typing is not accepted. If the medicine is not in the list, the same place offers "Add it to Medicines first" and then returns to the set. If a medicine in a set is later hidden or renamed, the set shows a clear warning on that medicine and cannot be used as-is until fixed.

## 6. Actions catalogue
| # | Action | Who | True first | What changes | Other effects | Undo? | Confirm? | Must NEVER happen |
|---|---|---|---|---|---|---|---|---|
| 1 | Add item | Doctor | Name filled; required fields valid | New `list_items` row at the end of the list | Audit row; item appears in visit/booking choices at once; a medicine added here is marked reviewed | Hide it | No | An exact duplicate (same name and same fields) saved. A same-name item with different details is allowed. |
| 2 | Edit item | Doctor | Item exists; nobody changed it meanwhile | Item updated and a new version written | Audit row; a medicine saved here is marked reviewed | Edit back (history kept) | No | Changing an already-issued prescription, a past bill or a past visit (records copy the name) |
| 3 | Hide / show again | Doctor | none | `active` flag flips | Hidden items vanish from visit, booking and bill choices; old records unchanged | Yes, "Show again" | No (one step; the doctor is told what happened) | Deleting the item for good |
| 4 | Reorder (kept apart from searching and filtering) | Doctor | Two or more items | Sort order saved at each step | Order shows in pickers | Move back | No | Reordering while a search or filter hides rows (order would be unclear), so search and filters are not active while reordering |
| 5 | Search and filter | Doctor | none | Nothing | none | n/a | n/a | n/a |
| 6 | Show more (next 25 rows) | Doctor | More rows than shown | Nothing | none | n/a | n/a | n/a |
| 7 | Open a "More" list | Doctor | none | Nothing | none | n/a | n/a | n/a |
| 8 | Add medicine from inside a visit ("Add to my list") | Doctor | Typed name not in the list | New medicine, marked "Needs review" | Shows up here under Needs review | Hide | No | Blocking the prescription until the doctor reviews it |

## 7. States and edge cases
- **Loading**: show that items are still loading; the list names and the title are there at once.
- **Empty list**: "Nothing in this list yet." plus the Add action in plain words.
- **No match**: "Nothing matches. Clear the search or filter." with one way to clear.
- **Error loading**: a sentence in plain words and a Retry; the other lists still work.
- **Usage count fails**: show "-" for that detail only; the rest still works.
- **Save fails**: the add/edit form stays open with the typed values kept and a sentence saying what to fix.
- **Changed by someone else (conflict)**: say "This item was changed. Reloaded." and reload the list; do not overwrite.
- **Offline**: say that changes cannot be saved; keep what was typed.
- **Very long name or phrase**: stays readable and does not push the actions out of reach.
- **Many rows**: 25 at a time with a count of what is left.
- **Hidden item** that is used inside an old record: still shows on the old record.
- **Needs review count of 0**: say so positively ("All medicines reviewed").
- **Unsaved changes in the add/edit form**: leaving asks "Leave without saving?" only if something was typed.
- **Receptionist opens the link**: the one permission page, not an empty Library.

## 8. Rules and constraints
- Doctor only. Receptionist never sees the page, the sidebar item or the phone More entry.
- Money: procedure fees are integer paise in storage, shown in rupees with Indian grouping. The doctor types rupees. Changing a fee never changes an existing bill.
- Clinical: seeded medicines and diagnoses are DRAFT until the doctor signs off. Allergen tags link to medicine tags and are safety data: a wrong tag can miss an allergy warning, so editing these must be careful and clear.
- Items are hidden, never deleted. Edits never change records already made (prescriptions, bills, visits keep their own copy of the name).
- Every change is versioned and audited.
- English only. Touch targets at least 44 px. Everything works by keyboard. Colour is never the only signal.
- No patient data on this page.

## 9. Things the user must never miss
- Which medicines are still "Needs review" (seeded or added in a visit and not yet confirmed).
- That an item is Hidden and so not offered anywhere.
- That an edit will not change old prescriptions or bills.
- An allergen or medical-history item marked restricted or with an alert label.
- A medicine set that points to a medicine that is hidden or not found.

## 10. Time and freshness
Nothing changes by itself while the page is open. After each save the list refreshes and the counts follow. If a refresh fails after a save, say the save worked but the list could not reload.

## 11. Related pages and shared pieces
Visit (medicine search, diagnosis autocomplete, procedures, quick phrases), Prescription (medicine sets, defaults), Billing and Bill (procedure fees), Book dialog and Calendar (visit types and colours), Tooth chart (conditions), New patient and medical history (referral sources, allergens, checklist), Settings (setup-progress card links here). Shared behaviour to keep consistent: adding or editing one item, filtering by state, the list of items with their details, short confirmations of what happened, the retry state.

## 12. Things a designer would forget
- Phone: every detail and every action must be reachable with one thumb and without hover.
- Moving an item up or down must work by touch and keyboard, and the new position must be announced or shown ("moved to position 3").
- On a 360 px phone, Save must always be reachable while adding or editing an item.
- The first-time doctor sees 100+ seeded medicines: the Needs review filter and a count are the way in; do not make them page through.
- A hidden item must be recognisable without relying on colour.
- Empty-state wording for each list should say what the list is for.
- Add confirmation: after adding, show where the new item went and let the doctor add another without reopening.

## 13. Questions and the owner's answers (2026-11-25)
| # | Question | Owner's answer |
|---|---|---|
| 1 | Same name added again? | Block only when everything is the same (name and every field). If anything differs, allow it. |
| 2 | Where to show last changed? | Inside the edit view only, and show who edited it as well as when. |
| 3 | Real delete or Hide only? | Hide only. |
| 4 | Allergens and Medical history checklist under More, or each in its own place? | Designer's choice: whichever looks better in the design. Keep the number of top-level choices small on a phone. |
| 5 | Receptionist sees Library? | No (doctor only, as already decided). |
| 6 | Bundled dental suggestion list? | Yes, but only matching suggestions while typing, never the full list. |
| 7 | Outside spelling-check API (RxNorm)? | Never. |
| 8 | Medicine sets: only from the Medicines list? | Yes. |
| 9 | Suggest procedure fees? | No, the doctor types the fee. |

## 14. Out of scope
Patient data of any kind. Settings (clinic details, timings, staff, billing and tax). Bulk import or export of lists. Prices of medicines or stock levels. Editing an issued prescription or a bill.
