# Flow runner (audit helper, not app code)

These scripts drove the browser for the flows in `../flows/`. They are kept so another session can repeat or extend a flow. They add no dependency: they use the repo's `@playwright/test`.

- `lib.mjs` opens Chromium, signs in with the local dev-login stub (`/api/staff/auth/dev-login?role=doctor|receptionist`). (The old repair for bug C1, double-encoded request bodies, was removed in Q0.2 when C1 was fixed; any 400 now is a real bug.)
- `lib2.mjs` `flow(spec, body)` records every step (action, URL, toasts, errors, screenshot only when the screen changed) into `../flows/<id>/result.json`.
- `gen.mjs` turns `result.json` + a hand-written `verdict.json` into `../flows/<id>.md`.
- `g01.mjs`, `g02.mjs`, `b02.mjs`, `h01.mjs`, `a02.mjs`, `d02.mjs`: one script per flow. `reset.sh` restores a fresh scratch database and restarts the dev server.

Before running: edit the absolute paths at the top of `lib.mjs` (Chromium binary, screenshot folder) and `reset.sh` (scratch folder, snapshot of a migrated and seeded local D1 made with `wrangler d1 migrations apply --persist-to` and `db:seed:staging --local`). Browse only `http://localhost:8787` (CSRF origin). Fake data only. Never point this at staging or production.

Scratch setup (no owner data touched): `wr d1 migrations apply DB --local --env='' --persist-to $SCRATCH/pristine`, then `node apps/worker/scripts/seed-staging.mjs --local --persist-to $SCRATCH/pristine`. `SCRATCH=<folder> zsh reset.sh` copies pristine to `d3` and starts the dev server on it. Run a flow with `node <flow>.mjs GATE-B-<flow>` from this folder.
