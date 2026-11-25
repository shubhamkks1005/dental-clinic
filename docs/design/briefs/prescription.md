# Design brief: Prescription (writing a prescription on the visit)

Written: 2026-11-25. Source: owner's notes (medicine search, writing the prescription) + project docs + the screen as built today. Fake data only.

## Prompt for the design AI (paste this first)
You are designing ONE page of a web app for a single dental clinic in India. Below is a brief. It says what the page must contain, why each thing is there, and the rules behind it. It does NOT say how it looks: that is your job.
- Use only the data and actions in the brief. Do not invent fields, features or numbers. Use obviously fake sample data.
- Items marked MUST are required. SHOULD can be dropped if space is short. ADDED BY AI items are suggestions: include them only if they fit.
- Design every state in section 7 (empty, loading, error, long text, many rows), not only the happy path.
- Respect section 8 (who may see what, money, safety). The screen must work on a laptop (1366x768), a tablet (768) and a phone (360). UI text is English only.
- If something is unclear, list your assumption at the end of your answer instead of guessing silently.

## 1. Purpose
Let the doctor write the prescription for the patient who is in the chair, by finding medicines in their own list, setting dose, frequency and days, and issuing it, in well under a minute for a normal case (about 3 medicines: search, Enter, adjust, Issue). It is a panel inside the visit, not a separate trip.

## 2. Who, when, how
| Role | Situation | Device | How often | Time pressure | Interruptions |
|---|---|---|---|---|---|
| Doctor (writes) | Patient is in the chair or just left; doctor is finishing the visit | Laptop at the chair; sometimes tablet | 15-30 times a day (one chair, 20-40 patients) | High: patient waiting, next patient arriving | Phone, assistant, patient talking, a tooth being worked on |
| Receptionist (read/print only) | Patient is at the desk after the visit and asks for the paper | Desk PC | A few times a day | Medium | Queue at the desk |
| Developer | Support only | Any | Rare | None | None |

The receptionist cannot write. The panel tells them so and points to printing from History.

## 3. Jobs to be done (in order of importance)
1. Find a medicine fast by typing a few letters (generic or brand), and add it with one key press. (Owner note: medicine search.)
2. Write the line: dose, frequency, days, with the total quantity shown so the patient knows how many tablets to buy. (Owner note: writing.)
3. Never miss an allergy, pregnancy or duplicate problem while choosing medicines.
4. Add a medicine that is not in the doctor's list, without leaving the prescription.
5. Add a usual combination in one tap (medicine sets, for example "Post-extraction").
6. Copy the patient's previous prescription as a starting point.
7. Add advice, follow-up date, patient weight.
8. Issue it (locks it, gives it a number) and print.
9. Correct an issued one by revising (a new version), never by editing.

## 4. How they arrive and where they go next
- Arrive: from the visit screen (doctor opens the visit from Today "Now"). The panel is part of the visit. Also "prescriptions not issued" in the doctor's "Waiting for you" list opens the visit.
- Go next: Print (A5 prescription sheet, then browser print, then back), then the visit's Finalise. The visit's bottom bar shows whether the prescription is issued.
- Patient profile History lists issued prescriptions and the desk can reprint from there.

