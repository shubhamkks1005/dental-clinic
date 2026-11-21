# apps/web rules (Vite + React SPA)
- Two separate route trees: /app/* (staff) and /my/* (patient portal). The portal has no forms except login.
- The shared typed API client lives in src/api. Each feature keeps its own small API functions in its folder that call that client. Components never call fetch directly.
- Forms validate with the shared zod schema. Finalising a record shows a preview and asks for confirmation. Finalised data is shown read-only.
- Print = browser print of HTML built from the saved immutable snapshot JSON, with @media print CSS. No PDF libraries.
- Receptionist speed matters: keyboard-first patient search and new-patient form, big click targets, no page reloads.
- Never store patient data in localStorage or sessionStorage.
- Every screen must be responsive at 360, 768 and 1366 px: mobile-first CSS (min-width breakpoints), flex/grid, no fixed pixel widths for layout, touch targets at least 44 px, no horizontal page scroll, wide tables become cards on phones. Add the viewport meta tag and test in the browser's device mode. For UI tasks, state in the final message which three widths you checked. Empty states and error states are written in plain sentences.
- File layout and size limits: follow "Code structure" in AGENTS.md (src/features/<name>/, shared parts in src/ui/).
