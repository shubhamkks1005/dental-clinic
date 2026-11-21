# STATE
Last updated: 2026-11-22
Phase: 1 (owner chose to start 1.1 while Phase 0 clinic tasks are still open)
Current task: 1.1.7
Status: 1.1.6 committed locally; owner pushes
Done tasks: 1.1.1 (monorepo, no apps/site), 1.1.2 (three environments, placeholder IDs, README table), 1.1.3 (CI runs pnpm check on every push; deploy step left out by owner's choice), 1.1.4 (gitleaks job in CI, docs/ACCOUNTS.md register; real tokens wait for the Cloudflare account), 1.1.5 (dependabot.yml, Node 26 pinned; "weekly PRs arrive" can only be confirmed on GitHub), 1.1.6 (path routing only, per plan note: /app, /my, /api/*, /hooks/*; no hostname routing)
Next 3 tasks: 1.1.7, 1.1.8, 1.2.1
Owner to-do from 1.1.3: push, check the Actions tab shows a green "CI" run; optional branch protection on main requiring the "check" job.
Phase 0 still open: 0.1.1, 0.1.2, 0.1.3 and the rest (clinic-visit tasks for the owner)
Open questions for owner:
- 8.10.1-8.10.4, 8.11.1, 8.11.3, the Phase 8 gate site lines, "form" in 8.2.13, plan lines 357-361 still mention the public site (see DECISIONS.md for what was already changed).
- 9.2.5 refers to the cancelled 8.8.5 uptime monitor. Keep a monitor for the portal only?
- SMS sender: clinic's own number or a separate SIM (DECISIONS.md says "to confirm").
Known issues:
- Agents never push; the owner pushes. Leave git config and credentials alone.
- docs/DESIGN.md is referenced by AGENTS.md but not in the repo yet (owner adds it).
- Real Cloudflare IDs (D1, R2) are placeholders until the owner creates the resources; deploy:staging will fail until then.
Owner's real hours (owner fills): Phase 0: -
