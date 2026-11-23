# Support process (9.5.4)

How clinic staff report problems, and how the developer responds.

---

## Reporting a problem

**In the app:** Use the "Report a problem" button at the bottom of any screen. It sends the page name and timestamp — no patient data.

**By phone / WhatsApp:** Call or message the developer directly.
- Developer phone: _FILL IN_
- Developer WhatsApp: _FILL IN_

---

## Priority levels

| Level | What it means | Examples | Response target |
|-------|--------------|---------|----------------|
| **P0** | App is completely down or patient data is at risk | App shows no data; login broken; breach suspected | Same day, usually within 1–2 hours during clinic hours. Use paper mode while waiting. |
| **P1** | A core workflow is broken; workaround exists but it is painful | Billing cannot issue a bill; prescriptions cannot print | Within 48 hours |
| **P2** | A minor annoyance; a workaround is easy | Wrong label; layout off on one screen; non-critical report wrong | Within the next weekly deploy window |

For P0: **call the developer** — do not only send a WhatsApp message.

---

## Deploy windows

Deploys happen only **outside clinic hours or on Sundays**.

This means no deploy between 09:00 and 20:00 IST on working days (Monday to Saturday). Emergency P0 hotfixes may deploy any time, with the clinic's permission.

---

## Release notes

Every deploy gets a one-line plain-English release note posted to the clinic (WhatsApp message to the doctor):

> "Update deployed — [brief description]. No action needed."

The note is kept in the GitHub release tag for reference.

---

## Bug list

Bugs are tracked in the GitHub Issues tab of the repository. The developer adds every reported problem as an issue, assigns it a priority, and closes it when fixed.

---

## Hypercare (first month after go-live)

During the first month after going live with real patients:
- Developer checks in every morning (message to clinic): "Morning — anything from yesterday?"
- Clinic hours response target: within 2 hours for any problem.
- P0 bugs are fixed before the next clinic day.
- After 30 days: review open bugs with the doctor; decide what to fix next.

---

## Privacy issues

Any suspected privacy issue (wrong patient data shown, data accessed without permission) is a P0 regardless of scope. Call the developer immediately — do not use email or WhatsApp for the details. See `docs/BREACH_PLAN.md`.

---

## See also

- `docs/runbooks/DOWNTIME.md` — what to do when the app is completely down
- `docs/PAPER_KIT.md` — paper backup kit
- `docs/BREACH_PLAN.md` — privacy / data breach response
