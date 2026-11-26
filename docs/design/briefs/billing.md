# Design brief: Billing (the hub: Today, Dues, Bills, Day close)

SCOPE: this brief is for the **Billing page** reached from the main menu item "Billing" (`/app/billing`). It has four parts: **Today** (money taken today), **Dues** (who owes money), **Bills** (every bill), **Day close** (count the cash and close the day). The page for ONE bill (`/app/bills/:id`), the payment form, the refund and cancel panels and the print sheets are separate pages; they are linked from here but NOT designed here (see section 11 and 14).

Written: 2026-11-27. Updated: 2026-11-27 (owner answers in chat, section 13). Source: project docs (PRODUCT_DESIGN_CONTEXT D10, PHASE_Q Q2.3 and Q3.1/Q3.2, IDEAL_EXPERIENCE section 7, DECISIONS 5.x and D1-D8, ISSUES PA-B/PA-U) + the page as built (`apps/web/src/features/billing/`). The owner gave no extra notes, so every item that is not built today is marked ADDED BY AI; items the owner accepted in chat say "owner accepted". Fake data only.

**The clinic can have SEVERAL DOCTORS (owner, 2026-11-26/27).** Money on this page belongs to a doctor: a bill belongs to the visit's doctor, and a bill without a visit (opening balance, old dues) has a doctor chosen on it. Each doctor sees only their own money unless another doctor has allowed them, and each doctor decides which receptionists may see their money (section 8, "Who sees whose money").

## Prompt for the design AI (paste this first)
You are designing ONE page of a web app for a single dental clinic in India: the Billing page, where the front desk sees today's money, who owes money, every bill, and closes the day's cash. Below is a brief. It says what the page must contain, why each thing is there, and the rules behind it. It does NOT say how it looks: that is your job.
- Use only the data and actions in the brief. Do not invent fields, features or numbers. Use obviously fake sample data.
- Items marked MUST are required. SHOULD can be dropped if space is short. ADDED BY AI items are suggestions: include them only if they fit.
- Design every state in section 7 (empty, loading, error, long text, many rows), not only the happy path.
- Respect section 8 (who may see what, money, safety). Design for a laptop (1366x768) and a tablet (768). The phone layout comes later; do not design it now. UI text is English only.
- The clinic has several doctors. Every number and list on this page is for the doctor(s) chosen in the doctor picker (item P5); design the picker and the "combined and per doctor" view.
- Money is always shown in rupees with Indian grouping (₹1,25,000; ₹649.50). Never show a negative "collected" figure: payments and refunds are separate lines.
- If something is unclear, list your assumption at the end of your answer instead of guessing silently.

## 1. Purpose
One question: **"Where does the clinic's money stand right now: what came in today, who still owes, and does the cash drawer match?"**
The receptionist opens it many times a day: to see today's total, to chase a due, to find an old bill a patient asks about, and once at the end of the day to close the cash. A good visit takes under 10 seconds to answer "how much did we take today / does X owe us", and under 2 minutes to close the day.

## 2. Who, when, how
| Role | Situation | Device | How often | Time pressure | Interruptions |
|---|---|---|---|---|---|
| Receptionist | Between patients; patient at the desk asks "how much do I owe" or "give me a copy of my bill" | Laptop at the desk, sometimes phone | 10-30 times a day | High: patient is standing there | Phone calls, walk-ins |
| Receptionist | Quiet hour: calling patients who owe money | Laptop or phone | 1-3 times a week | Low | Patients arriving |
| Receptionist | End of day: counting the drawer and closing the day | Laptop | Once a day, 6-9 pm | Medium: wants to go home, tired | Last patient still in the chair |
| Doctor (any of several) | Evening or weekend: checking their own collection and old dues (and those of doctors who allowed them); reopening a closed day; answering discount or cancel requests | Phone or laptop | Daily to weekly | Low | Clinical work |
| Developer | Checking that numbers look right on staging (fake data) | Laptop | Rare | None | None |

