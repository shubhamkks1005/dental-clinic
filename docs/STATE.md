# STATE
Last updated: 2026-11-23. Older history (per-task Done lines, Phase 1-7 gate tables): docs/archive/STATE-until-2026-11-23.md.
Rules: docs/RUN_PROMPT.md. Next free migration: **0056**. Commands to run by hand: docs/STAGING_READINESS.md.

## Where we are
- Phase 7 complete locally (gate: passed with exceptions). Phase 9 docs drafts and 9.1.x backup minimum done locally. Do not start Phase 8 until the owner says so.
- Staging-test run (2026-11-23): staging seed, tester guide, error log, patient requests, retention. All local commits, nothing pushed, nothing applied to staging.

## Part 2 repair and Part 3 (2026-11-24) - Gate A passed
- Owner accepted D1 to D8 (DECISIONS.md; D1 refund rule still to be confirmed by the CA). Done locally, each with its own commit: Part 2 repair, Q0.7, Q1.1, Q1.5, Q1.6 (offline), Q1.7, Q1.8, Q1.9, Q1.10, Q1.11, runner scripts, **Gate Q1.G: passed** (ten flows, no harness repair, docs/ui-audit/flows/GATE-A.md). 28 browser specs pass together (`pnpm test:e2e`), `pnpm check` is green.
- **One new migration: 0056_bill_cancel_requests.sql (the owner applies it on staging).** Part 4 starts at Q2.1 only when the owner says so.
- Known gaps going into Part 4: tap targets under 44 px in lists and links at 360 px, plain Billing and profile Billing screens (the Bill screen has a scoped stylesheet), page gutters at 360 px, tooth surface shapes are small, advance on purpose (Q3.1).

## Part 4 (started 2026-11-24)
- Q2.1 done: PageContainer/PageHeader/Card/ListRow/EmptyState/StatusLabel, shared status map, format helpers, 8-item sidebar (Library doctor-only, placeholder page), same gutter on every screen. Screens: docs/ui-audit/screenshots/redesign/Q2.1/. Waiting on me: should the receptionist see Library (design says yes, Q1.11 made medicines doctor-only)?

## Phase Q (added 2026-11-23)
- Browser audit done (docs/ui-audit, docs/product-audit). Phase Q is planned in docs/PHASE_Q.md and runs before Phase 8. Q0.1 done (e2e runs, scratch DB, localhost origin; prettier ignores audit evidence and design mockups). Q0.2 done (C1 fixed, guard + browser test). Q0.3 done (C3). Q0.4 done (C4). Q0.5 done. Q0.6 done. Q0.7 blocked on D1.
- **Gate P0: passed with exceptions** (2026-11-23). Core-loop e2e: pass. G01 (runner, no repair, id GATE-P0-G01): visit, issue Rx, finalise, bill, payment all with no 400/409; the one 400 is the scripted "no free slot today" walk-in step; the script's old one-click "Full balance" step no longer records money (by design, Q0.6). D03 (GATE-P0-D03): no failed requests; overpay now asks first, 0 and negative blocked, split and 100.50 work. Evidence: docs/ui-audit/flows/GATE-P0-*/result.json. Exceptions: (1) Q0.7 refund rule not done, needs D1, so the D02 refund steps were not run; (2) runner scripts g01/d03 still assume the old Full balance click (screens differ from their notes). Part 2 may start; Q0.7 stays open until D1.
- **Part 2 (2026-11-24, local commits "Q1.2", "Q1.3", "Q1.4", "Q1.6")**: Ready to bill on Today (stat card + Take payment), payment toast and Payments lists, Reschedule / Cancel / Missed menu with reasons, Close-day blockers name patients, timings and visit-conflict messages, reasons under disabled buttons, offline banner says typed work is kept. **Skipped, waiting on the owner:** Q1.1 (D2) and Q1.5 (D6). Browser checks: e2e/core-loop (Q1.2, Q1.3), e2e/appointment-actions (Q1.4), e2e/no-silent-failures (Q1.6). Not done from Q1.6: disabling server actions while offline and keeping the old screen when a menu click loads an empty page (only the banner text changed).
- Found by the audit and not yet fixed: visit cannot be opened (C1), prescription cannot be issued (C3), booking without a note fails (C4), overpayment accepted silently, refund does not change the balance.

