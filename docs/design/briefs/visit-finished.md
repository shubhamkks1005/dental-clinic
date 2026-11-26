# Design brief: Visit finished page (after Finalise: bill, prescription preview, today's details)

SCOPE (owner): this brief is ONLY for the NEW page that opens right after the doctor presses "Finalise visit" on the visit page. The visit page itself stays exactly as it is (final design docs/design/final/doctor_visit.html); it is not designed here. This page shows three things together: the bill made from the visit (every line can be changed, a consultation fee can be added), the full prescription preview as the patient will get it, and beside it the details of this visit that are not on the prescription. Then the doctor hands the money to the desk or takes it, and goes back to Today.

Written: 2026-11-25. Updated: 2026-11-26 (owner answers in chat; backend for this page is built, handoff docs/design/handoff/doctor-visit.md section 13). Source: owner's notes + project docs (PLAN U10, DECISIONS) + the app as built. Fake data only.

## Prompt for the design AI (paste this first)
You are designing ONE page of a web app for a single dental clinic in India: the page the doctor sees right after finishing a visit. Below is a brief. It says what the page must contain, why each thing is there, and the rules behind it. It does NOT say how it looks: that is your job.
- Use only the data and actions in the brief. Do not invent fields, features or numbers. Use obviously fake sample data.
- Items marked MUST are required. SHOULD can be dropped if space is short. ADDED BY AI items are suggestions: include them only if they fit.
- Design every state in section 7 (empty, loading, error, long text, many rows), not only the happy path.
- Respect section 8 (who may see what, money, safety). Design for a laptop (1366x768) and a tablet (768). The phone layout comes later; do not design it now. UI text is English only.
- If something is unclear, list your assumption at the end of your answer instead of guessing silently.

## 1. Purpose
Answer: "The visit is done. What is the bill, what does the patient take away, and who collects the money?" The doctor sees the bill made from the visit and changes anything on it if needed (amount, a line, a consultation fee, a discount, a note), checks the full prescription as the patient will get it, glances at today's other details, and in one tap either hands the money to the reception desk or takes it, then goes back to Today for the next patient. Target: under 20 seconds for a normal visit (look, one tap to hand over, one tap back to Today).

## 2. Who, when, how
| Role | Situation | Device | How often | Time pressure | Interruptions |
|---|---|---|---|---|---|
| Doctor | Has just pressed Finalise; the patient is getting up from the chair; the next patient is waiting | Laptop at the chair; sometimes a tablet | 15-30 times a day | High | Phone, assistant, next patient |
| Receptionist | Does NOT open this page (it has clinical content). The desk sees the result on its own Billing and Today screens: the patient appears as "Ready to bill" with the amount, and can read the bill note | Desk PC | n/a here | n/a | n/a |
| Developer | Support only | Any | Rare | None | None |

## 3. Jobs to be done (in order of importance)
1. See the bill made from today's visit: every procedure done today as a line, with its amount, plus discount, total, already paid, due.
2. Change anything on the bill before it goes out (owner: "har cheej customise ho"): the amount of a line, the label, the quantity, remove a line, add a free line, add the consultation fee, give a discount.
3. Not lose money by mistake: if something done today is not on the bill (removed, or never added), a small prompt asks "Add it to the bill?" (owner decision).
4. See the full prescription exactly as the patient will receive it (the same A5 sheet as the print), and print it.
5. See, beside the prescription, today's details about this patient that are NOT on the prescription (what was found, what was done, what comes next).
6. Hand the money to the reception desk in one tap ("Pass to reception"), or take the payment right here.
7. Add a short note to the bill that stays with it (the desk can read it).
8. Go back to Today in one tap, or open the next waiting patient.
9. Fix a mistake after finalising: add an addendum (clinical) or reach the full bill (cancel, after it is issued).

Design principle (owner): least effort for the doctor. Fewest taps, no confirm dialogs for the normal path, nothing that blocks. Default path = look, "Pass to reception", "Back to Today".

## 4. How they arrive and where they go next
- Arrive: ONLY from the visit page, right after "Finalise visit" succeeds (the page opens by itself). The visit page no longer shows its own "Create bill" step after Finalise; that moves here.
- Opening an old finalised visit from History: NOT decided yet (owner will decide in a later chat). Do not design that entry.
- Go next: "Back to Today" (main), "Open next waiting patient: <name>", print the prescription, open the full bill screen, add an addendum.