## 3. Jobs to be done (in order of importance)
1. See how much money came in today, by mode (Cash, UPI, Card, Bank, Cheque, Other), and the list of those payments.
2. Find a patient who owes money and take the payment (one step to the payment form).
3. Close the day: compare the cash expected in the drawer with the cash counted, explain any difference, and lock the day.
4. Find any bill by patient name, patient code or bill number, and open it (to reprint, check, or correct).
5. Follow up old dues: write what the patient said on the call, send a "payment pending" WhatsApp message.
6. (Doctor) Reopen a closed day with a reason; see bills waiting for the doctor (discount, cancel request).

## 4. How they arrive and where they go next
**Entry points:** main menu "Billing" (laptop sidebar, phone bottom tab); it opens on **Today** (owner, 2026-11-27); Today page "To follow up: Collect" (opens Dues); a link with the part in the address (`?tab=today|dues|bills|close`) so a reload or shared link opens the same part.
**Exits:** a bill row opens the Bill page; a patient name opens the patient's Billing tab; "Take payment" opens the payment form (today on the patient's Billing tab); WhatsApp opens WhatsApp with the text ready; "Print day close" opens the print sheet; Day-close blockers open the patient's appointment.

## 5. Data catalogue

### 5a. Whole page
| # | Item | Why it is here | Source | Fresh how fast | Who sees it | Format | If empty / long / missing | Priority | Added by AI? |
|---|---|---|---|---|---|---|---|---|---|
| P1 | Page title "Billing" and a one-line subtitle | Orientation | static | n/a | Doctor, receptionist | Text | n/a | MUST | |
| P2 | The four parts: Today, Dues, Bills, Day close, with the open one clear | Each is a different job (section 3) | static; open part kept in the address | n/a | Both | Text labels | n/a | MUST | |
| P3 | A count or marker on each part name: Dues "12", Day close "Not closed" / "Closed" | Know where work waits without opening each part | computed from the same endpoints | On open | Both | Number / status word | Hide count when 0 | SHOULD | ADDED BY AI: "show what is waiting for me" rule (IDEAL_EXPERIENCE rule 2) |
| P5 | **Doctor picker: whose money is shown.** Lists only the doctors this person may see (themselves, plus doctors who allowed them). Tick one or several by name; the page shows the ticked doctors **combined**, and also **separately per doctor** (each total split by doctor; each row says its doctor). | Several doctors share one clinic; each one's money is private by default | Settings "who sees whose money" (new, see section 8) + bill's doctor | On open | Doctor (own + allowed); receptionist (only doctors who allowed her) | Doctor names; "All I can see" shortcut | Only one doctor allowed: picker shows just that name (or is hidden) and nothing is combined. Nobody allowed (receptionist): "No doctor has shared billing with you. Ask a doctor to allow it in Settings." | MUST | Owner, 2026-11-27 |
| P6 | Each total, list row and bill carries its doctor's name when more than one doctor is ticked | No mixing up whose patient paid | bill → visit.doctor_id, or the doctor chosen on a bill without a visit | | Same as P5 | "Dr. Mehta" | Hidden when one doctor | MUST | Owner, 2026-11-27 |
| P4 | "Waiting for the doctor" line: discount requests and bill-cancel requests open | Desk sees what is stuck; doctor sees what to approve | GET pending discounts, cancel requests | On open | Both (doctor acts) | "2 discounts, 1 cancel request waiting" with links to each bill | Hidden when none | SHOULD | ADDED BY AI: today these live only on the doctor's Today page; the desk has no view of them |