## This run (commit, task)
| Commit | Task |
|--------|------|
| 4813c64 | Staging seed (`pnpm --filter @clinic/worker db:seed:staging -- --staging`): 30 fake patients, appointments -14..+14 days, finalised/open visits, Rx, bills, split payment, refund, dues, one closed day, 3 requests. Refuses unless staging D1. Idempotent (notes marker). |
| 48a6791 | docs/TESTING.md (5.5.2 script, doctor + receptionist day flows, bug templates); copyable Error ID on More > Help and the crash page. |
| c8dff40 | 9.2.5 DONE locally: POST /api/staff/errors (signed in, 5/min + 100/day per user, 2 KB cap), browser reporter, doctor-only list at /app/errors. **Migration `0054_error_log_role_version.sql` - owner applies.** |
| 16631dd | 8.2.11 DONE locally (staff side): list, view (doctor, access-logged), close (doctor, audited), roles requests.view/requests.manage, UI /app/requests, dashboard "Things to watch". **Waiting:** portal form (Phase 8), doctor confirm roles + 30-day due + wording (DRAFT). |
| a3c5790 | 9.3.10 DONE locally for operational data: message_attempts 90d, message_outbox 1y, error_log 30d; daily 02:00 IST; **dry run unless Worker var RETENTION_MODE=live**; audit row per run. **Waiting:** doctor/CA on access log, sessions, legal hold, patient/clinical/billing purge. |
| 68adac0 + next | docs/STAGING_READINESS.md, e2e smoke for error log + requests. **Not run:** Playwright browsers are not installed on this Mac (all e2e tests fail at browser launch, including old smoke/print tests). Run `pnpm exec playwright install chromium` once, then `pnpm test:e2e`. |

