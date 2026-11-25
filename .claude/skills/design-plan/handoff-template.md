# Handoff: <name> (docs/design/final/<name>.html)

Status: PLANNED | BACKEND DONE | DESIGN APPLIED | MEASURED | DONE
Written: <date>. Plan by: design-plan. Next skill: design-apply.

## 0. How to read this file
design-apply reads ONLY this file plus the HTML. Update the status lines and the checkboxes as work is done. Add a line to "Log" after every step.

## 1. The screen in one paragraph
What the screen is, who uses it (roles), where it lives in the app (route, existing files it replaces).

## 2. States (what can be on screen)
| Area | State | What shows | HTML lines |
|---|---|---|---|

## 3. Motion inventory (from the HTML style and script)
| # | Animation | Trigger | Element | Duration | Delay | Easing | HTML lines | Measure how |
|---|---|---|---|---|---|---|---|---|

## 4. Data and actions
| Item | In HTML | App today | Verdict (EXISTS / FIX FIRST / NEW) | Detail |
|---|---|---|---|---|

## 4b. Also used on (shared pieces)
| Piece | Other pages / files that use it | Apply there too? | Note (own final design? conflict?) |
|---|---|---|---|

## 5. Backend work (do first, in this order)
- [ ] B1 ... (shared rule / migration / repo / domain / route / permission / matrix / tests)
Queries per request: before -> after. Migration number (if any): ... (the owner applies it).

## 6. Logic changes (frontend)
State shape, optimistic updates and their rollback, refresh rules, guards, what the server decides.

## 7. New things that need the owner's answer
| # | Question | Options | Default if no answer |
|---|---|---|---|

## 8. Decisions already taken (also in docs/DECISIONS.md)

## 9. Design apply checklist
- [ ] tokens/colours (scoped), icons, CSS files
- [ ] components (one per file, small)
- [ ] every motion in section 3
- [ ] reduced motion
- [ ] phone 360 / tablet 768 layout
- [ ] shared pieces from 4b applied on the other pages (and checked there)
- [ ] docs: MAP.md, STATE.md, USER_MANUAL.md, handoff INDEX.md

## 10. Test cases (state x interaction x edge)
| # | Case | Steps | Expect (look) | Expect (numbers) |
|---|---|---|---|---|
Include: repeat 3-5 times in a row; first/last/only item; empty; server refuses (rollback); server slow (300 ms); 360/768/1366; keyboard only.

## 11. Measurement targets
- first visible change within 100 ms of the click, even with a 300 ms server;
- each transition spans >= 8 frames over its HTML duration, no 1-3 frame jump larger than 24 px;
- no layout jump of other elements, no page scroll movement;
- durations within +-20 percent of the HTML value.

## 12. Log
