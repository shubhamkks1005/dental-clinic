# HANDOFF (for the next AI session)

Written: 2026-11-23 (after the UI/UX audit). Read RUN_PROMPT.md, then docs/PHASE_Q.md (only the section of the task below). Fake data only. Never push, never deploy, never apply migrations (give the owner the command).

## Where we are
- Phases 0-7 are done locally (see STATE.md). Phase 8 (portal) is NOT started and stays paused.
- **Phase Q (quality, safety and redesign) is the current phase.** The audit is finished: docs/ui-audit/ (pages, 18 flows with screenshots, runner scripts), docs/product-audit/ (ISSUES, IDEAL_EXPERIENCE, ROADMAP), docs/design/proposal/ (new screen designs).
- No Phase Q task is done yet. Nothing in the app code was changed by the audit.
- Next free migration: **0056** (0054 and 0055 are new and still to be applied by the owner on staging).

## Next task
**NOW: Part 2 (the daily workflow): Q1.1 to Q1.6** (Part 1 is finished except Q0.7, which needs D1; if the owner answers D1, do Q0.7 first). Older text below.
**Part 1 (bugs and money safety): (Q0.1-Q0.6 and Gate Q0.G done; Q0.7 waits for D1)  Q0.4, Q0.5, Q0.6, Q0.7, then Gate Q0.G.** Do them in this order in one session, committing after each. Task text and "Done when" are in docs/PHASE_Q.md section 1. The 5 Parts and what each delivers are in the "The 5 Parts" table there. Q0.7 needs decision D1 (see "Proposed defaults"); if the owner has not answered, write it under "Waiting on me" and finish Part 1 without it.

## Done in Phase Q
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
