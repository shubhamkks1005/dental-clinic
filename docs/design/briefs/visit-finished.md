# Design brief: Visit finished page (after Finalise: prescription preview, bill, back to Today)

SCOPE (owner): this brief is ONLY for the page the doctor lands on right after pressing "Finalise visit". It shows what the patient will get (today's prescription), the bill that came from the visit, and the way back to Today. The visit tabs (notes, chart, diagnosis and procedures, prescription, plan) are not designed here.

Written: 2026-11-25. Source: owner's notes + project docs (Q1.1, Q2.3 and Q2.4 in PLAN, DECISIONS D2, D4, D5, Q1.7) + the screens as built today. Fake data only.

## Prompt for the design AI (paste this first)
You are designing ONE page of a web app for a single dental clinic in India: the page the doctor sees right after finishing a visit. Below is a brief. It says what the page must contain, why each thing is there, and the rules behind it. It does NOT say how it looks: that is your job.
- Use only the data and actions in the brief. Do not invent fields, features or numbers. Use obviously fake sample data.
- Items marked MUST are required. SHOULD can be dropped if space is short. ADDED BY AI items are suggestions: include them only if they fit.
- Design every state in section 7 (empty, loading, error, long text, many rows), not only the happy path.
- Respect section 8 (who may see what, money, safety). The screen must work on a laptop (1366x768), a tablet (768) and a phone (360). UI text is English only.
- If something is unclear, list your assumption at the end of your answer instead of guessing silently.

## 1. Purpose
Answer: "The visit is done. What does the patient take away, what do they owe, and who collects it?" The doctor checks the final prescription as the patient will get it, looks at the bill, and in one tap either hands the money part to the reception desk or settles it themself, then goes back to Today for the next patient. Target: under 20 seconds for a normal visit (look, one tap to hand over, one tap to go back).

## 2. Who, when, how
| Role | Situation | Device | How often | Time pressure | Interruptions |
|---|---|---|---|---|---|
| Doctor | Patient has just left the chair; next patient waiting | Laptop at the chair; sometimes tablet | 15-30 times a day | High | Phone, assistant, next patient |
| Receptionist | Does NOT open this page (it shows the prescription). She sees the result on her own Billing and Today screens: a patient "ready to bill" | Desk PC | n/a here | n/a | n/a |
| Developer | Support only | Any | Rare | None | None |

## 3. Jobs to be done (in order of importance)
1. See today's prescription exactly as the patient will receive it (a preview of the sheet), and print it.
2. Go back to Today in one tap, and see who is next (the next waiting patient can be opened from here).
3. Hand the money part to the reception desk in one tap, so the doctor does not have to take money. (Owner: "pass to reception, doctor does not take the money".)
4. See the bill made from the visit: procedure lines, discount, total, what is already paid, what is due.
5. When the doctor wants to, adjust the money themself: give a discount (the doctor needs no one's approval), or take the payment right here.
6. Fix a mistake after finalising: add an addendum (clinical) or reach the bill's cancel action (money).

Design principle (owner): least effort for the doctor. Fewest taps, no confirm dialogs, nothing that blocks. Default path = look, "Pass to reception", "Back to Today".

## 4. How they arrive and where they go next
- Arrive: from the visit screen after "Finalise visit" succeeds. Also reachable later from the patient's History (open a finalised visit).
- Go next: "Back to Today" (main), "Open next waiting patient: <name>", print the prescription, open the full bill screen, add an addendum.

## 5. Data catalogue
| # | Item | Why it is here | Source | Fresh how fast | Who sees it | Format | If empty / long / missing | Priority | Added by AI? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Finalised banner: "Visit finalised" with time, and that it is now read only | The doctor knows the lock happened | `visits.status`, `finalised_at` | On load | Doctor | Words, never colour alone | n/a | MUST | No |
| 2 | Patient strip: name, age, P-000123 code | Right patient (a wrong-patient bill is the worst error) | `patients`, `visits` | On load | Doctor | Name, "24 yrs . Male", code chip | Long names wrap | MUST | No |
| 3 | Prescription preview (today's sheet) | Doctor checks what the patient gets, before they leave | Issued `prescriptions` + `prescription_items` for this visit; clinic letterhead from settings | On load | Doctor | The A5 sheet as printed: medicines with dose, frequency, days, timing, total approx., advice, follow-up date, status and number RX-2026-27-0001 | No prescription for this visit: "No prescription for this visit." with an option to write one is NOT here (the visit is locked) | MUST | No |
| 4 | Prescription status | "Draft" must never look final | `prescriptions.status`, `rx_no` | On load | Doctor | Words: Draft / Issued / Revised + number | Draft left unissued: clear notice "Not issued: the patient has no paper." and a way to go to Revise or Issue (the prescription can still be issued, it has its own lock) | MUST | No |
| 5 | Print prescription | Patient wants the paper | `prescriptions.print` | n/a | Doctor | Opens the A5 print sheet; logs the print | Disabled with reason when not issued | MUST | No |
| 6 | Bill lines | What the patient is charged | Built from `visit_procedures` (label, tooth, `default_paise`) via the visit-to-bill rule | On load | Doctor; the desk sees the same bill on her side | Procedure name . tooth . amount in rupees (Indian grouping) | No procedures: "No billable work in this visit." and no bill is made | MUST | No |
| 7 | Bill totals | Doctor understands the amount | Computed on the server: subtotal, discount, round-off, total, advance used, paid, balance due | After each change | Doctor | Integer paise shown as rupees, Rs 3,700 | Lines with no fee: "No fee set" shown on that line, never silently 0 | MUST | No |
| 8 | Bill status | Is it a draft, issued, partly paid, paid | `bills.status`, `paid_paise` | On change | Doctor | Words + bill number | No bill yet: "Bill not made" | MUST | No |
| 9 | Handed-to-reception state | Doctor sees the money part is passed | New: a marker on the bill or visit ("With reception since 10:42") | On change | Doctor, and the desk sees the patient under "Ready to bill" | Words + time | Not handed: shows the Pass to reception action | MUST | The marker is NEW (question 1) |
| 10 | Discount (amount or percent, reason) | Doctor can adjust the money | `bills.discount_paise`, `discount_reason` | On edit | Doctor | Rupees or percent, short reason | None: "No discount" | SHOULD | No |
| 11 | Patient's earlier balance and advance | Doctor sees if the patient already owes or has advance | `bills` dues, `payments` advance | On load | Doctor | Rupees: "Earlier due Rs 1,500", "Advance Rs 500" | None: nothing shown | SHOULD | ADDED BY AI: the visit header already shows dues, and it explains the balance |
| 12 | Addendum entry | Correct a clinical mistake in a locked visit | `visit_addenda` | On load | Doctor | Existing addenda listed, "Add addendum" action | None: nothing listed | SHOULD | No |
| 13 | Next waiting patient | Fast to the next person | Today queue | Live (about every 30 s while open) | Doctor | "Next: Sunita Rao, waiting 12 min" | Nobody waiting: "No one waiting." | SHOULD | ADDED BY AI: the visit design already offers "Open next waiting patient" after Finalise |
| 14 | Save and error state of this page | Doctor trusts the hand-over happened | Client state | Live | Doctor | Words: "Passed to reception", or the failure reason | Failure keeps the page and allows retry | MUST | No |

## 6. Actions catalogue
| # | Action | Who | Needs to be true first | What changes in the data | Other effects | Undo? | Confirm? | Must NEVER happen |
|---|---|---|---|---|---|---|---|---|
| 1 | Back to Today | Doctor | none | Nothing | Opens Today; this patient leaves "Now" | n/a | No | Losing a hand-over that did not finish |
| 2 | Open next waiting patient | Doctor | Someone is waiting | Nothing here; opens that visit | None | n/a | No | Opening a wrong patient (show their name on the button) |
| 3 | Print prescription | Doctor | Prescription issued | Print log row | Opens the A5 sheet | n/a | No | Printing a draft as if final |
| 4 | Pass to reception | Doctor | Bill exists (or can be made from the visit) | Bill is prepared and issued with its gap-free number (as "Create bill" does today), marked "handed to reception" | The patient shows on the desk's Today as "Ready to bill" with the amount; audit row | Yes, a short "Take back" while the desk has not started payment | No (owner: one tap) | Handing over twice and making two bills; the desk seeing clinical details |
| 5 | Take payment here | Doctor | Bill issued | A payment (mode, amount, short reference) against the bill | Receipt; audit row; balance updates | Payments are reversed, never edited | No for a full payment; amount and mode are fields | Editing a payment; taking more than the bill without making advance |
| 6 | Adjust discount | Doctor | Bill is a draft (before it is issued) | Discount amount or percent with reason on the draft bill; the doctor's own approval is automatic | Totals recompute on the server; audit row | Yes before issue | No | A discount above the bill; discount after the bill is issued (locked: cancel and remake) |
| 7 | Review bill first (do not issue yet) | Doctor | Bill lines exist | Keeps the bill as a draft | The desk does not see it as ready | Yes | No | Forgetting a draft bill for ever: it must show on the doctor's "Waiting for you" |
| 8 | Add addendum | Doctor | Visit finalised | A new addendum row (text, reason, time, who) | Audit row | Never removed | No | Editing the finalised visit in place |
| 9 | Open the full bill | Doctor | Bill exists | Nothing | Opens the Bill screen (payments, cancel) | n/a | No | n/a |

## 7. States and edge cases
- No procedures in the visit (a consultation only): the bill part says "No billable work in this visit." Pass to reception is replaced by nothing to pass; the page shows only the prescription and Back to Today. If the clinic charges a consultation fee, that is not known: UNKNOWN (question 5).
- Prescription not issued (draft or none): the preview shows DRAFT clearly; print is disabled with the reason; the notice says the patient has no paper; the doctor can still go back to the visit's prescription (it has its own Issue).
- Bill with a procedure that has no fee: shown as "No fee set" on the line and the hand-over still works, but the amount is flagged so the desk is not surprised.
- Bill already handed over and the desk has taken payment: the page shows "Paid Rs 2,000 of Rs 3,700" and "Passed to reception" is replaced by status only.
- Bill paid in full: "Paid", nothing left to do but print or go back.
- The patient has an advance: applied automatically as the bill is issued today; show "Advance used Rs 500".
- Discount asked by the desk earlier (not approved): the doctor sees "Requested by the desk" and can approve in place.
- Loading: the page shows its shape while the prescription and bill load; Back to Today works at once.
- Error loading the bill: the prescription preview still shows; the bill part says why and offers retry.
- Network drops while handing over: the page says it did not go through and keeps the state; never shows "handed over" falsely.
- Two people: the desk opens the same bill while the doctor adjusts a discount; the page reloads with a words notice and never loses the doctor's typing silently.
- Old finalised visit opened from History: same page, read only, no hand-over action if already handled.
- Very long medicine lists (up to 30 lines) on the sheet preview: it scrolls inside its own area; the main actions stay reachable.
- Wrong role: the receptionist who opens this address sees "Only the doctor can see the visit. Your bill list is under Billing." and nothing clinical.

## 8. Rules and constraints
- Clinical content (prescription preview, addenda) is doctor only. The receptionist sees only the bill (amounts and procedure names) on her own screens, and that an alert exists.
- Money is integer paise, shown as rupees with Indian grouping; totals and round-off are computed on the server; a bill is locked after issue and is only cancelled with a reason; payments are reversed, never edited; discount needs the doctor (here the doctor is the doctor, so no extra approval step); bill numbers have no gaps per financial year; GST is off by default.
- A finalised visit is never edited; corrections are addenda. A prescription issued is locked; corrections are a new version (Revise).
- Every hand-over, discount, payment and addendum is audited with who and when. Delete is soft only.
- English only on screen and on the printed sheet. Dates in IST, day-month-year. Patient code format P-000123.
- Keyboard first: Enter on the main action; Back to Today reachable by keyboard. Touch targets 44 px. Status is never colour alone.
- Nothing here blocks the doctor with a confirm dialog; the safe default is the one tap that does the normal thing.
- No health information in any reminder message; the desk's follow-up messages never carry prescription content.

## 9. Things the user must never miss
- That the right patient's bill is open (name and code always visible).
- That the prescription is a DRAFT or not issued (the patient has no paper).
- That a bill line has no fee set.
- That a bill is already passed, paid or locked (so nothing is done twice).
- That a discount or payment was recorded (a words confirmation).

## 10. Time and freshness
The page loads once when opened. While it stays open: the desk's payment status refreshes about every 30 seconds (only while the page is visible); the next-waiting-patient line refreshes the same way. If a refresh fails, the older data stays with a "last updated" time.

## 11. Related pages and shared pieces
- Visit screen (all tabs): the Finalise button leads here; its bottom bar's "Finalise visit" warnings (diagnosis missing, procedure missing, prescription not issued) already exist.
- Prescription tab and the A5 print sheet: this page reuses the same sheet as its preview.
- Bill screen and Billing hub: the full bill, payments, cancel, day close.
- Doctor Today: "Now", "Next" and "Waiting for you" (discount asks, bill-cancel asks, unfinished visits); "Back to Today" lands here; a passed-over patient shows on the desk's Today as ready to bill.
- Patient profile, History: finalised visits, prescriptions and bills.
- Shared status words (Draft, Issued, Revised, Paid) and money format.

## 12. Things a designer would forget (expert checks)
- Wrong-patient safety: name and code beside every money action.
- Double-tap on Pass to reception must not make two bills or two numbers.
- Pass to reception and Back to Today are both one tap; the page remembers which is the normal path.
- Phone layout: the sheet preview folds under the bill; the main actions stay in view.
- Printing the prescription from here must print only the sheet, not the page.
- A patient who pays now at the chair (take payment here) and a patient who leaves without paying (the desk collects).
- The desk and the doctor can both act on the same bill: show the latest state in words.
- The next step after this page is always one tap away (Back to Today).

## 13. Open questions for the owner
| # | Question | Why it matters | Suggested default |
|---|---|---|---|
| 1 | What exactly does "Pass to reception" do? | Today "Create bill" makes and issues the bill and the desk finds the patient under "Take payment". A separate "handed over" marker is new work | It issues the bill (as today) and marks it "handed to reception", so it shows on the desk's Today with the amount. Take back allowed until payment starts |
| 2 | When is the discount given: before issuing (draft) or also after? | Issued bills are locked | Before issuing only; after issue the bill is cancelled and remade |
| 3 | Can the doctor take the payment here too, or only adjust? | Owner said "doctor can adjust money" | Both allowed; payment is one short form |
| 4 | Is the desk told anything else when the doctor passes the bill (a note)? | Avoid health information in a note | A short plain note for money only, no clinical words |
| 5 | A consultation-only visit with no procedure: is there a fee? | Page has nothing to pass | UNKNOWN: ask the doctor; default "No bill" |
| 6 | Should this page show the prescription's advice and follow-up date too? | Part of the sheet | Yes, it is on the sheet; no separate section |
| 7 | Should Today show a patient who was passed over for a short time ("Ready to bill") on the doctor's side as well? | Doctor sees the loop closed | Yes, a small count only; no clinical details |

## 14. Out of scope
- The visit tabs (notes, chart, diagnosis and procedures, prescription, plan).
- The full Bill screen, payments list, day close, refunds and bill cancel.
- Sending the bill or prescription by WhatsApp or SMS.
- The A5 sheet's own layout (a separate page).
- Backend note for the builder (not for the design AI): visit to bill, issue, discount approve, payment create, addenda and print log exist today. NEW: the "handed to reception" marker and "take back"; the desk's "Ready to bill" already exists on her Today.
