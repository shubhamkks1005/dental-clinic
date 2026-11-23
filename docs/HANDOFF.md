# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 5 mid-flight — context full after 5.3.11, stop). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 5 mid-flight.** Gate not run. Do **not** start Phase 6.
- Next free migration number: **0043**.
- Carry forward all earlier leftovers under STATE "Before real patients" / "Waiting on me".

## Done this round (local commits; never push)
| Task | Commit | Notes |
|------|--------|-------|
| 5.3.4 | `5506fcb` | dues list age buckets + call notes; Due mark on cards; mig **0041** |
| 5.3.5 | `c0b5501` | apply advance on issue |
| 5.3.6 | `9aa7638` | discount request + doctor approve |
| 5.3.7 | `1c18330` | refund UI + payments list |
| 5.3.8 | `b971985` | cancel UI |
| 5.3.9 | `907bdfe` (+ `be121a2` fix) | day close; mig **0042** |
| 5.3.11 | `942d363` | A5 bill+receipt print + Duplicate; receipt after payment |

Earlier Phase 5 (prior session): 5.1.1–5.2.7, 5.3.10, 5.3.1–3 partial, 5.3.16. See STATE.md.

## Still open in Phase 5 (do these next, in order)
- **Polish 5.3.1–5.3.3:** 3-click visit bill; fee-change reason; split cash+UPI UI; statement print
- **5.3.12** monthly CSV export for CA
- **5.3.15** plan vs billed vs paid on Plan tab
- Skip **5.3.13** / **5.3.14** (baad me)
- **5.4.1** weekly integrity Action (may need Healthchecks — Waiting if blocked)
- **5.4.2** domain events — likely blocked until 2.5.1; list Waiting
- **5.5.1** property/concurrency money tests + CI
- **5.5.2** receptionist usability — Waiting sister
- **5.5.3** CA review — Waiting CA
- **5.5.4** top-5 fixes after 5.5.2
- Then **Phase 5 gate** → STATE passed / passed with exceptions. Stop. No Phase 6.

## New migrations (owner applies; agent did not touch staging)
- **0037**–**0040** (prior): shadow, bills, payments, gst_mode
- **0041** `0041_dues_calls.sql`
- **0042** `0042_day_closes.sql`
- Next free: **0043**
- Staging: apply **0006–0042**, then `pnpm deploy:staging`.

## Waiting on me (carry forward)
- 5.3.11 sister A5 print haan; 5.1.1 CA; 5.2.5 opening balances; DRAFT accountant tax
- Prior: 4.3.4 / 4.5.2 printer; doctor.registration_no; lawyer DRAFTs; 3.x leftovers; B2 keys; etc. (see STATE.md)

## Commands
```
nvm use system
pnpm check 2>&1 | tail -25
pnpm db:migrate
pnpm db:seed
```

Screens: **S09** billing; **S04/S17** Billing tab; appointment Due marks on day/Today.

Do not put real patient data anywhere.
