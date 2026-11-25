# Design brief: Diagnosis and procedures tab (on the visit)

SCOPE (owner): this brief is ONLY for the "Diagnosis and procedures" tab of the visit. Notes, tooth chart, prescription and plan are other tabs and are not designed here. Where this tab needs a tooth, it only picks one; the chart itself is not designed here.

Written: 2026-11-25. Source: owner's request + project docs + the data model and the screen as drawn in the accordion design (option 4). Fake data only.

## Prompt for the design AI (paste this first)
You are designing ONE tab (the "Diagnosis and procedures" tab of a patient visit) of a web app for a single dental clinic in India. Design only this tab, not the rest of the visit screen. Below is a brief. It says what the tab must contain, why each thing is there, and the rules behind it. It does NOT say how it looks: that is your job.
- Use only the data and actions in the brief. Do not invent fields, features or numbers. Use obviously fake sample data.
- Items marked MUST are required. SHOULD can be dropped if space is short. ADDED BY AI items are suggestions: include them only if they fit.
- Design every state in section 7 (empty, loading, error, long text, many rows), not only the happy path.
- Respect section 8 (who may see what, money, safety). The screen must work on a laptop (1366x768), a tablet (768) and a phone (360). UI text is English only.
- If something is unclear, list your assumption at the end of your answer instead of guessing silently.

## 1. Purpose
Let the doctor record, in a few seconds each, what is wrong (diagnoses, per tooth) and what was done today (procedures, per tooth and surface), so that the visit can be finalised, the bill can be made and the treatment plan stays true. About 1 to 3 diagnoses and 1 to 3 procedures in a normal visit: search, Enter, pick the tooth, done.

## 2. Who, when, how
| Role | Situation | Device | How often | Time pressure | Interruptions |
|---|---|---|---|---|---|
| Doctor (writes) | During or just after the work in the chair | Laptop at the chair; sometimes tablet | 15-30 visits a day | High: patient in the chair | Phone, assistant, patient talking |
| Receptionist | Never opens this tab. She sees only the bill that comes from it | Desk PC | n/a | n/a | n/a |
| Developer | Support only | Any | Rare | None | None |

