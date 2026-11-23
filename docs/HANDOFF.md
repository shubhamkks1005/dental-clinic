# HANDOFF (for the next AI session)

Written: 2026-11-24 (after Gate A). Read RUN_PROMPT.md, then docs/PHASE_Q.md (only the section of the task below). Fake data only. Never push, never deploy, never apply migrations (give the owner the command).

## Where we are
- Phases 0-7 are done locally (see STATE.md). Phase 8 (portal) is NOT started and stays paused.
- **Phase Q (quality, safety and redesign) is the current phase.** The audit is finished: docs/ui-audit/ (pages, 18 flows with screenshots, runner scripts), docs/product-audit/ (ISSUES, IDEAL_EXPERIENCE, ROADMAP), docs/design/proposal/ (new screen designs).
- Phase Q Parts 1 to 3 are done (see "Done in Phase Q").
- Next free migration: **0057** (0056 bill_cancel_requests is NEW, owner applies it on staging) (0054 and 0055 are new and still to be applied by the owner on staging). Part 3 so far added ONE migration, 0056 (Q1.9).

## Next task
**Parts 1, 2 and 3 are done; Gate A passed (2026-11-24, docs/ui-audit/flows/GATE-A.md).** Next is **Part 4: Q2.1 to Q2.6** (frame and 8-item sidebar, one vocabulary, Billing hub and Bill, Visit on one screen, both Today screens, Patients list and profile), read the Q2 table in docs/PHASE_Q.md. Start it only when the owner says so. Before Part 4: the owner applies migration 0056 on staging (command in STATE.md / STAGING_READINESS.md). D1 to D8 are accepted and written in DECISIONS.md (D1 refund rule still to be confirmed by the CA). Known gaps carried into Part 4 are in STATE.md ("Part 2 repair and Part 3").

