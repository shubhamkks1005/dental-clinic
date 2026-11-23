# DESIGN_SYSTEM: what exists, where it is not used, what to follow

Source of truth for look and feel stays `docs/DESIGN.md` (approved by the owner). This file records what the code really has and the rules to add. Rules marked **Proposed** are not approved yet (see DECISIONS_UI.md).

## 1. Existing tokens [code: apps/web/src/styles/base.css]
- Colors: `--blue #1e4fa3`, `--navy #0f2a5c`, `--blue-hover`, `--blue-soft #e6eefa`, `--focus #cfddf5`, `--red #c8202a` (clinic name only), `--bg #f3f6f7`, `--card #fff`, `--border #e3e9ee`, `--text #0e1b2b`, `--muted #5b6b7b`, `--teal` (calendar only).
- Status pairs: success `#14532d/#dcfce7`, info `#1e3a8a/#e0e7ff`, warning `#78350f/#fef3c7`, danger `#9a3412/#ffe4d6`, neutral `#334155/#edf1f4`.
- Shape: `--radius-card 16px`, `--radius-control 12px`, `--control-h 48px`. Spacing `--s1..--s6` = 4, 8, 12, 16, 20, 24 px.
- Font: Inter. A contrast test exists (`styles/contrast.test.ts`).
- **Seen in the browser:** the tokens are applied on Today (receptionist), New patient, Settings, dialogs, print. Not applied on Billing, Bill, Reports tables, Messages, profile Billing tab (H2).

## 2. Existing reusable components [code: apps/web/src/ui]
| Area | Component | Notes from the browser |
|------|-----------|------------------------|
| Shell | StaffShell, TopBar, MainNav, BottomTabs, PortalShell | Shell good; TopBar Walk-in has no handler (H1); tablet nav overflows (H9) |
| Form | `Field`, `DateInput`, `MobileInput`, `zodResolver` | Used by 8 feature files; 40 feature files still use raw `<input/select/textarea>` (M2) |
| Table | `DataTable`, `TableFilter`, `TableViews` | Patients list uses a table with page controls; Billing, Bill, Messages do not |
| Overlay | `Dialog`, `ConfirmDialog`, `Menu`, `Tooltip`, `Toast`, `UnsavedChangesGuard` | Dialogs seen: consistent. Toast seen only in code |
| Display | `StatCard`, `StatusBadge`, `PatientNoChip`, `PageMessage`, `OfflineBanner`, `CopyButton`, icons, charts, print/ | Chip and badges consistent where used |
| Nav | `Tabs` (with keyboard test) | Phone tab overflow without cue (M14) |
Missing (needed by the findings): `PageContainer`/`PageHeader`, `Card`, `EmptyState`, `StatusLabel` map, `formatDate` helper, `Money` display, `DetailList` (read-only label/value), `ListRow`.

## 3. Inconsistencies seen
1. Page margins: 0, 16, 24, 72 px at different screens (H5).
2. Two input families: rounded shared vs square native (M2).
3. Three date formats (M1). Times are unified.
4. Status words: raw `in_chair`, `draft`; colour contradicts meaning (green draft); Waiting vs Arrived (H10).
5. Buttons: primary blue, secondary white with border: consistent. But "Cancel bill", "Add call note" and "Print bill" share one weight (H4); chips used both as filters (History) and as actions (Full balance/Half).
6. Text areas in monospace, everything else Inter (visit).
7. Headings: Page title colour is navy on some pages (Patients, New patient, profile) and near-black on others (Today, Billing, Messages, Settings).
8. Links: blue underlined text for "Edit patient or medical history", "Past visits", "Open calendar", patient names: acts as navigation, buttons and rows in other places.
9. Lists: bullets (`<ul>`) leak through on Billing, Bill, Diagnosis.

## 4. Recommended rules (Proposed)
**Layout**
- Every staff screen: `PageContainer` (max-width 1200 at L, left/right padding 16 px at P and 24 px at T/L) > `PageHeader` (title 26/700 navy, optional one-line subtitle, one primary button at the right) > content in cards.
- One main button per screen (DESIGN.md). Secondary actions in a "..." menu.
- Two-column at L only when the second column is genuinely secondary (alerts, last visits, totals). Always with the same gutter as the page.

**Typography:** Inter only (no monospace in inputs). 26 title, 16 card title, 14 body, 12 small. Never below 12 px, except tooth numbers which need 11 px minimum.

**Buttons:** Primary (blue fill) max one per card. Secondary (white, border). Quiet/link for low-risk extras. Destructive actions (Cancel bill, Void, Delete) are menu items or red text buttons behind a reason prompt, never next to Print.

**Forms:** only `ui/form` controls. Label above, helper below (only if it adds information), error replaces helper. Required fields marked; optional fields marked "(optional)" in the label. Default values only when safe (no pre-selected gender). One date widget (typed dd/mm/yyyy with a picker button). Mobile uses `MobileInput` with type tel.

**Tables and lists:** `DataTable` on L/T; on P each row becomes a card with the same fields minus repeated labels. Whole row is the link. Numbers right-aligned, money with ₹ and thousands separators. Empty state with one sentence and one action.

**Cards:** white, 1 px border, 16 px radius, 16-20 px padding, title 16/700. No bullets.

**Status:** one map (`StatusLabel`) from system value to word and colour. Colour pairs from section 1. Draft = neutral, not green. Never colour alone.

**Dates and times:** screen `23 Nov 2026` (relative "Today", "Tomorrow" when close); print `23/11/2026`; time with AM/PM (FIXES #4); durations as `10 h 23 min`.

**Navigation:** phone bottom tabs (5), tablet: same sidebar as laptop or a "More" tab (never a clipped row), laptop sidebar (7). The round "+" belongs to Today and Patients only.

**Modals:** use for short decisions (confirm, quick pick). If it has more than 5 fields or needs scrolling, it is a page. Cancel on the left, primary on the right. Close on Escape. Empty/loading/error states inside the dialog.

**Feedback:** toast for success (with next action link), inline sentence for errors where the user is looking, never a console-only failure. Loading: skeleton or "Loading..." text in the same place.

**Touch:** min 44 px height for any tappable thing; the whole list row is the target.

## 5. Reuse map (for a new screen)
List page: PageHeader + filter chips + DataTable/ListRow cards + EmptyState. Detail page: PageHeader + stat strip (StatCard) + Tabs + Cards. Form page: PageHeader + one Card per group + sticky action bar. Dialog: Dialog + Field. Money screen: use S09 layout (items card, totals card, payment card).
