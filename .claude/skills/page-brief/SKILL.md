---
name: page-brief
description: Write a design brief for ONE page that tells a design AI (or a designer) WHAT the page must contain and WHY, never how it looks. Takes the page name plus the owner's notes ("show X, Y, Z"), then adds the data behind each item, the reason it exists, the logic and rules behind it, the states and edge cases, who sees it, and the things an expert would not forget. Output docs/design/briefs/<page>.md. Use when the owner says they must design a page and wants the design AI to get all the details.
---

# page-brief (what and why, not how it looks)

Goal: the owner will paste this brief into a design AI (Google Stitch or similar). That AI knows nothing about this clinic. If the brief is complete, the AI can design the page well without guessing. The brief says WHAT is on the page, WHY each thing is there, WHERE its data comes from, WHO sees it, WHAT can go wrong. It never says colours, fonts, layout, spacing or animation. (The look is the designer's job; behaviour of the finished design is checked later by design-review.)

Output: `docs/design/briefs/<page>.md` (use `brief-template.md` in this folder), plus a short Hinglish summary in chat and the open questions.

## Input
- The page name (for example "Prescription", "Patient profile", "Appointments calendar").
- The owner's notes: the things they want on it, in any words. Every note must appear in the brief, with its reason. Do not drop any.

## Sources (read only what the page needs; grep first)
1. `docs/PRODUCT_DESIGN_CONTEXT.md` (the product, the users, what exists), `docs/SPEC.md`, `docs/DESIGN.md`, `AGENTS.md` (rules: privacy, money, roles, English only).
2. `docs/PLAN.md` and `docs/PHASE_Q.md` for the page's tasks (grep the page name), `docs/product-audit/IDEAL_EXPERIENCE.md` and `ISSUES.md`, `docs/DECISIONS.md`, `docs/FIXES.md`.
3. The data model: `packages/db/src/schema/*.ts` (tables and columns), `packages/shared/src/*.ts` (types, rules, tunables), `packages/db/src/permissions.ts` (who may do what).
4. The existing screen if there is one: `docs/MAP.md` to find it, then the feature folder in `apps/web/src/features/`. Note what it shows today and what is missing.
5. Fake data only. Never put real patient data in a brief.

## How to write it (the rules)
- **Every item gets a reason.** For each thing on the page write: what it is, why the user needs it at that moment, what they do with it, where the data comes from (table.column, endpoint, or "computed from ..."), how fresh it must be, who may see it (doctor / receptionist / developer), how it is formatted (money is integer paise shown as rupees; dates in IST; patient code P-000123; Indian mobile numbers), and what shows when it is empty, very long or missing.
- **Every action gets its consequences.** Who can do it, what must be true first, what changes in the data, what else happens (audit row, message, bill, locked record), can it be undone, does it need a confirm, and what must NEVER happen because of it.
- **Think like a dental-clinic expert and a product person.** Add what the owner did not say but a good page would need. Use `expert-prompts.md` in this folder. Mark each such addition "ADDED BY AI: <reason>" so the owner can accept or remove it.
- **Be concrete.** Real examples with fake data. Numbers: how many rows can there be (a clinic with one chair sees 20-40 patients a day), how long a name can be, how often the page is opened.
- **Mark what you do not know.** Use UNKNOWN and put it in the questions with a suggested default. Never guess about money, clinical or legal rules.
- **No visual words.** If you catch yourself writing "left", "blue", "card", "button style", delete it. "A way to search patients by name, mobile or code" is right; "a search box at the top right" is wrong.

## Steps
1. Read the sources above for this page. Note what exists today and what is missing.
2. List the owner's notes as the first draft of the data and action lists.
3. Walk through the page as each role in each situation (see the template, section 2) and add what they need at that moment.
4. Apply `expert-prompts.md`: the safety things the user must never miss, the things users forget to ask for, the edge cases.
5. Fill the template. Put a ready-to-paste prompt block at the top (see template) so the design AI uses the brief correctly.
6. Chat: say in Hinglish, short, what the page is for, the five most important things in it, the ADDED BY AI list, and the open questions. Ask the owner to confirm before they paste it to the design AI.
7. Commit locally with `git add` of that one file (message "Brief: <page>"). Never push.
