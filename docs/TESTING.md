# Testing guide (staging, fake data only)

Staging has **fake patients only** (all last names "Testcase", phones 90000 0xxxx). Never type a real patient.
Find a bug? Fill one template below and send it to the developer.

**Where is the Error ID?** Open **More** (phone bottom tab; on a laptop go to `/app/more`). The Help card shows the last Error ID with a **Copy** button. A crash page and server errors also show an Error ID.

---

## A. Usability script for the receptionist (task 5.5.2)

Do these 10 tasks without help. The developer watches and notes where you got stuck. Goal: 8 of 10 without help.

| # | Task | Expected result |
|---|------|-----------------|
| 1 | Open a finished visit and make its bill | Bill has the visit's lines and a bill number |
| 2 | Take a payment split in two modes (cash + UPI) | One receipt shows both amounts; total equals the bill |
| 3 | Take an advance for a patient with no bill | Advance shows on the patient; receipt printed |
| 4 | Take a part payment on a bill | Bill shows "Part paid" and the balance |
| 5 | Ask for a discount | Request goes to the doctor; you cannot approve it yourself |
| 6 | Ask for a refund | You cannot refund; screen says the doctor must do it |
| 7 | Close the day | Cash counted vs expected is shown; day shows Closed; new entries for that date are refused |
| 8 | Find everyone who still owes money | Dues list opens with amounts and a call button |
| 9 | Reprint a receipt | Print says "Duplicate copy" with today's date |
| 10 | Fix a wrong bill | Old bill stays visible as cancelled; new bill has a new number |

## B. Doctor day flow

| Step | Do | Expected |
|------|----|----------|
| 1 | Sign in | Today screen opens |
| 2 | Open today's "in chair" patient | Visit draft opens |
| 3 | Write complaint, exam, one diagnosis | Saves without a message |
| 4 | Add a prescription from your medicine list | Items listed; no automatic suggestions |
| 5 | Finalise the visit | Visit is locked; Edit is gone; Add addendum is offered |
| 6 | Print the prescription | A5/A4 black and white, no browser header or footer |
| 7 | Open the patient History tab | The visit and prescription appear |
| 8 | Approve a discount request; do one refund with a reason | Both need a reason; both show in History |
| 9 | Open Messages | Reminders are listed as test mode (nothing is really sent) |
| 10 | Open More > Help | Error ID or "No Error ID yet" |

## C. Receptionist day flow

| Step | Do | Expected |
|------|----|----------|
| 1 | Sign in | Today screen opens |
| 2 | Add a new patient (try a child with a guardian) | Patient code like P-000123 |
| 3 | Add the same name and phone again | A soft warning shows; you can still save |
| 4 | Book an appointment | Appears on the day view |
| 5 | Mark Arrived | Status changes; patient shows in queue |
| 6 | Open the patient (receptionist view) | No diagnosis, notes or prescriptions anywhere |
| 7 | After the doctor finishes: make the bill | Bill number appears |
| 8 | Take payment; print receipt | Receipt number; amount in words |
| 9 | Open patient History tab | Bills and payments shown; no clinical entries |
| 10 | Open Messages | Reminder list in test mode; "Open WhatsApp" opens a chat with a plain text that has no health information |
| 11 | Close the day | Day shows Closed |

---

## Bug report templates

Copy one, fill it, send with screenshots. Use fake data only in screenshots.

**UI bug**
- Screenshot:
- URL or screen number (S01 to S19):
- Screen size: 360 / 768 / 1366
- Expected:
- Actual:
- F12 console error (copy the red text, if any):

**Logic bug**
- Steps (1, 2, 3):
- Fake input used:
- Expected:
- Actual:
- Error ID (More > Help > Copy):
