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
3. Never miss an allergy, pregnancy or duplicate problem while choosing medicines (information only, never a block).
4. Write a medicine that is not in the doctor's list just by typing it, with no extra steps.
5. Add a usual combination in one tap (medicine sets, for example "Post-extraction").
6. Copy the patient's previous prescription as a starting point.
7. Add advice and a follow-up date. Adjust timing (before/after food) and a short instruction on any line.

Design principle (owner): the least effort for the doctor. Fewest taps, no confirm dialogs, nothing that blocks, and no sending the doctor to another page to add things. The doctor can see what they did.
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
| 3 | Medicine sets (quick combos) | One tap adds several usual medicines, so the doctor types nothing | `medicine_sets` list; items are generic names separated by `|` | On open | Doctor | Each set shows its name and, in small text, the medicines inside ("Post-extraction: Amoxicillin 500, Ibuprofen 400, Pantoprazole 40"). They are offered while the search is empty. Typing also finds sets by name, so "post" lists the set next to single medicines. One tap adds ALL its medicines as normal lines the doctor can still edit or remove | None configured: the area is simply absent. A name in a set that is no longer in the medicine list is skipped, and the doctor is told which one (never silent). More than about 6 sets: show the most used first, the rest found by typing | SHOULD | Finding sets by typing, showing their contents, and the skipped-name notice are ADDED BY AI: today it is a row of buttons with only the set name, and skipped names are silent |
| 4 | Prescription lines (one per medicine) | The actual prescription | `prescription_items` | Saved on each change | Doctor; printed sheet for everyone allowed | Generic name, strength, form; brand if any | No lines: "No medicines yet. Search and press Enter to add." Maximum 30 lines | MUST | No |
| 5 | Dose | How much per intake | item.dose, up to 40 characters, required | On edit | Doctor | Free text, usually a number ("1") | Missing: row warning | MUST | No |
| 6 | Frequency | How many times a day | item.frequency; presets 1-0-1, 1-1-1, 0-0-1, BD, TDS, SOS, HS; a medicine's own value that is not a preset is kept | On edit | Doctor | One of the presets | Missing: row warning | MUST | No |
| 7 | Days | For how long | item.days, required, up to 40 characters | On edit | Doctor | Number of days, for example 5 | Missing: row warning | MUST | No |
| 8 | Total quantity (rough) | Patient knows how many tablets to buy | Computed: dose x times per day x days; shows a dash when it cannot be worked out (for example SOS with no days, a syrup) | Instantly | Doctor and printed sheet | Whole number | Dash when not computable. It is a count aid, never clinical advice | SHOULD | No |
| 9 | Timing (before food / after food / bedtime / anytime) | Safety and compliance; printed on the sheet | item.timing, default from the medicine list | On edit | Doctor, printed | Words, never raw tokens like `after_food` | Editable on every line (owner decision). Starts from the medicine's default; one change on one line never changes the medicine list | MUST | No |
| 10 | Line instruction (short note) | "Gargle, do not swallow" | item.instruction, up to 200 characters | On edit | Doctor, printed | Short text | Editable on every line (owner decision); optional, empty is fine | MUST | No |
| 11 | Safety notices | Allergy, pregnancy, duplicate, incomplete row | Computed: line tags against the patient's allergies and pregnancy alert; duplicate generic names; missing dose, frequency or days | Instantly after each change | Doctor only | A sentence naming the medicine and the cause, for example "Allergy: Penicillin (patient history) - Amoxicillin." | None: nothing shown. They NEVER block issue or print; the doctor decides | MUST | No |
| 12 | Advice | Instructions for the patient on the paper | prescription.advice, up to 2000 characters | Saved on leaving the field | Doctor, printed | Plain text | Empty is fine | SHOULD | No |
| 13 | Follow-up date | When to return | prescription.followUpOn | On edit | Doctor, printed; may feed recall | Date, shown as day-month-year | Empty is fine; a past date should be questioned | SHOULD | Past-date check is ADDED BY AI |
| 14 | (Removed) Patient weight | Owner decision: no weight while writing a prescription | Not shown, not asked, not printed | n/a | n/a | n/a | n/a | n/a | No |
| 15 | Status and number | Draft, Issued, Revised; RX-<financial year>-0001 | prescription.status, rxNo | On change | Doctor; desk sees issued ones | Status word plus number, never colour alone | No prescription yet: no status | MUST | No |
| 16 | (Removed) Patient name, age and allergy strip next to the search | Owner decision: not needed here, the doctor already sees the patient on the visit | Not on this panel | n/a | n/a | n/a | n/a | n/a | No. The allergy notice in item 11 stays, because it appears only when a chosen medicine clashes |
| 17 | Save state | Doctor must trust it saved | Client state | Live | Doctor | "Saving", "Saved", or the failure reason | Failure shows the reason and keeps what was typed | MUST | Partly: the visit has a "Saved" chip; the panel itself shows nothing while saving |
| 18 | "Recently used" medicines | Most prescriptions use the same 10-15 medicines | Computed from this doctor's last issued prescriptions | Daily | Doctor | Short list shown before typing | Empty for a new clinic | COULD | ADDED BY AI: the owner can drop it |

