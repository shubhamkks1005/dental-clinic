# Staff user manual (9.5.2)

**English.** For the doctor and receptionist at Align Dentistry.

This manual covers everyday tasks in the clinic software. For technical problems, see the Quick help section at the end.

---

## Receptionist — everyday tasks

### Sign in
1. Open the clinic website in Chrome.
2. Click "Sign in with Google" and choose your clinic Gmail account.
3. You are taken to the Today screen.
4. The app stays signed in for 12 hours, then asks you to sign in again.

### Today screen
- Shows today's appointment list: time, patient name, status.
- Click a patient name to open their profile.
- Use the status buttons (Arrived, In chair, Completed, No-show) to update each appointment.
- **Walk-in:** Click "Walk-in" to add a patient who came without an appointment.
- **Call list:** Shows patients who did not show up — call them to reschedule.

### New patient registration
1. Click the **+** button (top right or bottom of the screen).
2. Fill in the required fields: Full name, Mobile number, Gender.
3. Date of birth or age (at least one is required for under-18 patients).
4. Under-18: guardian name and mobile are required.
5. Click "Save patient."
6. The app shows the new patient's profile. You can book an appointment from there.

> **[Screenshot placeholder: New patient form]**

### Book an appointment
1. From the Today screen or the Appointments tab, click **+ New appointment**.
2. Search for the patient by name or last 4 digits of mobile.
3. Pick the visit type and choose a time slot.
4. Click "Book."

### Appointments screen
- Shows the full day view as a timeline.
- Click an empty slot to quick-book.
- Drag and drop to reschedule (a confirmation dialog appears).
- Print today's or tomorrow's list: click "Print" at the top.

### Print the day list (every evening)
1. From the Today screen, click "Print tomorrow's list."
2. Print and file it. This is your backup if the app is unavailable.

> **[Screenshot placeholder: Print day list]**