## Done in Phase Q
- Q2.1 Foundation, 2026-11-24 (git log "Q2.1"). ui/page/*, StatusLabel, shared status-words + format, 8-item sidebar, one gutter. Test: e2e/frame.spec.ts. Next in Part 4: Q2.2.
- Part 2 repair and skipped tasks, 2026-11-24 (git log): "Part 2 repair" (360 px Today rows, Bill payment layout, calendar panel buttons, Missed test no longer depends on the clock), Q0.7 (refund re-opens the due, `paidByBill`), Q1.1 (visit to bill chain), Q1.5 (messages hygiene), Q1.6 rest (offline guard), Q1.7 (discount hand-off), Q1.8 (data and form rules). Browser specs: e2e/visit-to-bill, messages, data-rules, no-silent-failures, appointment-actions, core-loop (25 pass together).
- Q1.6 No silent failures, 2026-11-24 (git log "Q1.6"). Timings: live sentence + Save disabled with reason; visit autosave stops on a 409 and shows a banner (text kept, Copy my text, Reload visit); reasons under disabled Book, Walk-in and Record payment buttons; offline banner says typed work is kept. Not done: disabling server actions offline. Test: e2e/no-silent-failures.spec.ts.
- Q1.4 Cancel, Missed, Reschedule, 2026-11-24 (git log "Q1.4"). AppointmentActions "..." menu on Today rows, calendar panel and patient tab; Missed needs a reason (schema + repo, no migration); Close-day blockers name patients; drag hint added. Test: e2e/appointment-actions.spec.ts. NOTE: its Missed part is skipped before 00:20 IST (it moves a booking to 00:00 today with node:sqlite so the 15-minute rule allows it).
- Q1.3 Receipts and payments list, 2026-11-24 (git log "Q1.3"). Toast with Print, PaymentsList on the patient Billing tab and on the Bill screen (which now has the payment form). Covered in e2e/core-loop.spec.ts.
- Q1.2 Ready to bill, 2026-11-24 (git log "Q1.2"). repos.bills.readyToBill, "Ready to bill" stat card, Take payment on the row. Covered in e2e/core-loop.spec.ts.
- Q0.G Gate P0: passed with exceptions, 2026-11-23 (details in STATE.md).
- Q0.6 Payment safety, 2026-11-23 (git log "Q0.6"). Server refuses an amount above the due unless allowAdvance:true (message has the fresh balance); Full balance/Half only fill the field; confirm "Change amount / Record as advance"; 0 or negative shows a sentence; form resets to Cash. Existing tests that relied on silent advances got allowAdvance. Design: Bill.dc.html payment card. Not built: take advance when nothing is due (Q3.1, D8) - the form is hidden when nothing is due, as before.
- Q0.5 Core-loop browser test, 2026-11-23 (git log "Q0.5"). Statement asserted: bill 1,500, receipts 500 + 1,000, Outstanding 0. Fails when the Q0.2 fix is reverted. Booking tomorrow is in e2e/booking.spec.ts, not in this file.
- Q0.4 Booking without a note (C4), 2026-11-23 (git log "Q0.4"). Dialog sends undefined; shared test for empty note; e2e/booking.spec.ts fails with the old code. Only QuickBookDialog had the pattern.
- Q0.3 Prescription Issue works (C3), 2026-11-23 (git log "Q0.3"). saveMeta returns the saved rx, Issue uses its version; core-loop e2e issues, reloads, opens print; fails again if fix reverted.
- Q0.2 Fix double JSON encoding (C1), 2026-11-23 (git log "Q0.2"). 14 files lost the extra JSON.stringify (6 named + 8 print screens, same bug); api() throws on a string body; e2e/core-loop.spec.ts doctor half passes with no 4xx/5xx. Runner repair removed.
- Q0.1 Browser tests can run, 2026-11-23 (hash in git log, message starts "Q0.1"). `pnpm test:e2e`: 15 pass on a fresh scratch DB.

## Half done
(nothing)

## Waiting on me (the owner). The AI must not guess these
- Q2.1: should the receptionist see Library? (built doctor-only, see DECISIONS.md).
- Nothing blocks the AI now. D1 (CA) still needs the CA to confirm the refund rule.
- D1 refund rule (doctor and CA), D2 addendum can add a procedure?, D3 gender default, D4 receptionist cancel bill / see Settings, D5 bill created issued?, D6 reminder timing, D7 devices used, D8 advance payment wanted. Table with who and what each blocks: docs/PHASE_Q.md.
- Older items: STATE.md "Waiting on me" (staging steps, doctor confirmations, CA questions).

## How the app is run for testing (short; full text in PHASE_Q.md section 0)
Node 26: `source ~/.nvm/nvm.sh; nvm use system`. Use a SCRATCH database (`--persist-to <folder>`), not the owner's local one (it is half-migrated). Browse only `http://localhost:8787`. Dev login: `/api/staff/auth/dev-login?role=doctor|receptionist`. Cron by hand: `/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*`. Scripts that already drive the browser: docs/ui-audit/runner/ (they repair bug C1 until Q0.2 is done; remove that repair then).
Check: `pnpm check 2>&1 | tail -25`.

## Prompts the owner gives a new AI (one line is enough)
1. Every session: **"Read docs/RUN_PROMPT.md and continue from docs/HANDOFF.md."** The AI then does the whole Part named under Next task.
2. If the AI asks what to do: **"Do the whole Part named under Next task in docs/HANDOFF.md, following docs/PHASE_Q.md, task by task, committing locally after each. Stop only when the Part is done, a task is blocked, or your context is nearly full; then update HANDOFF.md first."**
2b. To answer all decisions at once: **"I accept all proposed defaults in docs/PHASE_Q.md. Write them in docs/DECISIONS.md and continue."**
3. After the owner answered a decision: **"Read docs/HANDOFF.md. I decided D1: <answer>. Write it in docs/DECISIONS.md, unblock the task in docs/PHASE_Q.md and continue."**
4. For a check-only session: **"Read docs/RUN_PROMPT.md. Run the Gate named in docs/HANDOFF.md using docs/ui-audit/runner/ and report; change no app code."**