## 6. Actions catalogue
| # | Action | Who | Needs to be true first | What changes in the data | Other effects | Undo? | Confirm? | Must NEVER happen |
|---|---|---|---|---|---|---|---|---|
| 1 | Search and add a medicine (type, Enter adds the first match; or pick a result) | Doctor | Prescription not locked | A draft prescription is created on the first add; a line is added with a copy (snapshot) of the medicine's name, strength, form and defaults | Search box clears; focus stays ready for the next search | Yes, remove the line while draft | No | Adding to an issued prescription; adding the same medicine twice without a notice; Enter adding a wrong item silently (the doctor must see what was added) |
| 2 | Write a new medicine that is not in the list (type the name; strength and form optional) | Doctor | Search found nothing | The typed text becomes a normal line on this prescription (a free-text medicine with no list entry). Dose, frequency and days start as "As directed" until the doctor writes them | Audit row as for any line | Remove the line | No. Saving it to the list is never required and never stops the doctor (see open question 3) | Blocking the doctor: no required "strength", no extra form, no step to leave this panel |
| 3 | Edit dose, frequency, days on a line | Doctor | Draft | Line updated, whole prescription saved with a new version | Total recalculates; notices recalculate | Yes while draft | No | Losing typed text on a failed save |
| 4 | Remove a line | Doctor | Draft | Line deleted from the draft | Notices recalculate | Needs a way back for a few seconds | No for one line, but a mis-tap must be recoverable | Removing from an issued prescription |
| 5 | Apply a medicine set | Doctor | Draft | Each medicine in the set added as a line | Duplicates flagged | Remove lines | No | Adding some of a set and silently dropping the rest |
| 6 | Copy previous prescription | Doctor | Patient has an earlier issued prescription | The earlier lines and advice come into the current draft; follow-up date cleared | Audit row | Remove lines | No | Carrying an old follow-up date; creating a second draft beside the current one |
| 7 | Edit advice, follow-up date | Doctor | Draft | Saved when the field loses focus | None | Yes | No | Advice lost when Issue is pressed straight after typing |
| 8 | Issue | Doctor | Draft with at least one medicine | Status Issued (or Revised), number assigned (gap-free per financial year), issue time and doctor recorded, locked, shared with patient portal | Audit row; visit checklist item turns done | No: only Revise | No (owner decision: one tap, the doctor has already looked). Safety notices stay visible but do not stop it | Issuing with zero medicines (server refuses); two taps creating two numbers; issuing a stale version without telling the doctor |
| 9 | Revise | Doctor | Issued or revised | New draft linked to the old one, same lines, old one stays on record | Audit row | The old one is never altered | No | Editing an issued prescription in place |
| 10 | Print | Doctor, receptionist | Issued or revised | Print log row | Opens the A5 print sheet | n/a | No | Printing a draft as if final; showing the desk anything clinical beyond the prescription itself |

## 7. States and edge cases
- No prescription yet: the panel is ready to search; nothing is created until the first medicine is added.
- Loading: the panel shows its shape while the medicine list, sets and patient alerts load. Search must work as soon as the list is there.
- Medicine list empty (new clinic): the doctor can still write medicines by typing; say nothing scary.
- No match for the search: offer to write the typed text as a new medicine line, in one tap or Enter.
- Many matches: show the best few; narrowing by typing is the way.
- Generic and brand: the same medicine can be found by either; the line shows the generic name, with the brand if there is one.
- Very long medicine name or advice: wraps; never pushes the Issue action off screen.
- Locked (issued): everything read-only; Revise and Print are the only actions; the reason is stated.
- Someone else saved a newer version (another tab or device): on a conflict the panel reloads, says so in words, and does not lose the doctor's typing without telling them.
- Save fails or network drops: the reason is shown in words, the typed text stays, retry is possible.
- Draft exists from an earlier session: the doctor sees it as a draft, not a blank panel.
- A medicine in the list is deactivated after being used on an old prescription: old prescriptions are unchanged (they keep their copy).
- Receptionist or wrong role: the message "Only the doctor can write prescriptions. Receptionist can print issued ones from History." and nothing else clinical.
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
- Limits: 30 medicines per prescription; dose and days up to 40 characters; advice up to 2000 characters.
- Nothing on this panel blocks the doctor: no confirm dialogs, no required extra forms, safety notices inform only.
- No health information in any reminder message; the prescription is never sent by an automated reminder.

