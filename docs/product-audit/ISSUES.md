# ISSUES: master register (product audit)

Built only from evidence that already exists in `docs/ui-audit/` (AUDIT, PAGES, FORMS, WORKFLOWS, DESIGN_SYSTEM, `flows/*`, `screenshots/*`). Nothing was re-run for this document. "Source" gives the older id so nothing is counted twice. Ideal replacements are in [IDEAL_EXPERIENCE.md](IDEAL_EXPERIENCE.md); the order of work is in [ROADMAP.md](ROADMAP.md).

**Confidence scale**
- **Verified**: seen in the real browser AND the cause is confirmed (source line or network log), or reproduced in more than one run.
- **Observed**: seen in the real browser once; the cause or the intended rule is not confirmed.
- **Code-based**: read from source only, not seen in a browser.
- **Hypothesis**: reasoning without direct evidence. Needs checking before acting.

**Severity**: Critical = blocks a daily task or can make money, medical or patient-facing data wrong. High = serious confusion, wrong result with a workaround, or breaks a stated rule. Medium = noticeable. Low = polish.

Evidence paths: `flows/<id>` means `docs/ui-audit/flows/<id>/` (screenshots are the numbered .jpg files and the step list is in the `.md` file with the same id); `shots/` means `docs/ui-audit/screenshots/`.

**Important test caveat**: the test clock was about 9-10 PM on a Monday (clinic closed), the database was small and fake, and bug C1 was repaired inside the test harness to reach the doctor's screens. Real conditions may add or remove items.

## Summary counts (counted from the tables below; 107 entries)
| Category | Critical | High | Medium | Low | Other (positive/unknown) |
|---|---|---|---|---|---|
| 1 Backend / domain bugs | 0 | 5 | 7 | 1 | 0 |
| 2 Frontend / UI bugs | 3 | 7 | 8 | 2 | 0 |
| 3 Wrong or confusing business logic | 0 | 6 | 4 | 1 | 0 |
| 4 Poor UX and user workflows | 0 | 6 | 9 | 3 | 0 |
| 5 Professional design problems | 0 | 3 | 5 | 3 | 0 |
| 6 Missing or unnecessary features | 0 | 5 | 4 | 4 | 1 |
| 7 Product-market-fit risks | 0 | 4 | 5 | 0 | 0 |
| 8 Security and reliability | 0 | 3 | 2 | 4 | 2 |

---|---|---|---|---|
| 1 Backend / domain bugs | 0 | 6 | 6 | 1 |
| 2 Frontend / UI bugs | 3 | 7 | 8 | 6 |
| 3 Wrong or confusing business logic | 0 | 6 | 5 | 0 |
| 4 Poor UX and workflows | 0 | 8 | 9 | 2 |
| 5 Professional design problems | 0 | 2 | 6 | 3 |
| 6 Missing / unnecessary features | 0 | 6 | 5 | 0 |
| 7 Product-market-fit risks (all hypotheses) | 0 | 4 | 5 | 0 |
| 8 Security and reliability | 0 | 3 | 4 | 3 |

---

