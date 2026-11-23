# DECISIONS_UI

Only the owner approves entries in section 1. Sections 2-3 are mine and need his yes. AI sessions: follow section 1 and "Do not repeat", treat section 2 as suggestions, and ask before applying them.

## 1. Approved (already decided by the owner elsewhere; this file only collects them)
| Rule | Source |
|------|--------|
| Colours, type scale, radii, 48 px controls, 4 px spacing steps | docs/DESIGN.md |
| Patient number shown as a soft-blue chip `#E6EEFA/#163C80` wherever a patient appears | DESIGN.md |
| Never use colour alone for status; text contrast at least 4.5:1 | DESIGN.md |
| Brand red only for the clinic name, never for buttons | DESIGN.md |
| Every screen has one main job and one main button | DESIGN.md |
| Finalised records are read-only with a "Finalised" badge and "Add note/addendum" instead of Edit | DESIGN.md, AGENTS.md |
| Responsive: phone 360 (bottom tabs, round "+"), tablet 768 (top tabs), laptop 1366 (navy sidebar); no horizontal scroll; 44 px touch targets; tables become cards or scroll in their own box | DESIGN.md, AGENTS.md |
| UI and prints are English only; consent forms are Hindi with the English name under the heading | AGENTS.md, DECISIONS.md (2026-11-23) |
| Errors to staff are plain sentences (what happened, what to do); no stack traces | AGENTS.md |
| Print is clean black and white, A4/A5, no browser header/footer, reprints say "Duplicate copy" | RUN_PROMPT.md |
| Staff say "Prescription" (never "Parcha"); "Patient no." for the number | DESIGN.md |
| Times show AM/PM through one shared helper | FIXES #4 (done) |
| Doctor Today lists the whole day and every row opens the visit; opening a visit marks In chair | FIXES #1, #2 |
| Settings, not code, holds clinic text, medicines, timings | AGENTS.md |
| New screens must name the mockup (S01-S19) they follow | AGENTS.md |

## 2. Proposals awaiting the owner (NOT approved)
| # | Proposal | Fixes |
|---|----------|-------|
| P1 | Add a `PageContainer`/`PageHeader` and use it on every staff screen | H5 |
| P2 | Billing nav becomes a hub: Today's collection, Dues, Bills, Day close | H3 |
| P3 | Visit screen follows S05 (chart + procedures + findings on one screen, alerts card, draft banner) | H6, C2 |
| P4 | One status vocabulary: Booked, Arrived, In chair, Done, Missed, Cancelled; Draft, Final | H10 |
| P5 | Screen dates `23 Nov 2026`, print dates `23/11/2026`, durations in hours | M1 |
| P6 | No pre-selected gender in New patient (confirm with doctor) | M3 |
| P7 | Round "+" only on Today and Patients | H7 |
| P8 | Phone calendar as a list | H8 |
| P9 | Lint rule: no raw `<input>/<select>/<textarea>` in `features/` | M2 |
| P10 | Remove or wire the top-bar Walk-in; keep a single Walk-in | H1 |
| P11 | Internal configuration warnings (gst_mode, missing registration number) shown to staff in Settings status, not on patient prints | H4 |

## 3. Do not repeat (from this audit; derived from problems seen)
- Do not build a screen from bare HTML. Using the shared form/table/card pieces is mandatory.
- Do not leave page margins to each screen.
- Do not show system values (`in_chair`, `gst_mode`, ISO dates) to staff or on paper.
- Do not hide a step the next person needs behind a tab the user may never open (procedures before billing).
- Do not ship a button without a handler. Do not ship an API client call that has not been exercised once in a real browser.
- Do not pre-select a clinical or demographic value.
- Do not put a destructive button (Cancel bill) next to a routine one (Print bill).
- Do not show an empty form field in a read-only record.
- Do not show a heading with nothing under it (empty states need a sentence).
- Do not use a floating action button where it covers content.

## 4. Constraints that affect future features
- Free-plan limits: no heavy client work or server PDF generation; prints are HTML printed by the browser.
- Role split: receptionist never sees clinical data; any screen shared by both roles must hide clinical parts for the receptionist (seen: profile tabs differ by role).
- The patient portal (Phase 8) must use the same shell tokens at 360 px first.
- Browser testing must use `http://localhost:8787` (CSRF origin), see AUDIT T1.