## 9. Things the user must never miss
- Allergy of the patient against a chosen medicine, shown at the moment the medicine is added, with the medicine named.
- Pregnancy caution when a medicine is tagged for it.
- A duplicate medicine on the same prescription.
- A line missing dose, frequency or days.
- That the prescription is still a DRAFT (the patient has no paper, the visit checklist is not done). Drafts left unissued come back as "prescriptions not issued" on the doctor's Today.
- That Issue locks the prescription (said in the Issue action's own words, not a dialog).

## 10. Time and freshness
Nothing changes by itself while the doctor writes, except saves finishing. The medicine list is loaded when the visit opens and again after the doctor adds a medicine. If a save fails the panel says so and keeps the typed values.

## 11. Related pages and shared pieces
- The visit screen (one-screen visit and its tabbed version): hosts the panel; the bottom bar and the Finalise dialog show "prescription issued" and warn when it is not.
- Patient profile, History: lists issued prescriptions, reprint for the desk.
- Print: A5 prescription sheet (letterhead, patient, medicines table, advice, follow-up, doctor registration).
- Settings, Medicines and Medicine sets: where the lists the search reads are managed.
- Doctor Today, "Waiting for you": counts unissued prescriptions.
- Shared status words (Draft, Issued, Revised) used everywhere.

Today's screen (for context only): search box with "Enter adds the first match"; up to 8 suggestions; "+ Add to my list" form (name, strength, form) which the owner now does not want on this panel; medicine-set buttons showing only the set name; "Copy previous"; a table of Medicine, Dose, Freq, Days, Total, Remove; advice, follow-up date, weight (weight now removed); Issue, Revise, Print; red notice for errors, yellow notices for safety. Not shown today: timing and line instruction editing, recently used, a saving indicator inside the panel.

## 12. Things a designer would forget (expert checks)
- A tired doctor at 6 pm presses Enter on the wrong first match: show clearly what was added and allow a one-step undo (an undo, not a confirm). (Expert prompt 4)
- Find one item among many: brand and generic both searchable, and a fast path for the most used medicines. (Expert prompt 5)
- Zero, one and 30 lines: all designed. (Expert prompt 6)
- Desk and doctor at the same time: the desk only prints; a revise during print must not confuse them. (Expert prompt 7)
- Undo for removing a line; no confirm for Issue or Revise (owner decision). The record of who did what is kept by the system. (Expert prompt 8)
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
| 1 | Should Enter add the first match, or only the one the doctor moved onto with the arrow keys? | A wrong first match is a patient-safety risk | Enter adds the highlighted result (the first is highlighted); show "Added: Amoxicillin 500 mg" with Undo |
| 2 | Medicines the doctor types freely (not in the list) have no allergy tags, so safety notices cannot see them. Fine? | Notices only work on tagged medicines | Fine: they simply produce no notice |
| 3 | Should a free-typed medicine ever be saved into the doctor's list, so it is found by search next time? | Otherwise the doctor retypes it every visit | UNKNOWN: optional, never required, never a step that stops the doctor. Owner to decide if and where |
| 4 | Should the doctor pick the dose from a few common choices per medicine (1, 1/2, 5 ml)? | Typing doses is slow | Offer the medicine's own default and a short list of usual doses; UNKNOWN which list |
| 5 | Is there a "dispensed by dentist" option on the sheet? | The data model has it, not shown on this screen | UNKNOWN: leave it out until the owner says |
| 6 | Show the total tablet count on the printed sheet? | Patients buy that amount | Yes, labelled "approx." |
| 7 | Sets: shown while the search is empty and found by typing their name, with their medicines in small text. Right? | The owner asked how sets will appear | Yes, as described in item 5.3 |

## 14. Out of scope
- Managing the medicine list and sets (that is Settings).
- Patient weight, and the patient name, age and allergy strip.
- Dose calculators, interaction checks and medicine suggestions (a project rule).
- Medicine stock, pharmacy billing and selling medicines.
- Sending the prescription by WhatsApp or SMS.
- The print sheet's own layout (a separate page).
