# HANDOFF (for the next AI session)

Written: 2026-11-23 (Phase 5 mid-flight — context full, stop). Read STATE.md and MAP.md. Fake data only. Never push.

## Where we are
- **Phase 5 started** (owner authorised after Phase 4 gate passed with exceptions).
- **Schema + money + core API + partial UI done.** Gate not run. Do **not** start Phase 6.
- Next free migration number: **0041**.
- Carry forward all earlier leftovers under STATE "Before real patients" / "Waiting on me".

## Done this round (local commits; never push)
| Task | Commit | Notes |
|------|--------|-------|
| 5.1.1 | `59a206b` | docs/CA_QUESTIONS.md DRAFT — Waiting CA |
| 5.1.2 | `def9bba` (+ `aee86e2` fix) | B/R/F + shadow; mig **0037** |
| 5.1.3 | `7361135` | money helpers paise |
| 5.2.1 | `9b3871f` | bills/items; mig **0038** |
| 5.2.2 | `23c9591` | payments/allocations; mig **0039** |
| 5.2.3–5.2.7 | `3f996ae` | refunds, advance, opening_balance, gst_mode **0040**, lock/cancel |
| 5.3.10 | `81e536f` | amountInWords |
| 5.3.1–3, 5.3.16 | `f944e69` | API + S09 UI + history bills/payments |

## Still open in Phase 5 (do these next, in order)
- **5.3.1** polish: 3-click visit bill UX; fee-change reason when ≠ list fee
- **5.3.2** polish: split cash+UPI UI; receipt auto-print
- **5.3.3** statement print
- **5.3.4** dues list + age buckets + appointment "due" mark
- **5.3.5** apply advance to new bill
- **5.3.6** discount request + doctor approve before issue
- **5.3.7** refund UI (API done)
- **5.3.8** cancel UI (API done)
- **5.3.9** daily cash close
- **5.3.11** A4/A5 bill+receipt print + Duplicate copy (letterhead pattern)
- **5.3.12** monthly CSV export for CA
- **5.3.13** SKIP baad me (installments)
- **5.3.14** SKIP baad me (thermal)
- **5.3.15** plan vs billed vs paid on Plan tab
- **5.4.1** weekly integrity Action (may need Healthchecks — Waiting if blocked)
- **5.4.2** domain events — likely blocked until 2.5.1 (skipped); list Waiting
- **5.5.1** property/concurrency money tests + CI
- **5.5.2** receptionist usability — Waiting sister
- **5.5.3** CA review — Waiting CA
- **5.5.4** top-5 fixes after 5.5.2
- Then **Phase 5 gate** checklist → STATE passed / passed with exceptions. Stop. No Phase 6.

## New migrations (owner applies; agent did not touch staging)
- **0037** `0037_billing_shadow_series.sql`
- **0038** `0038_bills.sql`
- **0039** `0039_payments.sql`
- **0040** `0040_billing_gst_mode.sql`
- Next free: **0041**
- Staging: apply **0006–0040**, then `pnpm deploy:staging`.

## Waiting on me (carry forward)
- 5.1.1 CA answers; 5.2.5 paper register opening balances; DRAFT accountant tax
- Prior: 4.3.4 / 4.5.2 printer; doctor.registration_no; lawyer DRAFTs; 3.x leftovers; B2 keys; etc. (see STATE.md)

## Commands
```
nvm use system
pnpm check 2>&1 | tail -25
pnpm db:migrate
pnpm db:seed
```

Screens followed this round: **S09** (bill/receipt), **S04/S17** Billing tab.

Do not put real patient data anywhere.