## 1. Backend / domain bugs
| ID | Area | Problem and why it matters | Sev | Conf | Evidence | Recommended solution |
|---|---|---|---|---|---|---|
| PA-B01 | Billing: refunds | After a ₹500 refund the History shows the refund, but Outstanding stays ₹2,000, the bill row still shows "Due ₹2,000", the printed statement lists the ₹500 payment and no refund, and the bill cannot be cancelled ("Refund or move the payments..."). Balance quoted at the desk disagrees with history; refund does not undo the payment's effect on the bill. | High (Critical if the rule turns out to be "refund re-opens the due") | Observed (intended rule not confirmed) | flows/D02 steps 27, 35-36; screenshot `D02/27-after-the-refund.jpg` | Decide the rule with the doctor/CA, then make Outstanding, bill due, statement and cancel logic follow it; add a domain test: pay 500, refund 500, outstanding returns. Source: H12, D2-2 |
| PA-B02 | Billing: payments | The server accepts a payment larger than the amount due with no confirmation (₹20,000 on ₹2,000; ₹9,999 on ₹2,500; ₹1,000 from a stale tab when only ₹500 was due) and turns the surplus into "Advance". Payments cannot be edited, only reversed by the doctor. One extra digit records money never received. | High | Verified (3 runs; form logic in code) | flows/D03 steps 34-39; flows/G10 step 14 | Server rule: reject amount above due unless `allowAdvance: true` is sent after an explicit confirm; return the fresh balance. Source: H17, D3-2, G10-2 |
| PA-B03 | Messages: appointment changes | After an appointment is moved (3:00 PM to 4:15 PM) the old confirm and reminder (3:00 pm) stay queued next to the new ones, and a second "confirm" is created instead of the existing reschedule template. Staff can send the wrong time. | High | Observed | flows/H02 steps 47-49 | On reschedule/cancel, mark queued messages for that appointment "Out of date" (hidden, not sendable) and create one "rescheduled" message. Source: H20, H2-1, H2-2 |
| PA-B04 | Messages: past appointments | The cron creates a confirm message for an appointment that has already happened ("booked for Monday 23/11/2026, 10:00 am" at 9:50 PM) and for every older booking without one (15 messages). | Medium | Verified (two runs, H01 and H01b exploration) | flows/H01 step 17 | Only create confirm/remind for future appointments; backfill never. Source: H1-2 |
| PA-B05 | Messages: contact number | A patient with no own mobile but a guardian contact mobile (child) gets a reminder in the queue that cannot be sent: "This patient has no mobile number for WhatsApp." (HTTP 400). The profile shows the contact number. Children never get reminders. | High | Verified (network 400 + profile text) | flows/G08 steps 23-25 | Resolve the recipient number from the contact mobile; address the guardian ("Dear Sunita, a reminder for Kiddo..."). Source: H21, G8-1 |
| PA-B06 | Messages: no mobile | A patient with "No mobile" ticked still gets confirm and reminder messages queued. | Medium | Observed | flows/H02 step 43 | Do not queue; show "no number: tell in person" instead. Source: H2-3 |
| PA-B07 | Messages: timing | Reminders for Wednesday appointments already appear in the send list on Monday night with the word "tomorrow". Not confirmed whether they are meant to be hidden until the day before. | Medium | Observed (intent unknown) | flows/H01 step 17 | Add a visible "due at" time and hide until due. Source: H1-3 |
| PA-B08 | Billing: discount | A discount that is only requested ("waiting for doctor approval") is already subtracted from the draft total (₹1,500 to ₹1,200). | High | Observed | flows/D06 step 16 | Keep total at the list price until approved; show the request as a separate line. Source: H19 (part), D6-2 |
| PA-B09 | Today statistics | "29 open slots" is shown while the walk-in dialog says "No free slot left today"; the count includes slots that already passed. | Medium | Verified (two runs) | flows/G01 step 25 | Count only slots from now until closing. Source: P8 |
| PA-B10 | Patient summary | "Next appointment" is wrong or disagrees: it shows today's walk-in (already in chair) instead of tomorrow's booking; Overview says "No upcoming appointment" while History strip shows 2026-11-27 for the same patient. | Medium | Observed | flows/G01 step 61; PAGES (probe on Neha) | One shared "next appointment" function (first future, not started). Source: P9 |
| PA-B11 | Validation | A date of birth in the future is reported as "Patients under 18 need a guardian on the record." | Medium | Observed | flows/A02 steps 39-44 | Reject with "The date of birth is in the future." Source: A2-4 |
| PA-B12 | Billing: day close | After the day is closed a payment is refused with "Use a late entry or ask the doctor to reopen it", but no late entry exists in the UI. | Medium | Observed | flows/D05 step 42 | Provide the late-entry path or change the sentence. Source: D5-3 (also PA-X in category 6) |
| PA-B13 | Reports | "Collected" can show a negative number (-₹50) when refunds exceed payments for a day. | Low | Observed (seed data) | shots/reports/reports-laptop.png; flows/F01 step 27 | Show Payments and Refunds on separate lines. Source: M10, F1-6 |

