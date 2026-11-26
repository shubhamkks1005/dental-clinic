# Final designs (the ones to follow)

**Rule (owner, 2026-11-25): a design in this folder is FINAL. Build exactly this: layout, copy, colours, animations and behaviour (read the file's `<style>` and `<script>` too).** If it disagrees with `docs/design/proposal/`, `docs/design/align-dentistry-screens.pdf` or an older task text, this folder wins. Screens without a file here still use `docs/design/proposal/` (reference only, not final) until the owner adds a final one. The owner adds more final designs screen by screen.

These files are web prototypes (Tailwind CDN, Google fonts, fake data). Rebuild them in the app's own React and CSS: no CDN, no new dependency, no fake data, no copied class names. Where the prototype is silent (phone width, the receptionist side, empty and error states) the plan task says what to copy instead.

| File | Screen | Built by (docs/PLAN.md) |
|---|---|---|
| `doctor_today.html` | Doctor's Today page (laptop and tablet; no phone layout yet) | Part T: backend T1.x, UI T2.x |
| `doctor_visit.html` | Doctor visit page, "Smart accordion cards" (laptop and tablet; no phone layout) | Doctor-visit handoff (docs/design/handoff/doctor-visit.md), built by design-apply |
| `appointments_calendar.html` | Appointments calendar, week view with booking popover, for the doctor and the desk (laptop; no phone or tablet layout) | Not planned yet: run design-plan. The owner's answers in docs/design/reviews/appointments-doctor.md (2026-11-26) win where the HTML differs: multiple doctors (a doctor sees only their own), any length, clashes allowed, duplicate = name + mobile. Gaps the HTML does not cover (booking details and actions, states, phone) are listed in that review |
| `library_align_dentistry (7).html` | Doctor Library: medicines, sets, procedures and fees, visit types, diagnoses, phrases, More lists (laptop and tablet; no phone layout) | Library handoff (docs/design/handoff/library.md), built by design-apply; the owner's earlier review answers win where the HTML still shows delete, extra filters or one-tap Confirm |
