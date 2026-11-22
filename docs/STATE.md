# STATE
Last updated: 2026-11-22
Phase: 1 (owner chose to start 1.1 while Phase 0 clinic tasks are still open)
Current task: 1.3.8 Staff Google sign-in (AUTH_PLAN approved 2026-11-22). 1.3.2 done (generic RS256/JWKS verifier + optional Access check, off by config).
1.3.1 Access: optional outer layer, WAITING on a Cloudflare card (Zero Trust asks for one). Done so far: staging D1 created, migrations applied (0000, 0001 on 54a33625-...), staging deployed at https://dental-clinic-staging.shubhamkks1005.workers.dev (/app and /my load). The "/" -> "/app" redirect (committed, not yet deployed) will be replaced by the landing page in 1.3.8. Spike DB deleted.
Status: spike 0.6.3 PASSED on real D1 (2026-11-22, dental-clinic-spike, APAC): batch rollback, changes() audit guard, edit conflict (two tabs + race, 2 audit rows = 1 + 1), gap-free 50 parallel (1..51, no gaps, ~1 s), patient code P-000001. Spike DB deleted (the optional audit-row query was skipped; code path and unit tests confirm 1 + 1).
Done tasks: 1.1.1 (monorepo, no apps/site), 1.1.2 (three environments, placeholder IDs, README table), 1.1.3 (CI runs pnpm check on every push; deploy step left out by owner's choice), 1.1.4 (gitleaks job in CI, docs/ACCOUNTS.md register; real tokens wait for the Cloudflare account), 1.1.5 (dependabot.yml, Node 26 pinned; "weekly PRs arrive" can only be confirmed on GitHub), 1.1.6 (path routing only, per plan note: /app, /my, /api/*, /hooks/*; no hostname routing), 1.1.8 (README deploy steps, T1-T10 in DECISIONS.md), 1.2.1 (table rules: standardColumns, oneOf, newUlid, rules test), 1.2.2 (db:generate, db:lock checksums + test, README migration rules; "applied on staging" waits for Cloudflare), 1.2.3 (6 base tables + default settings seed; migrations apply clean on empty SQLite and local D1), 1.2.4 (takeNumber + patientCodeSql; confirmed on real D1 by spike 0.6.3), 1.2.5 (auditInsert/accessInsert + append-only guard test; "every write endpoint makes one audit row" is enforced per endpoint as endpoints arrive), 1.2.6 (repositories + permission table + settings repo; worker architecture guard; per-request repos middleware comes with 1.3 when ctx has a real user), 1.2.7 (version-checked updates, auditInsertIfChanged, ConflictError -> 409 "Reload" message; the UI side comes with the first edit screen), 1.4.11 (shell restyle to DESIGN.md, S01/S14, Inter self-hosted, checked at 360/768/1366, ₹ renders in Inter)
Moved: rest of 1.1.7 (`pnpm db:seed` insert into local D1, "developer sees data in the app") is scheduled right after 2.1.1 (owner decision, noted in PLAN.md at 1.1.7 and 2.1.1). Generator + tests are done.
Next 3 tasks (after AUTH_PLAN approval): 1.3.2 generic JWT verifier, 1.3.8 Google sign-in, 1.3.3 users and roles (then 1.3.4-1.3.7; 1.2.8 still open; 1.3.1 waits on a card)
Owner checklist (accounts): GitHub settings (Dependabot alerts + security updates on, optional branch protection); add tokens to docs/ACCOUNTS.md when created.
Cloudflare checklist (1.3.1, agreed 2026-11-22):
  A. Dashboard on the owner's personal device: account + 2FA; note Account ID; custom API token "dental-clinic-mac-setup" with Account D1 Edit + Account Workers Scripts Edit, this account only, 30-day TTL. No R2, no card.
  B. This Mac, Cursor terminal: `read -rs` the token (account id is in wrangler.jsonc, not exported), `pnpm wr d1 list`; create dental-clinic-spike -> owner says "spike db created" -> agent sets the id -> `pnpm spike:d1` -> agent reports -> delete the spike DB; create dental-clinic-staging -> agent sets the id -> migrations --remote --env staging -> `pnpm deploy:staging`.
  NOTE: staging is PUBLIC until Access is on (fake data only; never put real patient data on staging). Redeploy once (`pnpm deploy:staging`) so "/" redirects to "/app" on the server before turning Access on.
  C. WAITING (Zero Trust asked for a card; no working card). Kept for later: Dashboard: Zero Trust Free plan (if it asks for a card: STOP and tell the owner before entering anything); One-time PIN; self-hosted app, hostname dental-clinic-staging.shubhamkks1005.workers.dev, paths app and api/staff, Allow 3 emails (if a workers.dev path is rejected: use the staging Worker's Cloudflare Access toggle); send team domain + AUD tag; phone test: unlisted email gets no PIN.
  D. Then delete the setup API token in the dashboard (not only unset). Owner choice now that C waits: delete it now and create a fresh short-lived token for the Google secrets (1.3.8), or keep it until those secrets are set (it expires 2026-12-22 anyway).
Google sign-in checklist (1.3.8, after approval): docs/AUTH_PLAN.md section 14 (Google Cloud project, consent screen, web client, redirect URIs, `wrangler secret put` in the owner's terminal only).
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
- Code structure: apps/web now uses src/ui (shared), src/features/today, src/routes (old src/layout, src/staff, src/portal removed in 1.4.11).
- The PDF in docs/design/ is reference only and will be revised later. When the owner replaces it, the new PDF is the source of truth. If a screen was already built from the older PDF, tell me what differs and ask before changing it.
- Web shell restyled to DESIGN.md in 1.4.11 (S01 laptop, S14 phone). Today shows FAKE sample data (features/today/sample-data.ts, ui/shell/sample-session.ts) until the real APIs exist. Buttons (Walk-in, Send in, row actions, search) are not wired yet.
- Staging D1 id is real (54a33625-...); production D1 id is still a placeholder. Staging has no R2 binding until task 3.7 (card decision).
Owner's real hours (owner fills): Phase 0: -
