---
name: design-plan
description: Step 1 of 2 for a final HTML design in docs/design/final/. Read the whole HTML (markup, style, script), compare it with the app, and write a handoff file that says what exists, what must be fixed in the backend first, what is new (needs the owner's answer), the logic changes, and the test cases. Does not change code. Use before design-apply, when the owner names a file like docs/design/final/xyz.html.
---

# design-plan (read, compare, write the handoff; change no code)

The owner gives one file: `docs/design/final/<name>.html`. That file is FINAL. It beats docs/design/proposal/, the PDF and older task text. Rebuild it in the app's own React and CSS (no Tailwind, no CDN, no new dependency, no copied class names, fake data only, UI text in English only).

Output: ONE file, `docs/design/handoff/<name>.md`, written from `handoff-template.md` (next to this file). The next skill (design-apply) reads only that file, so it must be complete and honest. Then tell the owner the summary in chat (Hinglish, short, a table) and ask the open questions.

## Steps

1. **Read the rules first**: AGENTS.md, docs/RUN_PROMPT.md, docs/MAP.md (for file locations), docs/design/final/README.md, and the "Part S" speed rules (at most ~10 D1 queries per request, IN lists of 90 or fewer, no waterfalls, skeletons, useSubmitOnce, optimistic only for status and order, never for money). Run `git status` and note files that are not yours (never commit them).
2. **Read the HTML completely**: the whole `<style>`, the whole `<script>`, then the markup. Do not skim the script: it is the truth for behaviour. Write down, for every visible thing:
   - every STATE it can be in (rows, cards, pills, buttons, empty/error/loading) and what shows in each;
   - every INTERACTION (trigger, what changes, after how many ms, easing);
   - every ANIMATION: name, trigger, duration, delay, easing, which element (a motion inventory table);
   - every piece of DATA it shows (field by field) and every ACTION it performs.
3. **Compare with the app** (grep, read only what you need): for each data field and action decide one of
   - EXISTS (name the file and endpoint),
   - FIX FIRST (exists but wrong or too slow or missing a field: say exactly what),
   - NEW (does not exist: backend, table/column, route, permission, tunable, UI).
3b. **Shared things (very important).** For every part of the design that is a reusable piece (sidebar, dialog, menu, pill colours, buttons, toast, empty state, search box, tokens), grep the app for the same piece on OTHER pages. Write each in section "Also used on" of the handoff: the other pages, the files, and whether the new design should apply there too. Rule: if the same thing appears elsewhere, it changes there too (one rule in one place), unless that page has its own final design in docs/design/final/README.md that says otherwise. If it conflicts with such a page, ask the owner.
3c. **Index.** Add or update the row of this page in `docs/design/handoff/INDEX.md` (page, handoff file, status, shared pieces touched, date). The owner works through many pages; the index is the map of what is planned, applied and done.
4. **Backend first.** List backend work in order: shared types/pure rules (packages/shared), migration (only if truly needed; next free number is in docs/HANDOFF.md; never apply it), repo (one `db.batch` per write, version-checked, audit row), domain, route, permissions, route-matrix, query count (EXPLAIN, <= ~10 per request), tests. Keep status machines untouched unless the owner says so.
5. **Logic changes** the UI needs (state shape, optimistic order, what the server decides, what happens when the server says no, refresh rules). Use the lessons in `design-apply/lessons.md`.
6. **Test cases** (see template): every state x every interaction x edge cases (first/last/only row, empty list, chair full/empty, break on, repeated 3-5 times in a row, server refuses, slow server 300 ms, 360/768/1366 px, keyboard only).
7. **Questions for the owner**: **Ask in chat, never leave questions only in the file (owner rule, 2026-11-25).** The owner must not have to open the file to find what to answer. Ask every open question in the chat with the AskUserQuestion tool: at most 4 questions per call, each question self-contained (say what it is about in the question itself), 2 to 4 short options, your recommended option first and marked "(Recommended)", plain words, Hinglish allowed in the question text. Ask the most blocking ones first; if more than 4 remain, ask the next batch after the answers. Then write the answers into the file (the questions table keeps the question and the owner's answer) and into docs/DECISIONS.md. The file still keeps its questions table as a record, but the chat is where the owner answers. Ask ONLY for NEW things, for money/clinical/legal rules, and for anything the HTML does not say (phone layout, empty and error states, text wording). Everything else: decide, write the decision in the handoff and docs/DECISIONS.md.
8. Write the handoff file with the questions table (answers filled in as the owner gives them). Do not start applying. After asking the questions in chat (step 7), say "Plan ready." and, when all answers are in, "Run design-apply."

## Rules for the plan
- Be specific: file paths, endpoint names, columns, ms values, selectors. No vague lines like "add animation".
- Mark anything you could not verify as UNVERIFIED.
- Never invent a design. Where the HTML is silent, copy the nearest existing screen and say which.
- The plan must say how each animation will be MEASURED later (see design-apply).
