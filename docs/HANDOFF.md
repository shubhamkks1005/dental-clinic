# HANDOFF (for the next AI session)

Written: 2026-11-23 (staging-test run finished). Read RUN_PROMPT.md, STATE.md, MAP.md. Fake data only. Never push, never deploy, never apply migrations.

## Where we are
- Phase 7 complete locally; **do not start Phase 8** until the owner says so.
- App is ready for staff testing on staging with fake data once the owner runs the by-hand steps (docs/STAGING_READINESS.md).
- Next free migration: **0055** (0054 error_log role + version is new this run).

## Done this run (all local commits, see STATE.md table)
Staging seed, docs/TESTING.md + copyable Error ID, 9.2.5 error log (route, reporter, doctor list), 8.2.11 patient requests staff side, 9.3.10 retention (dry run by default).

## Half done / not verified
- Seed CLI against a real database: not run. Exact next step: owner runs `pnpm --filter @clinic/worker db:migrate`, then `pnpm --filter @clinic/worker db:seed:staging -- --local` and reports the output.
- Playwright e2e (old smoke, print regression, new errors-requests-smoke): not run, browsers missing. Next step: `pnpm exec playwright install chromium`, then `pnpm test:e2e`; fix only failures caused by this run's work.
- UI of /app/errors, /app/requests and More > Help was not checked at 360/768/1366 in a browser (CSS is mobile-first; owner check open).

## Waiting on humans
Doctor: confirm request roles, 30-day due, DRAFT wording, 8-year retention, access-log retention, legal hold. CA: billing retention. Owner: staging steps, tokens, GraphQL analytics token (9.2.1), Phase 8 go-ahead. Rest: STATE.md "Waiting on me".

## Next task
Wait for the owner's go on Phase 8 (8.2.11 portal form and portal login belong there). Otherwise fix what staff testing finds (bug templates in docs/TESTING.md).

## Commands the owner runs by hand
See docs/STAGING_READINESS.md (token with `read -rs`, migrations apply, `pnpm deploy:staging`, seed, reactivate receptionist in the app).

Run commands with node 26: `source ~/.nvm/nvm.sh; nvm use system`. Check: `pnpm check 2>&1 | tail -25`.