## 2. Frontend / UI bugs
| ID | Area | Problem and why it matters | Sev | Conf | Evidence | Recommended solution |
|---|---|---|---|---|---|---|
| PA-F01 | API client | Six feature API files (visits, prescriptions, chart, plan, history, certificates) JSON-encode the request body, then the shared client encodes it again. The server answers 400 "Invalid input: expected object, received string". A real doctor cannot open a visit, autosave notes, add a procedure, diagnosis or medicine, finalise, or create a certificate. Unit tests with mocks do not catch it. | Critical | Verified (network log + source) | flows/G01 (9 calls), G02 (4), F02, D06; `apps/web/src/api/client.ts` | Pass plain objects; make `api()` throw if given a string; add a browser test "open visit". Source: C1 |
| PA-F02 | Prescription | "Issue" saves advice first (record version rises) then issues with the old version still in memory: always 409 "Someone else changed this record". Reloading does not help. Finalise still succeeds with the prescription unissued. | Critical | Verified (network log: PATCH 200 then POST issue 409; source) | flows/G01 step 40; iso runs; `VisitMedicinesPanel.tsx` onIssue | Use the version returned by the save, or skip the save if nothing changed; test it in a browser. Source: C3 |
| PA-F03 | Booking | Book dialog sends `complaint: null` when the optional note is empty; the schema accepts only a string: red "Invalid input: expected string, received null". | Critical | Verified (browser + two source lines) | flows/H01 step 12; `QuickBookDialog.tsx:100`, `appointment-book.ts:20` | Send undefined or accept null; add a test. Source: C4 |
| PA-F04 | App frame | Top-bar "Walk-in" button has no click handler. Appears on every tablet and laptop screen for both roles. | High | Verified (source + click does nothing) | `TopBar.tsx`; flows/G01 step 22 | Wire to the dialog or remove; keep one Walk-in. Source: H1 |
| PA-F05 | Phone layout | Receptionist Today at 360 px is 441 px wide: stat cards and Next patient card are cut off and the row buttons "In chair"/"Cancel" are off-screen or under the "+". | High | Verified (measurement + screenshot) | flows/F02 steps 1-2 | Single column, row actions below the name, bottom padding. Source: F2-1 |
| PA-F06 | Chart layout | Chart tab is 774 px wide at 360 px and 838 px at 768 px; teeth are ~32x9 px; 193 tap targets under 44 px. Left half of the mouth unreachable by touch. | High | Verified (2 widths) | flows/F02 step 44; F03 | Fit to width in two rows with 44 px tap areas. Source: H16, F2-2, F3-1 |
| PA-F07 | Visit autosave | A tab holding an old version of the visit shows a small red "Not saved — retrying" that never resolves; the typed exam note is lost on reload; no explanation. | High | Verified (reproduced with screenshot) | flows/G10 steps 5-6; `G10/tabB-after-typing.jpg` | On version conflict show a banner with the cause and keep the text for merge; stop infinite retry. Source: H22, G10-1, G10-3 |
| PA-F08 | Settings | Timings: closing time before opening time, Save does nothing: no request, no message, form reverts on reload. | High | Verified (network log: no request) | flows/E01 steps 8-11 | Inline sentence next to the row; disable Save with reason. Source: H23, E1-1 |
| PA-F09 | Payment form | Hidden whenever nothing is due; "Full balance" and "Half" record the payment at once (no confirm, mode cash); no toast, no receipt after any payment; mode field keeps the last choice (UPI). | High | Verified (D03, G01, G02) | flows/G01 steps 53-59; D03 step 6; G02 step 30 | Chips fill the amount only; form always present; reset after payment; toast with receipt link. Source: H13, G2-2, D3-1 (form part) |
| PA-F10 | Visit side card | "Last visits" card shows "Draft / No complaint noted" after the complaint is typed or the visit is finalised. | Medium | Verified (G01, G02) | flows/G02 steps 5, 8; `visit/create-bill-error-laptop.png` | Refresh the card on save/finalise. Source: M7 part, G2-3 |
| PA-F11 | Visit layout | "Draft"/"Finalised" badge is clipped at the right edge; right column has no gutter. | Medium | Verified | shots/visit/draft-laptop.png | Page container (see PA-D01). Source: M7 part |
| PA-F12 | Dialogs | Walk-in dialog: checkbox sits above its label, centred. Book dialog: no sentence when no time is free (heading with nothing under it); dialog taller than a 768 px screen (25 chips + 5 long "next free" buttons); error line appears below the fold. | Medium | Verified | shots/today/walkin-dialog-laptop.png; flows/H01 steps 11-12 | Fix row alignment, add empty state, 8 chips + "More", fixed footer. Source: M8, H1-7 |
| PA-F13 | Procedure form | "Scaling" is pre-selected in the procedure list, so pressing Add after clicking a tooth silently adds a ₹1,500 billable item. | Medium | Observed | flows/G01 step 33 | Start empty; disable Add until chosen. Source: P6 |
| PA-F14 | Tap targets | Under 44 px: patient names (21 px), calendar times (21 px), dues links (17 px), back links (17 px), checkboxes (13 px). | Medium | Verified (measured at 3 widths) | flows/F02, F03 measure notes | Whole row/card is the link; min height 44 px. Source: M9, F2-4, F2-5 |
| PA-F15 | Phone chrome | Round "+" covers rows, badges and form fields, and appears on screens where it is irrelevant (visit, billing, appointments). | Medium | Verified | shots/today/doctor-phone.png; shots/visit/draft-phone.png | Only on Today and Patients, with bottom padding. Source: H7, F2-6 |
| PA-F16 | Tablet nav | At 768 px the top tab row is cut after "Messages"; user name and search placeholder truncated. | Medium | Verified | shots/today/receptionist-tablet.png | Use the laptop sidebar from 768 or a "More" tab. Source: H9, F3-3 |
| PA-F17 | Phone calendar | Patient names cut to "M." / "T..". | High | Verified | shots/appointments/calendar-phone.png | List view on phone. Source: H8 |
| PA-F18 | Visit phone | Tab row runs off the edge (History, Files cut). | Medium | Verified | shots/visit/draft-phone.png | Scrollable tabs with a fade or fewer tabs. Source: M14 |
| PA-F19 | Patients list | Keyboard hint shown on phone; labels repeated on each card; second search box on laptop. | Low | Verified | shots/patients/list-phone.png, list-laptop.png | Hide hint on touch; remove repeats; one search. Source: M13, M4 |
| PA-F20 | Misc polish | "1 appointments", "1 payments"; "Free times on undefined/undefined/" when the date is cleared (seen once during exploration, no screenshot kept); search icon and "/" chip off-centre; style-guide scrolls sideways. | Low | Observed (undefined text: exploration only, see verification gaps) | flows/D05 steps 16, 24; PAGES | One plural helper; guard empty date. Source: D5-4, L3, L5 |

