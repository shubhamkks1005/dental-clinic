# apps/worker rules (Hono API on Cloudflare Worker)
- Only three route groups: /api/staff/* (Cloudflare Access JWT required), /api/portal/* (patient session, read-only), /hooks/* (signed webhooks). Nothing else.
- Auth middleware runs first. Every staff route declares its allowed roles (doctor, receptionist, developer). Add the route to the role test matrix.
- Validate every input with zod schemas from packages/shared. Reply shape: { ok: true, data } or { ok: false, error: { code, message } }.
- Database only through functions in packages/db. Any write touching more than one row uses db.batch().
- Unauthenticated endpoints: rate limit, at most one write per request, Turnstile where the plan says so.
- Cron: one scheduled() handler; each job is a branch in src/cron/*.ts; each branch returns fast and respects the 30-subrequest guard. Messages per tick default to 5.
- Provider calls (SMS, email, R2 backup) only inside src/adapters/*. Business code uses the adapter interface.
- Logs must never contain patient names, numbers or health data.
- File layout and size limits: follow "Code structure" in AGENTS.md (thin routes, rules in src/domain/<feature>.ts).
