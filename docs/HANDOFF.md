# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 7 gate done; Phase 9 docs/cron partly done; takeover session cleaned up interrupted work). Read RUN_PROMPT.md, STATE.md, MAP.md. Fake data only. Never push.

## Where we are
- **Phase 7 complete locally** (dry_run + manual wa.me). Gate: **passed with exceptions** (see STATE.md).
- **Do not start Phase 8** until the owner says so.
- Next free migration: **0054** (0051 ops_status, 0052 error_log, 0053 patient_requests).
- Owner decision: no paid SMS/WhatsApp API, no DLT, no card; `MESSAGING_MODE=dry_run` everywhere; receptionist opens `wa.me`.

## Done this round (local commits; never push)
See STATE.md Phase 7 Done lines and the final task table in the session summary.

## Skipped / Waiting (Phase 7)
7.1.1 sister table ok; 7.1.2–7.1.5 gateway/SIM/DLT/Plan B; 7.2.7 OTP (Phase 8); 7.2.8–7.2.9 webhooks/heartbeat phone; 7.3.5 inbox; 7.4.4 Hinglish; 7.5.4–7.5.5 aftercare/birthday; 7.6.1 Brevo; 7.8.2 phone setup; 7.8.4 gateway secrets; 7.9.3 7-day phone; 7.9.4 sister sign-off. Plus prior Phase 5/6 Waiting.

## New migrations (owner applies; agent did not touch staging)
- Apply **0006–0053** then `pnpm deploy:staging`.
- Next free: **0054**

## Next task
Open code gaps from the interrupted Phase 9 run: 9.2.5 error-log POST route + browser reporter; 8.2.11 patient-requests API + UI; 9.2.1 real GraphQL request count; 9.3.10 purge for other tables. Docs for 9.2-9.5/10.1 exist as drafts (see STATE.md). Otherwise wait for owner on Phase 8.
Run commands with node 26: `source ~/.nvm/nvm.sh; nvm use system` (default node 16 fails typecheck).

## Commands
```
nvm use system
pnpm check 2>&1 | tail -25
```

Do not put real patient data anywhere.