## 3. Wrong or confusing business logic
| ID | Area | Problem and why it matters | Sev | Conf | Evidence | Recommended solution |
|---|---|---|---|---|---|---|
| PA-L01 | Visit to bill | Procedures can only be added on the Chart tab (not on the first tab); Finalise warns only about diagnosis; after finalising, Create bill says "Add procedures on the visit before creating a bill" while the visit is locked. Not verified: whether an addendum can add procedures. Doctor finalises, receptionist cannot bill. | High (Critical for revenue if no addendum path exists) | Verified (message + source tab location) | `shots/visit/create-bill-error-laptop.png`; flows/G01 | Procedures on the main screen; Finalise checklist (diagnosis, procedures, prescription); Create bill disabled with reason. Source: C2 |
| PA-L02 | Finalise | Finalise is allowed with an unissued prescription and no procedures, with no warning for either. | High | Verified | flows/G01 steps 42-43 | Warnings list in the dialog. Source: P1 |
| PA-L03 | Appointment status | Today says "Waiting 623 min" while the calendar says "Arrived" for the same appointment; "Arrived 3 / checked in" counts an in-chair walk-in; raw words (`in_chair`, `scheduled`, `draft`) and green for "draft"/"scheduled". | High | Verified | flows/G01 step 25; shots/patients/profile-laptop.png | One status map and one set of words. Source: H10 |
| PA-L04 | Cancel vs no-show | Cancel on Today is immediate, has no reason, and is not a no-show; there is no No-show action; the Call list stays empty; Close-day text asks for "no-show" which cannot be set. | High | Verified | flows/D05 steps 16, 22-24 | Reason prompt (cancelled / no-show / other) and a No-show action. Source: H18, D5-1, D5-2 |
| PA-L05 | Discount | Doctor is not told a discount is waiting (nothing on Today); receptionist's "Issue bill" stays visible but cannot be pressed, with no reason. | High | Observed | flows/D06 steps 17, 21 | "Discount waiting" item on doctor's Today; reason text under the disabled button. Source: D6-1, D6-3 |
| PA-L06 | Bill correction | Receptionist has no way to cancel a wrong bill or ask the doctor; the doctor must refund first; the cancel rule is learnt only after pressing Confirm. The tester script (TESTING.md task 10) expects the receptionist to fix a wrong bill. | High | Verified (buttons absent) | flows/D02 steps 7, 18-19 | "Ask the doctor to cancel" with reason; refund-first button in the cancel panel. Source: D2-1, D2-3 |
| PA-L07 | Payment allocation | A ₹3,000 payment on two bills was applied to the older bill first; nothing on screen says so, no payment list, no reference or receipt. | Medium | Observed | flows/G02 steps 29-30 | Payments list with "applied to ..." lines. Source: G2-1 |
| PA-L08 | Draft bill | A bill is created as a draft and needs a separate "Issue bill" click, with no explanation of why drafts exist; internal sentences shown to staff ("gst_mode off — DRAFT accountant", "Billing decision only (DCI)"). | Medium | Verified | flows/G01 steps 44-45; D06 step 13 | Create as issued from a finalised visit, or explain; move legal notes to Settings. Source: P5, D6-4 |
| PA-L09 | Duplicates | The "Possible match" box does not stop saving: Save creates the duplicate at once. | Medium | Observed | flows/A02 steps 27-29 | "Same person? Open existing / Save as new". Source: A2-2 |
| PA-L10 | Gender default | New patient gender pre-selected "Female". | Medium | Verified (screenshot) | shots/patients/new-empty-laptop.png | Require a choice (confirm with doctor). Source: M3 |
| PA-L11 | Messages queue | Hand-off of "opened in WhatsApp" merges with "sent". | Low | Observed | flows/H01 step 20 | Keep a separate "opened, confirm sent" state. Source: H1-5 |

