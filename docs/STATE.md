# STATE
Last updated: 2026-11-22
Phase: 1 (owner chose to start 1.1 while Phase 0 clinic tasks are still open)
Current task: waiting for owner (after 1.2.3)
Status: 1.2.1-1.2.3 committed locally; staging apply waits for Cloudflare account; owner pushes
Done tasks: 1.1.1 (monorepo, no apps/site), 1.1.2 (three environments, placeholder IDs, README table), 1.1.3 (CI runs pnpm check on every push; deploy step left out by owner's choice), 1.1.4 (gitleaks job in CI, docs/ACCOUNTS.md register; real tokens wait for the Cloudflare account), 1.1.5 (dependabot.yml, Node 26 pinned; "weekly PRs arrive" can only be confirmed on GitHub), 1.1.6 (path routing only, per plan note: /app, /my, /api/*, /hooks/*; no hostname routing), 1.1.8 (README deploy steps, T1-T10 in DECISIONS.md), 1.2.1 (table rules: standardColumns, oneOf, newUlid, rules test), 1.2.2 (db:generate, db:lock checksums + test, README migration rules; "applied on staging" waits for Cloudflare), 1.2.3 (6 base tables + default settings seed; migrations apply clean on empty SQLite and local D1)
Moved: rest of 1.1.7 (`pnpm db:seed` insert into local D1, "developer sees data in the app") is scheduled right after 2.1.1 (owner decision, noted in PLAN.md at 1.1.7 and 2.1.1). Generator + tests are done.
Next 3 tasks: 1.2.4, 1.2.5, 1.2.6
Owner checklist (accounts): Cloudflare account + README "First-time setup"; GitHub settings (Dependabot alerts + security updates on, optional branch protection); add tokens to docs/ACCOUNTS.md when created.
Owner to-do from 1.1.3: push, check the Actions tab shows a green "CI" run; optional branch protection on main requiring the "check" job.
Phase 0 still open: 0.1.1, 0.1.2, 0.1.3 and the rest (clinic-visit tasks for the owner)
Open questions for owner:
- 8.10.1-8.10.4, 8.11.1, 8.11.3, the Phase 8 gate site lines, "form" in 8.2.13, plan lines 357-361 still mention the public site (see DECISIONS.md for what was already changed).
- 9.2.5 refers to the cancelled 8.8.5 uptime monitor. Keep a monitor for the portal only?
- SMS sender: clinic's own number or a separate SIM (DECISIONS.md says "to confirm").
- Patient SMS language: English or Hinglish (OPEN in DECISIONS.md).
- Rate list language (11.9.2): waits for the state law in 11.9.1 (OPEN in DECISIONS.md).
Rule: UI and printed documents are English only (AGENTS.md); PLAN edited to match.
Known issues:
- Agents never push; the owner pushes. Leave git config and credentials alone.
- docs/DESIGN.md is referenced by AGENTS.md but still not in the repo (checked 2026-11-22 01:30; owner to add it).
- Real Cloudflare IDs (D1, R2) are placeholders until the owner creates the resources; deploy:staging will fail until then.
Owner's real hours (owner fills): Phase 0: -
