# Handoff: library (docs/design/final/library_align_dentistry (7).html)

Status: DONE (2026-11-26, design-apply): backend P1-P3, UI P4-P7, measured P8. Open: P7.1.2 (phone bottom sheet and "‹ More" link not built) and P7.3.5 (other pickers unchanged); see Log.
Written: 2026-11-25, re-checked and rebuilt 2026-11-26. Plan by: design-plan. Next skill: design-apply.

## 0. How to read this file
design-apply reads ONLY this file plus the HTML. Update the status lines and the checkboxes as work is done. Add a line to "Log" after every step.

**The HTML** is `docs/design/final/library_align_dentistry (7).html` (1036 lines, the owner's file name, kept as is). HTML line numbers below refer to it: Tailwind config (colours, radius, spacing, fonts, sizes) 6-152, style 156-165, app rail 170-199, header 204-219, tabs 222-230, More bar 233-239, banner 242-248, filter column 253-345, list header and reorder 349-373, Add/Edit modal 380-395, delete modal 398-414, script 416-1034 (`LIST_META` 417, `MED_SUGGESTIONS` 430, fake `DATA` 447, state 499, `selectTab` 505, `selectMore` 517, `toggleMoreFilters` 523, `resetOpt1` 542, `showToast` 556, `toggleHidden` 561, `confirmMed` 570, `getFilteredList` 579, `setSortBy` 636, drag 642-676, `moveItem` 678, modals 692-709, suggestions 711-726, modal fields 728-763, `saveModalItem` 765, delete timer 819-860, `cardStyle` 862, `renderAll` 876-1032).

Inputs read on 2026-11-26: AGENTS.md rules via RUN_PROMPT, docs/HANDOFF.md (next free migration 0065), docs/design/final/README.md, docs/design/briefs/library.md and docs/design/reviews/library.md (owner answers inside; both exist), the whole HTML (style, script, markup), and the real code: `packages/shared/src/lists.ts`, `packages/shared/src/medicines.ts`, `packages/shared/src/prescriptions.ts`, `packages/db/src/repos/lists.ts`, `packages/db/src/repos/prescriptions-usage.ts`, `packages/db/src/repos/prescriptions-issue.ts`, `packages/db/src/schema/list-items.ts`, `packages/db/src/schema/prescriptions.ts`, migrations 0008, 0016, 0032, `apps/worker/src/routes/staff-lists.ts`, `apps/web/src/features/library/*`, `apps/web/src/features/lists/medicine-input.ts`, `apps/web/src/features/prescriptions/useVisitPrescription.ts`, `AddMedicineInline.tsx`, `apps/web/src/features/visit-doctor/visit-doc-fonts.css`. Part S speed rules apply (at most ~10 D1 queries per request, IN 90 or fewer, no waterfalls, skeletons, useSubmitOnce, optimistic only for status and order, never for money).

Files in `git status` that are not this plan's (never commit them with this work): `.claude/skills/*`, `apps/worker/.wrangler/*`, `apps/worker/scripts/seed-local-clinical.mjs`, `seed-local-patients.mjs`, `packages/db/src/testing/*`, `playwright.config.ts`, `types/node-builtins.d.ts`, `docs/PLAN.md`, `docs/PRODUCT_DESIGN_CONTEXT.md`, the screenshots under `docs/ui-audit/`.

**Where design (7) still shows what the review marked as a mistake.** Q1 (owner, 2026-11-25): the earlier answers win for behaviour and data; the HTML wins for look, layout, copy and motion. Design (7) still shows:
1. Delete button + 7-second delete dialog on medicines (owner: Hide only, never delete). -> not built (P5.6.4).
2. Filters and card lines for Route, Manufacturer, Rx type, Schedule type, Storage (owner: drop). -> not built (P5.3.5).
3. "Search Medicine Sets only" switch (review C3: remove, use the tab). -> not built (P5.3.5).
4. Date filters and quick views Recently added / Recently updated / Frequently used / Combination only (owner: only All, Needs review, Hidden). -> P5.3.2.
5. Confirm marks reviewed in one tap (owner: Confirm opens the filled card; Save there marks reviewed). -> P5.4.6.
6. Created by / on / Last updated on the expanded MEDICINE card (owner: inside Edit only). Non-medicine cards: Q11 (2026-11-26) says their expand shows exactly these three. -> P5.4.4, P5.4.5.
7. Medicine set Add/Edit has only a Name; new set saved with a fixed `Pantoprazole`. -> set picker (Q3), P5.6.
8. Add/Edit for visit types, phrases, More lists has no own fields. -> P5.5.
9. Suggestions show 6 names on focus with nothing typed. -> matching only (P5.5.6).
10. Empty fields saved as "-", "5 days", "Room Temperature"; Category starts on Antibiotic. -> P1.1.3, P5.5.2.
11. No duplicate check, validation, unsaved guard, loading/error/offline/conflict states, Show more, Needs-review-0 message, "past records keep their copy" line; new item goes to the top. -> P5.7, P1.5.1.
12. Reorder works with sort, search and filters on. -> P5.8.1.

## 1. The screen in one paragraph
The doctor's Library at `/app/library/<list>` (doctor and developer only; the sidebar item needs `settings.medicines`; the receptionist sees the one permission page). It replaces the current tabs + table + right drawer in `apps/web/src/features/library/` (LibraryScreen, LibraryList, LibraryRow, LibraryDrawer, MedicineAddForm, library.css). Layout: the app's own sidebar (not redrawn), a header (title "Library", "Doctor only" pill, search, "Add <item>" button), one tab strip (Medicines, Medicine sets, Procedures and fees, Visit types, Diagnoses, Quick phrases, More), a second strip under "More" (Tooth conditions, Allergens, Referral sources, Medical history checklist), a success banner, and the body. On Medicines the body is a left filter column (3 of 12) plus tinted cards (9 of 12); on every other list the cards take the full width. A card has the name, category pill, "Needs review"/"Hidden" pills, one detail line, and actions (Confirm, Edit, Hide / Show again). Clicking a card expands its details. Reorder mode has arrows and drag. Add/Edit opens in a centred modal.

## 2. States (what can be on screen)
| Area | State | What shows | HTML lines | Sub-point |
|---|---|---|---|---|
| Tabs | active / idle | filled primary pill / plain pill; changing tab clears search, resets status pills to Active, leaves reorder | 223-229, 505-516, 881-888 | P5.2.1, P5.2.2 |
| More sub-bar | hidden unless tab = More | "Setup lists:" + 4 bordered buttons, selected one tinted | 233-239, 891-900 | P5.2.3 |
| Header Add button | label | "Add medicine / medicine set / procedure / visit type / diagnosis / quick phrase / tooth condition / allergen / referral source / checklist item" | 214-217, 914 | P5.1.3 |
| Search | placeholder | "Search medicine or salt..." on Medicines, else "Search <list title lower-case>..."; matches name and salt | 212, 630, 915 | P5.1.2, P5.3.6 |
| Filter column (Medicines only) | shown / hidden on other tabs | title "Filter Medicines", Reset, Quick Views, More Filters | 253-345, 903-909 | P5.3.1 |
| Quick view button | selected / idle | tinted + primary text / plain; All has the active count; Needs review has a warning pill with count; Hidden has a count | 268-273, 919-936 | P5.3.2 |
| More Filters | closed (default) / open | rows 0fr -> 1fr, chevron turns 180 deg, `aria-expanded` | 276-286, 523-528 | P5.3.3, P6.1.3, P6.1.4 |
| Status pills (non-Medicines, not reordering) | Active n / Hidden n | selected = primary fill | 355, 938-948 | P5.3.4 |
| Card | normal / hidden (dimmed 80 %, "Hidden" pill) / needs review (warning pill + Confirm) / expanded / reorder (drag handle, arrows, no expand) | tinted by category on Medicines; by list on the others | 862-874, 1014-1030 | P5.4.1 to P5.4.7 |
| Card detail line | per list | Medicines: form, strength, dose, usage counter; Sets: medicine chips; Procedures: code, usual fee; Visit types: minutes, colour name; Phrases: text; More lists: code | 959-972 | P5.4.3 |
| Expanded card | medicine / other | Medicine: Salt, Brand, Timing, Days (Route/Mfg/Storage/created dropped). Other lists: Created by, Created on, Last updated (Q11) | 986-1008 | P5.4.4, P5.4.5 |
| Reorder banner | on / off | "Reordering active items. Drag cards up/down or use arrows to set your preferred order." + Done | 368-371, 916-917 | P5.8.1 |
| Sort select | Custom / A to Z / Z to A | A to Z or Z to A turns reorder off | 356-360, 636-640 | P5.8.4 |
| Empty result | any filter | "Nothing matches your current filter." + Reset filters | 954-955 | P5.7.4 |
| Banner | hidden / shown | green banner under the tabs, check pops, X closes | 242-248, 556-559 | P5.7.1, P6.1.1, P6.1.2 |
| Add/Edit modal | add / edit; per-list fields | centred, scrim 40 %, title "Add <item>" / "Edit <item>", Cancel / Save | 380-395, 692-709 | P5.5.1 to P5.5.8 |
| Name suggestions | hidden / list | only when typed text matches (not on focus) | 711-726 | P5.5.6 |
| Delete modal | counting / ready | NOT BUILT (owner) | 398-414 | P5.6.4 |

NOT in the HTML, copied from the nearest app screen (named in each sub-point): loading, load error, empty list, save failing, conflict, offline, receptionist page, phone 360, tablet 768, unsaved-changes guard, validation messages, Needs-review-0, long names, hide dialog for medicines used in sets (Q12).

## 3. Motion inventory (from the HTML style and script)
| # | Animation | Trigger | Element | Duration | Delay | Easing | HTML lines | Measure how | Sub-point |
|---|---|---|---|---|---|---|---|---|---|
| M1 | toastEnter: opacity 0 to 1, translateY(-8px) to 0, scale .98 to 1 | banner shown | banner | 220 ms | 0 | cubic-bezier(0.2,0,0,1) | 158, 160, 242 | rAF sample opacity, translateY, scale; must replay on EVERY message (the HTML only removes `hidden`, so a second message does not replay; the app re-keys) | P6.1.1 |
| M2 | checkPop: scale .5 to 1.18 (65 %) to 1, opacity 0 to 1 | with M1 | check icon | 320 ms | 0 | cubic-bezier(0.2,0,0,1) | 159, 161, 244 | rAF sample scale: peak 1.18 near 208 ms | P6.1.2 |
| M3 | More Filters open/close: `grid-template-rows` 0fr to 1fr + opacity 0 to 1 | click More Filters | collapse box | rows 240 ms, opacity 200 ms | 0 | rows cubic-bezier(0.2,0,0,1), opacity ease | 162-164, 286 | rAF sample height and opacity; other elements do not jump; sticky column stays | P6.1.3 |
| M4 | Chevron turn 0 to 180 deg | same click | More Filters chevron | 200 ms | 0 | cubic-bezier(0.4,0,0.2,1) (Tailwind default) | 283, 527 | rAF sample transform | P6.1.4 |
| M5 | Card chevron turns + colour on expand | card click | card icon | none (instant class swap) | 0 | none | 1019 | snaps; do not add a transition | P6.1.5 |
| M6 | Colour/border hover | hover | header Add, tabs, cards, More Filters button | 150 ms | 0 | cubic-bezier(0.4,0,0.2,1) | 214, 223, 278, 1015 | computed `transition-duration` = 150 ms | P6.1.6 |
| M7 | Drag: dragged card opacity 0.6; drop target gets ring + primary border | dragstart / dragover | card | none (instant) | 0 | none | 642-676 | state check, not timing | P6.1.7 |
| M8 | Modal open/close | open/close | modal | none (display toggle) | 0 | none | 380, 697, 709 | none; the app Dialog keeps its own behaviour | P6.1.8 |
| M9 | List re-render after a change | any action | card list | none | 0 | none | 954 | none; keep scroll position and expanded cards | P6.1.9 |

Reduced motion: the HTML has none. In the app, under `prefers-reduced-motion: reduce`, M1 becomes opacity only, M2 to M4 are instant (P6.2.1).

## 4. Data and actions
"Item" = a `list_items` row (label, data_json, active, sort_order, version, created_by, updated_by, created_at, updated_at).

| Item | In HTML | App today | Verdict | Detail | Sub-point |
|---|---|---|---|---|---|
| 7 tabs + More sub-bar | tabs and a second bar | tabs + a card page for More (`MoreTab`, LibraryScreen.tsx:35-48) | EXISTS (UI change) | Keep routes `/app/library/<key>`; replace the More card page by the second strip; `/app/library/more` redirects to `conditions`. | P5.2.1-P5.2.3 |
| List title + help | `LIST_META` | `LIST_DEFS[key].title/help` | EXISTS | Keep `LIST_DEFS` text (one place); add "Past prescriptions, bills and visits keep their own copy." in every Edit view. | P5.1.4, P5.5.7 |
| Search | name and generic | name only | FIX FIRST (UI) | Medicines: name, salt, brand. | P5.3.6 |
| Quick views | All, Needs review + 4 extra | `countFilters` | FIX FIRST (UI) | Only All, Needs review, Hidden, each with a count. | P5.3.2 |
| Needs review | `review` flag; Confirm clears it | `data.reviewed !== "yes"` | FIX FIRST | Needs review = added from a visit with "Add to my list". Seeded medicines are reviewed (Q5, Q9). Confirm opens Edit; Save sets `reviewed: "yes"`. | P1.4.2, P5.4.6 |
| Medicine fields | name, generic, brand, category, form, strength, dose, frequency, time of day, food timing, days, storage | label, brand, form, strength, default_dose, default_frequency, default_days, timing, instruction, tags, category | FIX FIRST / NEW | name = `label`; Generic / Salt = NEW `salt`; Time of Day NOT built (Q7); Storage dropped; Food timing = `timing` with After food / Before food only (Q10); instruction and tags kept under "More details". | P1.1.1, P1.1.2, P1.1.6, P5.5.2 |
| Required fields | name only | form, strength, dose, frequency, days, timing required (lists.ts:132-137) | FIX FIRST | Only Name required; empty dose, frequency, days, timing store "As directed"; empty form and strength stay blank (Q8). | P1.1.1, P1.1.3 |
| Combination | `combo` | not in data | NEW | optional `combination` "yes"/""; switch starts ON when the name has "+". | P1.1.2, P5.5.3 |
| Usage counter | "Used N times (30d)" | `medicineUsage30d` counts prescriptions in 30 days, all doctors | FIX FIRST | "You wrote this 48 times (6 in the last 30 days)": signed-in doctor only (L14), counts visits not prescription rows (L13). | P1.6.1, P2.1.4, P5.4.3 |
| Category pill colours | `cardStyle` | not shown | NEW (UI) | Case-insensitive mapping; empty = neutral (L23). | P1.1.8, P5.4.2 |
| Hide / Show again | flips `active` | `setActive` | EXISTS | Medicine in a set: Q12 dialog. | P5.6.5, P2.1.3 |
| Medicine used in sets | none | none | NEW | Q12: hiding asks to remove it from the sets; if not removed, those sets are not offered in visits. Rename is safe (sets store ids, Q6). | P1.2.*, P1.5.7, P2.1.3, P5.6.5, P7.3.1 |
| Medicine set edit | name only | text field "items" (`|` names) | NEW | Picker of active medicines (Q3); stores `item_ids` + `items` (Q6). | P1.2.1, P5.6.1-P5.6.3 |
| Procedure fee | "₹1,000" text | `default_paise` integer | FIX FIRST (UI) | Doctor types rupees; stored in paise; code field shown. | P5.5.4 |
| Visit type fields | name only | minutes + `#RRGGBB` colour | FIX FIRST (UI) | Minutes select 5..240 step 5; named colour swatches (L19). | P1.1.9, P5.5.4 |
| Quick phrase text | fixed | `data.text` max 500 | FIX FIRST (UI) | Textarea with counter; card clamps long text. | P5.5.4, P5.4.3 |
| More lists fields | name only | conditions: code, colour, icon, applies_to; allergens: tag; checklist: code, section, alert_label, restricted | FIX FIRST (UI) | Generic form from `LIST_DEFS` fields; allergen and checklist caution lines. | P5.5.5 |
| Duplicate rule | none | `refuseDuplicate` by name + unique index | FIX FIRST | Block only when name and every field are the same (brief). Migration 0065 drops the unique index. | P1.4.1, P1.5.1 |
| Delete | button + 7 s dialog | none | NOT BUILT | Owner: Hide only. No route. | P5.6.4 |
| Reorder | arrows + drag | `move` up/down | FIX FIRST | Active items only (L1); new `move-to` for drag. | P1.5.5, P1.5.6, P2.1.2, P5.8.* |
| Sort A to Z / Z to A | select | none | NEW (UI) | Client only; turns Reorder off. | P5.8.4 |
| Show more | none | 25 + "Show more (N left)" | EXISTS | Keep. | P5.7.5 |
| Created / updated who and when | on expanded card | not returned (`ListItem` has none) | NEW | Returned by `list()`; names via one `users` query; "system" shows "Starter list" (L18). | P1.1.4, P1.5.4, P5.4.5, P5.5.7 |
| Suggestions | 14 names, 6 on focus | none | NEW | Bundled dental list, matching only, names only (Q4). | P1.3.1, P5.5.6 |
| Banner | green, no auto-hide | `useToast` | EXISTS (UI) | Library renders its own `LibraryBanner`; errors still use the app toast. Clears on tab change (L20). | P5.7.1 |
| Unsaved changes | none | `ui/UnsavedChangesGuard` | EXISTS | Asks only after typing. | P5.5.8 |
| Save states | none | `useSubmitOnce`, `problemText` | EXISTS | "Saving...", one request, 409 reload sentence, offline blocked. | P5.7.2, P5.7.3 |
| Permission | none | `settings.medicines` (nav, medicines list), `settings.read` (other lists), `settings.write` (changes) | EXISTS | Verified: `settings.write` is doctor + developer only (`packages/db/src/permissions.ts:39`). | P2.2.1 |

## 4b. Also used on (shared pieces)
| Piece | Other pages / files that use it | Apply there too? | Note | Sub-point |
|---|---|---|---|---|
| App sidebar | every staff page (`ui/shell`) | NO: Library uses the app's own sidebar. | The HTML rail is the same family as doctor_today.html; do not redraw. | P4.1.4 |
| Fonts (Instrument Sans, Wix Madefor Display, Spline Sans Mono) + icon font subset | visit page (`visit-doctor/visit-doc-fonts.css`, `public/fonts/*`) | YES (one file): move the `@font-face` rules to `apps/web/src/styles/design-fonts.css`, imported by the visit page and the Library. The icon subset gets the Library's glyphs added. | Visit page must look the same after the move (visit specs). | P4.1.1, P4.1.2 |
| Colour tokens | Today (`.today-doc`), visit (`visit-doc*.css`) | Scoped to `.library-doc` only; app-wide re-theme is T3.1. | Tokens must also be on portals (modal, banner, suggestion list). | P4.1.3 |
| Modal | `ui/Dialog` (10+ pages), `ui/Drawer` (Library only) | Use `ui/Dialog` behaviour with the Library look; `ui/Drawer` becomes unused: keep it, do not delete here. | Lesson: save scrollX/Y around `showModal`. | P5.5.1 |
| Pills, chips, category colours | `ui/StatusBadge`, `ui/Tabs`, pill classes in base.css | NO (Library scope only). | | P5.4.2 |
| Success banner | `ui/Toast` on every page | NO: the app toast stays everywhere; the Library adds `LibraryBanner`. | | P5.7.1 |
| Medicine rules in the visit | `useVisitPrescription.ts` (applySet), `AddMedicineInline.tsx`, `VisitMedicinesPanel.tsx` | YES (behaviour only; the visit page has its own final design, its look does not change): "Add to my list" uses `fillAsDirected`; sets resolved by id; unusable sets not offered (Q12); applySet bug fixed (L12). | Run the visit specs. | P7.3.1-P7.3.4 |
| List readers (`getList`) | QuickBookDialog (visit types), ChartPlayground / VisitChartPanel (conditions), MedicalHistoryForm (checklist, allergens), PlanAddForm (procedures), WalkInDialog | YES (data only): `ListItem` gets optional fields; twins with the same name may appear in pickers: show "name · detail" when two active items share a name. | None has a final design. | P7.3.5 |
| `ListEditor` / `ItemRow` (features/lists) | Verified 2026-11-26: `ListEditor` is exported from `features/lists/index.ts` but imported nowhere. | Leave alone (not deleted in this task). | Reuse field rendering ideas only. | none |
| `MedicinesListReview` | under the Medicines list (setting `medicines.list_reviewed`) | KEEP under the Medicines cards. | Not in the HTML. | P5.1.5 |

## 5. Work plan (Phases -> Sub-phases -> Sub-points; backend first, then UI)
Every row of sections 2, 3, 4, 4b and 6b maps to a sub-point id. The old list B1-B10 (2026-11-25) is folded in; each sub-point says "(was B#)" where it came from. Nothing is done yet, so the move to this numbering loses no done item.

### P1 BACKEND: shared rules, migration, repo
Goal: the data rules the screen needs live in packages/shared and packages/db, tested, before any UI.

#### P1.1 Shared list fields and pure rules (`packages/shared/src/lists.ts`, `medicines.ts`)
- [x] P1.1.1 `packages/shared/src/lists.ts` `LIST_DEFS.medicines.fields`: set `optional: true` on `form`, `strength`, `default_dose`, `default_frequency`, `default_days`, `timing`. (was B1) Why: owner "only Name required", Q8. Check: `lists.test.ts` "medicine with only a name parses"; "medicine with 41-char strength is refused".
- [x] P1.1.2 Same object: add `{ name: "salt", label: "Generic / Salt", kind: "text", max: 120, optional: true }` after `brand`, and `{ name: "combination", label: "Combination", kind: "text", max: 3, optional: true }` (values "yes" or ""). Do NOT add `time_slot` (Q7). (was B1) Why: Q2, review. Check: `lists.test.ts` "salt and combination are optional"; "combination 'maybe' is refused" (add a refine: "yes" or "").
- [x] P1.1.3 `packages/shared/src/medicines.ts`: move `AS_DIRECTED = "As directed"` here from `apps/web/src/features/lists/medicine-input.ts:6`; add `fillAsDirected(data: ListItemData): ListItemData` that fills ONLY `default_dose`, `default_frequency`, `default_days`, `timing` when empty after trim; `form` and `strength` stay "". Never writes "-", "5 days" or a category. (was B1) Why: Q8, HTML 770-783 shows the wrong fill. Check: `medicines.test.ts` "fills only the four fields"; "keeps typed values"; "blank form stays blank".
- [x] P1.1.4 `packages/shared/src/lists.ts` type `ListItem`: add optional `createdAt?: string`, `createdByName?: string`, `updatedAt?: string`, `updatedByName?: string`. (was B1) Why: owner "who and when in Edit", Q11. Check: `pnpm check` types pass in every reader of `ListItem`.
- [x] P1.1.5 `packages/shared/src/lists.ts` new `canonicalListData(key, data)`: drops `reviewed`, runs `fillAsDirected` for medicines, trims strings, lower-cases nothing (the doctor's text stays), returns a JSON string with keys sorted; `isSameListItem(key, a, b)` = label equal case-insensitive AND canonical data equal. Why: brief duplicate rule, L2. Check: `lists.test.ts` "same name + same data = same"; "different strength = not same"; "reviewed flag ignored"; "empty dose equals 'As directed'".
- [x] P1.1.6 `packages/shared/src/medicines.ts` new `LIBRARY_FOOD_TIMINGS = ["after_food", "before_food"] as const` and `foodTimingWord(value)`: known token -> `MEDICINE_TIMING_LABEL` word, "As directed" -> "As directed", any other old text -> the text as stored. Why: Q10 (only after/before food). Check: `medicines.test.ts` "old 'anytime' still reads Anytime"; "after_food reads After food".
- [x] P1.1.7 `packages/shared/src/medicines.ts` new `medicineFormKey(form)`: maps Tab/Tablet -> "tablet", Cap/Capsule -> "capsule", Syp/Syrup -> "syrup", Gel, Mouthwash, Drops, Other (case-insensitive, trimmed), unknown -> lower-cased text; and `MEDICINE_FORM_WORD` (tablet -> "Tablet", ...). Why: L15 (two form lists). Check: `medicines.test.ts` "Tab and Tablet share one key".
- [x] P1.1.8 `packages/shared/src/medicines.ts` new `categoryTint(category)`: trimmed, case-insensitive: "antibiotic" -> "info", "analgesic" -> "warning", "antacid" -> "secondary", "" -> "neutral", anything else -> "success". Why: HTML 862-868, L23. Check: `medicines.test.ts` "ANTIBIOTIC -> info", "'' -> neutral".
- [x] P1.1.9 `packages/shared/src/lists.ts` new `VISIT_COLOURS`: the 7 seeded colours named (`#1E4FA3` Blue, `#0B7A75` Teal, `#15803D` Green, `#B45309` Amber, `#C8202A` Red, `#1E3A8A` Navy, `#9A3412` Rust; values from migration 0016) and `visitColourName(hex)` -> name or "Custom colour". Why: HTML 967 shows a colour name, app stores hex, L19. Check: `lists.test.ts` "#0b7a75 -> Teal"; "#123456 -> Custom colour".

#### P1.2 Medicine sets (`packages/shared/src/medicine-set.ts`, new)
- [x] P1.2.1 `packages/shared/src/lists.ts` `LIST_DEFS.medicine_sets.fields`: add `{ name: "item_ids", label: "Medicine ids", kind: "text", max: 600, optional: true, hidden: true }`; `items` (names) stays required so old readers and the visit keep working. (was B2) Why: Q6. Check: `lists.test.ts` "set with item_ids parses".
- [x] P1.2.2 `medicine-set.ts` `parseSetItemIds(raw)` (split on `|`, trim, drop empty) and re-export `parseMedicineSetItems` from `medicines.ts` (no second copy). (was B2) Check: unit test.
- [x] P1.2.3 `medicine-set.ts` `resolveSetMedicines(set, medicines)` -> `{ name, medicine: ListItem | null, problem: "ok" | "hidden" | "missing" }[]`: with `item_ids`, match by id (inactive = "hidden", not found = "missing", name shown = the medicine's CURRENT label so a rename shows at once); without `item_ids`, match old names case-insensitive among ACTIVE medicines only, else "missing". (was B2) Why: Q6, L5. Check: tests "id wins over name", "renamed medicine keeps its place", "old name list, hidden twin ignored", "empty set".
- [x] P1.2.4 `medicine-set.ts` `isSetUsable(set, medicines)` = at least one item and every item "ok". Why: Q12. Check: test "one hidden medicine = not usable".
- [x] P1.2.5 `medicine-set.ts` `setsUsingMedicine(medicine, sets)` (active sets whose ids contain the medicine id, or, without ids, whose names match its label case-insensitive). Why: Q12. Check: tests by id and by old name.
- [x] P1.2.6 `medicine-set.ts` `withoutMedicine(setData, medicine)` -> new `{ items, item_ids }` with that medicine removed from both, other entries kept in order. Why: Q12. Check: test "removes from both lists"; "last medicine removed gives an empty set" (then P1.5.7 refuses: a set cannot be empty, see there).

#### P1.3 Suggestions (`packages/shared/src/dental-suggestions.ts`, new)
- [x] P1.3.1 Bundled lists per field: medicines (start from HTML 430-445, names only), procedures, visit types, diagnoses, quick phrase names, referral sources; NEVER fees. `suggest(field, typed)` returns [] when `typed.trim()` is empty, else up to 8 case-insensitive "contains" matches, names only. Each list carries a `// DRAFT: doctor reviews before pilot` comment. (was B3) Why: brief 5b, Q4. Check: `dental-suggestions.test.ts` "nothing typed gives []", "no fee list exists", "max 8".

#### P1.4 Migration 0065 (the agent writes it, the OWNER applies it; never applied by the agent)
- [x] P1.4.1 `packages/db/migrations/0065_list_items_duplicates.sql`: `DROP INDEX list_items_key_label_unique;` then `CREATE INDEX list_items_key_label_idx ON list_items (list_key, label);`. (was B4) Why: brief duplicate rule. Check: migration test applies on a fresh DB; `EXPLAIN QUERY PLAN` of the duplicate check uses `list_items_key_label_idx`... note the check uses `lower(label)`, which cannot use the index: acceptable (one list has at most a few hundred rows; checked in P3.2.1).
- [x] P1.4.2 Same file: `UPDATE list_items SET data_json = json_set(data_json, '$.reviewed', 'yes', '$.category', CASE WHEN json_extract(data_json, '$.category') = 'DRAFT - doctor to confirm' THEN '' ELSE json_extract(data_json, '$.category') END), version = version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE list_key = 'medicines' AND created_by = 'system' AND deleted_at IS NULL;`. Verified 2026-11-26: migration 0032 seeds every medicine with `created_by = 'system'` and `category = 'DRAFT - doctor to confirm'`. Why: Q5, Q9 (seeded medicines are added directly, no review), L8. Check: migration test "seeded medicine is reviewed, category blank; a doctor-added row untouched".
- [x] P1.4.3 `packages/db/src/schema/list-items.ts`: replace `unique("list_items_key_label_unique")` with `index("list_items_key_label_idx").on(t.listKey, t.label)`; update `packages/db/migrations/checksums.json` and `meta`; `docs/HANDOFF.md` next free migration -> 0066. (was B4) Check: schema drift test passes.
- [x] P1.4.4 `apps/worker/scripts/seed-local-clinical.mjs`: medicines it seeds carry `reviewed: "yes"` (Q5). This file is ALREADY modified by someone else in `git status`: read the diff first, change only the medicine rows, and tell the owner. Check: local seed shows Needs review 0.
- [x] P1.4.5 Index for the usage count: run `EXPLAIN QUERY PLAN` on the P1.6.1 query; add `prescription_items (generic_name)` or `prescriptions (doctor_id, status)` index to 0065 ONLY if the plan shows a full scan of a table that grows per visit. UNVERIFIED until run. Check: P3.2.2.

#### P1.5 Repo `packages/db/src/repos/lists.ts`
- [x] P1.5.1 `refuseDuplicate(key, input, exceptId)`: one query reads `id, label, data_json` of rows with `lower(label) = lower(?)` in the list (not deleted); compare in JS with `isSameListItem` (P1.1.5); throw `NotAllowedError("This is already in your list.")` (route answers 422, staff-lists.ts:8). Same name with other data passes. (was B5) Why: brief, L2. Check: repo tests "same name + same data refused", "same name + other strength allowed", "update to equal another refused", "case-insensitive".
- [x] P1.5.2 `add()`: for medicines apply `fillAsDirected` before saving; return `{ items, id }` (the new id) instead of only items. (was B5/B7) Why: Q6, Q8 (AddMedicineInline must not search by label). Check: repo test "add returns the new id"; "dose empty -> 'As directed'".
- [x] P1.5.3 `update()`: same `fillAsDirected` for medicines. Check: repo test.
- [x] P1.5.4 `list()` / `itemsOf()`: add `createdAt`, `updatedAt` from the row; names: collect distinct `created_by`/`updated_by` ids, read `users (id, name)` in ONE query with `IN` of at most 90 ids (chunk if more, still no waterfall per item); id `system` -> "Starter list" (L18); unknown id -> "-". (was B5) Why: owner "who/when", Q11. Check: repo test "names resolved", "system -> Starter list"; queries 1 -> 2.
- [x] P1.5.5 `move()` (lists.ts:159-205): the neighbour query adds `eq(listItems.active, true)`, so hidden items keep their place and are never swapped. (L1) Check: repo test "active A, hidden H, active B: B up -> B above A in one call".
- [x] P1.5.6 New `moveTo(key, id, position, version)`: position = 1-based place among ACTIVE items in `sort_order`; one `db.batch`: version-checked update of the moved row + renumber the active rows between old and new place (each `sort_order` set from the computed order) + one audit row `{ position: from -> to }`. (was B7) Why: drag (HTML 658-671). Check: repo tests "first to last", "last to first", "same place = no change", "stale version 409".
- [x] P1.5.7 New `hideMedicine(id, version, removeFromSets: boolean)`: reads the medicine (1 query) and active sets (1 query); if `removeFromSets`, one `db.batch` = hide the medicine + for each set from `setsUsingMedicine` a version-checked update with `withoutMedicine` + one audit row per changed row; a set that would become EMPTY is not changed and is reported back (`emptySets: string[]`) so the screen can say "Edit or hide this set yourself". Without `removeFromSets` it is today's `setActive(false)`. Why: Q12. Check: repo tests "hide + remove from 2 sets in one batch", "set left empty is reported, not saved", "stale set version -> 409 and nothing saved".

#### P1.6 Usage repo `packages/db/src/repos/prescriptions-usage.ts`
- [x] P1.6.1 Rename `medicineUsage30d` -> `medicineUsage(): Record<string, { total: number; last30: number }>`; one grouped query: `count(distinct coalesce(prescriptions.visit_id, prescriptions.id))` as total and `count(distinct case when prescriptions.created_at >= :since then coalesce(visit_id, id) end)` as last30; where `status IN ('issued','revised')`, `doctor_id = ctx.userId`, not deleted; group by `lower(generic_name)`. (was B6) Why: owner counter, L13 (a revision is a new row with the same visit, prescriptions-issue.ts:47,113-119), L14 (schema allows a second doctor, users.ts role enum). Check: tests "issued + its revision = 1", "other doctor's prescriptions not counted", "draft not counted", "31 days ago counts in total only".

### P2 BACKEND: routes, domain, permissions
Goal: the screen gets every action through `apps/worker/src/routes/staff-lists.ts` with version checks and permission checks.

#### P2.1 Routes and domain (`apps/worker/src/routes/staff-lists.ts`, `apps/worker/src/domain/lists.ts`)
- [x] P2.1.1 `POST /lists/:key`: reply `{ items, item }` where `item` is found by the id from P1.5.2 (today found by label, staff-lists.ts:48-54, wrong once twins exist). (was B7) Check: route test "two same-name items: reply names the new one".
- [x] P2.1.2 New `POST /lists/:key/:id/move-to` body `{ position: int >= 1, version }` -> `{ items }`; bad position 400 "Pick a place in the list."; uses `ListChange { kind: "moveTo" }`. (was B7) Check: route tests 200, 400, 409.
- [x] P2.1.3 New `POST /lists/medicines/:id/hide` body `{ version, removeFromSets: boolean }` -> `{ items, sets, emptySets }` (fresh medicines and sets). Why: Q12. Check: route test; receptionist 403.
- [x] P2.1.4 `GET /library/medicine-usage` returns `{ counts: { [lowerName]: { total, last30 } } }` from P1.6.1. (was B6) Check: route test shape; doctor 200, receptionist 403.

#### P2.2 Permissions and route matrix
- [x] P2.2.1 No new permission: `move-to` and `hide` need `settings.write` (repo `assertAllowed`), usage needs `prescriptions.write`. Add both new routes to the route-matrix test (doctor 200, receptionist 403, signed out 401). (was B8) Check: route-matrix test green.

### P3 BACKEND: tests and query count
Goal: prove the backend before any UI, and keep each request at 10 queries or fewer.

#### P3.1 Tests
- [x] P3.1.1 Run `lists.test.ts`, `medicines.test.ts`, `medicine-set.test.ts`, `dental-suggestions.test.ts`, the lists repo tests, `prescriptions-usage` tests, staff-lists route tests, route-matrix, the migration test for 0065, `tunables-guard` (no new tunable). (was B10) Check: `pnpm check 2>&1 | tail -25` green.

#### P3.2 Query count (Part S)
- [x] P3.2.1 Count per request with the query logger: `GET /lists/:key` 1 -> 2; `POST /lists/:key` 3 -> 3 (duplicate read + batch + list) plus 1 users read = 4; `PUT` 4 -> 5; `move` 3 -> 4; `move-to` new: 4; `hide` new: 5; `GET /library/medicine-usage` 1 -> 1. All <= 10. Check: numbers written in the Log.
- [x] P3.2.2 `EXPLAIN QUERY PLAN` for the usage query (P1.4.5) and the duplicate read; write the plans in the Log.

### P4 UI: frame, tokens, fonts, icons
Goal: the Library page wears the design's look inside a `.library-doc` scope, with no CDN and no new dependency.

#### P4.1 Fonts, icons, tokens
- [x] P4.1.1 Move the four `@font-face` rules and `.vd-icon` from `apps/web/src/features/visit-doctor/visit-doc-fonts.css` into `apps/web/src/styles/design-fonts.css` (rename the class `.design-icon`, keep `.vd-icon` as an alias so the visit page is untouched); import it from `DoctorVisitPage.tsx` and `LibraryScreen.tsx`. Why: 4b fonts row, HTML 154-157. Check: visit page screenshot unchanged; Library shows Instrument Sans.
- [x] P4.1.2 `apps/web/public/fonts/MaterialSymbols.woff2` is a subset with the visit page's glyphs only (8 KB). Re-subset to ALSO include: search, add, close, check_circle, tune, expand_more, swap_vert, arrow_upward, arrow_downward, drag_indicator, save. Which glyphs it holds now is UNVERIFIED (check with fonttools `pyftsubset` / `ttx` before and after). Why: HTML 211-1019 icons. Check: every Library icon renders, none shows its name as text.
- [x] P4.1.3 New `apps/web/src/features/library/library-doc.css`: on `.library-doc` (and on the modal, banner and suggestion list via the same class) define tokens copied from HTML 13-61: `--ld-primary #054D61`, `--ld-on-primary #FFFFFF`, `--ld-primary-container #0F5266`, `--ld-secondary-container #D0E6F0`, `--ld-on-secondary-container #091E26`, `--ld-success #146C43`, `--ld-success-container #D1F4E0`, `--ld-on-success-container #0B462B`, `--ld-warning #9A5B00`, `--ld-warning-container #FEF0C7`, `--ld-on-warning-container #693D00`, `--ld-info #0F5266`, `--ld-info-container #D0E6F0`, `--ld-on-info-container #003544`, `--ld-error #BA1A1A`, `--ld-surface #F8F9FB`, `--ld-surface-lowest #FFFFFF`, `--ld-surface-low #F2F4F5`, `--ld-surface-container #EDEEEF`, `--ld-on-surface #191C1D`, `--ld-on-surface-variant #40484C`, `--ld-outline-variant #C0C8CC`; radius sm 6, default 8, md 12, full 9999 px (HTML 98-105); spacing 4/8/16/24/32 (106-114); type sizes from HTML 123-136 (headline-md 22/28 600, title-lg 18/24 600, title-md 15/22 600, body-md 14/20, body-sm 13/18, label-lg 14/20 600, label-md 12/16 600, label-sm 12/16 500, mono-sm 12/16 500). Page background: gradient `to bottom right` from secondary-container at 20 % via surface to success-container at 15 % (HTML 202). Check: computed colours equal the HTML at 1366 px (screenshot side by side).
- [x] P4.1.4 Keep the app sidebar and shell (do not copy HTML 170-199). Check: sidebar identical to other pages.

### P5 UI: components and states
Goal: every state of section 2 built as small components (one per file) in `apps/web/src/features/library/`.

#### P5.1 Page frame
- [x] P5.1.1 `LibraryScreen.tsx`: wrap in `<div className="library-doc">`; keep lazy route; layout header / tabs / More strip / banner / body as HTML 204-375. Check: at 1366 px matches the HTML.
- [x] P5.1.2 `LibraryHeader.tsx`: sticky top 0, white, bottom border, padding 12/24 px; h1 "Library" (headline-md); pill "Doctor only" (hidden under 640 px, HTML 207); search: rounded-full, min height 44 px, width 288 px (208 px under 640), icon left 12 px; placeholder per HTML 915. Check: sticky on scroll; placeholder changes per tab.
- [x] P5.1.3 Header Add button: primary fill, min height 44, padding 8/16, radius 8, icon + "Add <LIST_DEFS itemName>" with the HTML words (HTML 914; "medicine set", "procedure", "visit type", "diagnosis", "quick phrase", "tooth condition", "allergen", "referral source", "checklist item": map from LIST_META, HTML 417-428). Check: label per tab.
- [x] P5.1.4 List header: title (title-lg) and help text from `LIST_DEFS` (not `LIST_META`), HTML 349-353. Check: text equals LIST_DEFS.
- [x] P5.1.5 Keep `MedicinesListReview` under the Medicines cards. Check: still visible on Medicines.

#### P5.2 Tabs and More strip
- [x] P5.2.1 `LibraryTabs.tsx`: 7 tab links (role tablist, routes unchanged), pill min height 44, padding 6/14, label-md; active = primary fill + white; idle = on-surface-variant, hover surface-low; strip scrolls sideways inside itself (HTML 222). Labels: "Procedures and fees" (LIST_DEFS-style words; the HTML's `&` in 881 is not used). Check: arrow keys move between tabs (existing `tabs-keys`).
- [x] P5.2.2 Tab change clears search, resets status pills to Active, leaves reorder, closes expanded cards, hides the banner (HTML 505-516, L20). Check: T1.
- [x] P5.2.3 `LibraryMoreStrip.tsx`: shown only under More; "Setup lists:" + 4 buttons (min height 40, radius 8, label-sm, border); selected = secondary-container + primary text; `/app/library/more` redirects to `conditions`; "More" tab stays active on the 4 lists; changing sub-list also clears search (L20; HTML 517 does not). Check: T2.

#### P5.3 Filters (Medicines) and status pills (others)
- [x] P5.3.1 `LibraryFilterColumn.tsx`: lg 3 of 12 columns, sticky top 80 px, white, radius 12, padding 16, gap 16; title "Filter Medicines" + "Reset" link (HTML 253-257). Hidden on other tabs (cards take 12 of 12). Check: sticky while the list scrolls.
- [x] P5.3.2 Quick views: "All Medicines" (count of active), "Needs review" (warning pill with count of active + not reviewed), "Hidden" (count). Selected = secondary-container + primary text; min height 40. Address keeps it (`?filter=review|hidden`). Why: owner, HTML 266-274 trimmed. Check: T3.
- [x] P5.3.3 "More Filters" button (min height 44, primary text, tinted, border primary 35 %) + collapse box holding ONLY: Category (select of categories in use, case-insensitive, sorted), Dosage form (select by `medicineFormKey`, words from `MEDICINE_FORM_WORD`, L15), Strength + Brand (two text inputs side by side), Combination (All / Yes / No), Added by (select of names in use). Why: owner keeps Added by + Combination. Check: T3.
- [x] P5.3.4 Other lists: "Active n" / "Hidden n" round pills (min height 40), selected = primary fill; hidden while reordering (HTML 938-948). Check: counts follow Hide / Show again.
- [x] P5.3.5 NOT built: sets-only switch, status select, date filters, custom date row, Advanced box (Route, Manufacturer, Rx, Schedule, Storage). Why: Q1, review. Check: none of these words on screen.
- [x] P5.3.6 `library-view.ts` `filterItems`: Medicines search matches label, `salt`, `brand` (case-insensitive); others match label. Unit tests in `library-view.test.ts`. Check: "amox" finds by salt and by brand.

#### P5.4 Cards
- [x] P5.4.1 `LibraryCard.tsx`: article, radius 12, 1 px border, padding 16, small shadow, hover border primary (150 ms, M6); row = left (chevron, name title-md, pills, detail line) + right (actions); stacks under 640 px (HTML 1014-1028). Check: matches HTML at 1366.
- [x] P5.4.2 Tints from `categoryTint` (P1.1.8): info -> info-container 25 % / info border 25 %, warning -> warning-container 30 % / warning 30 %, secondary -> secondary-container 30 % / primary 20 %, success -> success-container 30 % / success 25 %, neutral -> surface-low 70 % / outline-variant; other lists per HTML 870-873; hidden card = surface-low 60 % + opacity .8. Category pill only when category is not empty. Check: T3 visual.
- [x] P5.4.3 Detail line: Medicines "<form> · <strength> | <dose> · <frequency> | You wrote this <total> times (<last30> in the last 30 days)" (blank form/strength left out, no stray dots; counter "-" if usage failed; "(this name)" added when two active medicines share the name, L3); Sets: chips of CURRENT medicine names from `resolveSetMedicines`, a hidden/missing one shows its word ("Hidden" / "Not in your list") and the card says "Not offered in visits until fixed. Edit the set to remove it." (Q12); Procedures: code (mono) + "Usual fee: ₹4,500" (`formatMoney`); Visit types: "<minutes> mins · <colour name> tag" + a 12 px swatch (L19); Phrases: text clamped to 2 lines; More lists: code in mono. Check: T19, T20, T10.
- [x] P5.4.4 Medicine expand (click on card, not on buttons): box with Salt, Brand, Timing (`foodTiming Word`, empty -> "As directed", never the HTML's "After food" default, L16), Days; 3 columns from 640 px. No Route, Mfg, Storage, created/updated (Q1). Check: expand, collapse, survives refresh (keyed by id).
- [x] P5.4.5 Non-medicine expand (Q11): box with "Created by", "Created on", "Last updated" ("24 Nov, 4:10 pm by Dr Sharma" via `istDateTime`; seeded rows "Starter list"). Phrases: the box also shows the full text. Check: T34.
- [x] P5.4.6 Actions: "Confirm" (needs-review medicines only, warning tint) opens the Edit modal filled in; "Edit"; "Hide" / "Show again"; all min height 44; clicks do not toggle expand (HTML 979). No Delete. Check: T9, T12.
- [x] P5.4.7 Pills: "Needs review" (warning), "Hidden" (surface-container, words, not colour alone). Check: T12.

#### P5.5 Add/Edit modal
- [x] P5.5.1 `LibraryModal.tsx` on `ui/Dialog` (focus trap, Esc, scroll lock, scroll save around `showModal`): max width 512 px, radius 12, padding 20, gap 16; title "Add <item>" / "Edit <item>"; X (40 px); footer Cancel + Save (with icon), top border. Body scrolls, header and footer stay (L21). Check: at 768 x 1024 and 1024 x 768 Save is visible without scrolling the page.
- [x] P5.5.2 `MedicineForm.tsx`, field order as HTML 731-757 minus dropped fields: Medicine name (required; label "Medicine name"; suggestions below), Generic / Salt + Brand (2 columns), Category (text with suggestions of categories in use, starts EMPTY) + Form (text, suggestions from `MEDICINE_FORM_WORD`) + Strength (3 columns), Usual dose + Frequency (2 columns), Food timing (select: blank = "As directed", "After food", "Before food"; an existing other value shown as an extra option so nothing is lost, Q10) + Days (2 columns), Combination switch, "More details" (Instruction, Tags), then created/updated lines at the bottom (Edit only). Placeholders from the HTML ("Enter salt", "e.g. 1 tablet, 10 ml", "e.g. 2 times a day", "e.g. 5 days"). Check: T5, T6.
- [x] P5.5.3 Combination switch starts ON as a suggestion when the typed name contains "+" and the doctor has not touched it; once touched it keeps the doctor's choice. Check: T6.
- [x] P5.5.4 `GenericForm.tsx` for procedures (Usual fee in rupees, "₹" prefix, stored paise, Code), visit types (Usual length select 5..240 step 5; colour = 7 named swatches + "Custom colour" keeps an existing other hex), diagnoses, referral sources (name only), quick phrases (Full text textarea, counter "n / 500"). Check: T19, T20.
- [x] P5.5.5 More lists: fields from `LIST_DEFS` (conditions: code, colour, icon, applies to; allergens: match tag + line "A wrong tag can miss an allergy warning."; checklist: code, section, alert label, restricted yes/no + line on the card "Restricted" in words). Check: T21.
- [x] P5.5.6 `SuggestBox.tsx`: list under the name field only when `suggest()` returns matches (never on focus with nothing typed); up to 8 rows, 44 px each, arrow keys + Enter, Esc and Tab close; picking fills the NAME only (Q4); never for fees. Check: T18.
- [x] P5.5.7 Every Edit view shows at the bottom: "Added <when> by <name>" and "Last changed <when> by <name>" and the line "Past prescriptions, bills and visits keep their own copy." Check: T9.
- [x] P5.5.8 `UnsavedChangesGuard`: Cancel, X, Esc, outside click ask "Leave without saving?" only after something was typed. "Save and add another" button on Add. Check: T22.

#### P5.6 Medicine sets and hiding
- [x] P5.6.1 `SetForm.tsx`: Name + medicine picker (search ACTIVE medicines, chips with remove "x", 44 px); a medicine not in the list offers "Add it to Medicines first" which opens the medicine modal and returns to the set with it added. Saves `item_ids` and `items` (current labels). Why: Q3, Q6. Check: T17.
- [x] P5.6.2 Editing a set that holds a hidden or missing medicine shows that chip marked "Hidden" / "Not in your list" with its remove "x"; Save is allowed only when every chip is "ok" and at least one medicine is left ("A set needs at least one medicine."). Why: Q12. Check: T35.
- [x] P5.6.3 Old sets without `item_ids`: the form fills chips via `resolveSetMedicines` (active name matches); saving writes `item_ids`. Check: T35.
- [x] P5.6.4 NOT built: Delete button, delete modal, 7-second timer (HTML 398-414, 819-860, 983). Check: no "Delete" word on the page.
- [x] P5.6.5 `HideMedicineDialog.tsx` (app `ConfirmDialog` look): when "Hide" is pressed on a medicine that `setsUsingMedicine` finds, show "This medicine is in N sets: <names>." with buttons "Remove from sets and hide" (default), "Hide only (these sets stop showing in visits)", "Cancel"; calls `POST /lists/medicines/:id/hide`; `emptySets` from the reply shows "Not changed: <set> would have no medicine left. Edit or hide that set." Why: Q12. Check: T10, T36.

#### P5.7 Banner, save states, empty and loading
- [x] P5.7.1 `LibraryBanner.tsx`: under the tabs, margin 12 top / 24 sides, radius 12, success-container, success border 40 %, padding 10/16, check icon + text + X (36 px), `role="status"`; texts: `"<name>" added to <List>. It is at the end (position N).`, `Updated "<name>".`, `Saved and marked reviewed.`, `"<name>" is hidden from clinic choices.`, `"<name>" is active again.`; no auto-hide; hides on X and on tab / sub-list change (L20); re-keyed per message so M1/M2 replay. Errors go to the app toast. Check: T32.
- [x] P5.7.2 All writes through `useSubmitOnce`: Save shows "Saving...", one request per click; failure keeps typed values and shows `problemText`; 409 says "This item was changed. Reloaded." and reloads the list. Check: T23, T24.
- [x] P5.7.3 Offline: `OfflineGuard` blocks Save with its sentence, typed text kept. Check: T27.
- [x] P5.7.4 Empty: "Nothing matches your current filter." + "Reset filters" (HTML 955); an empty list (no items at all) says "No <items> yet." + the Add button; Needs review 0 says "All medicines reviewed." Check: T3, T37.
- [x] P5.7.5 Loading: tab names and title at once, 3 skeleton cards; load error: sentence + Retry (other tabs still work); usage failure shows "-" in the counter only; "Show more (N left)" after 25 cards. Medicines and Sets lists load in parallel on first open (`scope.shared`, no waterfall). Check: T16, T26.

#### P5.8 Reorder and sort
- [x] P5.8.1 "Reorder" button (min height 44, swap icon) turns on reorder: clears search, filters and sort (restored on Done), shows the banner of HTML 368-371, shows only ACTIVE items, hides status pills, cards show the drag handle and up/down arrows (44 px), no expand. Why: brief, HTML 916-917. Check: T13, T14.
- [x] P5.8.2 Arrows call `move` (optimistic order, rollback with a sentence on refusal); first "up" and last "down" disabled; with one item Reorder is disabled ("Only one item."). Announce "Moved to position N of M" (aria-live polite). Check: T13.
- [x] P5.8.3 Drag (mouse only; touch uses arrows, L22): on drop call `move-to` with the target's position; optimistic, rollback on refusal. Check: T13.
- [x] P5.8.4 Sort select (min height 44): "Sort: Custom order", "Sort: A → Z", "Sort: Z → A" (HTML 357-359), client-side; A to Z / Z to A disables Reorder with the reason "Switch to Custom order to reorder." Check: T15.

### P6 UI: motion (one sub-point per row of section 3)
Goal: every animation of the HTML, same duration and easing, measured.

#### P6.1 Motions
- [x] P6.1.1 M1 banner enter: keyframes opacity 0 -> 1, translateY(-8px) -> 0, scale .98 -> 1, 220 ms cubic-bezier(0.2,0,0,1), replays per message. Check: probe 220 ms +-20 %, >= 8 frames.
- [x] P6.1.2 M2 check pop: scale .5 -> 1.18 (65 %) -> 1, opacity 0 -> 1, 320 ms same easing. Check: peak near 208 ms.
- [x] P6.1.3 M3 More Filters: `grid-template-rows` 0fr <-> 1fr 240 ms cubic-bezier(0.2,0,0,1) + opacity 200 ms ease; inner `overflow: hidden`; `aria-expanded`. Check: T4, no jump of other elements.
- [x] P6.1.4 M4 chevron 0 -> 180 deg, 200 ms cubic-bezier(0.4,0,0.2,1). Check: probe.
- [x] P6.1.5 M5 card chevron: instant (no transition). Check: computed transition none.
- [x] P6.1.6 M6 hover colours 150 ms cubic-bezier(0.4,0,0.2,1) on header Add, tabs, cards, More Filters. Check: computed 150 ms.
- [x] P6.1.7 M7 drag: dragged card opacity .6; drop target 1 px ring + primary border; instant. Check: state classes during drag.
- [x] P6.1.8 M8 modal: app Dialog behaviour, no new motion. Check: none.
- [x] P6.1.9 M9 list change: no animation; scroll position and expanded cards kept. Check: scrollY same after Hide.

#### P6.2 Reduced motion
- [x] P6.2.1 `@media (prefers-reduced-motion: reduce)` in `library-doc.css`: M1 opacity only, M2-M4 instant. Check: probe with reduced motion on.

### P7 UI: phone/tablet, keyboard, shared pieces
Goal: the page works at 360 and 768 px and with the keyboard, and the shared pieces of 4b are applied where they live.

#### P7.1 Widths (HTML silent; copied from `docs/design/proposal/PhoneLibrary.dc.html` and the current library.css)
- [x] P7.1.1 768 px: one column; the filter column becomes a "Filters" row above the cards (collapsed, same M3 motion). Check: T30.
- [ ] P7.1.2 360 px: header wraps (title row, then search full width + Add icon button 44 px); tabs scroll sideways inside their strip; "Filters" button opens a bottom sheet (`ui/Dialog`); card actions on their own line; modal full screen with sticky footer; a "‹ More" link back on the More lists. Check: T30, no sideways page scroll.

#### P7.2 Keyboard and focus
- [x] P7.2.1 Visible focus ring (2 px primary) on tabs, chips, cards (card itself focusable, Enter/Space toggles expand), actions, modal fields, suggestions; Esc closes the modal and returns focus to the opener; arrow buttons reachable. Check: T31.

#### P7.3 Shared pieces (4b)
- [x] P7.3.1 `apps/web/src/features/prescriptions/useVisitPrescription.ts` `applySet` (118-123): resolve with `resolveSetMedicines`; build all new lines first and call `replaceItems` ONCE (fixes L12: today each `addMedicine` reuses the `rx`, `lines` and `busy` of the render before the loop, so the 2nd medicine can create a second draft or hit a 409). Check: new unit/e2e test "set of 3 adds 3 lines in one request" (write it FAILING first on the old code).
- [x] P7.3.2 `VisitMedicinesPanel.tsx:253`: offer only sets where `isSetUsable` is true (Q12). The visit page look does not change. Check: T36.
- [x] P7.3.3 `apps/web/src/features/prescriptions/AddMedicineInline.tsx:30-40`: use the `item` from the add reply (P2.1.1) instead of `list.find(label)`; build input with shared `fillAsDirected` (`apps/web/src/features/lists/medicine-input.ts` re-uses `AS_DIRECTED` from shared). Check: visit "Add to my list" spec green.
- [x] P7.3.4 `apps/web/src/features/library/api.ts`: usage shape `{ total, last30 }`; remove the old 30-day-only type. Check: types pass.
- [ ] P7.3.5 Pickers that read lists (QuickBookDialog, VisitChartPanel, MedicalHistoryForm, PlanAddForm, WalkInDialog, visit medicine search): when two ACTIVE items share a label, show "label · detail" (medicine: strength; procedure: fee; others: code). Which pickers can show twins is UNVERIFIED: list each in the Log. Check: T33.

### P8 Docs and measurement
Goal: the work is recorded and measured.

#### P8.1 Docs
- [x] P8.1.1 `docs/MAP.md` (new library files, design-fonts.css, medicine-set.ts, dental-suggestions.ts), `docs/STATE.md`, `docs/USER_MANUAL.md` (Library section: Needs review, sets rule, Hide dialog), `docs/HANDOFF.md` (0065 for the owner, next free 0066), `docs/design/handoff/INDEX.md` status. Check: files updated.
- [x] P8.1.2 Give the owner the migration command for 0065 (never applied by the agent).

#### P8.2 Measurement and specs
- [x] P8.2.1 Motion probe (`.claude/skills/design-apply/motion-probe.template.ts`) for M1-M4, M6 with a 300 ms delay on `**/api/**`; numbers in the Log. Check: section 11 targets.
- [x] P8.2.2 Port `e2e/library.spec.ts`, Library parts of `e2e/part5-keyboard-widths.spec.ts` and `redesign-part5.spec.ts` to the new selectors; run the visit specs that use sets and "Add to my list". Check: all green.
- [x] P8.2.3 Screenshots at 360, 768, 1366 into `docs/ui-audit/screenshots/redesign/library/`. Check: files present.

Migration number: 0065 (the owner applies it). Status machines: none touched.

## 6. Logic changes (frontend)
New files (one component per file, small): `LibraryScreen.tsx` (frame, routes), `LibraryHeader.tsx`, `LibraryTabs.tsx`, `LibraryMoreStrip.tsx`, `LibraryFilterColumn.tsx`, `LibraryCard.tsx`, `LibraryCardDetails.tsx`, `LibraryModal.tsx`, `MedicineForm.tsx`, `SetForm.tsx`, `GenericForm.tsx`, `SuggestBox.tsx`, `HideMedicineDialog.tsx`, `LibraryBanner.tsx`, `useLibraryList.ts` (state), `library-view.ts` (filters, counts, sort), `library-doc.css`. Remove `LibraryDrawer.tsx`, `MedicineAddForm.tsx`, `LibraryRow.tsx`, `LibraryList.tsx` and `library.css` once replaced.

State per list (`useLibraryList`): `items | null`, `problem`, `usage` (medicines only, never blocks), `sets` (loaded with medicines, for the hide dialog and set cards), `filter` (medicines: all | review | hidden; others: active | hidden), `query`, `moreFilters`, `sort` (custom | az | za), `reorder` (+ saved filters to restore), `expanded` (Set of ids), `shown` (25 steps), `modal` ({ mode, item? } | null), `banner` ({ id, text } | null). The address keeps the list key and `?filter=`.

Rules:
- Writes go through one `apply()` (`useSubmitOnce`, 409 reload). Optimistic ONLY for Hide / Show again and order (allowed: status and order); rollback with one plain sentence. Medicine content, fees and sets are never optimistic.
- The server decides duplicates, validation, versions, `reviewed`, "As directed" fill, the set changes on hide.
- Confirm opens Edit filled in; Save sends `reviewed: "yes"`.
- New item goes to the end (server: `MAX(sort_order)+1`); banner says the position; "Save and add another" keeps the modal open, empty.
- Reorder clears search / filters / sort and restores them on Done.
- Expand toggles on card click and Enter/Space; buttons do not toggle; expansion keyed by id survives refresh.
- Medicine sets: only active medicines can be picked; hiding a medicine in a set goes through `HideMedicineDialog` (Q12); renaming needs no warning (ids, Q6).
- Receptionist: `RequirePermission` page, as now.

## 6b. Logic problems and design issues (checked against the real code)
| # | Problem | Proof (file:line or screen) | Fix (in plan) or owner question (Q#) | Sub-point |
|---|---|---|---|---|
| L1 | Reorder can swap with a hidden item: nothing moves on screen. | `packages/db/src/repos/lists.ts:169-178` neighbour query has no `active` filter | Fixed in plan: neighbour among active only. | P1.5.5 |
| L2 | Duplicate check would compare the `reviewed` flag and treat empty vs "As directed" as different. | `lists.ts` stores `reviewed` in data_json (`packages/shared/src/lists.ts:141`) | Fixed: canonical data without `reviewed`, after "As directed" fill. | P1.1.5, P1.5.1 |
| L3 | Two same-name medicines show the same counter (prescriptions store the name). | `prescriptions-usage.ts:21` groups by name | Accepted: "(this name)" added when twins exist. | P5.4.3 |
| L4 | Seeded medicines all land in Needs review. | no seed sets `reviewed` (0032) | Q5: seeded = reviewed. | P1.4.2, P1.4.4 |
| L5 | Visit and "Add to my list" find medicines by name; twins can fill the wrong strength. Corrected 2026-11-26: the visit list is active-only (`useVisitPrescription.ts:51`); `AddMedicineInline.tsx:39` still takes the first label match. | as said | Q6: sets store ids; add uses the returned id. | P1.2.3, P2.1.1, P7.3.3 |
| L6 | Time of Day would be Library-only and clash with Frequency. | HTML 751 | Q7: not built. | P1.1.2 |
| L7 | "As directed" in Strength/Form reads oddly. | screen "Tablet · As directed" | Q8: those stay blank. | P1.1.3 |
| L8 | Seeded medicines carry category "DRAFT - doctor to confirm" and placeholder doses ("Fake defaults only; not clinical advice"), and migration 0032 runs on the real clinic too. | `packages/db/migrations/0032_medicines_seed.sql:1,13-30` | Q9 (owner): seeded medicines are added directly, no review. Agent: 0065 also blanks that exact category text so no card shows a "DRAFT" pill. | P1.4.2 |
| L9 | Food timing options differ: design After / Before / With food / Empty stomach; app stores before_food, after_food, bedtime, anytime. | HTML 752; `packages/shared/src/prescriptions.ts:16-24` | Q10 (owner): only After food and Before food; blank = "As directed"; old values kept as stored. | P1.1.6, P5.5.2 |
| L10 | Non-medicine expand showed only created/updated, which the owner had moved to Edit, so the expand would be empty. | HTML 1002-1008 | Q11 (owner): non-medicine expand shows Created by, Created on, Last updated. | P5.4.5 |
| L11 | A set with a missing or hidden medicine is skipped silently in the visit: the doctor may think all were added. | `useVisitPrescription.ts:119-122` (`if (med)`) | Q12 (owner): sets hold only Library medicines; hiding a medicine in a set asks to remove it; a set not fixed is not offered in visits. | P1.2.4-P1.2.6, P1.5.7, P5.6.5, P7.3.2 |
| L12 | BUG today: applying a set adds medicines in a loop, and each `addMedicine` uses the `rx`, `lines` and `busy` of the render before the loop. The 2nd medicine reuses the old version (409) or, with no draft yet, creates a second draft prescription. Found by reading, not yet run. | `useVisitPrescription.ts:83-115` (`ensureDraft` reads `rx`, `replaceItems(..., [...lines, added])`), `118-123` loop | Fixed in plan: one `replaceItems` with all lines; failing test first. | P7.3.1 |
| L13 | Usage counter counts a revised prescription twice (revise = new row with the same visit). | `prescriptions-issue.ts:47,113-119`; `prescriptions-usage.ts:22` counts prescription ids | Fixed: count distinct visit (or prescription when no visit). | P1.6.1 |
| L14 | Counter mixes doctors; the schema allows a second doctor. | `prescriptions-usage.ts:24-31` no `doctor_id` filter; `users.ts:14` role enum | Fixed: only the signed-in doctor's prescriptions ("You wrote this..."). | P1.6.1 |
| L15 | Two form vocabularies: seed and prescriptions use Tab/Cap/Syp, the Library add form uses Tablet/Capsule/Syrup; a Dosage form filter would split one form in two. | `packages/shared/src/prescriptions.ts:13`; `apps/web/src/features/lists/medicine-input.ts:3`; 0032 rows | Fixed: `medicineFormKey` groups them; stored text unchanged. | P1.1.7, P5.3.3 |
| L16 | Design shows "After food" when timing is empty: a clinical instruction nobody gave. | HTML 988 | Fixed: show stored value; empty = "As directed" (Q8). | P5.4.4 |
| L17 | Dropping the unique index allows two exact twins from two tabs at the same moment (check and insert are separate). | `lists.ts:62-70` then `103-121` | Accepted: one doctor, `useSubmitOnce` stops it in one tab; a twin is harmless and can be hidden. | P1.5.1 |
| L18 | "Created by" for seeded rows is the id `system`, not a person. | migrations 0016, 0032 `created_by = 'system'` | Fixed: shows "Starter list". | P1.5.4 |
| L19 | Card shows a colour NAME ("Teal tag"); the app stores hex and has a free colour picker. | HTML 967; `lists.ts:56` colour field; 0016 hex values | Fixed: 7 named swatches (the seed colours) + "Custom colour" for any other hex. | P1.1.9, P5.4.3, P5.5.4 |
| L20 | Banner never hides and stays when the tab changes (old message on a new list); search stays when the More sub-list changes. | HTML 556-559, 517 | Fixed: banner and search clear on tab and sub-list change; X still closes. | P5.2.2, P5.2.3, P5.7.1 |
| L21 | Modal has no max height: the medicine form pushes Save below the screen on a landscape tablet. | HTML 381 (no max-height / overflow) | Fixed: modal body scrolls, header and footer stay. | P5.5.1 |
| L22 | HTML5 drag works with a mouse only; tablets cannot drag. | HTML 642-676 (`dragstart`) | Fixed: arrows are the touch and keyboard way; drag kept for mouse. | P5.8.3 |
| L23 | Category colours match exact words only; categories are free text ("antibiotic" gets the wrong tint); empty category got green. | HTML 864-868 | Fixed: case-insensitive mapping; empty = neutral. | P1.1.8, P5.4.2 |
| L24 | `move` sets `updated_at/by` on both swapped rows, so "Last updated" changes when only the order changed. | `lists.ts:185-202` | Accepted: one doctor, audit row has the detail. Not changed. | none |

## 7. New things that need the owner's answer
| # | Question | Options | Default if no answer | Owner's answer |
|---|---|---|---|---|
| 1 | Design (7) still shows delete, Route/Mfg/Rx/Schedule/Storage, sets-only switch, date filters, extra quick views, one-tap Confirm, created/updated on the card. Build per your earlier answers? | A: earlier answers win (Recommended). B: build the HTML. | A | A (2026-11-25, chat) |
| 2 | Medicine form: "Time of Day" and "Generic / Salt"? | A: both. B: Time of Day only. C: neither. | B | A (2026-11-25); Time of Day later dropped by Q7 |
| 3 | Medicine set picker (active medicines, chips, "Add it to Medicines first")? | A: yes (Recommended). B: keep text field. | A | A (2026-11-25) |
| 4 | Suggestion fills more than the name? | A: names only now (Recommended). B: fill all, DRAFT. | A | A (2026-11-25) |
| 5 | (L4) Seeded medicines all in Needs review. | A: mark seed reviewed (Recommended). B: keep. | A | A (2026-11-26) |
| 6 | (L5) Lookups by name; twins. | A: sets store ids (Recommended). B: block twins in sets. C: leave. | A | A (2026-11-26) |
| 7 | (L6) Time of Day clashes with Frequency. | A: drop (Recommended). B: print. C: Library only. | A | A (2026-11-26) |
| 8 | (L7) "As directed" in Strength/Form. | A: leave blank (Recommended). B: everywhere. | A | A (2026-11-26) |
| 9 | (L8) Seeded medicines have "DRAFT - doctor to confirm" category and placeholder doses; Q5 marks them reviewed. | A: keep in Needs review (Recommended). B: reviewed, clear DRAFT. C: reviewed, keep text. | A | Owner (chat 2026-11-26): "seed wale me koi review nahi hoga, direct add ho jayegi" = seeded are reviewed (Q5 stays). Agent: the DRAFT category text is blanked (B). |
| 10 | (L9) Food timing options. | A: app's four + As directed (Recommended). B: all six. C: design's four. | A | Owner (2026-11-26): food timing = when to take the medicine: only "After food" and "Before food". |
| 11 | (L10) What a click does on non-medicine cards. | A: no expand except phrases (Recommended). B: opens Edit. C: all fields. | A | Owner (2026-11-26): expand shows only who created it, the date created and when it was last edited. |
| 12 | (L11) Set with a missing/hidden medicine on the visit page. | A: add the rest, name the skipped (Recommended). B: refuse the set. C: leave. | A | Owner (2026-11-26): sets are made only in the Library from Library medicines, and only those sets show in the visit. When a medicine in a set is hidden ("deleted"), removing it from the set is required; if it is not removed, that set is not offered in the visit. Future idea (not now): monthly suggestion "these medicines are often given together, make a set?" -> docs/FUTURE_IDEAS.md A7. |

Decided by the plan (tell the plan if you disagree): modal instead of the right drawer (HTML wins); app toast stays global, Library has its own banner; phone layout copies PhoneLibrary + current library.css; Reorder clears and restores search/filter/sort; "Needs review 0" says "All medicines reviewed."; delete not built; and the agent fixes and acceptances L12 to L24 above.

## 8. Decisions already taken (also in docs/DECISIONS.md)
- Library brief (2026-11-25): exact duplicate blocked only; who/when in Edit; Hide only, no delete; doctor only; bundled dental suggestions, matching only; sets only from existing medicines; fees never suggested.
- Library review (2026-11-25): keep Added by, Last updated by, Combination; drop Route, Manufacturer, Rx, Schedule, Storage; quick views All, Needs review, Hidden; Confirm opens the card; written-N-times counter.
- Library medicine card form (2026-11-25): only Name required; Combination switch; counter total and last 30 days.
- Library re-check Q5-Q8 (2026-11-26) and Q9-Q12 (2026-11-26, this run): see section 7.
- Doctor visit design: the visit page has its own final design; only behaviour changes there (P7.3).

## 9. Design apply checklist
- [x] HTML saved and README.md row added (2026-11-26)
- [x] P1 to P3 backend done and tested; migration 0065 given to the owner
- [x] P4 tokens, fonts, icons (scoped `.library-doc`, also on modal, banner, suggestion list)
- [x] P5 components (one per file, small)
- [x] P6 every motion in section 3 + reduced motion
- [x] P7 phone 360 / tablet 768, keyboard, shared pieces (visit sets, Add to my list, pickers)
- [x] P8 docs (MAP, STATE, USER_MANUAL, HANDOFF, INDEX), probe numbers, specs, screenshots

## 10. Test cases (state x interaction x edge)
| # | Case | Steps | Expect (look) | Expect (numbers) |
|---|---|---|---|---|
| T1 | Each of 7 tabs | click each, then Back | tab fills, search clears, banner hides, list changes, address keeps list and filter | skeleton while loading; first change < 100 ms |
| T2 | More lists | More, each of 4 sub-lists, type a search, switch sub-list, reload | strip only under More; More stays selected; search cleared on switch; reload keeps the sub-list | no sideways page scroll at 360 |
| T3 | Medicine filters | All, Needs review, Hidden, More Filters (category, form "Tab" vs "Tablet", strength, brand, combination, added by), search by salt and brand | counts follow every change; "Tab" and "Tablet" under one form; Needs review 0 says "All medicines reviewed." | counts equal rows |
| T4 | More Filters x5 fast | click 5 times | smooth, chevron follows, nothing else jumps | rows 240 ms +-20 %, opacity 200, chevron 200, >= 8 frames |
| T5 | Add medicine, name only | type name, Save | dose, frequency, days, timing "As directed"; form, strength, category blank; at the end; banner gives the position | 1 POST |
| T6 | Name with "+" | type "A + B", switch off, type more | Combination ON, then stays OFF | |
| T7 | Exact duplicate | add the same medicine twice | form stays open, "This is already in your list."; with another strength it saves | server 422; one row |
| T8 | Validation | empty name, name 81 chars, fee "abc", phrase 501 chars | one sentence next to the field, values kept | |
| T9 | Confirm on Needs review | Confirm, Save without change | modal filled; after Save pill gone, count drops, banner "Saved and marked reviewed."; created/updated lines at the bottom | `reviewed = "yes"` |
| T10 | Hide a medicine in 2 sets, "Remove from sets and hide" | | dialog names both sets; after: medicine hidden, both sets without it, both still offered in the visit | 1 POST, one batch |
| T11 | Rename a medicine in a set | rename | set card shows the new name; visit set adds it | no warning |
| T12 | Hide, Show again x3 (not in a set) | repeat | "Hidden" pill in words, card dimmed, counts update, banner text | one POST each, optimistic |
| T13 | Reorder | arrows on first/last/only; 5 moves in a row; mouse drag; tablet touch | first up / last down disabled; one item: Reorder disabled; "Moved to position N of M"; touch uses arrows | order after reload = screen |
| T14 | Reorder with search on | search, Reorder, Done | search/filter/sort off during, back after | |
| T15 | Sort A to Z | select | sorted; Reorder disabled with reason; Custom restores order | |
| T16 | Show more | 60 medicines | 25, "Show more (35 left)", 25, 10 | |
| T17 | Set editor | add set, search, remove a chip, hidden medicine not offered, "Add it to Medicines first" | only active offered; returns to the set | `item_ids` and `items` saved |
| T18 | Suggestions | focus empty name; type "am"; "zzz"; pick | nothing on focus; matches only; none for "zzz"; fills name only | no network call |
| T19 | Visit type and phrase | add 45 min, Teal; phrase 500 chars | "45 mins · Teal tag" + swatch; counter; Book dialog shows it | |
| T20 | Procedure fee | type 1500 | "₹1,500"; "Edits never change past bills" | 150000 paise |
| T21 | Allergen / checklist | open each | caution line; "Restricted" in words | |
| T22 | Unsaved guard | type then Esc, X, outside; no typing then Esc | asks only after typing | |
| T23 | Double click Save | fast twice | one POST, "Saving..." | |
| T24 | Server refuses | 422, 409, 500 | values kept + sentence; 409 "This item was changed. Reloaded." | |
| T25 | Slow server 300 ms | T5, T9, T12, T13 | hide/order change < 100 ms; saves show "Saving..." | |
| T26 | Usage fails | block `/library/medicine-usage` | "-" in the counter only | |
| T27 | Offline | offline, Save | blocked with sentence, text kept | |
| T28 | Long name / 500-char phrase | add | readable, actions in reach, phrase clamped, expand shows all | no sideways scroll |
| T29 | Receptionist | open `/app/library` | permission page; no sidebar item | 403 on medicines list, move-to, hide |
| T30 | Widths | 360, 768, 1366 | per P7.1; targets >= 44 px; Save reachable | no sideways page scroll |
| T31 | Keyboard only | Tab through all; Enter on card; Esc in modal | focus ring; expand by Enter; focus returns to opener | |
| T32 | Banner replay | two messages in a row | animates again | M1 220 ms, M2 320 ms |
| T33 | Other pages after the duplicate rule | visit Add to my list, Book dialog, chart conditions, medical history | still work; twins show "name · detail" | visit specs green |
| T34 | Non-medicine expand | click a procedure, a seeded diagnosis | Created by / Created on / Last updated; seeded shows "Starter list" | |
| T35 | Set with a hidden medicine | hide only, then edit the set | chip marked "Hidden" with x; Save blocked until removed; old name-only set opens with chips | |
| T36 | Visit after "Hide only" | open a visit, look at sets | that set is not offered; Show again brings it back | |
| T37 | Empty list | a list with no items | "No <items> yet." + Add | |
| T38 | Set apply in visit (L12) | tap a 3-medicine set with no draft yet, and again with a draft | 3 lines added, one prescription | 1 replaceItems request, no 409 |
| T39 | Usage counter | issue, revise, issue; second doctor writes it | counter +1 for the visit only; other doctor not counted | |

## 11. Measurement targets
- first visible change within 100 ms of the click, even with a 300 ms server (Hide, Show again, reorder arrows, tabs, filters; saves show "Saving...");
- each transition spans >= 8 frames over its HTML duration, no 1-3 frame jump larger than 24 px (M1 to M4);
- no layout jump of other elements, no page scroll movement (sticky filter column stays at top 80 px);
- durations within +-20 percent of the HTML value (220, 320, 240, 200, 200, 150 ms);
- probe: `.claude/skills/design-apply/motion-probe.template.ts`, rAF sampling of opacity, transform, height, scrollY; 300 ms delay on `**/api/**`.

## 12. Log
- 2026-11-25 design-plan: handoff written. HTML not on disk. Waiting for Q1 to Q4.
- 2026-11-25 owner answers: Q1 earlier answers win; Q2 both Time of Day and Generic / Salt; Q3 set picker; Q4 names only.
- 2026-11-26 owner answers Q5-Q8: seed reviewed; sets store ids; Time of Day dropped; empty strength/form blank. L1-L3 fixed in the plan.
- 2026-11-26 design-plan re-check: HTML on disk, read in full; migration number 0064 -> 0065.
- 2026-11-26 design-plan re-run under the new skill rules (Phases, 6b with design issues): section 5 rebuilt as P1-P8 (old B1-B10 folded in, "was B#" noted; nothing was done, so no done item renumbered); every row of sections 2, 3, 4, 4b, 6b mapped to a sub-point. New findings L8-L24 (17) checked against the code; L12 is a live bug in the visit's set button. Owner answered Q9-Q12 in chat. Verified and closed: seed rows have `created_by = 'system'`; all seeded set names exist as medicines; `ListEditor` is imported nowhere; the schema allows a second doctor (counter now per doctor); visit medicines are active-only (L5 corrected). Still UNVERIFIED: icon subset contents (P4.1.2), usage query plan / index (P1.4.5), which pickers can show twins (P7.3.5).
- 2026-11-26 design-apply Phase A (backend) DONE. Commits b0cc136 (P1.1-P1.3 shared rules), 15c6ab4 (P1.4 migration 0065, owner applies), 564f009 (P1.5-P3 repo, routes, tests); 83aaa06 is an unrelated fix (orphan lines in e2e/visit-doctor-lines.spec.ts broke `pnpm lint`). `pnpm check` green: shared 417, web 234, db 491, worker 594 tests.
  - Deviations, tell the plan if you disagree: (a) P1.5.2 `add()` still returns the items (15 callers); the new `addWithId()` returns `{ items, id }` and the POST route uses it. (b) New shared files to keep lists.ts under 300 lines: `list-rules.ts` (canonicalListData, isSameListItem, VISIT_COLOURS, visitColourName), `medicine-set.ts` (also `setDataFrom`), `dental-suggestions.ts`; repo split into `lists-core.ts`, `lists-order.ts`, `lists-hide.ts`. (c) The combination rule is a general `oneOf` on text fields. (d) Usage counts a revision WITHOUT a visit once too: key = coalesce(visit_id, revised_from_id, id). (e) Hide with sets: a set change that hits a stale version makes the hide 409; set rows changed in that same race are not rolled back (one doctor; a set without that medicine is harmless).
  - P1.4.4: `seed-local-clinical.mjs` seeds no medicines (they come from migration 0032, which 0065 marks reviewed), so the file was not touched.
  - P1.4.5 / P3.2.2 plans: usage query `SEARCH prescriptions USING INDEX prescriptions_doctor_status_idx (doctor_id=? AND status=?)` + `SEARCH prescription_items USING INDEX prescription_items_rx_idx`; duplicate read `SEARCH list_items USING INDEX list_items_key_order_idx (list_key=?)`; names `SEARCH users USING INDEX sqlite_autoindex_users_1`. The new index is in 0065. Query-plan guard runs moveTo, hideMedicine and medicineUsage: no scans.
  - P3.2.1 round trips (test `lists-query-count.test.ts`): GET list 2 (1 when only seeded rows), POST 4, PUT 5, move 5, move-to 5, hide with sets 7, usage 1. All <= 10.
- 2026-11-26 design-apply Phase B (UI) and C (measure) DONE. Commits c75e8f3 (P4-P6 UI), 10c9156 (P7.3 visit sets and Add to my list), 4f686e2 (P8.2 specs, 44 px targets, screenshots), plus this docs commit.
  - Deviations, tell the plan if you disagree: (a) P4.1.2: icons are inline SVG (`LibraryIcon.tsx`, Material shapes) instead of re-subsetting the icon font (needs Python fonttools, not allowed here); the visit page font subset is unchanged. (b) Targets are 44 px where the HTML has 40 px (quick views, More strip, status pills, filter fields, Reset) and 36 px (banner X): the project rule and part5-keyboard-widths require 44 px. (c) Under 1024 px the filter column folds into a "Filters" row (same box), no bottom sheet at 360 (P7.1.2 open). No "‹ More" link at 360: the More strip shows the four lists. (d) A validation problem shows as one sentence at the bottom of the form (role alert), not next to the field. (e) `ui/Dialog` got two optional props, `className` and `beforeClose` (other pages unchanged). (f) The page hides the app top bar from 768 px (`body.ld-page`, like the visit page); the app sidebar is untouched. (g) LIST_DEFS medicine_sets help now says "Pick them from your Medicines list." (h) Banner shows after the server answers; the card itself changes at once.
  - Probe (300 ms delay on every API call, 1366 px): M1 banner 214-233 ms (HTML 220), M2 check 314-334 ms (HTML 320), both replay on every message; M3 More Filters rows 215-218 ms (HTML 240), start +50 to +99 ms, 12-14 frames, x5 in a row; M4 chevron 183-218 ms (HTML 200); M5 card chevron transition 0 s; M6 hover 150 ms on cards, tabs, Add, More Filters; T12 Hide / Show again: card leaves the view after 5-22 ms (x3 each); T13 arrows: card moves after 2-5 ms (x5 in a row, no 409); 409 on Hide: card back + "This item was changed. Reloaded."; widths 360/768/1366: no sideways scroll, no control under 40 px (then 44 px in the specs); reduced motion: collapse 0 s, banner fades only. Not measurable: easing curves by eye, real-device speed.
  - P7.3.5 pickers: the visit medicine search already shows "name + strength" per row, so twin medicines are told apart. QuickBookDialog, VisitChartPanel, MedicalHistoryForm, PlanAddForm, WalkInDialog: unchanged (twins there need the same name with other data in visit types, conditions, checklist or procedures; not seen in seed data).
  - L12: the bug was confirmed by reading (stale `rx`/`lines` in the loop); fixed by `linesOfSet` + one `replaceItems`; unit test rx-lines.test.ts (a failing-first test on the old code was not possible: the old code had no pure part to test).
  - Specs: e2e/library.spec.ts 6/6, redesign-part5 Q2.13 2/2, part5-keyboard-widths 20/20, visit-doctor-lines 10/10, visit-to-bill 3/3, frame 5/5, lazy-chunks, role-matrix pass. FAILS: e2e/rx-not-issued.spec.ts at the doctor Today "Open" button on the pending-issue card (Today screen, not touched by this work; the draft prescription itself is made).
  - Note for the owner: running redesign-part5.spec.ts re-saves docs/ui-audit/screenshots/redesign/Q2.11 and Q2.13 PNGs, which already had your uncommitted changes (not committed by the agent).
