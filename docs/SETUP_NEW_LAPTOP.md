# Setup on a new laptop (for the AI and for the owner)

**AI: if this repo was just cloned (no `node_modules/` folder, or the owner says "new laptop"), read this file first and guide the owner step by step. Run each check yourself where you can, ask the owner to type only what needs their account or a secret. Never push, never touch other folders on the computer.**

The owner moves between two laptops through GitHub. Everything needed is in the repo: code, plan, design, docs, the Gate B screenshots and the local development database (fake data only). Not in the repo, on purpose: `node_modules/`, build output (`dist/`), `.wrangler/tmp`, `.wrangler/logs`, `.wrangler/e2e-state`, and any secret (`.dev.vars`).

## 1. Tools (once per laptop)
```bash
brew install nvm pnpm          # pnpm 12 is needed (package.json: pnpm@12.21.0)
nvm install 26 && nvm use 26   # Node 26 is needed (engines: >=26 <27; .nvmrc = 26)
node --version && pnpm --version
```
On the owner's first laptop `nvm use system` was used because Node 26 came from Homebrew. Either works if `node --version` says 26.x. Playwright refuses Node below 20.

## 2. Get the code
```bash
git clone https://github.com/shubhamkks1005/dental-clinic.git
cd dental-clinic
pnpm install
pnpm exec playwright install chromium
```
Later, on the laptop that already has the repo: `git pull` (and `pnpm install` if `pnpm-lock.yaml` changed).

## 3. Local variables (optional, never committed)
Local dev works without it (dev-stub login). If the Worker complains, create `apps/worker/.dev.vars`:
```
AUTH_MODE=dev-stub
MESSAGING_MODE=dry_run
APP_ORIGIN=http://localhost:8787
```
Use `localhost`, not `127.0.0.1`: the CSRF guard answers 403 to writes from 127.0.0.1. Do NOT add Google or Cloudflare secrets for local work. Secrets for staging are typed with `read -rs VAR`, never written to a file.

## 4. Database
The local development database (fake data) is in the repo at `apps/worker/.wrangler/state`, so nothing has to be seeded. If it does not open (wrangler or Node version differs), recreate it:
```bash
rm -rf apps/worker/.wrangler/state
pnpm db:migrate     # all migrations, local only
pnpm db:seed        # fake patients, local only
```
Never run migrations or seeds against staging or production without the owner's say. Browser tests and runner flows use their own scratch database (`--persist-to <folder>`), see `docs/ui-audit/runner/README.md`.

## 5. Run and check
```bash
pnpm dev                       # app and Worker on http://localhost:8787
pnpm check 2>&1 | tail -25     # typecheck + lint + unit tests (must be green)
pnpm exec playwright test      # browser tests, 79 should pass (stop any server on port 8787 first)
```
Dev login: `http://localhost:8787/api/staff/auth/dev-login?role=doctor` or `role=receptionist`.

## 6. Then continue the work
Follow `AGENTS.md`: read `docs/RUN_PROMPT.md`, then `docs/HANDOFF.md` (next task), `docs/STATE.md`, `docs/FIXES.md`, `docs/MAP.md`. Prompt for the AI: **"Read docs/RUN_PROMPT.md and continue from docs/HANDOFF.md."**

## 7. Pushing (owner only)
The AI never pushes. When the owner says "push": run `git remote -v` and `git config user.email`, push only to the owner's personal `origin` (`shubhamkks1005/dental-clinic`), never force, never add another remote. If the remote or email looks like an office account, stop and ask. Check the GitHub repo is **Private** (it holds a fake-data database and screenshots).

## Troubleshooting
- `Playwright requires Node.js 20 or higher`: run `nvm use 26` in this terminal.
- Port 8787 busy: `lsof -ti :8787 | xargs kill` (only if it is our own dev server).
- Wrangler cannot open the database: step 4 recreate.
- `pnpm check` fails on Prettier only: `pnpm exec prettier --write <file>`.