### 5b. Today
| # | Item | Why | Source | Fresh | Who | Format | Empty / long / missing | Priority | AI? |
|---|---|---|---|---|---|---|---|---|---|
| T1 | Payments today (total) | The first question of the day | GET /day-close?date=today → totalPaise | On open + after any payment | Both | ₹ | "₹0" with "No payments recorded yet today." | MUST | |
| T2 | Total by mode (Cash, UPI, Card, Bank, Cheque, Other) | Cash must match the drawer; UPI/card must match the bank app | modeTotals (a split payment counts in both modes) | Same | Both | ₹ per mode; hide modes with ₹0 | Only Cash if all cash | MUST | |
| T3 | Refunds today (separate total) | Money given back; never subtracted silently | refunds for the day | Same | Both | ₹, its own line | Hidden when ₹0 | MUST | |
| T4 | Number of payments | Quick sense check | paymentCount | Same | Both | "14 payments" (one plural rule) | "No payments yet" | SHOULD | |
| T5 | List of today's payments: time, patient name + code, receipt number, amount, mode (and split), reference, bill(s) it paid ("applied to SB-2627-000123") or "Advance", who recorded it | Answer "did Ramesh pay?" and find a receipt to reprint without opening the patient | payments for day_local (exists per patient: PatientPaymentRow; needs a by-day list) | Same | Both | Newest first; time in IST AM/PM | Long names cut with full name on focus; 40+ rows scroll | MUST | ADDED BY AI, owner accepted: today the part says "the full list is on each bill" (gap) |
| T6 | Each payment row: Print receipt | Patient asks for the receipt again | /app/print/receipt/:id | n/a | Both | Action | Reprint says "Duplicate copy" on paper | MUST | ADDED BY AI |
| T7 | Today's refunds list: time, patient, refund number, amount, mode, reason, who | Refunds must be visible and explained | refunds for the day | Same | Both | Separate from payments | Hidden when none | MUST | ADDED BY AI, owner accepted |
| T8 | Still to collect today ("Ready to bill"): patients whose visit is final today and have no bill, a draft bill or an unpaid balance; amount due; one action Take payment / Open bill | So nobody leaves without paying; same rule as the Today page stat | ready-to-bill rule (Q1.2) | On open | Receptionist (money) ; doctor too | Name + code, ₹ due | "Everyone seen today has paid." | MUST | ADDED BY AI, owner accepted: the hub is where money lives; today this is only on the Today page |
| T9 | Day status: "Day open" or "Closed at 8:12 pm by Priya" | A closed day refuses new payments | day close summary | Same | Both | Status word | n/a | SHOULD | ADDED BY AI |

