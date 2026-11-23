# UI/UX audit: Align Dentistry staff app

Audit date: 2026-11-23. Method: the app was run locally (`wrangler dev`, fresh scratch database, 30 fake patients from the staging seed) and driven with Playwright + Chromium at 360, 768 and 1366 px as the **doctor** and the **receptionist** (dev-login stub, fake data only). No application code, auth, schema or config was changed.

## How to use this folder (humans and AI sessions)
1. Before building or changing any screen, read [REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md) and the matching section of [PAGES.md](PAGES.md) / [FORMS.md](FORMS.md) / [WORKFLOWS.md](WORKFLOWS.md).
2. Pick components and tokens from [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Do not invent new ones.
3. [AUDIT.md](AUDIT.md) holds the ranked problem list (IDs like `C1`, `H3`). Other files point to those IDs instead of repeating them.
4. [DECISIONS_UI.md](DECISIONS_UI.md) separates **approved** rules (from the owner's own docs) from **proposals** (mine, not yet approved). Never treat a proposal as a rule.
5. When a finding is fixed, change its status in AUDIT.md in the same commit. Do not delete it.

## Flows (added later the same day)
After the first page-by-page pass the owner asked for real end-to-end runs. Eighteen are done and written up in `flows/`; they replace guesses in WORKFLOWS.md where they overlap, and they found three more blocking bugs (C3, C4 and the money balance in H12). Start with [flows/README.md](flows/README.md).

## Evidence labels
- **[seen]**: observed in a real rendered page (screenshot or measurement from the browser run). A screenshot path is given when one is kept.
- **[code]**: read from the source only. Not seen in a browser. Treat as an assumption until checked.
- **[seen+code]**: seen in the browser, and the cause confirmed in source.

## Priority scale
Critical = blocks a workflow or risks wrong data. High = major confusion or friction. Medium = noticeable, should fix. Low = polish.

## Files
| File | What it holds |
|------|---------------|
| [AUDIT.md](AUDIT.md) | Overall verdict, ranked problems, redesign targets, what is good |
| [PAGES.md](PAGES.md) | Page by page: purpose, route, observations, fixes, responsive notes |
| [FORMS.md](FORMS.md) | Every form: fields, validation, problems, ideal structure |
| [WORKFLOWS.md](WORKFLOWS.md) | End-to-end tasks: current steps, friction, ideal flow |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | What exists, where it is not used, recommended rules |
| [DECISIONS_UI.md](DECISIONS_UI.md) | Approved rules, proposals awaiting the owner, things to avoid |
| [REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md) | Checklist every UI change must pass |
| [flows/](flows/README.md) | **Step-by-step runs in the browser** (18 done): aim, steps, screenshots, problems per flow |
| `runner/` | The scripts that drove the browser, so a flow can be repeated |
| `screenshots/` | 32 fake-data screenshots, by feature (about 3.4 MB) |

## Coverage
Role: D = doctor, R = receptionist. Widths: P = 360, T = 768, L = 1366.

| Area | Route | Seen in browser | Notes |
|------|-------|-----------------|-------|
| Today | /app | D+R, P/T/L | Doctor and receptionist get different layouts |
| Patients list | /app/patients | D, P/L | Tablet only measured |
| New patient | /app/patients/new | D, P/L | empty, validation, partial, filled, more details |
| Patient profile | /app/patients/:id | D+R, P/L | History and Billing tabs viewed; other tabs captured, not reviewed |
| Appointments | /app/appointments | D, P/L | Book dialog, appointment click |
| Visit | /app/visits/:id | D, P/L | Draft, Chart, Medicines tabs, finalise dialog, finalised view, bill error |
| Billing home (dues) | /app/billing | D, P/L | |
| Bill | /app/bills/:id | D, L | |
| Reports | /app/reports | D, L | Phone/tablet captured, not reviewed |
| Messages | /app/messages | D, L | Empty data only |
| Settings | /app/settings | D, L | Clinic details viewed. Timings, Billing, Medicines, Preferences, Messages loaded without error, not reviewed |
| Print | /app/print/* | D, L | Bill, consent viewed. Others loaded without error, not reviewed |
| Dialogs | Book, Walk-in, Finalise | seen | |

**Not inspected (say so, do not assume):** patient portal (`/my` is a placeholder page, Phase 8 not built), staff sign-in page, Plan / Files / Messages tabs of profile and visit, prescription print from a real prescription, certificates (new and register), consent list, requests and error-log content, day close, refunds, discount requests, appointment status actions, tablet width for most pages, offline banner, keyboard-only use, screen reader use.

**Mockup comparison:** the 22-page mockup PDF was rendered (S01, S05, S09 viewed closely; others read from DESIGN.md text). Deviations are listed as "A" items in AUDIT.md.

## Method limits (be honest about these)
- The local database is fake and small: 30 patients, 2 appointments today. Reports and lists look sparser than in real use.
- Seed time was 9 pm, so "Waiting 6xx min" is partly a data artefact. The format problem is real either way.
- Full-page screenshots show fixed elements (sidebar, bottom bar, "+" button) in the middle of long pages. This is a capture effect. Phone viewport screenshots were taken separately to judge the real overlap.
- The Chromium build the repo expects (1255) is not installed; the installed build 1248 was used directly. Existing `pnpm test:e2e` still cannot start until `pnpm exec playwright install chromium` is run.
- Browsing must use `http://localhost:8787`, not `127.0.0.1`: the CSRF guard compares Origin to `APP_ORIGIN=http://localhost:8787`, so writes from 127.0.0.1 return 403 (see AUDIT.md T1).