## Consent forms in Hindi (2026-11-23, local commit, nothing applied anywhere)
- Doctor's six consent forms are the defaults (Hindi), same layout for all, edited in Settings > Consent templates. No migration. Print: /app/print/consent/:patientId?template=KEY. Details in DECISIONS.md.
- **Waiting:** doctor proofreads the Hindi (typed from PDF images, the PDFs' text layer is broken); lawyer confirms wording; owner checks a print and the Hindi font on the clinic printer; forms for implant, whitening, anaesthesia, photos still English DRAFT.
- Fix list from the owner: docs/FIXES.md (letterhead and the doctor flow are next).

## Known gaps from this run
- Seed CLI end to end (vite load + remote D1) is unverified against a database: the local D1 is not fully migrated (run `pnpm --filter @clinic/worker db:migrate`, then `db:seed:staging -- --local`). The seed logic itself is covered by a test on a fresh migrated DB.
- 9.2.1 live GraphQL request count is still a stub (needs owner token).
- Receptionist reactivation: staff-admin.mjs has no such command; use the app (Settings > Staff > Reactivate).
- error_log only receives browser reports so far; the Worker does not yet write its own server errors there (repo `errorLog.insert` is ready).
- ops_status has fixed keys, so retention has no dashboard line yet (audit row only).

## Migrations waiting for the owner (agent did not apply any)
Staging: everything after the last applied one, up to **0055** (0055 = four empty letterhead settings: clinic.kind, clinic.email, clinic.instagram, doctor.extra_line). Known pending: 0049 to 0055 at least (HANDOFF listed 0006-0053; `migrations apply` skips what is already there).

## Before real patients (go-live blockers — do not put real PHI live until these)

- Staging migrations applied through 0054 + `pnpm deploy:staging`; health OK (docs/STAGING_READINESS.md)
- Doctor confirms: 8y clinic retention, request roles + 30-day due (DRAFT), RETENTION_MODE=live decision; CA confirms billing retention
- 1.6.3 backup: accounts/secrets, 7 green nights, one restore drill
- 1.6.4 alarms (Healthchecks + UptimeRobot) tested
- 1.5.2 clinic profile (or accepted placeholder) so printed docs show real clinic details
- 1.5.3 doctor sets real clinic hours (not PLACEHOLDER seed)
- 1.5.6 / Phase 0 sheets: real visit types, medicines, diagnoses, referrals (or explicit defer)
- 1.3.4 doctor confirms permission table
- 1.3.1 Access (or explicit accept Google-only without Access)
- 1.3.5 securityheaders.com grade noted
- 1.4.8 clinic printer check; 1.4.3 receptionist PC; 1.4.7 offline banner on clinic PC; keyboard checks
- Owner push + green CI on main; production env + domain when going live
- Phase 0 clinic-visit leftovers the doctor still owes
- No real patient data on staging or in repo ever before go-live rules say so

Waiting on me (owner):
- **Phase Q decisions:** D2 (can an addendum add a procedure?) blocks Q1.1; D6 (reminder timing) blocks the due-time part of Q1.5 (the rest of Q1.5 could be done, it was skipped whole); D1 still blocks Q0.7. Proposed defaults are in docs/PHASE_Q.md; say "I accept all proposed defaults" to unblock all.
- **Now:** run docs/STAGING_READINESS.md by hand; install Playwright Chromium and run `pnpm test:e2e`; sister + receptionist follow docs/TESTING.md (this is also the 5.5.2 usability session)
- **Phase 7**: 7.1.1 sister message-list ok; 7.1.2–7.1.5 gateway/SIM/TRAI/DLT (if ever); 7.9.3–7.9.4 phone test + sister sign-off; 7.3.6 day-cancel wizard; 7.7.3 lawyer privacy paragraph; DRAFT templates doctor confirm
- **6.1.1 / 6.6.2 / 6.6.3**: sister sign-off on metric defs + dashboard layout; then top-5 fixes
- **6.5.4**: DRAFT national holidays (Republic / Independence / Gandhi) — sister edit in Settings
- **5.5.2**: receptionist 10-task usability session (visit bill, split pay, advance, partial, discount ask, refund ask, day close, dues, reprint, fix wrong bill)
- **5.5.3 / 5.5.4**: CA review sample bills+export+day close; then top-5 fixes
- **5.4.1**: create Healthchecks check + GitHub secret `HEALTHCHECKS_BILLING_URL`; confirm fail ping on bad dump
- **5.4.2**: blocked until 2.5.1 domain events
- **5.3.12**: CA open one fake-month CSV and approve columns
- **5.3.11**: sister approve A5 bill/receipt print on clinic printer
- **5.2.5**: enter 5 fake/real opening balances from paper register and confirm totals
- **5.1.1**: CA written answers to docs/CA_QUESTIONS.md (GST, bill form, cash ₹2L, retention, print fields)
- **4.3.4 / 4.5.2 / 4.3.3**: clinic printer + sister haan on 10 fake Rx / Rx preview
- **4.1.2**: doctor sign each DRAFT medicine row (dose/instruction) on printout
- **doctor.registration_no**: fill in Settings (seed is empty; blocks Rx/certificate finalise/print)
- **6.3.9 / 6.3.10**: baad me (wait/chair; age/gender)
- **6.4.1**: sister approve monthly report print on clinic printer
- **6.4.3 / 6.4.4**: baad me (email report; YoY)
- **HEALTHCHECKS_BILLING_URL** GitHub secret for weekly billing integrity
- DRAFT lawyer + doctor: estimate disclaimer (4.4.1); consent templates (3.8.1/4.4.2); certificate CERTIFICATE_DRAFT_BANNER (4.4.3)
- **3.9.1–3.9.2**: records demand register/bundle deferred (baad me); paper until then
- **3.10.3 / 3.10.4**: doctor usability session + top-5 fixes
- **B2 keys as Worker secrets on staging** (`S3_KEY_ID` / `S3_APP_KEY` via `wrangler secret put`; endpoint/bucket/region already in wrangler staging vars) — then run `pnpm --filter @clinic/worker storage:check`
- **3.7.1**: sister confirm which RVG/software and whether it exports JPEG/PNG (or only DICOM)
- **3.6.3**: multi-sitting step tracker deferred (baad me)
- **3.5.10**: visit templates (Scaling / RCT next / Review) deferred as PLAN "baad me" — confirm later if doctor wants them before Phase 4
- **3.1.1**: 90-minute clinic visit with doctor — paper chart flow, draft lists (diagnosis, procedures+fees, tooth conditions, medical alerts, quick phrases), FDI vs Palmer and chart facing. Needed for clinical decisions page (sister "haan"). Agent skipped; Phase 3 code continues with DRAFT list seeds until then.
- 2.4.4: test-print A4 day list on the clinic printer (sister)
- **3.4.3**: sister confirm chart facing/notation habit ("haan"); default remains dentist+FDI until then
- 3.2.3 / 3.3.1 DRAFT clinical list seeds (diagnoses/procedures/conditions/allergens/phrases/medical_history_items) — replace after 3.1.1 doctor sign-off
- 2.1.3: lawyer sign-off on final guardian/DPDP wording (clinic save rule is in place)
- DRAFT lawyer texts: any consent/under-18 wording marked "DRAFT - lawyer to confirm" in app (list when added)
- 1.6.3 / 1.6.4 backup + alarm accounts (ACCOUNTS.md); if B2 asks for a card: stop
- 1.5.2 when R2/card ready; 1.5.6 when Phase 0 sheets exist
- 1.5.3 real clinic hours; 1.4.8 printer; 1.3.4 permissions; 1.4.2/1.4.4 keyboard; 1.4.7 wifi-off; 1.4.3 receptionist PC; 1.3.5 securityheaders; 1.3.1 Zero Trust card
- Push for green CI; optional branch protection
Owner checklist / Cloudflare / Google: unchanged (see prior notes).
Phase 0 still open: clinic-visit tasks for the owner.
Open questions: SMS language, rate list language, portal monitor, public-site plan lines (DECISIONS).
Known issues: agents never push; Today uses FAKE sample data until Phase 2 APIs; staging no R2 until 3.7; Book appointment / Walk-in after new patient land on NotBuiltYet until 2.3.
Owner's real hours (owner fills): Phase 0: -