## 4. Poor UX and user workflows
| ID | Area | Problem and why it matters | Sev | Conf | Evidence | Recommended solution |
|---|---|---|---|---|---|---|
| PA-U01 | Hand-off | After the doctor finalises, the receptionist's Today still shows "In chair / Completed" with only a small "Due ₹1,500" tag; no "Ready to bill" action. Busiest hand-off depends on memory. | High | Verified | flows/G01 step 47 | Row action "Take payment" when a visit is finalised. Source: H14, P2 |
| PA-U02 | Billing nav | "Billing" opens only "Outstanding dues"; no bills list, no payments list, no way to start a bill, no collection total; CA export and Day close hang under the list. | High | Verified | shots/billing/dues-laptop.png | Billing hub with tabs. Source: H3 |
| PA-U03 | Visit screen | Six tabs; nine fields at equal weight on tab 1; chart and procedures on tab 2; medicines on tab 4; no alerts card; Finalise at the top, far from the end; deviates from S05. 30 clicks, 14 fields and 8 screens for one new-patient-to-payment chain. | High | Verified | shots/visit/*; flows/G01 metrics | One-screen visit (see IDEAL §6). Source: H6, P11 |
| PA-U04 | Future bookings | No Cancel, No-show or Reschedule button for a booking that is not today; panel has only "Open profile"/"Close"; reschedule only by dragging within the same day, undiscoverable and not usable by touch. | High | Verified | flows/B02 steps 2-6 | Reschedule and Cancel in the detail panel and on profile rows. Source: H11, B2-1, B2-2 |
| PA-U05 | Receipt | No receipt link or number after payment; receipts appear only on the printed statement; the Billing tab lists bills but no payments. | High | Verified | flows/G01 steps 53-54, 60 | Toast with "Print receipt"; payments under the bills. Source: P3, D3-5 |
| PA-U06 | Guardian | For under-18 the required guardian fields hide inside "More details"; the error appears at the bottom of the form. | High | Verified (two flows) | flows/A02 step 6; G08 step 10 | Open the group automatically at age < 18. Source: A2-1, G8-3 |
| PA-U07 | Patient list | Three columns only; receptionist cannot see who owes money, last visit or next appointment without opening each patient. | Medium | Verified | shots/patients/list-laptop.png | Add Last visit, Next appointment, Due. Source: M6 |
| PA-U08 | Profile | Opens on History while Overview is the first tab; mobile shown twice; no Book/Take payment actions for the receptionist; "Saved" screen has two equal primary buttons and no link to open the new profile. | Medium | Verified | shots/patients/profile-laptop.png; flows/G01 step 9 | Overview first; role-based action row. Source: M5, P10 |
| PA-U09 | Messages page | One narrow column of cards with "remind · needs_human", "Dear Bina" only, three buttons each; no grouping; subtitle "DRAFT - doctor to confirm" as page text. | Medium | Verified | flows/H01 step 17; shots/messages/messages-laptop.png | Group by patient/day; full name, number, appointment time; plain words. Source: M12, H1-4, H2-4 |
| PA-U10 | Today (doctor) | Unfinished-visit card above "Now"; "In chair" pill full width; "Completed" next to "Open visit" ambiguous; heading touches card. | Medium | Verified | shots/today/doctor-laptop.png | Now, Next, Unfinished, in that order; "Mark done". Source: M11 |
| PA-U11 | Dues | "Add call note" opens a bare field and the note is not shown afterwards; reminder opens WhatsApp for the clicked row but is not logged in Messages. | Medium | Observed | flows/D05 steps 3-7 | Show "Called today: ..." under the name; log the reminder. Source: D5-5, D5-6 |
| PA-U12 | Medicine form | 11 fields at equal weight when only the name is needed. | Medium | Verified | flows/E01 step 30 | Name and strength first; More details. Source: E1-2 |
| PA-U13 | Settings lists | Every row carries Edit, up, down, Hide; Add form at the bottom of long lists. | Low | Verified | flows/E01 step 22 | Add at the top; reorder mode. Source: E1-3 |
| PA-U14 | Offline | While offline a menu click does nothing visible and the target page is empty; only the banner explains. | Medium | Verified | flows/F04 steps 19-23 | Keep the screen, say work is kept; disable server actions. Source: F4-1 |
| PA-U15 | Reports | One day of data shows giant single-bar charts; empty "Collected" chart; no "Sample data" label; "Things to watch" repeats other screens. | Medium | Observed (data-dependent) | shots/reports/reports-laptop.png | "Not enough data yet" state; four numbers first. Source: M10 |
| PA-U16 | Profile history | History tab inside a visit opens the full filter UI (From, To, Tooth "36", Search, Apply) for a quick look at last time. | Low | Verified | flows/G02 step 8 | Last three visits as short cards. Source: G2-5 |
| PA-U17 | Chart helper | Chart text says "click a tooth surface first" even for procedures that need no tooth. | Low | Verified | shots/visit/chart-tab-laptop.png | Conditional helper. Source: L2 |
| PA-U18 | Next-patient order | After the doctor finalises, "Next patient" button is ambiguous (next in queue? next booking?). | Medium | Observed | shots/visit/finalised-laptop.png | Rename "Open next waiting patient" and show the name. Source: PAGES (Visit) |

## 5. Professional design problems
| ID | Area | Problem and why it matters | Sev | Conf | Evidence | Recommended solution |
|---|---|---|---|---|---|---|
| PA-D01 | Page frame | Margins differ per screen: title at x=0 on Patients, Billing, Messages, Reports at 360 px; flush against the sidebar on five screens at 1366 px; Today 72 px, Settings and Appointments 16-24 px. | High | Verified (measured) | flows/F02; shots/patients, billing, messages | One PageContainer and PageHeader. Source: H5 |
| PA-D02 | Unstyled screens | Billing, Bill, draft bill, Messages, Reports tables, profile Billing tab, History filters, Medicines tab, Chart dropdowns show bullets, glued text ("Vikram Testcase · P-0000220-30 days"), native square inputs. The product looks unfinished next to the polished screens. | High | Verified | shots/billing/*, messages/*, patients/profile-billing-laptop.png | Rebuild with shared components. Source: H2, M2 |
| PA-D03 | Form controls | 40 feature files use raw inputs/selects; 8 use the shared form module. | Medium | Verified (grep count + screenshots) | `apps/web/src/features/*`; AUDIT M2 | Lint rule; migrate screens. Source: M2 |
| PA-D04 | Internal text on paper | The printed patient bill carries "This is not a GST invoice (gst_mode off — DRAFT accountant)" and "Doctor registration number missing in Settings." | High | Verified | shots/print/bill-print.png | Remove from prints; show as staff-only warning in Settings. Source: H4 |
| PA-D05 | Dates and times | Three date styles on screen (2026-11-23, 16/11/2026, 23 November, 27/11/2026 · 11:00 AM), money shown with or without paise (₹2,500 vs ₹649.50). | Medium | Verified | flows/B02 step 8; D03 step 26 | One date helper and one money formatter. Source: M1, B2-3, D3-4 |
| PA-D06 | Typography | Multi-line inputs in a monospace font; page titles navy on some screens, near-black on others; bare underlined links used as buttons and rows. | Medium | Verified | shots/visit/draft-laptop.png | Inter everywhere; one heading colour; links vs buttons rules. Source: DESIGN_SYSTEM §3 |
| PA-D07 | Status colours | "draft" and "scheduled" shown green like success. | Medium | Verified | shots/patients/profile-laptop.png | Neutral for draft/scheduled. Source: H10 |
| PA-D08 | Destructive placement | "Cancel bill" beside "Print bill"; "Confirm cancel" same weight as "Back"; Cancel next to "In chair". | Medium | Verified | shots/billing/bill-laptop.png; flows/D02 step 19 | Quiet menu actions; destructive style on the final button. Source: H4 part, D2-5 |
| PA-D08b | Prescription/medicine rows | Settings > Medicines rows show raw tokens ("after_food", "DRAFT - doctor to confirm") inline. | Low | Verified | flows/F01 step 24 screenshot | Friendly words; DRAFT as a badge. Source: F1 |
| PA-D09 | Chart | Tooth labels ~7 px, unexplained "W" button, "R/L" tiny. | Low | Verified | shots/visit/chart-tab-laptop.png | Larger labels; legend; remove "W" or explain. Source: L1 |
| PA-D10 | Settings wording | "Kind of clinic (under the tagline)", "Extra line under speciality", "Reset Google link", "Number series": layout or internal words. | Low | Verified | shots/settings/clinic-details-laptop.png; flows/E02 | Plain labels. Source: L4, E2-2 |

## 6. Missing or unnecessary features
**Missing (evidence of need in the flows)**
| ID | Area | What is missing and why it matters | Sev | Conf | Evidence | Recommended solution |
|---|---|---|---|---|---|---|
| PA-M01 | Money | Take an advance on purpose (form hidden when nothing is due; TESTING.md task 3 cannot be done). | High | Verified | flows/D03 steps 6-11 | "Take advance" with receipt. Source: D3-1 |
| PA-M02 | Appointments | Cancel, No-show and Reschedule for future bookings (see PA-U04). | High | Verified | flows/B02 | See PA-U04. |
| PA-M03 | Money | A payments list and a way to print a receipt right after taking money. | High | Verified | flows/G01 | See PA-U05. |
| PA-M04 | Billing | A way to start a bill that is not tied to a doctor's visit (e.g. over-the-counter, balance, correction). "No bills yet. Create one from a visit." | Medium | Observed | flows/D03 step 11 | Decide with the doctor; at minimum a "Add charge" on the account. Source: H3 |
| PA-M05 | Doctor inbox | No place where the doctor sees "things waiting for me": discount requests, unfinished visits, unissued prescriptions, patient requests. | High | Verified (absence on Today) | flows/D06 step 21 | "Waiting for you" card on doctor Today. Source: D6-1 |
| PA-M06 | Appointments | Week view (mockup S08), late-entry on a closed day, undo after cancel. | Medium | Observed | AUDIT A; flows/D05 | Add after P1. |
| PA-M07 | Messages | Reschedule/cancel messages that are actually used; message to the guardian; clear "not sent yet" lists. | High | Verified | flows/H02, G08 | See PA-B03, PA-B05. |
| PA-M08 | Records | Not assessed: treatment plan / braces journey, files, certificates, consent history, patient portal (placeholder only). | Unknown | Not evidenced | flows/README "Not run" | See verification gaps. |

**Unnecessary or over-built (hypotheses to confirm with the owner)**
| ID | Area | Observation | Sev | Conf | Evidence | Recommendation |
|---|---|---|---|---|---|---|
| PA-N01 | Reports | Five charts and a heat map for a clinic with 100-200 new patients a month; with little data they mislead. | Medium | Hypothesis | shots/reports/reports-laptop.png | Four numbers and a list; charts later. |
| PA-N02 | Settings | 20 settings sections including Number series and Backup; most are set once. | Low | Hypothesis | shots/settings/clinic-details-laptop.png | Group into 5 headings; hide system ones from daily view. |
| PA-N03 | Walk-in | Three Walk-in entry points (top bar x2 and Today). | Medium | Verified | PA-F04 | Keep one. |
| PA-N04 | Messages | Template placeholders named `naam`, `din`, `tareekh`, `samay`, `fone` (Hinglish) in an English-only product. | Low | Code-based | `packages/shared/src/messaging.ts` | Rename to English. |
| PA-N05 | Promo | "Promo messages (off by default)" checkbox sits with legal consent in New patient. | Low | Verified | shots/patients/new-empty-laptop.png | Move to More details. |
| PA-N06 | Style guide | Developer page in the staff app. | Low | Verified | flows/F01 step 29 | Local development only. |

## 7. Product-market-fit risks (all hypotheses; no customer evidence exists)
These cannot be proven from the audit. Each needs customer discovery, not code.
| ID | Risk | Sev | Conf | Why it is a risk | How to test |
|---|---|---|---|---|---|
| PA-P01 | The first-day loop does not work for a real user (cannot open a visit, issue a prescription, book without a note). A trial clinic would stop on day one. | High | Verified bugs, hypothetical effect | See PA-F01 to F03 | Fix, then watch a receptionist do the 10-task script in TESTING.md. |
| PA-P02 | Trust in money: wrong balances after refunds, silent advances, no receipts. Clinics adopt software mainly to control collections. | High | Hypothesis | PA-B01, B02, U05 | Show the doctor and a CA the cash close and statement on one day's fake data. |
| PA-P03 | Reminders and recalls are manual WhatsApp (test mode, no SMS provider). A clinic can already do this by hand; the value is small until messages are right, grouped and automatic where allowed. | High | Hypothesis | Owner decision: no paid API for now | Time the receptionist sending 20 reminders; compare to her current method. |
| PA-P04 | Complexity for a non-technical doctor: six tabs, many fields, drafts, issue and finalise steps. The doctor may skip steps (finalise without prescription) or avoid the screen. | High | Hypothesis | PA-U03, L02 | Observe the doctor with 5 real-style visits; count taps and hesitations. |
| PA-P05 | Single-clinic design: heavy Settings, English-only UI with Hindi consent, Gmail-only staff login, GST off, free-plan limits. A second clinic may need onboarding help, Hindi UI, tax invoices or non-Gmail login. | Medium | Hypothesis | AGENTS rules; E02; D02 | Interview 3 other clinics about language, tax, login. |
| PA-P06 | Children are many in an orthodontic clinic but reminders cannot reach guardians. | Medium | Verified bug, hypothetical scale | PA-B05 | Count child patients in the real register. |
| PA-P07 | No patient-facing side yet (portal placeholder, no online booking). Patients cannot see appointments or bills. | Medium | Hypothesis | `/my` placeholder | Ask 10 patients what they would use. |
| PA-P08 | Phone use: owner may use the app from a phone; two core screens break at 360 px. | Medium | Verified bugs, usage unknown | PA-F05, F06 | Ask which devices the doctor and receptionist use. |
| PA-P09 | Backup, alarms and go-live checklists are still open in STATE.md; a clinic cannot hold real data until they close. | Medium | Code/doc-based | docs/STATE.md | Complete the checklist before any real patient. |

## 8. Security and reliability
| ID | Area | Observation | Sev | Conf | Evidence | Recommended solution |
|---|---|---|---|---|---|---|
| PA-S01 | Test strategy | The bugs C1, C3, C4 pass unit tests and `pnpm check`, because no browser test exercises the core loop; the Playwright suite cannot start (Chromium build mismatch) and uses `127.0.0.1` while the CSRF guard allows only `localhost:8787`, so write steps get 403. Regressions in the main workflow are invisible. | High | Verified | flows (bugs found by browser only); AUDIT T1, T2 | Fix the config, install the browser, add a core-loop browser test to `pnpm check` or CI. |
| PA-S02 | Data integrity | Money can be recorded wrongly with one keystroke (overpay), stale tabs can record against old balances, refunds do not move balances. Payments cannot be edited. | High | Verified | PA-B01, PA-B02 | See P0 money tasks. |
| PA-S03 | Reliability | Silent failures: timings Save, autosave retry forever, disabled buttons without reason, offline navigation. The user believes data is saved when it is not. | High | Verified | PA-F07, F08, U14 | Every failed save says why and keeps the text. |
| PA-S04 | Access control (UI) | A receptionist can open the blank "New medical certificate" form and Settings > Medicines/Billing by address; the server refused every clinical read tested. Submitting the certificate form as receptionist was not tested. | Medium | Verified (pages open), server write not tested | flows/F01 steps 13-14, 23-25 | Show the permission page for doctor-only forms; test the write; document the receptionist's Settings view in AUTH_PLAN. |
| PA-S05 | Access control (server) | Server enforcement held in every test: visit, prescriptions, chart events, error log all 403 for the receptionist; history feed shows no visit or prescription entries. | (positive) | Verified | flows/F01 steps 33-39 | Keep; add a role-matrix browser test. |
| PA-S06 | Privacy of messages | WhatsApp links carry the patient's full mobile and a text with first name, clinic, date and time to WhatsApp (api.whatsapp.com). This matches the owner's rule, but the privacy notice should say it. | Low | Verified (URL observed) | flows/H01 step 19 | Mention in the privacy notice (DRAFT wording needs doctor/lawyer). |
| PA-S07 | Dev surfaces | Style guide and error-log routes exist in the staff app; dev-login is guarded by tests per AUTH_PLAN (not re-verified here). | Low | Verified (style guide), doc-based (dev-login) | flows/F01 step 29 | Local only; keep the bundle guard test. |
| PA-S08 | Migration safety | Re-applying migrations to a half-migrated local database fails on a UNIQUE constraint (0016); the repo's own e2e config ignores the failure. | Low | Observed | AUDIT T3 | Make seed migrations idempotent or document reset. |
| PA-S09 | Concurrency | Two tabs can both record payments on one balance and the server accepted both (see PA-B02). Optimistic version checks exist for records but not for balances. | Medium | Verified | flows/G10 step 14 | Server compares the payer's view of the balance. |
| PA-S10 | Positive | Double click on Record payment and Save patient produced one record each; offline banner and "Leave without saving?" exist. | (positive) | Verified | flows/F04 | Keep and extend to Book, Issue bill, Finalise (not tested). |
| PA-S11 | Message cron | Messages are created by a 5-minute cron; a failure would silently leave Messages empty. Alarm coverage was not checked here. | Low | Hypothesis | flows/H01 step 15 | Verify cron health alarms (1.6.4). |

---

## Verification gaps (the only items that need extra checking)
1. **Refund rule**: owner/doctor/CA must state what Outstanding should be after a refund (PA-B01). Then one browser run.
2. **Addendum and procedures**: can an addendum add a procedure to a finalised visit? (PA-L01 severity depends on it).
3. **"Free times on undefined/undefined/"** seen once when the booking date was cleared during exploration; no screenshot saved. One re-check (PA-F20).
4. **Certificate form submit as receptionist** (PA-S04).
5. **Prescription print** with a real issued prescription: impossible until PA-F02 is fixed.
6. **Not audited**: treatment plan / braces journey, files, certificate register, consent history, doctor's full day, emergency walk-in start to payment, no-show recall, 5,000-patient list, A4/A5 print variations, keyboard-only use, real touch, session expiry. These belong to the next audit after P0 fixes.
7. **Quiet hours** (21:00-08:00) and message sending cannot be seen while sending is manual.