## 5. Data catalogue
| # | Item | Why it is here | Source | Fresh how fast | Who sees it | Format | If empty / long / missing | Priority | Added by AI? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Medicine search | Doctor types a few letters, list narrows | Doctor's medicine list (`list_items` "medicines", active only): label = generic name, plus brand | On open; refreshed after adding a medicine | Doctor | Matches generic or brand, any case, anywhere in the name | Empty search shows the first few (quick picks); no match offers "Add '<typed text>' to my list" | MUST | No |
| 2 | Search result row | Pick the right one among similar medicines | Medicine list: generic, brand, strength, form, default frequency | Same | Doctor | "Amoxicillin 500 mg Cap . 1-0-1"; show at most about 8 | Very long names are cut with the full name reachable | MUST | No |
| 3 | Medicine sets (quick combos) | One tap adds several usual medicines | `medicine_sets` list; items are generic names separated by `|` | On open | Doctor | Short label | None configured: hide the area. A name in a set that is no longer in the medicine list is skipped, and the doctor must be told which one | SHOULD | Skipped-name notice is ADDED BY AI: today it is silent |
| 4 | Prescription lines (one per medicine) | The actual prescription | `prescription_items` | Saved on each change | Doctor; printed sheet for everyone allowed | Generic name, strength, form; brand if any | No lines: "No medicines yet. Search and press Enter to add." Maximum 30 lines | MUST | No |
| 5 | Dose | How much per intake | item.dose, up to 40 characters, required | On edit | Doctor | Free text, usually a number ("1") | Missing: row warning | MUST | No |
| 6 | Frequency | How many times a day | item.frequency; presets 1-0-1, 1-1-1, 0-0-1, BD, TDS, SOS, HS; a medicine's own value that is not a preset is kept | On edit | Doctor | One of the presets | Missing: row warning | MUST | No |
| 7 | Days | For how long | item.days, required, up to 40 characters | On edit | Doctor | Number of days, for example 5 | Missing: row warning | MUST | No |
| 8 | Total quantity (rough) | Patient knows how many tablets to buy | Computed: dose x times per day x days; shows a dash when it cannot be worked out (for example SOS with no days, a syrup) | Instantly | Doctor and printed sheet | Whole number | Dash when not computable. It is a count aid, never clinical advice | SHOULD | No |
| 9 | Timing (before food / after food / bedtime / anytime) | Safety and compliance; printed on the sheet | item.timing, default from the medicine list | On edit | Doctor, printed | Words, never raw tokens like `after_food` | NOT editable on the line today; only defaulted from the list | SHOULD | Making it editable per line is ADDED BY AI: the doctor must be able to say "after food" for this patient |
| 10 | Line instruction (short note) | "Gargle, do not swallow" | item.instruction, up to 200 characters | On edit | Doctor, printed | Short text | NOT editable on the line today | COULD | ADDED BY AI: same reason as timing |
| 11 | Safety notices | Allergy, pregnancy, duplicate, incomplete row | Computed: line tags against the patient's allergies and pregnancy alert; duplicate generic names; missing dose, frequency or days | Instantly after each change | Doctor only | A sentence naming the medicine and the cause, for example "Allergy: Penicillin (patient history) - Amoxicillin." | None: nothing shown. They NEVER block issue or print; the doctor decides | MUST | No |
| 12 | Advice | Instructions for the patient on the paper | prescription.advice, up to 2000 characters | Saved on leaving the field | Doctor, printed | Plain text | Empty is fine | SHOULD | No |
| 13 | Follow-up date | When to return | prescription.followUpOn | On edit | Doctor, printed; may feed recall | Date, shown as day-month-year | Empty is fine; a past date should be questioned | SHOULD | Past-date check is ADDED BY AI |
| 14 | Patient weight (kg) | Dose checks for children | prescription.weightKg, whole kg, 1-300 | On edit | Doctor, printed | "18 kg" | Empty is fine. Should be asked for when the patient is a child (age from the patient record) | SHOULD | Child prompt is ADDED BY AI |
| 15 | Status and number | Draft, Issued, Revised; RX-<financial year>-0001 | prescription.status, rxNo | On change | Doctor; desk sees issued ones | Status word plus number, never colour alone | No prescription yet: no status | MUST | No |
| 16 | Patient identity strip (name, age, patient code, allergies present) | Right patient, and the alert is in view where medicines are picked | Patient record and medical history alerts | On open | Doctor (full alert text); receptionist never sees alert details | "Riya Sharma, 8 y, P-000123" | Alert exists but cannot be loaded: say so, do not show "no allergies" | MUST | ADDED BY AI: allergy visibility at the moment of choosing is a core rule |
| 17 | Save state | Doctor must trust it saved | Client state | Live | Doctor | "Saving", "Saved", or the failure reason | Failure shows the reason and keeps what was typed | MUST | Partly: the visit has a "Saved" chip; the panel itself shows nothing while saving |
| 18 | "Recently used" medicines | Most prescriptions use the same 10-15 medicines | Computed from this doctor's last issued prescriptions | Daily | Doctor | Short list shown before typing | Empty for a new clinic | COULD | ADDED BY AI: the owner can drop it |

