# STATE
Last updated: 2026-11-22
Phase: 3. Current task: **3.2.4**. 3.1.1 skipped (Waiting on me). 3.1.2–3.2.3 DONE. Phase 2 gate was **passed with exceptions**; leftovers stay under **Before real patients** (do not redo).
PLAN: Unified Patient History (docs/PATIENT_HISTORY.md) Stage 1 = tasks 3.5.11–3.5.15 after visit/treatment deps exist. Permissions: AUTH_PLAN 4f in packages/db/src/permissions.ts only.
3.2.3 DONE locally (diagnoses/procedures/conditions/allergens/quick_phrases lists; visit_diagnoses + visit_procedures; DRAFT seeds). **New migrations `0020_visit_clinical_children.sql`, `0021_clinical_lists_seed.sql` — owner applies; agent did not apply to staging.**
3.2.2 DONE locally (tooth_events append-only; chartFromEvents; <400 rows). **New migration `0019_tooth_events.sql` — owner applies; agent did not apply to staging.**
3.2.1 DONE locally (visits table; open draft; one appointment → one live visit; receptionist 403). **New migration `0018_visits.sql` — owner applies; agent did not apply to staging.**
3.1.2 DONE locally (reference note in DECISIONS.md). No migration.
2.4.7 DONE locally (Today + Appointments auto-refresh every 60s via useVisibleInterval; pauses when tab hidden). No new migration.
2.4.4 DONE locally (A4 day list at /app/print/day?date=; Print today/tomorrow from Today; browser print). Printer test on clinic printer waiting on owner. No new migration.
2.4.3 DONE locally (Today wired to GET day appointments; status one-click; walk-in dialog; next/waiting/call-list no-shows; doctor Now+Next3; collection stat deferred to Phase 5). No new migration. Screens: S01/S14.
2.4.2 DONE locally (QuickBookDialog S07: patient search, visit type, 5 slots, phone note, POST book; GET `/appointments/slots`). No new migration.
2.4.1 DONE locally (day view at /app/appointments: GET `/appointments?date=`, CSS grid timeline, status colour+label, now-line from serverNow, empty-slot → ?book=, drag-reschedule with confirm). No new migration. Screen: S08 (day).
2.3.8 DONE locally (cancel reasons + notifyPatient on audit until 2.5.1; reschedule new row + old rescheduled + chain; GET patient appointments + profile tab chain). No new migration.
2.3.7 DONE locally (POST `/appointments/walk-in`; arrived + waiting queue sort emergency-first; emergency overbook insert; formatWaiting). No new migration.
2.3.6 DONE locally (status wheel in shared; PATCH `/appointments/:id/status`; arrived/started/ended stamps; no_show after start+15m; cancelled/no_show→scheduled within 24h via updated_at; statusActionButtons for UI). No new migration.
2.3.5 DONE locally (booking rules: past/closed/lunch/ahead; overrideReason → overbook + audit; setting appointments.book_ahead_days=90). **New migration `0017_appointments_book_ahead.sql` — owner applies; agent did not apply to staging.**
2.3.4 DONE locally (POST `/api/staff/appointments`; INSERT…WHERE NOT EXISTS overlap + auditInsertIfChanged; 50 parallel same-slot → 1 win / 49 ConflictError / 1 audit). No new migration.
2.3.3 DONE locally (findFreeSlots: working hours − lunch − holidays − busy statuses; slotSearchEarliest = now+15m; 12 unit tests for empty/full/lunch/holiday/gap/RCT/today/Sunday/cancelled/rescheduled/arrived/limit). No new migration.
2.3.2 DONE locally (visit_types: minutes + colour; seed Consultation/Follow-up/Cleaning/RCT sitting/Extraction/Ortho adjustment/Emergency; roundUpToSlot + visitTypeSnapshot so list edits do not rewrite old bookings; Settings list UI colour picker). **New migration `0016_visit_types_seed.sql` — owner applies; agent did not apply to staging.**
2.3.1 DONE locally (appointments table: patient, chair_id, visit_type id/label, start_at UTC, date_local + start_min/end_min IST, status/source/priority/overbook, complaint, cancel_reason, rescheduled_from, arrived/started/ended_at; indexes chair+day+start, patient+day, day+status; EXPLAIN uses indexes). **New migration `0015_appointments.sql` — owner applies; agent did not apply to staging.**
2.2.8 DONE locally (contact_relation; contactMobile = own or guardian; profile shows relation + “N others on this number”). **New migration `0014_patient_contact_relation.sql` — owner applies; agent did not apply to staging.**
2.2.7 DONE locally (registration consent panel; create without consent OK; SMS/marketing/notice rows only when checked; settings privacy_notice.*). **New migration `0013_privacy_notice_settings.sql` — owner applies; agent did not apply to staging.**
2.2.5 DONE locally (list filters: new this month, not seen in 6 months [reg proxy until 2.3], archived; default sort created_at desc; server pagination). No new migration.
2.2.4 DONE locally (PUT `/patients/:id` version-checked edit; audit old/new mobile; ConfirmDialog on mobile change; 409 stale version). No new migration.
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
Next: 3.2.4 medical history + alerts schema → rest of Phase 3 in order → Phase 3 gate. Do not start Phase 4.


