# HANDOFF (for the next AI session)

Written: 2026-11-23 (after the UI/UX audit). Read RUN_PROMPT.md, then docs/PHASE_Q.md (only the section of the task below). Fake data only. Never push, never deploy, never apply migrations (give the owner the command).

## Where we are
- Phases 0-7 are done locally (see STATE.md). Phase 8 (portal) is NOT started and stays paused.
- **Phase Q (quality, safety and redesign) is the current phase.** The audit is finished: docs/ui-audit/ (pages, 18 flows with screenshots, runner scripts), docs/product-audit/ (ISSUES, IDEAL_EXPERIENCE, ROADMAP), docs/design/proposal/ (new screen designs).
- No Phase Q task is done yet. Nothing in the app code was changed by the audit.
- Next free migration: **0056** (0054 and 0055 are new and still to be applied by the owner on staging).

## Next task
**Q0.1 Browser tests can run.** Full text and "Done when" in docs/PHASE_Q.md section 1. Then Q0.2, Q0.3, Q0.4, Q0.5, Q0.6 in that order. Q0.7 is BLOCKED until the owner answers D1.

## Done in Phase Q
(nothing yet; add one line per finished task: id, commit hash, date)

## Half done
(nothing)

## Waiting on me (the owner). The AI must not guess these
- **Run once:** `pnpm exec playwright install chromium` (needed for Q0.1 and every browser check).
- D1 refund rule (doctor and CA), D2 addendum can add a procedure?, D3 gender default, D4 receptionist cancel bill / see Settings, D5 bill created issued?, D6 reminder timing, D7 devices used, D8 advance payment wanted. Table with who and what each blocks: docs/PHASE_Q.md.
- Older items: STATE.md "Waiting on me" (staging steps, doctor confirmations, CA questions).

## How the app is run for testing (short; full text in PHASE_Q.md section 0)
Node 26: `source ~/.nvm/nvm.sh; nvm use system`. Use a SCRATCH database (`--persist-to <folder>`), not the owner's local one (it is half-migrated). Browse only `http://localhost:8787`. Dev login: `/api/staff/auth/dev-login?role=doctor|receptionist`. Cron by hand: `/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*`. Scripts that already drive the browser: docs/ui-audit/runner/ (they repair bug C1 until Q0.2 is done; remove that repair then).
Check: `pnpm check 2>&1 | tail -25`.

## Prompts the owner gives a new AI (one line is enough)
1. Every normal session: **"Read docs/RUN_PROMPT.md and continue from docs/HANDOFF.md."**
2. If the AI asks which task: **"Do the task named under Next task in docs/HANDOFF.md, following docs/PHASE_Q.md. Stop when the task passes its Done-when or when your context is nearly full; update HANDOFF.md and commit locally first."**
3. After the owner answered a decision: **"Read docs/HANDOFF.md. I decided D1: <answer>. Write it in docs/DECISIONS.md, unblock the task in docs/PHASE_Q.md and continue."**
4. For a check-only session: **"Read docs/RUN_PROMPT.md. Run the Gate named in docs/HANDOFF.md using docs/ui-audit/runner/ and report; change no app code."**
