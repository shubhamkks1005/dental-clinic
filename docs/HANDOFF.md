# HANDOFF (for the next AI session)

Written: 2026-11-22. Read this first, then `docs/STATE.md` and `docs/MAP.md`. Do not ask the owner for anything already covered here or in those files. Fake data only. Never push.

## 1. Where we are

### Task in progress
None. Working tree clean at handoff. Next open code task: **1.6.2** (health endpoint).

### Recently done (this Mac, local commits; owner pushes)

| Task | Commit | Notes |
|------|--------|--------|
| 1.6.1 | `293a831` | Structured JSON request/error logs; no patient PII in logs |
| 1.5.4 | `a80dff8` | Final: list editor + browser check 360/768/1366 + docs |
| 1.5.4 interim | `6713f4f` | Code only; message said browser check pending |
| 1.5.3 | `b0e360c` | Timings + holidays settings + Settings UI |
| 1.5.1 | `836a1ab` | Settings store + zod rules |
| 1.4.8 | `ea614c2` | Print framework (test print = owner) |
| 1.4.6 | `fbc56fa` | Toasts, confirm, unsaved guard |
| 1.4.4 | `c08d6f6` | Form kit RHF+zod |
| 1.4.2 | `bf50021` | Dialog native, Tabs, Tooltip, Menu |
| decisions 1.4.x | `2e2ee14` | Native dialog / CSP, RHF, toasts accepted |
| 1.4.7 | `a88ab17` | Request id header, Error ID, offline banner |
| 1.4.5 | `b3e3af5` | Data table kit |
| 1.4.3 | `4eed33b` | Shell + "/" search (real PC check = owner) |
| 1.4.1 | `30f1786` | Brand tokens + style guide |
| 1.2.8 | `e13b139` | Query-plan guard; migration 0006 index |
| 1.3.2–1.3.8 | various | Staging live-checked by owner 2026-11-22 (Google sign-in, staff, deactivate) |

Older Phase 1 (1.1.x, 1.2.1–1.2.7, 1.3.x, 1.4.11) also done — see `docs/STATE.md` "Done tasks".

### Next open tasks (plan order; skip "baad me")
1. **1.6.2** Health endpoint `/api/health` (DB ping + build version) — **start here**
2. **1.6.3** Backup v0
3. **1.6.4** Alarm (Healthchecks / UptimeRobot)
4. Later: **1.5.2** clinic profile (deferred: logo needs R2; staging has no R2 until 3.7), **1.5.6** seed lists from Phase 0 sheets
5. Skip **1.5.5** and **1.6.5** (baad me) until the owner says otherwise

Phase 0 clinic-visit tasks remain open for the owner (not agent blockers for Phase 1 code).

### Waiting on me (owner) — keep `docs/STATE.md` in sync
- **Staging migrations:** apply **0006, 0007, 0008** before the next deploy, then `pnpm deploy:staging`
- **1.5.3:** doctor sets real clinic hours in Settings > Timings (seed is PLACEHOLDER)
- **1.4.8:** test print on the clinic printer
- **1.3.4:** doctor confirms permission table (`docs/AUTH_PLAN.md` 4f)
- **1.4.2 / 1.4.4:** keyboard-only check on style-guide
- **1.4.7:** wifi-off offline banner on clinic PC
- **1.4.3:** receptionist’s real PC fit + "/" shortcut
- **1.3.5:** securityheaders.com grade for staging URL
- **1.3.1:** Cloudflare Zero Trust card (optional Access layer)
- Owner pushes when ready; CI green; optional branch protection

## 2. Decisions

Canonical register: **`docs/DECISIONS.md`** (do not duplicate the whole file). Auth detail: **`docs/AUTH_PLAN.md`**.

Written into DECISIONS in this handoff (were chat-only before):
- Skip "baad me"; continue Phase 1 in order; owner blockers → Waiting on me
- 1.5.2 deferred past timings/lists/logs (R2 / card); STATE next = 1.6.2; 1.5.6 still open
- UI tasks may use interim commit `(browser check pending)` then final `N.N.N` after check + docs

Already in DECISIONS (do not re-litigate): native `<dialog>` for CSP; plain CSS no Tailwind/shadcn; Radix toast/tooltip/non-modal menu only; RHF + zod + own resolver; bill idempotency → Phase 5; English-only UI/print; money in paise; etc.

## 3. How to work here

### Session start (every time)
1. Read `docs/STATE.md`, `docs/MAP.md`, this HANDOFF
2. One PLAN task id at a time; smallest change; update MAP + STATE when done
3. Before coding: 3-line plan (files, change, verify)
4. After coding: `pnpm check` — fix failures; never disable tests/lint
5. Commit locally after each task; **never push** unless owner says "push"

### Commands (plain lines for the owner’s terminal)

```
pnpm check
pnpm dev
pnpm db:migrate
pnpm deploy:staging
```

From `apps/worker` (Cloudflare token: owner types `read -rs`, agents never store it):

```
pnpm wr d1 migrations apply DB --remote --env staging
pnpm wr d1 migrations apply DB --local
```

Local doctor login (dev-stub only): open  
`http://localhost:8787/api/staff/auth/dev-login?role=doctor`  
(receptionist: `?role=receptionist`). Staging has **no** this route.

Node: Homebrew **26** (`engines: >=26 <27`). Avoid nvm’s old Node 16.

### Environments

