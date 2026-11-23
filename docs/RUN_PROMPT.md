# RUN_PROMPT — standing rules for every coding session

Start each run with: **Read docs/RUN_PROMPT.md and continue from HANDOFF.md**.

This file is complete on its own. Also follow AGENTS.md stack/data/privacy rules. Fake data only. Never push.

## STANDING RULES

- Commit locally after each task. Never push.
- Fake data only, no real patient data and no real money figures from real patients anywhere.
- Keep files small (about 200 lines is a smell, 300 means split). Tests go in separate test files.
- Run pnpm check before every commit. If it fails, fix it before moving on.
- If a migration is new, list it clearly for me, do not apply it to staging yourself. Number migrations in order, never reuse a number (check the highest existing number in packages/db/migrations; as of now the next free number is 0049).
- Update STATE.md after each task.
- Follow the screen designs (S-numbers) named in each task.
- Do not stop to ask me questions. If something is unclear, take the most reasonable choice that matches the plan, write it in DECISIONS.md, and carry on. Stop only for a real blocker (needs my account, a card, a lawyer, an accountant, or a secret). If a task is blocked, skip it, list it in STATE.md under "Waiting on me", and continue.
- Money safety: all amounts are integer paise, never floats; use the one tested money helper; totals are recomputed on the server; bill and receipt numbers are sequential per financial year with no gaps and no reuse; a finalised bill is never edited, corrections are a credit note or a new version with who, when and reason; cancelled or voided bills and payments stay visible marked as such; nothing is hard-deleted; every create, payment, refund, discount, void and print goes to the audit log; payments are never edited, only reversed.
- Payments: mode and a short reference only. No payment gateway, no card numbers or UPI ids stored beyond a short reference.
- Tax stays a setting with default "no tax"; do not invent tax rules; CA answers live in docs/CA_QUESTIONS.md.
- Permissions: use docs/AUTH_PLAN.md section 4f as the default, all role rules in packages/db/src/permissions.ts. Receptionist can create bills and take payments but cannot give discounts or refunds and cannot see clinical notes or diagnosis. Doctor does discounts, refunds and voids with a mandatory reason. Enforce in the API with tests, not only the UI.
- Clinical data safety: finalised visits, prescriptions and certificates are read-only, corrections are new versions or addenda with who and when; nothing is hard-deleted; views and changes of clinical data are audited.
- Printing: English only, A4 or A5 as the task says, clean black and white for a cheap clinic printer, no browser header or footer text, existing letterhead pattern. A reprint is marked "Duplicate copy" with the reprint date.
- Patient History: keep every module's records in the history feed with the same receptionist filtering and tests.
- Anything that needs lawyer, CA or doctor wording uses clear placeholder text marked "DRAFT - ... to confirm" and a line in STATE.md. Do not block on it.
- Never write keys or secrets into any file. File storage uses the existing StorageAdapter.
- Skipped earlier and still skipped: 3.1.1, 3.5.10, 3.6.3, 3.7.8, 3.9.1, 3.9.2, 4.3.4, 4.4.4, 4.4.5, 4.4.7, 4.4.8, 4.5.2, 5.3.13, 5.3.14.
- Context saving, strictly: run pnpm check as "pnpm check 2>&1 | tail -25". Run only the tests related to the task while working, and the full pnpm check once before each commit. Never print whole files, use grep or sed -n with line ranges. Do not re-read STATE.md or HANDOFF.md after the first read; update them with small edits. Keep commit messages short.
- When context is nearly full, update docs/HANDOFF.md first, then stop.
- When all tasks of the current phase are done, run that phase's gate checklist (tests, role matrix incl. receptionist API tests, concurrency tests where relevant, print checks, responsive at 360/768/1366, keyboard use, fake-data-only scan), write the result in STATE.md as "passed" or "passed with exceptions" with the list, and stop. Do not start the next phase until I say so.
- At the end give me a final table: task, commit hash, tests, and anything waiting on me. Also list every new migration number to apply on staging.