## 5. Data catalogue
| # | Item | Why it is here | Source | Fresh how fast | Who sees it | Format | If empty / long / missing | Priority | Added by AI? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Finalised notice: "Visit finalised" with time, and that the visit is now read only | The doctor knows the lock happened | `visits.status`, `finalised_at` | On load | Doctor | Words, never colour alone | n/a | MUST | No |
| 2 | Patient strip: name, age and gender, P-000123 code, and that a medical alert exists | Right patient (a wrong-patient bill is the worst error) | `patients`, `visits` | On load | Doctor | "Rahul Verma . 24 yrs . Male . P-000123" | Long names wrap; no mobile is fine here | MUST | No |
| 3 | Bill state word | Doctor knows where the money part stands | Computed: `billStateWord` (Not billed / Draft / With reception / Paid; a cancelled bill counts as Not billed) from `GET /visits/:id/after` | On load and after each action | Doctor | One word + bill number once issued (BL-2026-27-0042) | n/a | MUST | No |
| 4 | Bill lines | What the patient is charged | Draft bill made from `visit_procedures` (label, tooth, usual fee from the Library) | After each change | Doctor; the desk sees the same bill on its side | Procedure name . tooth . quantity . amount in rupees (Indian grouping, Rs 3,700) | No procedures and no consultation: "Nothing to bill on this visit." with the consultation-fee option still there | MUST | No |
| 5 | Line with no fee set | Avoid a silent Rs 0 | Procedure without a usual fee | On load | Doctor | "No fee set" on that line, with a place to type the amount | n/a | MUST | No |
| 6 | Consultation fee option | Some visits are charged a consultation, some not (doctor decides each time) | `billing.consultation_fee_paise` setting (0 = not set) | On load | Doctor | Not on the bill until the doctor adds it. One tap adds "Consultation . Rs 500" with the usual fee; if no usual fee is set, the doctor types the amount. Once added it is a normal line: amount editable, removable | n/a | MUST | No (owner decision) |
| 7 | Bill totals | Doctor understands the amount | Computed on the server: subtotal, discount, round-off, total, advance used, paid, balance due | After each change | Doctor | Integer paise shown as rupees | Zero discount: "No discount" | MUST | No |
| 8 | Discount (amount or percent, reason) | Doctor can lower the bill | `bills.discount_paise`, `discount_reason` (doctor's discount needs no second approval) | On edit | Doctor | Rupees or percent, short reason | None: "No discount" | SHOULD | No |
| 9 | Discount asked earlier by the desk | The doctor can approve it here | Pending discount request on the bill | On load | Doctor | "Requested by the desk: Rs 200, reason ..." with approve | None: nothing shown | COULD | ADDED BY AI: the approve step exists; rare on this page |
| 10 | "Done today but not on the bill" reminder | Money is not lost because a line was removed or missed | Computed: procedures of this visit with no matching bill line | Right after a line is removed, and on load | Doctor | Small prompt: "Root canal (36) was done today. Add it to the bill?" with Add and Keep off. Never blocks the page | Nothing missing: nothing shown | MUST | No (owner decision) |
| 11 | Bill note | A short note kept with the bill ("will pay balance on Friday", "family discount agreed") | `bills.notes` | On edit | Doctor writes; the desk only reads | Plain text, up to 200 characters; the field says "No health details here" | Empty is fine | SHOULD | No (owner decision) |
| 12 | Patient's earlier dues and advance | The doctor sees if the patient already owes or has advance | `GET /visits/:id/after` (earlier dues in paise), advance from payments | On load | Doctor | "Earlier due Rs 1,500", "Advance Rs 500" | None: nothing shown | SHOULD | ADDED BY AI: it explains the balance and the desk will ask about it |
| 13 | Prescription preview (full sheet) | Doctor checks what the patient gets, before they leave | Issued prescription of this visit (`GET /visits/:id/prescriptions`); the same A5 layout as the print (clinic header, patient block, problem teeth, medicine table, advice, next visit, QR) | On load | Doctor | The sheet as printed, with Rx number RX-2026-27-0001 | No prescription for this visit: "No prescription for this visit." | MUST | No |
| 14 | Prescription status | "Draft" must never look final | `prescriptions.status`, `rx_no` | On load | Doctor | Words: Draft / Issued / Revised + number | Draft left unissued: clear notice "Not issued: the patient has no paper." with a way to issue it | MUST | No |
| 15 | Today's details (beside the prescription) | What happened and what comes next, which the sheet does not say | `GET /visits/:id/after`: diagnoses with tooth, procedures with tooth and surfaces (names only, no fees), next appointment, open plan items with sittings done, follow-up date, files added in this visit (names) | On load | Doctor only (clinical) | Short lists: "Diagnosis: Irreversible pulpitis (36)", "Done today: RCT started 36", "Next: RCT sitting 2, Thu 27 Nov 11:00", "Plan left: Crown 36 (0 of 1 sittings)", "Files: OPG.jpg" | Empty parts are left out; nothing at all: "Nothing else recorded for today." Long lists: first 5, then "Show all" | MUST | No (owner asked; list by AI, built) |
| 16 | Addenda | Corrections after the lock are visible | `visit_addenda` | On load | Doctor | Text, reason, who, when | None: nothing listed | SHOULD | No |
| 17 | Next waiting patient | Fast to the next person | Doctor's Today read | About every 30 s while the page is visible | Doctor | "Next: Sunita Rao, waiting 12 min" | Nobody waiting: "No one waiting." | SHOULD | ADDED BY AI: the visit page already offered "Next patient" after Finalise |
| 18 | Save state of this page | Doctor trusts the change or hand-over happened | Client state | Live | Doctor | Words: "Saving...", "Saved", "Passed to reception", or the failure reason | Failure keeps the page and allows retry | MUST | No |

## 6. Actions catalogue
| # | Action | Who | Needs to be true first | What changes in the data | Other effects | Undo? | Confirm? | Must NEVER happen |
|---|---|---|---|---|---|---|---|---|
| 1 | Change a bill line (amount, label, quantity) | Doctor | Bill is a draft | Draft bill items updated | Totals recompute on the server; audit row | Yes, before issue | No | Changing an issued bill (locked: cancel and remake) |
| 2 | Remove a bill line | Doctor | Bill is a draft | Line removed from the draft | If the line was a procedure done today, the "Add it to the bill?" prompt appears (item 10); audit row | Yes: the prompt's Add, or add again | No (the prompt is a reminder, not a confirm) | Losing a done procedure from the bill without the doctor seeing it |
| 3 | Add a free line | Doctor | Bill is a draft | New line with label and amount | Totals recompute; audit row | Yes, before issue | No | A line with no amount |
| 4 | Add or remove the consultation fee | Doctor | Bill is a draft | One "Consultation" line with the usual fee (or the typed amount) | Totals recompute; audit row | Yes, before issue | No | A consultation line on an issued bill; two consultation lines |
| 5 | Give a discount | Doctor | Bill is a draft | Discount amount or percent with reason (request and approve in one step for the doctor) | Totals recompute; two audit rows | Yes, before issue | No | A discount above the subtotal; a discount on an issued bill |
| 6 | Pass to reception | Doctor | Bill has at least one line | Bill is issued with its gap-free number; state becomes "With reception" | The patient shows on the desk's Today as "Ready to bill" with the amount; audit row | No take-back; a mistake is a bill cancel (full bill screen) | No (owner: one tap). If a done procedure is still off the bill, the reminder shows once more | Two bills or two numbers on a double tap (one live bill per visit) |
| 7 | Take payment here | Doctor | Bill has at least one line (it is issued first, then paid) | Payment (mode, amount, short reference) against the bill | Receipt can print; state becomes "Paid" or stays "With reception" if partial; audit row | Payments are reversed, never edited | No for a full payment; amount and mode are fields | Editing a payment; taking more than the bill without making it advance |
| 8 | Add or edit the bill note | Doctor | Bill is a draft or issued (not cancelled) | `bills.notes` text | Audit row with old and new text; the desk can read it | Yes (editable) | No | Health information in the note; the desk changing it |
| 9 | Print prescription | Doctor | Prescription issued | Print log row | Opens the A5 sheet | n/a | No | Printing a draft as if final |
| 10 | Add addendum | Doctor | Visit finalised | New addendum row (text, reason, who, when) | Audit row | Never removed | No | Editing the finalised visit in place |
| 11 | Open the full bill | Doctor | Bill exists | Nothing | Opens the Bill screen (payments, cancel) | n/a | No | n/a |
| 12 | Back to Today | Doctor | none | Nothing (a draft bill stays a draft) | Opens Today; an un-passed draft shows in "Waiting for you" | n/a | No | Losing an edit or a hand-over that did not finish |
| 13 | Open next waiting patient | Doctor | Someone is waiting | Nothing here; opens that visit | None | n/a | No | Opening a wrong patient (show the name on the action) |

## 7. States and edge cases
- Normal visit: draft bill with the procedure lines, prescription issued, today's details filled. The doctor taps Pass to reception, then Back to Today.
- Consultation only (no procedures): the bill part says "Nothing to bill on this visit." and offers the consultation fee. If added, hand-over and payment work as usual; if not, nothing to pass, the page shows the prescription and Back to Today.
- A done procedure removed from the bill: the "Add it to the bill?" prompt appears; Keep off leaves it off and the prompt does not come back for that line in this session (it shows once more at Pass to reception).
- Line with no fee: "No fee set" on the line with a place to type the amount; hand-over still works but the line is flagged so the desk is not surprised.
- Prescription not issued (draft or none): the preview shows DRAFT clearly; print is disabled with the reason; the notice says the patient has no paper; the doctor can issue it.
- Already passed and the desk has taken part of the money: "Paid Rs 2,000 of Rs 3,700. With reception." Lines are locked; only the note stays editable.
- Paid in full: "Paid", nothing left to do but print or go back.
- The patient has an advance: used automatically when the bill is issued; show "Advance used Rs 500".
- Loading: the page shows its shape while the bill, the prescription and the details load; Back to Today works at once.
- Error loading the bill: the prescription preview still shows; the bill part says why and offers retry. Error loading today's details: the rest of the page works.
- Network drops while saving a line or handing over: the page says it did not go through and keeps the state; never shows "Passed to reception" falsely.
- Two people: the desk opens the same bill while the doctor edits; the page reloads with a words notice and never silently loses the doctor's typing.
- Very long medicine list (up to 30 lines): the sheet preview scrolls inside its own area; the bill and the main actions stay reachable.
- Many bill lines (up to about 15 for a full-mouth visit): all visible with the total always in view.
- Wrong role: a receptionist who opens this address sees "Only the doctor can see the visit. Your bill list is under Billing." and nothing clinical.

## 8. Rules and constraints
- Clinical content (prescription, today's details, addenda) is doctor only. The receptionist sees only the bill (procedure names and amounts) and the bill note on the desk's own screens, and only that an alert exists.
- Money is integer paise, shown as rupees with Indian grouping; totals and round-off are computed on the server; a bill can be changed only while it is a draft; once issued it is locked and only cancelled with a reason; payments are reversed, never edited; the doctor's discount needs no second approval; bill numbers have no gaps per financial year; one live bill per visit; GST is off by default.
- A finalised visit is never edited; corrections are addenda. An issued prescription is locked; corrections are a new version (Revise).
- Every line change, hand-over, discount, payment, note and addendum is audited with who and when. Delete is soft only.
- English only on screen and on the printed sheet. Dates in IST, day-month-year. Patient code format P-000123.
- Keyboard first: Enter on the main action; Back to Today reachable by keyboard. Touch targets 44 px. Status is never colour alone.
- No confirm dialogs on the normal path; the "Add it to the bill?" prompt is a reminder that never blocks.
- The bill note carries no health information (the desk reads it). Messages to the patient never carry prescription content.

## 9. Things the user must never miss
- That the right patient's bill is open (name and code always visible).
- That something done today is not on the bill.
- That a bill line has no fee set.
- That the prescription is a DRAFT or not issued (the patient has no paper).
- That the bill is already passed, paid or locked (so nothing is done twice).
- That a change, discount or payment was saved (a words confirmation).

## 10. Time and freshness
The page loads once when opened (bill and today's details in one read, prescription in parallel). Each bill change saves and the totals come back from the server. While the page stays open and visible: the desk's payment state and the next-waiting-patient line refresh about every 30 seconds. If a refresh fails, the older data stays with a "last updated" time.

## 11. Related pages and shared pieces
- Visit page (docs/design/final/doctor_visit.html): its "Finalise visit" opens this page; its Live Rx sheet is the same A5 layout as the preview here.
- The A5 print sheet (shared layout for preview and print).
- Bill screen and Billing hub: full bill, payments, cancel, day close.
- Doctor Today: "Now", "Next" and "Waiting for you" (draft bills not passed, discount asks); "Back to Today" lands there. The desk's Today shows the patient as "Ready to bill".
- Library: usual fees of procedures. Settings: usual consultation fee.
- Shared status words (Draft, Issued, Revised, With reception, Paid) and the money format.

## 12. Things a designer would forget (expert checks)
- Wrong-patient safety: name and code beside every money action.
- A double tap on Pass to reception must not make two bills.
- The bill total must stay in view while lines are edited.
- The "done today but not on the bill" reminder must be noticeable but must not block.
- Pass to reception and Back to Today are each one tap.
- Printing the prescription prints only the sheet, not the page.
- A patient who pays at the chair and a patient who leaves without paying (the desk collects).
- The desk and the doctor can both act on the same bill: show the latest state in words.

## 13. Owner decisions and open questions
Decided by the owner:
- 2026-11-25: the doctor can take the payment OR pass it to the desk, both one tap; "with reception" is a state derived from the bill (no new marker, no take-back; a mistake is a bill cancel). Consultation fee is the doctor's choice each visit, one bill line. A bill note stays with the bill and can be changed after issue. A "today's details" part sits beside the prescription. Fees are not shown on the visit page.
- 2026-11-26: the visit page stays as it is; Finalise opens this new page, which shows the bill, the full prescription preview and today's details beside it. Everything on the bill can be changed (amounts, lines, consultation fee, discount). If something done today is removed from (or missing on) the bill, a prompt asks "Add it to the bill?". The consultation fee is added by the doctor (not pre-added). The desk only reads the bill note. Laptop and tablet now, phone later.

| # | Question | Why it matters | Suggested default | Owner's answer |
|---|---|---|---|---|
| 1 | What does "Pass to reception" do? | A new marker is extra work | Issue the bill; state derived | Derived state, no marker, no take-back (2026-11-25) |
| 2 | Consultation fee: pre-added or on tap? | Saves typing vs. avoids wrong charge | On tap, usual fee from Settings | Added by the doctor on this page; every line customisable (2026-11-26) |
| 3 | Which "today's details"? | Keeps the side part short | Diagnosis, done today, next appointment, plan left, follow-up, files, dues | The details of this visit not on the prescription (2026-11-26); list as in item 15 |
| 4 | Bill note: can the desk write it? | Privacy and who owns the note | Both write | Desk only reads (2026-11-26) |
| 5 | Discount only before issue? | Issued bills are locked | Before issue only | Yes (2026-11-25) |
| 6 | No procedure, no consultation: a bill? | Page has nothing to pass | No bill, page says so | Yes; the consultation fee can still be added (2026-11-26) |
| 7 | An old finalised visit opened from History: this page or the read-only visit page? | Entry points | This page, read only | OPEN: owner will decide in a later chat |
| 8 | Screen sizes for the design | Scope of the design work | Laptop and tablet, phone later | Laptop and tablet, phone later (2026-11-26) |

## 14. Out of scope
- The visit page and its accordions (notes, chart, diagnosis and procedures, prescription, files).
- The phone layout of this page (later).
- Opening this page from History (decision pending).
- The full Bill screen, payments list, day close, refunds and bill cancel.
- Sending the bill or prescription by WhatsApp or SMS.
- The A5 sheet's own layout (shared, already built).
- Backend note for the builder (not for the design AI): built (handoff section 13): `billStateWord`, `POST /bills/:id/discount/apply`, `POST /visits/:id/bill` with `reviewFirst` and `consultation`/`consultationPaise` (one live bill per visit, a second call returns the same bill), `PATCH /bills/:id/note`, `GET /visits/:id/after`, `POST /payments` for the doctor. Finalise does NOT make a bill: this page makes the draft on open with `reviewFirst: true`, edits it, and issues it on Pass or Take payment. CHANGES NEEDED: (a) `PATCH /bills/:id/note` must refuse the receptionist (today `bills.create`, the desk may write; owner: desk only reads); (b) adding a consultation line to an existing draft (today the consultation comes only at bill creation; check `updateDraft` takes a line with a label and `unitPaise` and no `listItemId`); (c) the visit page's "Finalise" must navigate here and its after-finalise "Create bill" strip (VisitNextSteps) goes away; (d) "done today but not on the bill" is computed on the client from `/after` procedures and the draft lines (no new endpoint).