### 5c. Dues
| # | Item | Why | Source | Fresh | Who | Format | Empty / long / missing | Priority | AI? |
|---|---|---|---|---|---|---|---|---|---|
| D1 | Total due and number of patients | Size of the problem | GET /bills/dues → totalDuePaise, rows | On open + after a payment or call note | Both | ₹, "23 patients" | "Nobody owes money right now." | MUST | |
| D2 | Ageing: Up to 30 days / 31 to 60 / Over 60 — amount and patient count each | Old dues are harder to collect; chase the oldest | byBucket; age = days since the oldest unpaid bill date (IST) | Same | Both | ₹ + count; the age group named in words, never by colour alone | A bucket with ₹0 still shows | MUST | |
| D3 | Filters: All, Over 30 days, Over 60 days, Not called this week | Pick today's calling list | computed on the list | Instant | Both | Chips/words | "No one matches this filter." | MUST | |
| D4 | Search by name, patient code or mobile | Patient on the phone: "how much do I owe?" | client filter or API | Instant | Both | | "No one matches" | SHOULD | ADDED BY AI: no search today |
| D5 | Sort: oldest first (default), biggest amount first | Two different ways to chase | computed | Instant | Both | | | SHOULD | ADDED BY AI |
| D6 | Row: patient name + code (link to patient's Billing tab) | Identify; avoid wrong patient with similar names | dues row | | Both | P-000123 | Long names wrap or cut | MUST | |
| D7 | Row: amount due | | duePaise | | Both | ₹ | | MUST | |
| D8 | Row: days outstanding + oldest bill date | Priority | daysOutstanding, oldestBillOn | | Both | "47 days (since 10 Oct 2026)" | | MUST | |
| D9 | Row: last call note and date | Do not call twice; know what they promised | dues_calls (append only) | After saving a note | Both | "Called 20 Nov 2026: will pay Saturday" | "Not called yet"; long note cut, full on focus | MUST | |
| D10 | Row: mobile number (or "No mobile") | Needed to call | patients.mobile (guardian's for a child) | | Both | 98765 43210 | "No mobile" disables WhatsApp with a reason | SHOULD | ADDED BY AI |
| D11 | Row: has advance? / next appointment date | If they come in on Friday, collect then instead of calling | patient next appointment rule | | Both | "Next visit 2 Dec" | Hidden when none | COULD | ADDED BY AI |
| D12 | Row: mark "Medical alert" exists? | NOT shown: no clinical data on money pages | — | | — | — | — | — (never) | ADDED BY AI: listed so the designer does not add it |

### 5d. Bills
| # | Item | Why | Source | Fresh | Who | Format | Empty / long / missing | Priority | AI? |
|---|---|---|---|---|---|---|---|---|---|
| B1 | Search: patient name, patient code, bill number | Find one bill fast | GET /bills?q= | 300 ms after typing | Both | | "No bills match." | MUST | |
| B2 | Status filter: All, Draft, Open (unpaid), Part paid, Paid, Cancelled | Drafts need issuing; cancelled ones checked | status + paid | Instant | Both | Status words (one vocabulary) | | MUST | Part paid / Paid / Open split ADDED BY AI (today only Issued/Draft/Cancelled) |
| B3 | Date range (Today, This month, custom) | "All bills of last month" for a check | billOn | Instant | Both | dd Mmm yyyy | | SHOULD | ADDED BY AI |
| B4 | Row: bill number (or "Draft bill"), date, patient name + code, total, paid, balance, status | Enough to answer without opening | BillSearchRow | | Both | B-2627-000123 / SB- prefix | Draft has no number | MUST | paid/balance columns ADDED BY AI |
| B5 | Row: "Discount waiting for the doctor" / "Cancel requested" mark | Why a bill is stuck | bills.discount_approved_by empty; bill_cancel_requests | | Both | Words | | SHOULD | ADDED BY AI |
| B6 | Cancelled bill: reason visible, number kept | Gap-free numbers; trust | bills.cancel_reason | | Both | Grey status word + reason | | MUST | |
| B7 | Totals for what is shown (count, sum of totals), combined and per ticked doctor | Quick month check | computed | | The doctor themself; anyone else only if that doctor allowed them in Settings | ₹ | Hidden for a person not allowed | SHOULD | ADDED BY AI; who sees it: owner, 2026-11-27 |
| B8 | Paging: Newer / Older (or "Show more"), 50 per page | Thousands of bills over years | hasMore | | Both | | | MUST | |

### 5e. Day close
| # | Item | Why | Source | Fresh | Who | Format | Empty / long / missing | Priority | AI? |
|---|---|---|---|---|---|---|---|---|---|
| C1 | The day being closed (default today; pick an earlier day) | A day may be closed late or checked later | dayLocal | | Both | 27 Nov 2026 | | MUST | |
| C2 | Earlier days not closed: warning with the dates (only days that had payments; a day with no payment never needs closing) | A forgotten close hides missing cash | day_closes vs days with payments | On open | Both | "26 Nov is not closed" + open it | Hidden when none | SHOULD | ADDED BY AI; payment days only: owner, 2026-11-27 |
| C3 | Blockers: patients still Booked, Waiting or In chair today, by name, with their status and a link (and a Missed action) | Close is refused while any remain; name them so the desk can fix it | incompleteAppointments | On open + after fixing | Both | "Kavita Sharma · Check-up · Waiting" | Hidden when none | MUST | |
| C4 | Cash expected in the drawer | The number to match | cashExpectedPaise (cash payments − cash refunds; split counted) | | Both | ₹, the most prominent number | ₹0 | MUST | |
| C5 | Digital total (UPI, card, bank, cheque) and per mode | Check against the UPI app / card machine | digitalPaise, modeTotals | | Both | ₹ | | MUST | |
| C6 | Counted cash (typed) | The real drawer | user input | | Both | Numeric keyboard, ₹ | Starts EMPTY: must be typed; never prefilled | MUST | Not prefilled: ADDED BY AI, owner accepted (today it is prefilled with the expected value, which invites closing without counting) |
| C7 | Difference, live: "Matches", "₹50 less than expected", "₹20 more than expected" | Spot a mistake before locking | computed | As typed | Both | Words + ₹, never a bare minus | | MUST | |
| C8 | Note "Why is there a difference?" — required only when different | Audit trail | day_closes.note | | Both | up to 500 chars | | MUST | |
| C9 | After closing: "Closed. Counted ₹4,500, difference −₹50 (note)", closed by whom and when; Print day close | Proof for the doctor | day_closes | | Both | | | MUST | who/when ADDED BY AI |
| C10 | Reopen day with reason (doctor only) | Fix a late payment | POST /day-close/reopen | | Doctor | | Receptionist sees "Only the doctor can reopen a closed day." | MUST | |
| C11 | Late entry on a closed day (payment form asks for a reason) | Today the error says "use a late entry" but there is no such path (PA-B12, Q3.2) | planned Q3.2 | | Both | | | SHOULD (later) | |
| C12 | Reopen/close history of this day (who closed, who reopened, why) | Trust in the cash book | audit_log | | Doctor | List | Hidden when only one close | COULD | ADDED BY AI |

## 6. Actions catalogue
| # | Action | Who | Needs to be true first | What changes in the data | Other effects | Undo? | Confirm? | Must NEVER happen |
|---|---|---|---|---|---|---|---|---|
| A1 | Switch part (Today/Dues/Bills/Day close) | Both | — | none (address changes) | — | n/a | No | Lose a typed counted-cash or call note without warning |
| A2 | Take payment (from a Due row, a Ready-to-bill row) | Both | Patient has a due; day not closed (or late entry) | payment + allocations (oldest bill first) + receipt number from counters | Audit row; toast "₹500 recorded. Receipt SR-2627-000045. Print" | No (only a doctor refund) | Only when the amount is above the due ("record the extra as advance?") | One click recording money; a wrong-patient payment; amount prefilled as a payment without typing/choosing |
| A3 | Print receipt again | Both | Payment exists | print_log row | Paper says "Duplicate copy" | n/a | No | |
| A4 | Write a call note | Both | — | new dues_calls row (append only) | Audit | No (append a new one) | No | Health details in the note (hint text says so) |
| A5 | Send WhatsApp payment reminder | Both | Patient has a mobile; reminder consent if required | message record (dry run in testing) | Opens WhatsApp with English template | n/a | No | Any health information, the amount of treatment, or procedure names in the text. Allowed: first name, clinic name, clinic phone, "payment pending" |
| A6 | Search / filter / sort / page | Both | — | none | — | n/a | No | |
| A7 | Open a bill | Both | — | none | Goes to Bill page | n/a | No | |
| A8 | Close day | Doctor; receptionist only if the doctor allowed it in Settings (owner, 2026-11-27) | No blockers; counted cash entered; note if different | day_closes row; day locked for new payments | Audit; print offered | Doctor reopen only | Yes, one confirm showing counted, expected, difference | Closing with blockers; closing with the counted field never touched |
| A9 | Reopen day | Doctor | Day closed; reason | day_closes reopened | Audit with reason | Close again | Yes | Receptionist reopening; reopening without a reason |
| A10 | Print day close | Both | Day closed | print_log | — | n/a | No | |
| A11 | Open a waiting discount / cancel request (P4) | Both see; doctor decides on the Bill page | Request open | none here | — | n/a | No | Approve from a list without seeing the bill |

## 7. States and edge cases
- **First day of use / nothing yet:** each part says what it is and what will appear ("Payments recorded today will show here.").
- **Loading:** a placeholder shaped like the content per part; the other parts stay usable.
- **Error / offline:** plain sentence + Retry per part ("Could not load the dues. Check the connection."). Never show old numbers as if fresh: say "Last loaded 6:40 pm".
- **Many rows:** 40 payments in a day; 200+ patients in Dues; 10,000+ bills over years (paging).
- **Long names / notes:** "Venkataraghavan Subramaniam Iyer"; call note 500 characters.
- **Child patient:** mobile is the guardian's ("Contact: mother 90000 99070").
- **No mobile:** WhatsApp off with the reason.
- **Split payment:** ₹1,000 = ₹600 cash + ₹400 UPI shows once in the list and counts in both mode totals.
- **Payment that became advance (more than due):** shows "Advance ₹500" not "applied to".
- **Refund larger than today's payments:** Payments ₹2,000, Refunds ₹2,500 — two lines, never "Collected −₹500".
- **Draft bill:** no number yet; "Draft bill"; may carry a discount waiting for the doctor.
- **Cancelled bill:** stays in the list with reason and its number (numbers have no gaps).
- **Day already closed:** Today and Day close say so; taking a payment is refused with the next step (late entry or ask the doctor).
- **Closing late (after midnight IST):** the day picker must default to the day not yet closed, not the new date. ADDED BY AI.
- **Two people at once:** desk takes a payment while the doctor looks at Day close — the expected cash refreshes when the part is opened again; closing uses fresh numbers on the server and says if they changed.
- **No permission:** receptionist sees no Reopen; CA export is not on this page.
- **Clinic holiday / no patients:** a day with no payments never needs closing and never shows "not closed" (owner, 2026-11-27).
- **Receptionist not allowed to close:** Day close shows the numbers and the blockers, and in place of Close day: "The doctor closes the day. A doctor can allow you in Settings."
- **Person allowed to see no doctor's money:** every part shows the sentence from P5, nothing else.
- **Doctor ticks two doctors:** totals show combined and per doctor; rows name the doctor.

## 8. Rules and constraints
- **Money:** stored as integer paise; shown as ₹ with Indian grouping; never rounded on screen. Bills, receipts, refunds are locked after issue; corrections only by refund (doctor) or cancel (doctor, after refund); receptionist can only **ask** the doctor to cancel. Discount changes the total only after the doctor approves.
- **Numbers:** bill B-/SB-, receipt R-/SR-, refund F-/SF- per financial year (April-March), gap-free; S prefix = software series (shadow mode).
- **Payment modes:** Cash, UPI, Card, Bank, Cheque, Other; only a short reference for non-cash (never full card or UPI IDs).
- **Cash warning:** a cash payment of ₹2,00,000 or more shows a warning (DRAFT, accountant to confirm). Bills over ₹10,00,000 need a confirm.
- **GST:** off by default; no tax lines on this page unless the doctor turns it on in Settings.
- **Privacy:** no clinical data on any part (no procedures beyond bill line names on the Bill page, no alerts, no notes). WhatsApp text: no health information.
- **Roles:** Reopen day, refunds, cancel, discount approval: doctor only. CA monthly export: doctor only and lives in Reports.
- **Who sees whose money (owner, 2026-11-27; set in Settings, which is designed later):**
  - A doctor sees only their own money (payments, dues, bills, totals) on every part of this page.
  - A doctor may allow another doctor to see their money; that doctor then finds them in the picker (P5).
  - A doctor chooses, person by person, which receptionists may see their money (with two receptionists, the doctor picks which one). A receptionist sees only the doctors who allowed her.
  - Bill totals (B7, month sums) follow the same per-person choice.
  - Whether a receptionist may **close the day** is the doctor's choice in Settings.
  - A bill belongs to its visit's doctor; a bill without a visit (opening balance, old dues) must have a doctor chosen when it is made.
  - UNKNOWN for the plan step (not a design question): with several doctors, is the cash drawer and day close one for the whole clinic or one per doctor? The design shows one drawer for the clinic, split by doctor in the totals.
- **Audit:** every payment, refund, call note, close and reopen writes an audit row (who, when).
- **Language:** English only on screen and paper.
- **Accessibility:** 44 px touch targets; status by words, not colour alone; keyboard: "/" jumps to search, Enter on a row opens it; numeric keyboard for money.
- **Times:** IST; "today" means the IST date.

## 9. Things the user must never miss
1. **Day not closed** (today or an earlier day) when there were payments.
2. **Cash difference** before pressing Close day.
3. **Patients still in the clinic** blocking the close, by name.
4. **Money waiting to be collected today** (ready to bill) before the patient leaves.
5. **A bill stuck waiting for the doctor** (discount / cancel request).
6. **Refunds** — always visible, never netted out silently.

## 10. Time and freshness
Totals and lists load when a part opens and after any payment, refund, call note or close done on this page. No live push today; if the page stays open long (the desk leaves it open all day), show "Updated 6:40 pm" and a Refresh. A failed refresh keeps the old numbers with "Could not refresh" — never blank them.

## 11. Related pages and shared pieces
- **Bill page** `/app/bills/:id` (final design pending; proposal `docs/design/proposal/Bill.dc.html`): opened from Bills, Today, Ready to bill.
- **Payment form** (same on Bill page and patient Billing tab; Q0.6 rules).
- **Patient profile, Billing tab**: balance, payments, refund (doctor).
- **Today page** (receptionist): stat "Ready to bill", To follow up "Collect". **Doctor's Today**: "Waiting for you" discounts and cancel requests.
- **Reports** (doctor): month payments/refunds, CA export.
- **Print sheets:** receipt, bill, statement, day close.
- Shared pieces: patient name + code chip, status words (Draft / Open / Part paid / Paid / Cancelled), money format, empty-state, toast with action.
- Existing proposals: `docs/design/proposal/Billing.dc.html` (Dues, laptop) and `PhoneBilling.dc.html` (Dues, phone). Today, Bills and Day close were never designed.

## 12. Things a designer would forget (expert checks)
- A way back to the part you were on after opening a bill (part stays in the address).
- Split payments counted twice in totals if drawn naively.
- Counted cash must be typed, not prefilled (C6).
- A day closed after midnight (picker default).
- Refunds as their own line (never negative collection).
- Dues of a child go to the guardian's mobile.
- Dues page for a patient who also has an advance (net figure) — UNKNOWN until Q3.1.
- Draft bills have no number; do not show "B-…" for them.
- Phone: tables become rows/cards; no sideways scroll; bottom tabs stay visible.
- Plural words ("1 payment", "2 payments").

## 13. Open questions for the owner
| # | Question | Why it matters | Suggested default | Owner's answer |
|---|---|---|---|---|
| 1 | Which part opens first when Billing is opened? | Today it opens on Dues | Today | Today |
| 2 | Should Today list every payment (with who took it) and today's refunds? | The main gap today | Yes, full list + refunds | Yes, list + refunds + still to collect |
| 3 | Should Billing > Today also show "Still to collect today" (ready to bill)? | Duplicate of the Today page stat, but money lives here | Yes | Yes |
| 4 | Counted cash: start empty (must type) or prefilled with the expected amount (as today)? | Prefill invites closing without counting | Start empty | Start empty |
| 5 | Who may close the day? | Today both can | Both; doctor reopens | A Settings option: the doctor decides whether the receptionist may close. Doctor reopens |
| 6 | Design the phone (360) layout now or later? | Earlier briefs did laptop + tablet first | Now (Billing is a phone bottom tab) | Later |
| 7 | Can the receptionist see total billed for a month on Bills (B7)? | Business numbers are the doctor's | Doctor only | A Settings option per doctor: each doctor sees only their own; the doctor picks, person by person (other doctors, each receptionist), who may see their money |
| 8 | A day with no payments: must it be closed? | Holidays create "not closed" warnings | No; only days with payments | No, only payment days |
| 9 | Does "own money only" apply to the whole page (Today, Dues, Bills)? | Several doctors | Yes, whole page | Yes, whole page; a doctor allowed by another sees them too; tick doctors by name to see them combined and separately |
| 10 | A bill without a visit: whose is it? | Needed for per-doctor money | Doctor chosen on the bill | Doctor chosen on the bill (required) |

## 14. Out of scope
The Bill page, the payment form, refund and cancel panels, discount approval, print sheets, CA export (Reports), advance taken on purpose (Q3.1 — only shown as "Advance" where it already exists), manual charge without a visit (Q3.3), GST settings, the patient portal, the phone layout (later), and the Settings screens that hold "who sees whose money" and "receptionist may close the day" (designed with the Settings brief).
