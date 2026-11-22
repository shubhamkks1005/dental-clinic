# STATE
Last updated: 2026-11-22
Phase: 2. Current task: none; next is **2.2.4** (patient edit).
2.2.3 DONE locally (top-bar PatientSearch: `/` focus, 250 ms debounce, arrows+Enter → profile; empty → New patient: query; last visit placeholder until 2.3). No new migration.
2.2.2 DONE locally (GET `/patients/:id`; S04/S17 profile header + Overview/Appointments tabs; Visits/Billing/Files/Messages hidden until their phase; consents on Overview; list name → profile). No new migration.
2.2.1 DONE locally (new patient form S03/S16: four required fields, More details fold, duplicate-check on mobile debounce, POST `/api/staff/patients` mints P- code + search tokens + audit; after save Book appointment / Walk-in now). No new migration.
2.1.9 DONE locally (consents table append-only; GET/POST `/patients/:id/consents`; ConsentsPanel shows when / who / notice version; withdraw = new row). **New migration `0012_consents.sql` — owner applies (with 0006–0011); agent did not apply to staging.**
2.1.8 DONE locally (archive with reason + restore; default list status=active; `?status=archived|all`; POST archive/restore; audit update/restore).
2.1.7 DONE locally (soft duplicate warnings: mobile+name word, name+age±1y, secondary mobile; POST `/api/staff/patients/duplicate-check`; never hard-blocks).
2.1.6 DONE locally (`patient_search` tokens + index; range search; last-4 via mobile_rev; seed writes tokens; EXPLAIN uses index; <100 rows on 5k). **New migration `0011_patient_search.sql` — owner applies (with 0006–0010); agent did not apply to staging.**
2.1.5 DONE locally (`takePatientCode`: counters `patient_code` / period `all` + settings prefix/digits → P-000123; batch with patient INSERT; same takeNumber path for later bill/prescription/portal numbers).
2.1.4 DONE locally (`displayAge` / `ageYearsOn`: DOB preferred; else age-at-reg + years since registration; Patients list shows computed age, never a stored current-age column).
2.1.3 DONE locally (guardian_name/relation/mobile columns; `guardianSaveError` blocks under-18 without guardian; age helpers for minor check). **New migration `0010_patient_guardian.sql` — owner must apply to staging (with 0006–0009); agent did not apply it.** Final DPDP lawyer wording still open.
1.1.7 DONE locally (`pnpm db:seed` loads 5,000 fake patients into local D1 only; GET `/api/staff/patients` + Patients screen S02/S15 so a developer can see them). Never seed staging/production.
2.1.2 DONE locally (20 good + 20 bad unit tests for `normaliseMobile` in packages/shared; displayMobile covered).
2.1.1 DONE locally (PATIENT_FIELDS registry with required/optional + purpose; patients table migration 0009; CHECKs for gender/status/mobile-or-reason/dob-or-age). Staging apply of 0009 waits on owner (with 0006–0008).
version_metadata DONE locally (env.staging + env.production in wrangler.jsonc so `/api/staff/health` shows real version, not "dev").
1.7.3–1.7.5 / 1.6.x / 1.5.x / 1.4.x / 1.3.x / 1.2.x / 1.1.x: see prior Done notes; staging Google live-checked 2026-11-22.
Next: **2.2.4**+.

## Phase 1 gate (from PLAN.md)

| Criterion | Status |
|-----------|--------|
| CI green; push from main deploys staging | **waiting** — CI exists; deploy step omitted by owner; owner must push |
| Access: doctor/receptionist pages differ; bad email blocked; JWT negatives | **passed with exception** — Google staff login live (1.3.8); Access outer layer optional (card). JWT verifier + tests done (1.3.2) |
| Role × endpoint matrix | **passed** (1.7.4) |
| 50 parallel numbering no dup/gap | **passed** (spike 0.6.3) |
| Backup 7 nights + restore | **waiting** (1.6.3 accounts + run) |
| Clinic profile + timings → print preview name | **waiting** — timings done (1.5.3); clinic profile/logo deferred (1.5.2 / R2) |
| Phase 0/1 hours vs plan updated | **waiting** (owner process) |

## Before Phase 2 (hard blockers to *start* Phase 2 code)

None. Gate treated as **passed with exceptions** (owner 2026-11-22). Agent may implement Phase 2 with fake data.

## Before real patients (go-live blockers — do not put real PHI live until these)

- Staging migrations 0006–0012 applied + `pnpm deploy:staging`; health OK
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
- Staging: apply migrations **0006–0012**, then `pnpm deploy:staging`; curl `/api/staff/health`
- 2.1.3: lawyer sign-off on final guardian/DPDP wording (clinic save rule is in place)
- 1.6.3 / 1.6.4 backup + alarm accounts (ACCOUNTS.md); if B2 asks for a card: stop
- 1.5.2 when R2/card ready; 1.5.6 when Phase 0 sheets exist
- 1.5.3 real clinic hours; 1.4.8 printer; 1.3.4 permissions; 1.4.2/1.4.4 keyboard; 1.4.7 wifi-off; 1.4.3 receptionist PC; 1.3.5 securityheaders; 1.3.1 Zero Trust card
- Push for green CI; optional branch protection
Owner checklist / Cloudflare / Google: unchanged (see prior notes).
Phase 0 still open: clinic-visit tasks for the owner.
Open questions: SMS language, rate list language, portal monitor, public-site plan lines (DECISIONS).
Known issues: agents never push; Today uses FAKE sample data until Phase 2 APIs; staging no R2 until 3.7; Book appointment / Walk-in after new patient land on NotBuiltYet until 2.3.
Owner's real hours (owner fills): Phase 0: -
