# New developer — first day (9.5.1)

You need: a Mac or Linux machine, Homebrew, and access to the GitHub repo.

---

## 1. Install tools

```bash
# Node 26 via nvm (the repo has .nvmrc = 26)
nvm install 26
nvm use 26          # or: nvm use system if Homebrew Node 26 is installed

# pnpm (the repo uses pnpm 12)
brew install pnpm

# Confirm versions
node --version      # should be 26.x
pnpm --version      # should be 12.x
```

---

## 2. Clone and install

```bash
git clone <repo URL>
cd dental-clinic
pnpm install
```

---

## 3. Set up local dev variables

Create `apps/worker/.dev.vars` (gitignored — never commit):

```
AUTH_MODE=dev-stub
MESSAGING_MODE=dry_run
APP_ORIGIN=http://localhost:5173
```

Do not add `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` for local dev — the dev-stub login handles sign-in without Google.

---

## 4. Set up the local database

```bash
# Apply all migrations to local D1
pnpm db:migrate

# Seed 5,000 fake patients (local only — never staging/production)
pnpm db:seed

# Optional: seed 200 fake clinical records for testing
pnpm --filter @clinic/worker seed:clinical
```

---

## 5. Start the development server

```bash
pnpm dev
```

Opens:
- Vite at http://localhost:5173 (web SPA, proxies `/api` to the Worker)
- Wrangler at http://localhost:8787 (Worker + local D1)

Sign in at http://localhost:5173 using the dev-stub links (Doctor or Receptionist — no Google needed in dev mode).

---

## 6. Run the checks

```bash
pnpm check
```

This runs:
- TypeScript strict compile (`tsc --noEmit`)
- ESLint
- Prettier format check
- Vitest (all packages)

All checks must be green before committing.

---

## 7. Run the backup dry-run

```bash
pnpm backup:dry-run
```

Uses a fake fixture dump. Verifies the backup pipeline (integrity check, age encryption if `age` is installed). Output goes to `scripts/backup/.dry-out/` (gitignored).

This confirms the backup toolchain works on your machine. See `docs/BACKUP.md` for the full design.

---

## 8. Read these docs

| Doc | Why |
|-----|-----|
| `README.md` | Commands, environments, deploy steps, secrets |
| `docs/AGENTS.md` | The rules every change must follow |
| `docs/ARCHITECTURE.md` | One-page system overview |
| `docs/DECISIONS.md` | Every tech decision and why |
| `docs/STATE.md` | Where the project is right now; what is waiting |
| `docs/PLAN.md` | The full task plan (read the current phase only) |
| `docs/DESIGN.md` | UI rules, screen map, colours |

---

## 9. Important rules (summary)

- **Never commit secrets.** Worker secrets go in `.dev.vars` (local) or `wrangler secret put` (staging/production).
- **Never put real patient data in the repo, tests, screenshots, or staging.**
- **Never push unless the owner says "push."** (`git commit` locally is fine.)
- Money is always integers in paise. No floats.
- Finalised records are locked — corrections are addendum rows, never updates.
- Every write to patient or money data needs an `audit_log` row in the same `db.batch()`.
- `pnpm check` must pass before every commit.

---

## Gotchas

- Your terminal's default Node may be nvm v16; run `nvm use system` or `nvm install` before `pnpm`.
- TypeScript is pinned to 6.0 (typescript-eslint 8.x compatibility).
- All `wrangler` commands run via the `wr` script in `apps/worker/package.json` so config and logs stay in `apps/worker/.wrangler`.
- No `wrangler login` on dev machines: the Cloudflare API token is typed with `read -s` per terminal session for staging/production commands.
- CSS order matters in `main.tsx`: `base.css` and `ui.css` must load before feature CSS.

---

## See also

- `docs/ARCHITECTURE.md` — system diagram
- `docs/BACKUP.md` — backup design
- `docs/runbooks/` — downtime and restore runbooks
