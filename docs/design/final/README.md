# Final designs (the ones to follow)

**Rule (owner, 2026-11-25): a design in this folder is FINAL. Build exactly this: layout, copy, colours, animations and behaviour (read the file's `<style>` and `<script>` too).** If it disagrees with `docs/design/proposal/`, `docs/design/align-dentistry-screens.pdf` or an older task text, this folder wins. Screens without a file here still use `docs/design/proposal/` (reference only, not final) until the owner adds a final one. The owner adds more final designs screen by screen.

These files are web prototypes (Tailwind CDN, Google fonts, fake data). Rebuild them in the app's own React and CSS: no CDN, no new dependency, no fake data, no copied class names. Where the prototype is silent (phone width, the receptionist side, empty and error states) the plan task says what to copy instead.

| File | Screen | Built by (docs/PLAN.md) |
|---|---|---|
| `doctor_today.html` | Doctor's Today page (laptop and tablet; no phone layout yet) | Part T: backend T1.x, UI T2.x |