## 3. Jobs to be done (in order of importance)
1. Add a diagnosis by typing a few letters (from the doctor's own list), with the tooth it belongs to.
2. Add a procedure done today (from the doctor's own list) with tooth, surfaces and a short note.
3. Write a diagnosis that is not in the list by just typing it (no extra steps).
4. See at a glance what is recorded for this visit, and fix a mistake (remove or change a line).
5. Know what the procedures will cost (doctor only) and that they will go to the bill and update the plan when the visit is finalised.
6. See that this tab is complete enough to finalise ("Diagnosis done", "Procedures done"), without being blocked.

Design principle (owner): least effort for the doctor. Fewest taps, no confirm dialogs, nothing that blocks, no sending the doctor to another page to add things.

## 4. How they arrive and where they go next
- Arrive: from the visit screen (doctor opens the visit from Today "Now"). Also a tooth picked on the chart can pre-fill the tooth here.
- Go next: the Prescription tab, then Finalise (bottom bar). After Finalise the procedures create plan updates and the bill draft.

## 5. Data catalogue
| # | Item | Why it is here | Source | Fresh how fast | Who sees it | Format | If empty / long / missing | Priority | Added by AI? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Diagnosis search | Find a diagnosis by typing | Doctor's diagnoses list (`list_items`, list "diagnoses", active only) | On open; refreshed after adding to list | Doctor | Matches anywhere in the name, any case; show at most about 8 | Empty search shows the few most used; no match offers "Add '<typed text>'" as free text | MUST | No |
| 2 | Diagnosis line | What is recorded | `visit_diagnoses`: label (copy of the name), tooth_fdi (optional), sort order | Saved on each change | Doctor | "Irreversible pulpitis - 36"; tooth shown as FDI number | No lines: "No diagnosis yet. Search and press Enter to add." | MUST | No |
| 3 | Tooth for a diagnosis | A diagnosis usually belongs to a tooth | `visit_diagnoses.tooth_fdi` | On edit | Doctor | FDI number (11-48, 51-85); optional ("whole mouth" is allowed) | Missing: allowed, shown as "No tooth" | MUST | No |
| 4 | Procedure search | Find a procedure by typing | Doctor's procedures list (`list_items`, list "procedures", active only; data: usual fee in paise, optional short code) | On open | Doctor | Matches name or short code | No match: say so; free text is NOT allowed for procedures (the fee and bill come from the list). Offer a way to ask the doctor to add it to the list later (see question 3) | MUST | No |
| 5 | Procedure line | What was done today | `visit_procedures`: label (copy), tooth_fdi, surfaces (O, M, D, B, L), note, default_paise (copy of the usual fee at that time), sort order | Saved on each change | Doctor | "RCT started - 36 - O, D - Rs 2,500" | No lines: "No procedure yet." | MUST | No |
| 6 | Surfaces | Which surfaces were treated (fillings) | `visit_procedures.surfaces_json` | On edit | Doctor | Subset of O, M, D, B, L; none allowed for whole-tooth work | Empty is fine | SHOULD | No |
| 7 | Procedure note | Short comment ("sitting 1 of 3") | `visit_procedures.note` | On edit | Doctor | Short text | Empty is fine | SHOULD | No |
| 8 | Procedure fee | Doctor sees what will be billed | `default_paise` (integer paise shown as rupees, Indian grouping Rs 1,00,000) | With the line | Doctor only. Not shown to the receptionist here | Rupees | No fee on the list item: show "No fee set" (never 0 silently) | SHOULD | Partly: price on this tab is ADDED BY AI; the owner may prefer it only in billing (question 1) |
| 9 | Visit procedures total | Quick sum for the doctor | Computed from item 8 | Instantly | Doctor | Rupees, "Rs 3,700" | Dash when no line has a fee | COULD | ADDED BY AI: today the screen shows a hard-coded figure |
| 10 | Plan link | Procedure may match an open plan item (for example "RCT sitting 2") | `plan_items` (match on finalise) | On open | Doctor | "From plan: Crown 36" tag on the procedure line | None: nothing shown | SHOULD | ADDED BY AI |
| 11 | Completion state | Bottom bar shows "Diagnosis done / Procedures done" | Computed: at least one line, or the doctor says "none for this visit" | Instantly | Doctor | Word + mark, never colour alone | Not done: the bottom bar says what is missing; it never blocks Finalise | MUST | "None for this visit" choice is ADDED BY AI (question 2) |
| 12 | Save state | Doctor trusts it saved | Client state | Live | Doctor | "Saving", "Saved", or the failure reason | Failure shows the reason and keeps what was typed | MUST | Partly: the visit has a "Saved" chip |
| 13 | Locked state | After Finalise nothing can change | `visits.status` | On change | Doctor | Words: "Finalised, read only. Add an addendum to correct." | n/a | MUST | No |

## 6. Actions catalogue
| # | Action | Who | Needs to be true first | What changes in the data | Other effects | Undo? | Confirm? | Must NEVER happen |
|---|---|---|---|---|---|---|---|---|
| 1 | Add a diagnosis from the list (type, Enter, or pick) | Doctor | Visit is a draft | A `visit_diagnoses` line with a copy of the name | Audit row; completion state updates | Yes, remove the line | No | Adding to a finalised visit; Enter adding a wrong item without the doctor seeing what was added |
| 2 | Add a diagnosis by typing free text | Doctor | Visit is a draft; no list match | A line with the typed text, no list link | Audit row | Remove the line | No | Blocking the doctor with an extra form |
| 3 | Set or change the tooth of a diagnosis | Doctor | Draft | tooth_fdi on the line | Audit row | Yes | No | Wrong tooth numbers (only valid FDI numbers) |
| 4 | Add a procedure from the list | Doctor | Draft | A `visit_procedures` line with copy of name and fee | Audit row; total updates | Remove the line | No | Free-typed procedure with an invented fee; adding to a finalised visit |
| 5 | Set tooth, surfaces, note on a procedure | Doctor | Draft | The line's fields | Audit row | Yes | No | Surfaces on a whole-tooth procedure that makes no sense, silently |
| 6 | Remove a diagnosis or procedure line | Doctor | Draft | Line soft-deleted (never hard delete) | Audit row; total and completion update | A way back for a few seconds | No for one line | Removing from a finalised visit |
| 7 | Pick a tooth from this tab | Doctor | Draft | Only fills the tooth on the line | none | n/a | No | Needing the chart tab to finish the line |
| 8 | Finalise visit (from the bottom bar, not this tab) | Doctor | Draft | Procedures are matched to plan items or create completed ones; the bill draft is made | Locks the visit | Only by addendum | The visit's own Finalise step | Finalising without telling that procedures will go to the bill and plan |

## 7. States and edge cases
- Empty (no diagnosis, no procedure): ready to search, no scary text.
- Loading: the tab shows its shape while lists load; search works as soon as its list is there.
- Diagnoses or procedures list empty (new clinic): the doctor can still type free-text diagnoses; for procedures say where the list is managed (Settings, Procedures).
- No match in diagnoses: offer the typed text as a new line in one tap or Enter.
- No match in procedures: say "Not in your procedures list" and offer a way to remember it (question 3).
- A list item deactivated after being used: old visits keep their copy, unchanged.
- Procedure with no fee: shows "No fee set"; billing handles it.
- Same procedure twice on different teeth: allowed (for example two fillings). Same procedure twice on the same tooth in one visit: a gentle notice, not a block.
- Many lines (up to about 20 per visit): stays usable; long names wrap; the bottom bar stays reachable.
- Save fails or network drops: reason in words, typed text stays, retry.
- Someone else changed it (another tab/device): the tab reloads, says so in words, never loses the doctor's typing silently.
- Finalised visit: read only, with the reason and the way to add an addendum.
- Wrong role: the tab is not available to the receptionist at all.
- Primary teeth and mixed dentition: tooth picker accepts both FDI ranges.

## 8. Rules and constraints
- Only the doctor reads and writes clinical data (`clinical.view`, `clinical.edit`). The receptionist never sees diagnoses or procedures; she sees only the resulting bill lines (name, amount).
- The doctor's own lists only. NO automatic diagnosis, NO suggestions of procedures or medicines from a diagnosis (project rule).
- Each line keeps a copy of the name (and fee for procedures) at the time of writing; later list changes never rewrite old visits.
- Money: integer paise, shown as rupees with Indian grouping. Totals that matter are computed on the server; the figure on this tab is for the doctor's information.
- Finalised visits are never edited; corrections are addenda. Delete is soft only. Every create, change and remove is audited with who and when.
- English only. FDI tooth numbers. Dates in IST, day-month-year.
- Keyboard first: search, Enter, Tab to tooth and surfaces. Touch targets 44 px. Status never by colour alone.
- Nothing on this tab blocks the doctor: no confirm dialogs, no required extra forms.

## 9. Things the user must never miss
- What exactly was added when Enter was pressed (and a one-step undo).
- That the procedures will become bill lines and plan updates when the visit is finalised (said in words near the Finalise path, not a dialog on this tab).
- A procedure with no fee set (so the bill is not silently low).
- That the visit is finalised and read only (reason stated).

## 10. Time and freshness
Nothing changes by itself while the doctor writes, except saves finishing. Lists load when the visit opens and again after the doctor adds an item to a list. If a save fails the tab says so and keeps the typed values.

## 11. Related pages and shared pieces
- Visit screen: hosts the tab; the bottom bar shows "Diagnosis done / Procedures done" and Finalise.
- Tooth chart tab: picking a tooth there can fill the tooth here; the chart is not designed in this brief.
- Prescription tab: separate; same search-and-Enter style, same "Added" with Undo, same saving words, so the doctor learns one way.
- Plan: procedures match open plan items at Finalise.
- Billing: procedures become bill lines from this tab's fees.
- Settings, Diagnoses and Procedures: where the lists are managed.
- Patient profile, History: shows the finalised diagnoses and procedures.

## 12. Things a designer would forget (expert checks)
- A tired doctor presses Enter on the wrong first match: show what was added and allow a one-step undo (not a confirm).
- Arrow keys choose a result; Enter adds the highlighted one.
- Zero, one and 20 lines all designed.
- Undo for removing a line.
- Phone layout: lines become stacked rows.
- Tooth picking must be fast: type "36" or tap, without leaving the tab.
- Money in rupees from paise, never a bare number.
- Unsaved-typing warning when leaving the tab with an unsaved note.

## 13. Open questions for the owner
| # | Question | Why it matters | Suggested default |
|---|---|---|---|
| 1 | Show the procedure fee on this tab, or only in billing? | The doctor may not want money while treating; the receptionist must not see this tab either way | Show a small fee on each line and a total, doctor only |
| 2 | Is "No diagnosis for this visit" (and "No procedure") a choice, so the bottom bar can show done? | A check-up may have none | Yes, one tap, can be undone |
| 3 | A procedure not in the list: offer "Add to my list" (needs a fee) or "tell me later"? | Free text would break bills | Short inline add to the list (name + fee) that never leaves the tab; UNKNOWN, owner decides |
| 4 | Can the doctor edit a line after adding (tooth, surfaces, note), or only remove and add again? | Backend today can add but has no change or remove for these lines | Allow edit and remove while the visit is a draft |
| 5 | Should a diagnosis link to a tooth by default from the chart tab selection? | Saves a tap | Yes, pre-filled but changeable |

## 14. Out of scope
- Managing the diagnoses and procedures lists (Settings).
- The tooth chart, notes, prescription and plan tabs.
- Bill creation and payment.
- Automatic diagnosis or treatment suggestions, and AI help (see docs/FUTURE_IDEAS.md).
- Backend note for the builder (not for the design AI): today the data layer can list and add diagnoses and procedures only; change and remove are NEW work.
