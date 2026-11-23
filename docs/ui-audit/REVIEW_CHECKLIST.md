# REVIEW CHECKLIST (for every UI task; read before coding, tick before commit)

Put the ticked list, with the screenshot paths, in your final message. If an item does not apply, write "n/a" and why.

## 0. Before coding
- [ ] Named the mockup screen (S01-S19) you follow in `docs/DESIGN.md`, or the closest one, and said so.
- [ ] Looked at the matching page in `docs/ui-audit/PAGES.md`, `FORMS.md`, `WORKFLOWS.md` and open items in `AUDIT.md`. Not making a listed problem worse.
- [ ] Wrote down the user's goal in one sentence and counted the steps/taps to reach it.

## 1. Design system
- [ ] Uses the page frame (container, header, gutters). No local margin hacks.
- [ ] Uses shared `ui/` pieces (form controls, DataTable, Dialog, StatusBadge, PatientNoChip, StatCard). No raw `<input>/<select>/<textarea>`.
- [ ] Only DESIGN.md tokens (colour, radius, 4 px spacing, Inter). No monospace in inputs.
- [ ] One primary button per screen. Destructive actions are not next to routine ones.
- [ ] No bullets, no unstyled lists, no run-together text (name and value separated).

## 2. Navigation and workflow
- [ ] The user can reach the screen from a place they would look first. Nav label matches the page title.
- [ ] The next step is visible without opening another tab. No dead end: every error says what to do next.
- [ ] No step depends on something the user must remember from a previous screen.
- [ ] Actions the current role may not do are hidden or explained. Check both roles (doctor, receptionist).
- [ ] Confirmation only for irreversible actions.

## 3. Forms
- [ ] Field order follows how the user thinks (who, what, when, how much). Optional fields hidden behind "More" when rare.
- [ ] Required vs optional is clear. No silent defaults for clinical or demographic values.
- [ ] Right input types: tel/numeric keyboard, one date widget, `MobileInput`.
- [ ] Validation: plain sentence under the field; first error scrolled into view and focused; button not blocked with no reason.
- [ ] Empty, partly filled, filled, error, saving, success and failed-save states all looked at.
- [ ] Cancel and success feedback (toast or inline) exist.

## 4. Content
- [ ] Short plain English. No system values (`in_chair`, `gst_mode`), no ISO dates, no internal notes on screen or on paper.
- [ ] Status words come from the shared map. Dates and times use the shared helpers.
- [ ] Empty state has one sentence and one action. Read-only views hide empty fields.

## 5. Responsive (check all three, with a screenshot each)
- [ ] 360 px: no horizontal scroll, 16 px gutters, names not truncated to unreadable, tabs/chips scroll with a cue, floating button does not cover content.
- [ ] 768 px: top navigation fits or collapses to "More"; two-column cards stack sensibly.
- [ ] 1366 px: content aligned with the page gutter, not flush to the sidebar, no large dead area beside a narrow form.
- [ ] Touch targets 44 px or more (measure; whole row is the link).

## 6. Accessibility (reasonably verifiable)
- [ ] Every control has a visible label or `aria-label`; focus ring visible; Tab order matches visual order.
- [ ] Text contrast at least 4.5:1; status never by colour alone.
- [ ] Dialogs trap focus, close on Escape, return focus.
- [ ] Keyboard: can do the main task with keys only (the clinic PC has a keyboard).

## 7. Verification (real browser, not just tests)
- [ ] Ran the app on `http://localhost:8787` (not 127.0.0.1) with fake data; walked the task end to end as each role that can use it.
- [ ] Triggered one real write (save, book, pay) and saw it succeed. Mocked unit tests alone are not enough (a double-encoded body once passed every unit test: AUDIT C1).
- [ ] Console and network show no errors (4xx/5xx) during the walk.
- [ ] Saved screenshots at 360/768/1366 under `docs/ui-audit/screenshots/<feature>/` only if they change an audit finding; fake data only.
- [ ] Updated AUDIT.md status of any finding you fixed, and PAGES/FORMS/WORKFLOWS if the screen changed.