## Phase 2 gate (from PLAN.md + owner checklist)

| Criterion | Status |
|-----------|--------|
| `pnpm check` green (typecheck + lint + tests) | **passed** |
| Role × endpoint matrix (includes new appointment GETs) | **passed** |
| 50 parallel same-slot booking: one win, no loser audit | **passed** (2.3.4 test) |
| Search budget &lt;100 rows on token index (5k local seed path) | **passed** (2.1.6 scale test) |
| No real patient PHI in repo/tests (fake data only) | **passed** |
| Consent optional; SMS/marketing only when checked | **passed** (2.2.7) |
| Today/day/quick-book/print/auto-refresh code in place | **passed** (2.4.1–2.4.4, 2.4.7) |
| Receptionist 10 fake cards &lt;90s each (usability) | **waiting** (needs sister / 2.7.3) |
| Half-name + last-4 search smoke by receptionist | **waiting** (owner/usability) |
| Full fake day on Today (10 appts, walk-in, emergency, cancel, no-show) | **waiting** (owner manual) |
| Aaj list on sister's clinic printer | **waiting** (2.4.4) |
| Responsive check at 360 / 768 / 1366 (owner eyes) | **waiting** (CSS mobile-first; visual not run this round) |
| Keyboard-first checks | **waiting** (prior 1.4.x) |
| 2.5.1 domain events | **skipped this round** (not in HANDOFF path; before formal PLAN gate) |
| 2.6 paper import | **skipped** (needs owner scope A/B/C) |
| 2.7.1–2.7.4 formal gate tasks | **partial** — automated pieces covered by existing tests; usability session waiting |

**Phase 2 gate: passed with exceptions** (owner may treat as ready to start Phase 3 only after clearing Waiting items that block real patients).

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

- Staging migrations 0006–0021 applied + `pnpm deploy:staging`; health OK
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
- **3.1.1**: 90-minute clinic visit with doctor — paper chart flow, draft lists (diagnosis, procedures+fees, tooth conditions, medical alerts, quick phrases), FDI vs Palmer and chart facing. Needed for clinical decisions page (sister "haan"). Agent skipped; Phase 3 code continues with DRAFT list seeds until then.
- 2.4.4: test-print A4 day list on the clinic printer (sister)
- Staging: apply migrations **0006–0021**, then `pnpm deploy:staging`; curl `/api/staff/health`
- 3.2.3 DRAFT clinical list seeds (diagnoses/procedures/conditions/allergens/phrases) — replace after 3.1.1 doctor sign-off
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
