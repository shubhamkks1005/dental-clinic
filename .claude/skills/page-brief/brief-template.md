# Design brief: <page>

Written: <date>. Source: owner's notes + project docs. Fake data only.

## Prompt for the design AI (paste this first)
You are designing ONE page of a web app for a single dental clinic in India. Below is a brief. It says what the page must contain, why each thing is there, and the rules behind it. It does NOT say how it looks: that is your job.
- Use only the data and actions in the brief. Do not invent fields, features or numbers. Use obviously fake sample data.
- Items marked MUST are required. SHOULD can be dropped if space is short. ADDED BY AI items are suggestions: include them only if they fit.
- Design every state in section 7 (empty, loading, error, long text, many rows), not only the happy path.
- Respect section 8 (who may see what, money, safety). The screen must work on a laptop (1366x768), a tablet (768) and a phone (360). UI text is English only.
- If something is unclear, list your assumption at the end of your answer instead of guessing silently.

## 1. Purpose
The one question this page answers, in one sentence. What the user is trying to get done when they open it. What a good visit to this page looks like (how many seconds, how many taps).

## 2. Who, when, how
| Role | Situation (what is happening in the clinic) | Device | How often | Time pressure | Interruptions |
|---|---|---|---|---|---|

## 3. Jobs to be done (in order of importance)
1. ...

## 4. How they arrive and where they go next
Entry points (which pages/links/notifications open it) and exits (what they do after).

## 5. Data catalogue
| # | Item | Why it is here | Source (table.column / endpoint / computed) | Fresh how fast | Who sees it | Format | If empty / long / missing | Priority (MUST / SHOULD / COULD) | Added by AI? |
|---|---|---|---|---|---|---|---|---|---|

## 6. Actions catalogue
| # | Action | Who | Needs to be true first | What changes in the data | Other effects (audit, message, bill, lock) | Undo? | Confirm? | Must NEVER happen |
|---|---|---|---|---|---|---|---|---|

## 7. States and edge cases
Empty, loading, error, offline, no permission, very many rows, very long names, nothing arrived yet, someone else changed it at the same time, the clinic is closed, a break or holiday, a locked (finalised) record. For each: what the user needs to understand and do.

## 8. Rules and constraints
Privacy and roles (what the receptionist must never see), money (paise, approvals, locked bills), clinical (alerts, allergies, finalised records), legal/consent, audit, retention, language (English only), accessibility (touch targets, keyboard).

## 9. Things the user must never miss
Safety and money items that must be impossible to overlook on this page (for example a medical alert, an unpaid balance, a patient allergy).

## 10. Time and freshness
What changes by itself while the page is open (counts, waiting times, status), how fast, what happens when a refresh fails.

## 11. Related pages and shared pieces
Pages that show the same data or use the same pieces (so the design stays consistent).

## 12. Things a designer would forget (expert checks)
The hits from expert-prompts.md that apply, each with a reason.

## 13. Open questions for the owner
| # | Question | Why it matters | Suggested default |
|---|---|---|---|

## 14. Out of scope
What this page deliberately does not do.
