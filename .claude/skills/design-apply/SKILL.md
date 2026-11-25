---
name: design-apply
description: Step 2 of 2 for a final HTML design. Reads docs/design/handoff/<name>.md (made by design-plan), does the backend work first, writes the handoff status, then applies the design in React with the HTML's exact motion, then runs a browser probe (seeded data, 300 ms slow server, every test case in the handoff, repeated actions) and fixes what is not smooth until all cases pass. Local commits only. Use after the owner has answered the plan's questions.
---

# design-apply (backend, then design, then measure and fix)

Input: `docs/design/handoff/<name>.md`. If it does not exist or has unanswered questions in section 7, STOP and say so (run design-plan first, or ask). The HTML in docs/design/final/ is final: exact layout, copy, colours and motion. Read `lessons.md` in this folder before coding. It lists mistakes already made on this project.

Hard rules (project): never push, never deploy, never apply migrations; commit locally, one commit per step, message starts with the step; `git add` only your own paths (the owner has uncommitted files); no new dependency; files under 300 lines; UI text English; fake data only; do not change the appointment status machine; follow the Part S speed rules; keep each file's line endings; Windows shell quirks are in lessons.md.

## Phase A: backend first (only if section 5 has work)
1. Do the items of section 5 in order: shared rules and tests, migration (then `pnpm db:lock`), repo with tests, domain, route, permissions, route-matrix and deny-by-default tests, query-count check.
2. Anything NEW that the handoff marks "needs answer" and is still unanswered: ask, do not guess.
3. `pnpm check` green, commit per item, tick the boxes in the handoff, set Status to BACKEND DONE, add to "Log".

## Phase B: design apply
1. Scope the look to the page (CSS variables on one scope class, see lessons). Rebuild markup in React with the app's own class names. One component per file, small.
2. Implement EVERY row of the motion inventory with the HTML's exact duration, delay and easing. Do not speed up, do not slow down, do not add animations the HTML does not have, do not remove ones it has. Keep reduced-motion handling unless the handoff says otherwise.
3. Behaviour like the HTML: the screen changes at once on a click; the server answers after; on refusal the screen goes back and a plain sentence says why (see lessons: optimistic updates).
4. **Shared pieces**: apply section 4b. A reusable piece changed for this page is changed for every other page that uses it (same file, one rule in one place), then check those pages still look right (screenshots at 1366 and 360) and that their e2e specs still pass. If a page has its own final design that disagrees, stop and ask.
5. Phone 360 and tablet 768 per the handoff (44 px targets, no sideways scroll).
6. `pnpm check` green, bundle budget passes (`pnpm --filter @clinic/web build` then `pnpm bundle:budget`; put big screens in their own lazy chunk), commit, tick the checklist, Status DESIGN APPLIED.

## Phase C: measure and fix (do this yourself, do not ask the owner to test)
1. Copy `motion-probe.template.ts` to `e2e/tmp-motion-<name>.spec.ts` (never commit tmp specs; delete when done).
2. Seed fake data through the API in the probe (clear the day first: the e2e database is shared by all specs). Make every state in handoff section 2 exist.
3. Write one scenario per test case of handoff section 10: every state x interaction x edge case. Also run each interaction 3 to 5 times in a row, with the server delayed 300 ms (`page.route`), with a refusing server (409) for rollback, and at 360/768/1366 px.
4. Run it. For each scenario the probe prints: ms from the final click to the first visible change, duration, frame count, biggest one-frame step, width/scale/colour changes, page scroll movement. Compare with handoff section 11 and the HTML values.
5. Take screenshots at key moments (start, middle, end) for anything that looks doubtful and READ them.
6. For every failure: find the cause (see lessons), fix it, rerun the SAME scenario until it passes. Then rerun the whole probe once more (fixes can break neighbours).
7. Add the important cases as a normal spec `e2e/<name>.spec.ts` (functional assertions, plus "starts within N ms" where stable; avoid tight timing asserts that flake). Run it together with the older specs that touch the same screen and say honestly what still fails and why.
8. Delete tmp specs. Update docs: MAP.md, STATE.md, HANDOFF.md ("Next task"), USER_MANUAL.md, DECISIONS.md. Handoff Status: DONE, and update the row in `docs/design/handoff/INDEX.md`.

## Final message to the owner (Hinglish, short, table)
For each animation: HTML time, measured time, pass/fail. Then: what you could not measure (the probe cannot judge easing curves by eye; video is not readable), anything left failing, commit hashes, and what the owner must do (never run these yourself): `git push origin main`, `pnpm deploy:staging`, any migration command.