## 6. Actions catalogue
| # | Action | Who | Needs to be true first | What changes in the data | Other effects | Undo? | Confirm? | Must NEVER happen |
|---|---|---|---|---|---|---|---|---|
| 1 | Search and add a medicine (type, Enter adds the first match; or pick a result) | Doctor | Prescription not locked | A draft prescription is created on the first add; a line is added with a copy (snapshot) of the medicine's name, strength, form and defaults | Search box clears; focus stays ready for the next search | Yes, remove the line while draft | No | Adding to an issued prescription; adding the same medicine twice without a notice; Enter adding a wrong item silently (the doctor must see what was added) |
| 2 | Add a new medicine to my list from the prescription (name, strength, form are enough) | Doctor | Search found nothing | New item in the doctor's medicine list, marked "not yet reviewed"; then added to this prescription | Medicine list changes for everyone who uses it; audit row | Edit or deactivate later in Settings, Medicines | No | A new medicine silently gaining allergy tags or defaults that look clinically checked. It stays marked as the doctor's own and unreviewed |
| 3 | Edit dose, frequency, days on a line | Doctor | Draft | Line updated, whole prescription saved with a new version | Total recalculates; notices recalculate | Yes while draft | No | Losing typed text on a failed save |
| 4 | Remove a line | Doctor | Draft | Line deleted from the draft | Notices recalculate | Needs a way back for a few seconds | No for one line, but a mis-tap must be recoverable | Removing from an issued prescription |
| 5 | Apply a medicine set | Doctor | Draft | Each medicine in the set added as a line | Duplicates flagged | Remove lines | No | Adding some of a set and silently dropping the rest |
| 6 | Copy previous prescription | Doctor | Patient has an earlier issued prescription | A new draft with the earlier lines and advice; follow-up date cleared | Audit row | Remove lines or discard draft | Yes if the current draft already has lines (it would add a second draft today) | Copying without showing the doctor what came in; carrying an old follow-up date |
| 7 | Edit advice, follow-up date, weight | Doctor | Draft | Saved when the field loses focus | None | Yes | No | Advice lost when Issue is pressed straight after typing |
| 8 | Issue | Doctor | Draft with at least one medicine | Status Issued (or Revised), number assigned (gap-free per financial year), issue time and doctor recorded, locked, shared with patient portal | Audit row; visit checklist item turns done | No: only Revise | Yes when safety notices exist or a row is incomplete; otherwise one tap | Issuing with zero medicines (server refuses); two clicks creating two numbers; issuing a stale version without telling the doctor |
| 9 | Revise | Doctor | Issued or revised | New draft linked to the old one, same lines, old one stays on record | Audit row | The old one is never altered | Yes ("This keeps the old copy and starts a new version") | Editing an issued prescription in place |
| 10 | Print | Doctor, receptionist | Issued or revised | Print log row | Opens the A5 print sheet | n/a | No | Printing a draft as if final; showing the desk anything clinical beyond the prescription itself |

## 7. States and edge cases
- No prescription yet: the panel is ready to search; nothing is created until the first medicine is added.
- Loading: the panel shows its shape while the medicine list, sets and patient alerts load. Search must work as soon as the list is there.
- Medicine list empty (new clinic): tell the doctor the list is empty and to add the first medicine right here.
- No match for the search: offer to add the typed name to the list (name, strength, form).
- Many matches: show the best few; narrowing by typing is the way.
- Generic and brand: the same medicine can be found by either; the line shows the generic name, with the brand if there is one.
- Very long medicine name or advice: wraps; never pushes the Issue action off screen.
- Locked (issued): everything read-only; Revise and Print are the only actions; the reason is stated.
- Someone else saved a newer version (another tab or device): on a conflict the panel reloads, says so in words, and does not lose the doctor's typing without telling them.
- Save fails or network drops: the reason is shown in words, the typed text stays, retry is possible.
- Draft exists from an earlier session: the doctor sees it as a draft, not a blank panel.
- A medicine in the list is deactivated after being used on an old prescription: old prescriptions are unchanged (they keep their copy).
- Receptionist or wrong role: the message "Only the doctor can write prescriptions. Receptionist can print issued ones from History." and nothing else clinical.
- Patient with no allergy recorded versus allergy information unavailable: these must look different.
- The 30 line limit: say so when reached.
- Clinic closed or holiday: not relevant to this panel.

## 8. Rules and constraints
- Only the doctor writes, issues and revises (`prescriptions.write`). Doctor and receptionist may print issued ones (`prescriptions.print`). The medicine list itself is the doctor's (Settings, Medicines); the desk cannot open it.
- The doctor's own medicine list only. NO dose calculator, NO drug-interaction engine, NO medicine suggestions (project rule). The only checks are the soft notices listed in item 11, which never block.
- A prescription is a draft until issued. Issued or revised prescriptions are locked; corrections are a new version.
- Each line keeps a copy of the medicine's details at the time of writing, so later list changes never rewrite old prescriptions.
- Numbering is gap-free per financial year, assigned only at issue (`RX-2026-27-0001` style).
- Every create, change and issue is audited with who and when. Delete is soft only.
- Privacy: the receptionist never sees allergy or medical-alert details; the desk sees only that an alert exists.
- English only on screen and on the printed sheet. Show "After food", never `after_food`.
- Dates in IST, shown day-month-year. Patient code format P-000123.
- Keyboard first: search, Enter to add, Tab through dose, frequency, days. Touch targets large enough on tablet.
- Limits: 30 medicines per prescription; dose and days up to 40 characters; advice up to 2000 characters; weight 1-300 kg.
- No health information in any reminder message; the prescription is never sent by an automated reminder.

