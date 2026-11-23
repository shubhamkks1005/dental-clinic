# Flow runner (audit helper, not app code)

These scripts drove the browser for the flows in `../flows/`. They are kept so another session can repeat or extend a flow. They add no dependency: they use the repo's `@playwright/test`.

- `lib.mjs` opens Chromium, signs in with the local dev-login stub (`/api/staff/auth/dev-login?role=doctor|receptionist`), and **repairs bug C1** (double-encoded request bodies) so later screens can be reached. Remove that block once C1 is fixed.
- `lib2.mjs` `flow(spec, body)` records every step (action, URL, toasts, errors, screenshot only when the screen changed) into `../flows/<id>/result.json`.
- `gen.mjs` turns `result.json` + a hand-written `verdict.json` into `../flows/<id>.md`.
- `g01.mjs`, `g02.mjs`, `b02.mjs`, `h01.mjs`, `a02.mjs`, `d02.mjs`: one script per flow. `reset.sh` restores a fresh scratch database and restarts the dev server.

Before running: edit the absolute paths at the top of `lib.mjs` (Chromium binary, screenshot folder) and `reset.sh` (scratch folder, snapshot of a migrated and seeded local D1 made with `wrangler d1 migrations apply --persist-to` and `db:seed:staging --local`). Browse only `http://localhost:8787` (CSRF origin). Fake data only. Never point this at staging or production.