### Billing
1. From the patient profile, go to the **Billing** tab.
2. Create a draft bill from the visit (the doctor's procedures are pre-filled).
3. Add or change line items if needed. If the amount differs from the standard fee, enter a reason.
4. If a discount is needed: enter the amount and reason, then ask the doctor to approve.
5. Click "Issue bill."
6. Click "Take payment" and enter the amount and payment mode (cash / UPI / split).
7. The receipt prints automatically. For a reprint, click "Print receipt."

> **[Screenshot placeholder: Billing tab]**

### Day close
1. At the end of each working day, go to **Billing → Day close**.
2. Enter the counted cash in the drawer.
3. If the amount matches the software total, click "Close day."
4. If there is a difference, write a note explaining why.

> Note: Day close is blocked if any appointment is still in "Arrived" or "In chair" status. Finalise those first.

### Dues
- The **Dues** section shows patients with outstanding balances.
- Use the "Call note" button to record a call attempt.
- The "Due" badge appears on appointment cards for patients with balances.

### Messages (WhatsApp)
- The **Messages** tab shows pending reminders.
- Click "Open WhatsApp" to send a reminder. The message is pre-filled — just tap Send in WhatsApp.
- Never type a diagnosis, treatment name, or amount in the WhatsApp message.

### End of day
1. Print tomorrow's appointment list.
2. Close the day in Billing.
3. Lock the computer screen before leaving.

---

## Doctor — everyday tasks

### Today screen (doctor view)
- **In chair now** shows the patient you are seeing, with **Open visit** and **Done**. Press **Start** on a patient in the list and they move into the chair.
- **Today's list** has everyone once, in your order. **Next** marks the first patient who is waiting. **Exp 11:20** is when you will probably see them. A yellow "min late" chip means the first patient will start later than booked.
- **Skip** (in the "..." menu): the patient steps out and the next one moves up. **Back** puts them in the queue again. **Pull forward** moves one patient one place up. **Late arrived**: choose Coming today (same appointment goes to the back, no new charge), Another day (reschedule) or Not coming (cancel). None of these change any bill or message.
- **Take a break**: choose 5, 10, 15 or 45 minutes (only when nobody is in the chair). The banner counts down; use +5 min or -5 min, then **I'm back**. A break does not move or cancel any appointment. If someone presses Start during your break you get a warning with **Start anyway**.
- **Waiting for you**: requests from the front desk (Yes, No, or a Note), discount approvals (Approve or Reject), prescriptions not issued, visit drafts. The X hides a prescription or draft for today only.
- **Order updated by Priya at 10:48 AM** shows when the front desk changed the order.

### Opening a visit
1. From the Today screen, click the current patient's name.
2. The visit screen opens. If a visit was already started, it reopens.
3. Fill in the chief complaint, notes, vitals, and diagnoses.

> **[Screenshot placeholder: Visit screen]**

### Dental chart
- Click the **Chart** tab in the visit screen.
- Click on a tooth surface to record a condition.
- Use the keyboard: arrows to move between teeth, Enter to select a surface.

### Prescriptions
- Click the **Medicines** tab on the patient profile.
- Click "New prescription."
- Add medicines from the clinic's list. Use medicine sets for common combinations.
- Review safety warnings (allergies, interactions within the list).
- Click "Issue prescription" to finalise and print.

> Note: once issued, a prescription cannot be changed. Use "Revise" for corrections.

### Finalising a visit
1. When the visit is complete, click "Finalise visit."
2. Check soft warnings (empty fields, missing consent).
3. Click "Confirm finalise."

> Finalised visits cannot be edited. Use the "Add addendum" button for corrections.

### Treatment plan
- The **Plan** tab shows the patient's treatment plan by phase.
- Add items from the visit (tooth + procedure + estimate).
- Mark items as "Told to patient" when you discuss them.

### Certificates (medical / fitness)
- From the patient profile, go to **Certificates**.
- Click "New certificate."
- Fill in the content. Click "Finalise."

> **DRAFT — certificate wording must be reviewed by a lawyer before go-live.**

### Approving discounts
- When a receptionist requests a discount, a notification appears on the Billing tab.
- Click "Approve" or "Reject" with a reason.

### Reports
- The **Reports** screen (accessible to doctors only) shows daily, monthly, and custom-range stats.
- Use the range chips (Today, 7 days, This month, etc.) to change the period.
- Click "Download CSV" to export data for the accountant.

---

## Common tasks — both roles

### Search for a patient
- Press **/** on the keyboard to focus the search bar.
- Type the patient's name or last 4 digits of their mobile number.
- Press arrow keys to move through results; Enter to open.

### Patient profile tabs
| Tab | Receptionist | Doctor |
|-----|-------------|--------|
| Overview | ✓ | ✓ |
| Appointments | ✓ | ✓ |
| Visits (timeline) | — | ✓ |
| History | — | ✓ |
| Billing | ✓ | ✓ |
| Files | Scan / Consent only | ✓ All |
| Messages | ✓ | ✓ |

### Settings
- **Receptionist:** can view timings; cannot change them.
- **Doctor:** can edit all settings — clinic details, timings, medicines list, consent templates.

---

## Quick help

| Problem | What to do |
|---------|-----------|
| App does not open | Check your internet. Try refreshing. If a "Server busy" message appears, see paper mode (desk folder). |
| Signed out unexpectedly | Sign in again. Sessions expire after 12 hours or 60 minutes of inactivity. |
| Appointment does not save | Check for a red error message. Try again. If it persists, call the developer. |
| Print is blank or wrong | Make sure the browser allows pop-ups for this site. Try printing again. |
| "Server busy" banner | Quota may be exceeded; resets at 05:30 IST. Use paper mode if urgent. |
| Any other problem | Use the "Report a problem" button (bottom of the screen) or call the developer. |

---

## Paper mode

If the app is completely unavailable, use the printed day list from the desk folder.
See the **Paper kit** on the desk for forms, the receipt book, and instructions.

---

*Screenshots will be added after the dress rehearsal (10.1.11).*