## 9. Things the user must never miss
- Allergy of the patient against a chosen medicine, shown at the moment the medicine is added, with the medicine named.
- Pregnancy caution when a medicine is tagged for it.
- A duplicate medicine on the same prescription.
- A line missing dose, frequency or days.
- That the prescription is still a DRAFT (the patient has no paper, the visit checklist is not done). Drafts left unissued come back as "prescriptions not issued" on the doctor's Today.
- That Issue locks the prescription.

## 10. Time and freshness
Nothing changes by itself while the doctor writes, except saves finishing. The medicine list is loaded when the visit opens and again after the doctor adds a medicine. If a save fails the panel says so and keeps the typed values.

## 11. Related pages and shared pieces
- The visit screen (one-screen visit and its tabbed version): hosts the panel; the bottom bar and the Finalise dialog show "prescription issued" and warn when it is not.
- Patient profile, History: lists issued prescriptions, reprint for the desk.
- Print: A5 prescription sheet (letterhead, patient, medicines table, advice, follow-up, doctor registration).
- Settings, Medicines and Medicine sets: where the lists the search reads are managed.
- Doctor Today, "Waiting for you": counts unissued prescriptions.
- Shared status words (Draft, Issued, Revised) used everywhere.

Today's screen (for context only): search box with "Enter adds the first match"; up to 8 suggestions; "+ Add to my list" form (name, strength, form); medicine-set buttons; "Copy previous"; a table of Medicine, Dose, Freq, Days, Total, Remove; advice, follow-up date, weight; Issue, Revise, Print; red notice for errors, yellow notices for safety. Not shown today: timing and line instruction editing, recently used, a confirm before Issue, a saving indicator inside the panel, the patient and allergy strip next to the search.

## 12. Things a designer would forget (expert checks)
- Wrong patient: show who the prescription is for next to the search. (Expert prompt 2)
- A tired doctor at 6 pm presses Enter on the wrong first match: show clearly what was added and allow a one-step undo. (Expert prompt 4)
- Find one item among many: brand and generic both searchable, and a fast path for the most used medicines. (Expert prompt 5)
- Zero, one and 30 lines: all designed. (Expert prompt 6)
- Desk and doctor at the same time: the desk only prints; a revise during print must not confuse them. (Expert prompt 7)
- Confirm for Issue (locks) and Revise; undo for removing a line. (Expert prompt 8)
- Next step after Issue is Print, one tap away, then Finalise. (Expert prompt 9)
- Receptionist sees no clinical data on this panel. (Expert prompt 10)
- Saving and failure messages in words. Unsaved-changes warning when leaving with typed but unsaved dose or advice.
- Phone layout: the lines table becomes stacked rows.
- Keyboard shortcuts for the most frequent action (search, Enter, Tab).
- Status never by colour alone.
- Printable preview: the doctor should be able to see what the patient will get.

## 13. Open questions for the owner
| # | Question | Why it matters | Suggested default |
|---|---|---|---|
| 1 | Should Enter add the first match, or only when the doctor has moved onto a result with the arrow keys? | A wrong first match is a patient-safety risk | Enter adds the highlighted result; the first result is highlighted; show a "Added: Amoxicillin 500 mg" message with Undo |
| 2 | Should timing (before/after food) and a short instruction be editable per line? | Today they are fixed from the medicine list | Yes, as optional fields on the line |
| 3 | Should Issue ask for a confirm? | Issue locks the prescription | Confirm only when notices exist or a row is incomplete |
| 4 | Medicines the doctor adds on the spot: any allergy or pregnancy tags? | Without tags the safety notices cannot see them | Ask for an optional allergy tag when adding; leave unreviewed otherwise |
| 5 | Should the doctor pick the dose from a few common choices per medicine (1, 1/2, 5 ml)? | Typing doses is slow and error-prone | Offer the medicine's own default and a short list of usual doses; UNKNOWN which list |
| 6 | Is there a quantity or "dispensed by dentist" option on the sheet? | The data model has a dentist-dispensed flag and note, not shown on this screen | UNKNOWN: leave it out of this page until the owner says |
| 7 | Show the total tablet count on the printed sheet? | Patients buy that amount | Yes, labelled "approx." |
| 8 | Pediatric prompt: ask for weight when the patient is under 12? | Safety | Yes, as a prompt that does not block |

## 14. Out of scope
- Managing the medicine list and sets (that is Settings).
- Dose calculators, interaction checks and medicine suggestions (a project rule).
- Medicine stock, pharmacy billing and selling medicines.
- Sending the prescription by WhatsApp or SMS.
- The print sheet's own layout (a separate page).