| | Local | Staging | Production |
|---|--------|---------|------------|
| URL | `http://localhost:8787` | `https://dental-clinic-staging.shubhamkks1005.workers.dev` | not set up |
| Worker entry | `src/dev/dev-entry.ts` (includes dev-login) | `src/index.ts` | `src/index.ts` |
| AUTH_MODE | `dev-stub` | `google` | `google` |
| D1 | local placeholder id | real `54a33625-…` (`dental-clinic-staging`) | placeholder |
| Migrations on remote | n/a | **0000–0005 applied**; **0006–0008 pending** before next deploy | none |
| R2 FILES | local binding | **none** until 3.7 | planned |
| MESSAGING_MODE | dry_run | dry_run | dry_run |
| Data | fake only | fake only | never real until go-live rules |

### Bindings / vars / secrets (names only — never values in chat or files)
- Bindings: `DB` (D1), `ASSETS`; `FILES` (R2) local/prod config only
- Vars (non-secret): `AUTH_MODE`, `APP_ORIGIN`, `MESSAGING_MODE`, `GOOGLE_CLIENT_ID`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` (empty = Access check off)
- Secrets (wrangler secret / `.dev.vars`, gitignored): `GOOGLE_CLIENT_SECRET`, `AUTH_COOKIE_SECRET`
- Cloudflare API token: owner only, never written to the repo

### Dev server note
`pnpm dev` builds web then runs web + worker. Worker serves `apps/web/dist`. After UI code changes, rebuild web (or full `pnpm dev`) and hard-reload the browser (`?v=` query) or you will see a stale SPA without new Settings sections.

## 4. Rules that must not be broken

- **Fake data only** — never real patients in repo, tests, logs, screenshots, staging
- **Never push** unless owner says "push"; then check `git remote -v` and `git config user.email` (personal GitHub `origin` only)
- **Never write tokens/secrets** into any file, commit, or chat
- **English-only** UI and printed documents (no Hindi/Hinglish in product UI)
- **Code structure:** routes thin; domain plain functions; DB only in `packages/db`; adapters for providers; web `features/<name>/`; one rule one place; update **MAP.md** and **STATE.md** every finished task
- **Money** integer paise; finalised rows never UPDATE; soft delete; audit on patient/money writes; counters for numbers
- **Ask the owner only if truly blocked** (clinical/legal/tax/money or missing from SPEC/DECISIONS)
- **One task at a time** by PLAN id; skip "baad me"
- UI screens: match `docs/DESIGN.md` + screen captions in the design PDF; responsive 360 / 768 / 1366
- End of each work round: table for the owner (task, commit, what it does, what they must check)

Full rules: `AGENTS.md`.

## 5. Traps we hit (and fixes)

| Trap | Fix |
|------|-----|
| Radix Dialog injects `<style>` for scroll lock → CSP `style-src 'self'` blocks it | Native `<dialog>` + CSS `body:has(dialog[open])`; Radix Menu **non-modal** |
| Staff seed / person name validation rejected short or odd names | Use `personNameField` rules; seed names that pass (e.g. "Dev Doctor") |
| Vite/`use client` warnings from Radix/react-router | Harmless; ignore |
| Wrangler crash mid-hot-reload (undefined import after partial edit) | Prefer whole-file writes for shared modules; restart `pnpm dev` |
| Browser shows old Settings (no Visit types) after rebuild | Hard reload with cache-bust `?v=`; confirm `index.html` asset hash |
| `URLSearchParams` in `packages/shared` breaks outside browser | ParamReader / plain `Record` params (shared must stay isomorphic) |
| Query-plan guard: full SCAN on `staff_sessions` by `user_id` | Migration **0006** index |
| List ItemForm `reset({ data: {} })` left previous minutes in the input | Reset with **named** blank keys per `LIST_DEFS.fields` |
| Phone: Add button click intercepted by bottom tabs | Shell already has bottom padding; scroll Add into view; don’t treat as a product bug if scroll works |
| Long-running `pnpm dev` / some browser tools hit Auto-review | Request approval / retry; don’t abandon the task |
| Default terminal Node is nvm v16 | Use system/Homebrew Node 26 |
| Agent browser cannot print or fully simulate keyboard Esc/Enter on native controls | Leave those checks in Waiting on me |
| Staging deploy without new migrations | App breaks (missing settings/list_items). Always apply **0006–0008** before next deploy |

## 6. How the owner likes to work

- Owner writes short **Hinglish**; agent replies in clear English
- After each round: a **table** — task, commit, what it does, what the owner must check/do
- Commands for the owner’s terminal: **plain lines** (no long prose to paste)
- No lectures; keep answers short unless asked
- Keep **Waiting on me** in STATE.md accurate every time it changes
- Commit locally after each task; owner pushes
- Do not start extra tasks beyond the agreed round

## Quick pointers

- Stack: one Worker + Vite React SPA; `packages/db`, `packages/shared`
- Lists: config in `packages/shared/src/lists.ts` → API + Settings section + editor (1.5.4)
- Settings keys: `packages/shared/src/settings.ts`
- Permissions: `packages/db/src/permissions.ts` (doctor must still confirm 1.3.4)
- Design screens: S01–S21 in DESIGN.md / design PDF; Settings frame = **S12**
- Local worker currently may already be on port **8787** from a prior `pnpm`/`wrangler` session

When you finish a task: files changed, how to verify in under 2 minutes, anything unsure, then MAP + STATE, then local commit.
