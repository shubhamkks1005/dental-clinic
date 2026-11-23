# Architecture (9.5.1)

One-page overview of the system.

---

## Stack

```
Browser (staff or patient)
        │
        │  HTTPS
        ▼
┌───────────────────────────────────────────────────────────┐
│  Cloudflare Worker  (apps/worker, Hono)                   │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ Static      │  │ /api/staff  │  │ /api/portal      │  │
│  │ assets      │  │ (Hono, auth │  │ (read-only,      │  │
│  │ (Vite SPA)  │  │ + CSRF +    │  │ patient login    │  │
│  │             │  │ deny-by-    │  │ Phase 8)         │  │
│  │             │  │ default)    │  │                  │  │
│  └─────────────┘  └──────┬──────┘  └──────────────────┘  │
│                           │                               │
│                    ┌──────▼──────┐                        │
│                    │  Domain     │                        │
│                    │  functions  │                        │
│                    │ (src/domain)│                        │
│                    └──────┬──────┘                        │
│                           │                               │
│          ┌────────────────┼──────────────────┐           │
│          │                │                  │           │
│   ┌──────▼──────┐  ┌──────▼──────┐  ┌────────▼──────┐   │
│   │ packages/db │  │  Adapters   │  │  Adapters     │   │
│   │ (Drizzle +  │  │  Storage    │  │  Messaging    │   │
│   │  D1 SQLite) │  │  (B2 / R2 / │  │  (WhatsApp /  │   │
│   │             │  │   memory)   │  │  SMS / Fake)  │   │
│   └──────┬──────┘  └──────┬──────┘  └───────────────┘   │
└──────────┼────────────────┼──────────────────────────────┘
           │                │
    ┌──────▼──────┐  ┌──────▼──────┐
    │ Cloudflare  │  │ Backblaze   │
    │ D1 (SQLite) │  │ B2 (files)  │
    └─────────────┘  └─────────────┘
```

---

## Key components

| Component | Location | What it does |
|-----------|----------|-------------|
| Vite + React SPA | `apps/web/` | Staff app and patient portal UI; built to static files |
| Cloudflare Worker (Hono) | `apps/worker/` | API + serves static files; one Worker, all environments |
| packages/db (Drizzle) | `packages/db/` | Schema, migrations, repositories; never imported by the web SPA |
| packages/shared | `packages/shared/` | Types, validation (zod), business rules shared between Worker and web |
| Cloudflare D1 | Cloudflare account | SQLite database; point-in-time restore 7 days |
| Backblaze B2 (files) | B2 account | Private file storage (X-rays, photos, scans); accessed only through the Worker |
| GitHub Actions | `.github/workflows/` | CI (lint + typecheck + tests + e2e), nightly backup, weekly billing integrity |

---

## Auth

- **Staff:** "Sign in with Google" (OIDC code flow; Google sub bound on first login); 12 h session, 60 min idle; sessions in `staff_sessions`; Cloudflare Access optional outer layer.
- **Patient portal:** SMS OTP + password (Phase 8); portal routes read-only; each query filters by the logged-in patient's ID.
- **Worker requests:** CSRF guard (Origin + `x-clinic-request` header) on all non-GET API calls; deny-by-default session middleware.

---

## Data rules (enforced in code, see AGENTS.md for all rules)

- Money: integers in paise only.
- Finalised records (visit, Rx, bill, receipt, certificate) are locked; corrections are addendum rows.
- Delete = soft delete (`deleted_at`); every money or patient write adds an `audit_log` row.
- Numbers (bill, receipt, etc.) come only from the `counters` table inside a `db.batch()`.
- Times stored UTC, displayed IST. Mobiles normalised by one shared function.

---

## Environments

| Environment | Entry point | Database | Files |
|-------------|------------|----------|-------|
| Local (dev) | `src/dev/dev-entry.ts` | Local D1 (`.wrangler/`) | Local R2 binding |
| Staging | `src/index.ts` | Staging D1 | B2 (S3 driver) |
| Production | `src/index.ts` | Production D1 | B2 (S3 driver) |

---

## See also

- `docs/DECISIONS.md` — all tech decisions with rationale (T1–T10 and beyond)
- `README.md` — setup, deploy, secrets
- `docs/FIRST_DAY.md` — new developer onboarding
