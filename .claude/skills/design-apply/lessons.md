# Lessons from the doctor Today build (read before coding)

Each line is a mistake that really happened here. The cause is written so you can recognise it fast.

## Motion that "does not play" or snaps
- **CSS variables out of scope.** The design tokens (`--td-ease`, colours) are defined on a scope class (`.today-doc`). An element appended to `document.body` (the flying box) or rendered in a portal (menus) is outside that scope, so `transition: ... var(--td-ease)` becomes invalid and the whole transition is dropped: the box jumped to the end at once. FIX: give such elements the scope class too. CHECK: sample the element's computed `transition-duration`.
- **Never remove an animation class on an unrelated event.** Removing `is-animating` on any `transitionend` cut the panel animation short. The HTML never removes it.
- **Animate out before removing from state.** If the state drops the item at once (dismiss, cancel), the exit animation never plays. Mark it "leaving", wait the HTML's time, then remove.
- **Initial paint must not animate.** A progress bar went 0 to full on the first paint. Start at the right value with `transition: none`, enable transitions after a short delay.
- **Reduced motion**: keep `prefers-reduced-motion` support (nothing moves, things fade or change at once) unless the handoff says otherwise. If the owner sees nothing move, ask them to check Windows "Animation effects".
- **Never scale the HTML's timings** to make it "faster". Smooth means: starts at once, no waiting for the network, no jumps. The values stay the HTML's.

## Waiting for the server made everything feel slow
- Old code waited for the API (150-400 ms on staging) before changing the screen. The HTML changes the screen at once. RULE: change the screen first, call the server in parallel, on refusal put the screen back and show one plain sentence. Only for status and order, never for money.
- Do not reload the whole page after an action (7 requests, re-sort, jump). Take the new versions from the reply and do one quiet refresh 1-1.5 s later.
- **Stale refresh guard**: a refresh that started before a local change can return old data and undo the change (Start then Done: the chair card came back). Count local changes; if the count moved while the refresh ran, drop that result and ask again shortly.
- Do not share one `busy` flag between buttons (Done showed "Opening..." because Open visit used the same flag).
- Optimistic order must use the same shared function as the server, so a reload gives the same order.

## List reorder (FLIP)
- Read row positions with `offsetTop` (layout), not `getBoundingClientRect().top` (where an animation currently draws it). Reading drawn positions made every second move start from the wrong place. Refresh the positions after EVERY render, animate only when the order key changed.
- A lifted row keeps its scale while it glides.

## Menus and dialogs
- Menus: render in a portal, measure the real height after it appears, open upward when there is no room, give it the scope class. Esc closes and focus returns to the opener (use a short timeout; the anchor may already be cleared).
- `dialog.showModal()` can scroll the page: save scrollX/Y before and restore after. Overlay light, not heavy dark.

## Measuring (what the probe must do)
- Sample every animation frame with `requestAnimationFrame`: top, left, width, height, opacity, transform, background colour of the tracked elements, plus `window.scrollY`.
- Mark the time of the FINAL click (not the start of a multi-step action). Report: ms to first change, duration, frame count, biggest one-frame step, scale/colour change, page scroll movement.
- Add a 300 ms delay to every API call (`page.route("**/api/**")`) to behave like staging. Local runs hide network problems.
- Known false alarms: the HTML's own delays (lift 170 ms, max-height collapse after 140 ms, row removal at 640 ms) look like "slow start". Compare with the HTML before fixing. Playwright's actionability wait adds time to menu/dialog clicks.
- Limits to state honestly: video cannot be read; easing curves cannot be judged by eye; headless speed differs from a real screen.

## Tests and data
- The e2e scratch database is shared by all specs and persists across runs: clear the day first (end the break, finish the chair patient, cancel open appointments) or tests fail by leftovers.
- Playwright selectors: dialogs `getByRole("alertdialog")`; list rows by `data-row-id`; wait for state, not time.
- A new page changes selectors of older specs: port them (see `e2e/doctor-helpers.ts`) or say clearly which still fail.

## Windows and tooling
- The Bash tool breaks on heredocs that contain an apostrophe or on inline `node -e` with quotes inside quotes. Use the Write tool to create scripts/files, then run `node file.mjs`. No Python. Use `$(cygpath -m /tmp)` when node must read a file from /tmp.
- Always run pnpm commands from the repo root or with a correct `cd`; `src/...` paths fail when the working directory is already inside apps/web.
- `git add` explicit paths only. Never `git stash`.
- Prettier rewrites files after your edits: re-read before the next edit if a replace fails.

## Project rules that bit
- Lint forbids raw `<input>` in features/ (use `NativeInput` or the form controls).
- First-load and total JS budgets are tight: put the screen in its own `lazy` chunk.
- A tunable or setting needs a shared entry, a seed migration and tests (tunables-guard).
- A new table needs a retention rule; a new index may be needed for a new list query (query-plan test).

## From the appointments calendar (2026-11-27)
- **Late content moves a placed popover.** A list that arrives after the popover is placed (visit types, 300 ms server) makes it taller and the clamp moves it: a one-frame jump. Load such lists before the first click and keep them. Re-clamp only when the box grows past the window edge, never when it shrinks (shrinking at "Book" moved it 110 px).
- **One toast element.** Two toasts from back-to-back actions stacked on the same spot; remove the old one first (the HTML has one element).
- **Rebuilding `apps/web/dist` while `wrangler dev` runs** leaves the server answering 404 or hanging. Restart the dev server after every web build. Stopping the background task may leave its wrangler and workerd running: stop only the processes on port 8787 that this session started (match command line and start time), never every workerd.
- **`git rm` stages at once.** Another session committed in between and took the staged deletions into its own commit. Stage and commit in the same command.
- **Probe clicks inside a scroll box**: centre the target first (`el.scrollIntoView({ block: "center" })`); a sticky head row can cover a cell that Playwright thinks is visible. Cards over a cell intercept the click: click the cell's free strip.
- **Dates in specs**: `new Date().toISOString()` is UTC; after midnight IST "day + 1" is still today. Book from day 2 when the test depends on "tomorrow".
