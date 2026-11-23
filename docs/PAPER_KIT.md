# Paper kit (9.2.3)

The paper kit lets the clinic run a full day if the software is unavailable.

---

## Evening checklist (every working day, ~5 minutes)

The receptionist prints tomorrow's list at the end of each day.

| # | Action | How |
|---|--------|-----|
| 1 | Print tomorrow's appointment list | Open `/app/print/day?date=tomorrow` → Print (browser Ctrl+P / Cmd+P) |
| 2 | File the printed list in the day folder | Physical folder on the desk |
| 3 | Confirm paper forms are stocked | At least 10 blank registration forms + 10 consent forms |
| 4 | Confirm blank prescription pad is on the desk | Doctor's pad — printed or hand-written |
| 5 | Confirm receipt book is accessible | Manual series (different from software series) |
| 6 | Confirm phone is charged and shows the clinic number | For calling patients |

The day list shows: patient name, appointment time, mobile number, and alert labels (allergies, medical flags).

---

## What the day list contains

- Appointment time (IST)
- Patient name and patient code (P-XXXXXX)
- Mobile number (masked: 98765 43210)
- Visit type (Consultation, RCT, etc.)
- Alert labels only (e.g. "Penicillin allergy" — no clinical detail)

---

## Blank forms to keep on hand

| Form | Quantity on desk | Replenish when |
|------|-----------------|----------------|
| Blank registration form | 10 | Below 5 |
| Medical history checklist | 10 | Below 5 |
| Consent form (with SMS consent line) | 10 | Below 5 |
| Blank prescription pad | 1 pad | On last sheet |
| Manual receipt book | 1 book | On last 20 pages |

Print blank forms any time: `/app/print/blank?kind=registration` (prints 20 copies).

---

## During paper mode (app is down)

1. Use the printed appointment list to run the day.
2. Write new patients on blank registration forms.
3. Doctor writes prescriptions by hand on the pad (manual number, e.g. M-001).
4. Issue receipts from the manual receipt book (note: different number series from software).
5. Note every new patient or action on a notepad: **patient name, mobile, time, what was done**.

---

## Late entry rule

When the app comes back, enter all paper records within **24 hours**.

Every late entry must be labelled:
> "Late entry — service date: DD/MM/YYYY, entered: DD/MM/YYYY"

The day-close screen shows a "Late entry" label on any entry added after the day was closed.

Paper receipt book entries must be reconciled against the software series — the numbers do not match (manual series vs software series). Keep both records separately and note the difference in the day-close note.

---

## See also

- `docs/runbooks/DOWNTIME.md` — decision tree for when to use paper mode
- `/app/print/day?date=tomorrow` — print tomorrow's list (staff app → Today → Print tomorrow's list)
