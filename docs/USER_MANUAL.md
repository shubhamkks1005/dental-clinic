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
1. From the Today screen, click **Open visit** on the patient in the chair.
2. The visit page opens (doctor only). If a visit was already started, it reopens.
3. The top strip always shows allergy, BP, dues and follow-up. Four cards sit below it; opening one closes the others, and the page remembers which one you had open:
   - **1 Tooth chart**: the chart and the tooth card.
   - **2 Diagnosis & Procedures**: search, press Enter. Pick the tooth and the surfaces on each line. **Remove** has an **Undo** that stays for 6 seconds. If a visit has no diagnosis or no procedure, press **No diagnosis for this visit** or **No procedure for this visit**.
   - **3 Prescription & Advice**: medicines, sets and advice. The sheet on the right is the live prescription.
   - **4 Files, Vitals & Next Visit**: open X-rays and photos in the viewer, set the next visit.
4. **Chief Complaints** and **Clinical Findings** are in the floating boxes at the bottom left. Drag a corner to resize a box, press the minus to fold one, or the arrow to fold both into a round bubble. Press the bubble to bring them back.
5. The right side has two tabs: **Live A4 Rx** and **History** (dues, next appointment, pending treatment, previous medicines, last visits, files). Drag the bar between the cards and the side to make it wider; double-click it to reset.

> **[Screenshot placeholder: Visit page]**

### Dental chart
- Open card **1 Tooth chart**.
- Click a tooth surface to mark it with the condition shown in **Mark:**. Marks show at once and are saved a moment later, or press **Save**. **Undo** takes back marks that are not saved yet.
- **Chart as of** shows the chart after an older finalised visit (read-only).
- Click a tooth (or a block under **Affected teeth & findings**) to open its **tooth card**: the history of that tooth newest first (with **Show older**), a marking pad for the surfaces and the whole tooth, a short clinical note, files and plan. For a permanent tooth the card also shows what was done on the baby tooth it replaced.
- Use the keyboard: arrows to move between teeth, Enter to select a surface.

### X-ray viewer
- In card 4 press a file to open it full screen. Zoom, rotate, flip, brightness, contrast, grayscale, invert and enhance do not change the saved file.
- **Compare** shows this picture next to the previous one.
- Tools: pen, circle, arrow, text and measure. Point at a mark to move or delete it. **Measure** shows pixels until you set the scale: draw a line of known length, type its length in mm and press **Set scale from last line**.
- Tag the teeth on the picture and write one note, then press **Save Annotations**. If someone saved the picture meanwhile, you are told and nothing is overwritten.

### Prescriptions
- Click the **Medicines** tab on the patient profile.
- Click "New prescription."
- Add medicines from the clinic's list. Use medicine sets for common combinations.
- Review safety warnings (allergies, interactions within the list).
- Click "Issue prescription" to finalise and print.

> Note: once issued, a prescription cannot be changed. Use "Revise" for corrections.

### Finalising a visit
1. When the visit is complete, click "Finalise visit" in the bar at the bottom. Diagnosis and procedures show as done or missing there.
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

### Library (your lists)
- **Library** in the sidebar (doctor only) holds your lists: Medicines, Medicine sets, Procedures and fees, Visit types, Diagnoses, Quick phrases, and under **More** the tooth conditions, allergens, referral sources and the medical history checklist.
- **Add <item>** (top right) opens a form. Only the name is needed. For a medicine, an empty dose, frequency, days or food timing is saved as "As directed"; form and strength stay empty. Suggestions under the name show only while you type, and fill the name only. **Save and add another** keeps the form open.
- The same name can be saved twice when something else differs (for example two strengths). The exact same item twice is refused: "This is already in your list."
- **Needs review** marks a medicine added from a visit with "Add to my list". **Confirm** opens it filled in; **Save** marks it reviewed.
- Click a card to see more (a medicine: salt, brand, timing, days; other lists: who added it and when). **Edit** shows who added and last changed it. Past prescriptions, bills and visits keep their own copy.
- **Hide** takes an item out of the choices; nothing is deleted. **Show again** brings it back (filter **Hidden**). Hiding a medicine that is in medicine sets asks first: **Remove from sets and hide** (recommended) or **Hide only** (those sets stop showing in visits until you edit them).
- **Medicine sets** are made from your active medicines (search, then +). A set that holds a hidden medicine says "Not offered in visits until fixed"; edit it and remove that medicine.
- **Reorder** sets your order: arrows (or drag with a mouse). Sorting A to Z or Z to A is for viewing only; switch back to Custom order to reorder.
- Each medicine shows "You wrote this N times (M in the last 30 days)": your own issued prescriptions, one per visit.

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
