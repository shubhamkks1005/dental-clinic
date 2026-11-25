---
name: design-review
description: Review a finished design (an HTML file in docs/design/, or images/PDF the owner attaches) for LOGIC problems, not looks. Finds what is missing for this page's purpose (for example no search, no way to issue the prescription), what should not be on it (wrong role, privacy, clutter), what contradicts the app's rules or other pages, dead ends and missing states, and suggests extra logic that would help. Writes docs/design/reviews/<page>.md. Use when the owner gives a design and wants their own mistakes found before building.
---

# design-review (find the logic mistakes the owner cannot see)

The owner is not a designer. They give a design (often made by an AI) and want to know: what did I forget, what is wrong for this page, what should not be here, what else could help. You judge the LOGIC and COMPLETENESS of the page for its purpose. You do not judge colours, fonts, spacing or animation (design-apply handles motion). You do not change the design or the code.

Output: `docs/design/reviews/<page>.md` (use `review-template.md`) and a short Hinglish summary in chat with the top findings and the questions.

## Input
- The design: a path in docs/design/ (read the whole HTML including `<script>`: behaviour hides there), or attached images/PDF (read each).
- The page name. If a brief exists in `docs/design/briefs/<page>.md`, read it. If not, build a quick one in your head with the same sources page-brief uses (PRODUCT_DESIGN_CONTEXT.md, SPEC.md, PLAN.md, schema, permissions, the existing screen) and say so.

## Steps
1. **Inventory the design.** List every item, action, state and flow it shows or implies (what the user can see, do, and what happens). Note what the script does when something is clicked.
2. **Know the page's purpose.** Write the one question the page answers and the jobs the user does there (from the brief or the docs).
3. **Check completeness against the purpose.** For each job: can the user do it start to finish from this design? What do they need that is not there? Think of the first five minutes of a new user and of a tired user at 6 pm. Use `review-checklists.md` (page-type checklists). Be specific to the page: if it is a prescription page and there is no medicine search, no dose/frequency/days, no way to issue or print, no allergy alert, say exactly that.
4. **Check what should not be there.** Wrong role (the receptionist seeing clinical data), health information in a message, money shown to the wrong role, items that do not belong to this page, duplicated controls, anything the app forbids (see the project rules in review-checklists.md section C), features the project decided not to build.
5. **Check consistency.** With the app's existing rules and words (status words, patient code, money format, English only), with other pages that show the same thing, and with docs/design/final/ designs.
6. **Check logic of interactions.** Dead ends (no way back), actions without confirm when destructive, actions without undo or reason when money/clinical, double-submit, what happens when two people act at once, what happens when the server refuses, empty/loading/error/offline/long-text states, keyboard and phone.
7. **Check feasibility.** For each data item and action: does the backend have it (EXISTS), is it slow or incomplete (FIX FIRST), or is it NEW (a new table, route, rule)? Roughly how big. (Look at the schema and routes with grep; do not read everything.)
8. **Suggest extra logic that would help** (clearly separated from mistakes): things the page could do that users will want, with the reason and the cost.
9. Write the review. Order findings by severity. Every finding says: what, where in the design, why it matters, what to do, and the backend impact.
10. Chat summary: the top 5 to 8 findings and how many in each group. Then ask the questions that need the owner's decision. **Ask in chat, never leave questions only in the file (owner rule, 2026-11-25).** The owner must not have to open the file to find what to answer. Ask every open question in the chat with the AskUserQuestion tool: at most 4 questions per call, each question self-contained (say what it is about in the question itself), 2 to 4 short options, your recommended option first and marked "(Recommended)", plain words, Hinglish allowed in the question text. Ask the most blocking ones first; if more than 4 remain, ask the next batch after the answers. Then write the answers into the file (the questions table keeps the question and the owner's answer) and into docs/DECISIONS.md. The file still keeps its questions table as a record, but the chat is where the owner answers. Ask before anyone fixes the design.
11. Commit locally with `git add` of the review file only. Never push.

## Rules
- Findings are about THIS page's purpose. No generic advice without a reason tied to the page.
- Say "I am not sure" when unsure, and put it in the questions. Never guess about money, clinical or legal rules; ask.
- Do not rewrite the design. Describe the missing thing in words ("a way to search the doctor's medicine list by name") so a designer can add it.
- Be kind and plain: the owner wants to learn. Give the reason for each point in one sentence.
