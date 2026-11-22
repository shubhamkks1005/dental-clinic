# HANDOFF (for the next AI session)

Written: 2026-11-22 (evening). Read this first, then `docs/STATE.md` and `docs/MAP.md`. Do not ask the owner for anything already covered here or in those files. Fake data only. Never push. **Do not start Phase 2** until the owner says the Phase 1 gate is passed.

## 1. Where we are

### Task in progress
None. Working tree should be clean. Phase 1 **agent-completable code** for this round is done. Gate is **not** closed (owner accounts, alarms, deferred 1.5.x, new-dep asks).

### Recently done (this Mac, local commits; owner pushes)

| Task | Commit | Notes |
|------|--------|--------|
| 1.7.5 | `fef87db` | fakePatient / fakeMobile / fakePersonName / fakeHistory |
| 1.7.4 | `66a9610` | STAFF_ROUTE_MATRIX; CI fails if a staff route is missing |
| 1.6.3 | `5dbd52e` | Backup Action + scripts (accounts + 7-night + restore = owner) |
| 1.6.2 | `99a3695` | `/api/staff/health` DB ping + CF_VERSION_METADATA version |
| 1.6.1 | `293a831` | Structured JSON request/error logs |
| docs | `4cfa18a` | Prior HANDOFF |

Also still valid from earlier: 1.5.4, 1.5.3, 1.5.1, 1.4.x, 1.3.x (staging Google live-checked), 1.2.x, 1.1.x — see STATE "Done tasks".

### Next (do not invent Phase 2 work)
1. Owner clears **Waiting on me** (migrations deploy, backup accounts, alarms, etc.)
2. Owner answers: OK to add `@cloudflare/vitest-pool-workers` (1.7.2)? Playwright (1.7.3)?
3. When owner says so: 1.5.2 (needs R2/card), 1.5.6 (needs Phase 0 sheets)
4. Skip **1.5.5** and **1.6.5** (baad me) until the owner says otherwise
5. **Phase 1 gate** checklist in PLAN — owner confirms before any Phase 2 task

### Waiting on me (owner) — keep `docs/STATE.md` in sync
- **Staging migrations:** apply **0006, 0007, 0008** before next deploy, then `pnpm deploy:staging`; curl `/api/staff/health`
- **1.6.3:** B2 + age key + Healthchecks + `CLOUDFLARE_API_TOKEN_BACKUP` + GitHub vars/secrets (ACCOUNTS.md). Manual Backup run → 7 nights → one restore. If B2 asks for a card: stop
- **1.6.4:** Healthchecks + UptimeRobot alarm tests
- **1.7.2 / 1.7.3:** approve new dependencies or leave skipped
- **1.5.2 / 1.5.6:** R2/card; Phase 0 list sheets
- Prior: clinic hours (1.5.3), printer (1.4.8), permission confirm (1.3.4), keyboard/offline/PC checks, securityheaders, Zero Trust card, push + CI green

## 2. Decisions / traps (new this round)

- Health path is **`/api/staff/health`** (code + AUTH_PLAN + PUBLIC_API), not `/api/health` from PLAN/HANDOFF wording. Trust the code.
- AUTH_PLAN once said health "(no DB)"; task 1.6.2 requires a DB ping — implemented.
- Backup uses **age** + **AWS CLI → B2 S3 API** in Actions (no new npm deps). Secrets never in repo.
- Route matrix: permission is enforced in repos; matrix HTTP tests send bodies that pass route parse so 403 is reachable.

Canonical register: **`docs/DECISIONS.md`**. Auth: **`docs/AUTH_PLAN.md`**.

## 3. How to work here

### Session start
1. Read STATE, MAP, this HANDOFF
2. One PLAN task id; 3-line plan; `pnpm check`; local commit; never push unless owner says "push"
3. Use Homebrew Node **26** (`/opt/homebrew/bin`); nvm Node 16 breaks ESLint (`structuredClone`)

### Commands

```
pnpm check
pnpm dev
pnpm db:migrate
pnpm deploy:staging
```

From `apps/worker` (token: owner `read -rs` only):

```
pnpm wr d1 migrations apply DB --remote --env staging
pnpm wr d1 migrations apply DB --local
```

Local doctor: `http://localhost:8787/api/staff/auth/dev-login?role=doctor`

### Environments (unchanged)

| | Local | Staging | Production |
|---|--------|---------|------------|
| URL | `http://localhost:8787` | `https://dental-clinic-staging.shubhamkks1005.workers.dev` | not set up |
| AUTH_MODE | `dev-stub` | `google` | `google` |
| Migrations remote | n/a | **0000–0005 applied**; **0006–0008 pending** | none |
| R2 FILES | local | **none** until 3.7 | planned |

## 4. Rules that must not be broken

Fake data only. Never push unless asked. Never write secrets into files/chat. English-only UI. Code structure + MAP/STATE every task. Money in paise. Ask only if truly blocked.

Full rules: `AGENTS.md`.

## 5. Phase 1 gate (from PLAN) — status

| Gate line | Status |
|-----------|--------|
| CI green; push → staging deploy | CI exists; deploy step still owner's choice; owner must push |
| Access login roles + JWT negatives | Google staff login live; Access optional (card) |
| Role × endpoint matrix | **1.7.4 done** |
| 50 parallel numbering | Spike 0.6.3 passed |
| Backup 7 nights + restore | **Waiting on owner** (1.6.3) |
| Clinic profile + timings → print preview | Timings done; **1.5.2 deferred** (R2) |
| Phase 0/1 hours vs plan | Owner |

**Stop here. Do not start Phase 2.**

## Quick pointers

- Health: `GET /api/staff/health` → `{ status, version }`
- Backup: `.github/workflows/backup.yml` + `scripts/backup/`
- New staff route → add to `apps/worker/src/route-matrix.ts` or CI fails
- Lists / settings / timings as before (S12)
- Design PDF still reference-only

When you finish a task: files changed, verify in under 2 minutes, unsure notes, MAP + STATE, local commit.
