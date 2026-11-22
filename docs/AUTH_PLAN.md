# AUTH_PLAN: staff "Sign in with Google" (task 1.3.8, for owner approval)

Main staff login until Cloudflare Access is available. Access (1.3.1) stays in the plan as an optional
outer layer, "waiting on card". No passwords stored; Google 2-Step Verification is the second factor.
Staff login is Google only. Nothing here changes the patient portal (Phase 8). No real patient goes live
before this is done; staging holds fake data only.

## 1. Flow and endpoints (all under the staff group, OIDC code flow + PKCE, server-side)
- `GET /api/staff/auth/start`: makes `state`, `nonce` and a PKCE `code_verifier` (32 random bytes each,
  base64url), puts them in a 10-minute cookie `__Host-staff_oauth` signed with HMAC-SHA256
  (secret `AUTH_COOKIE_SECRET`; no DB write), and redirects to Google with `response_type=code`,
  `scope=openid email`, `code_challenge` (S256), `prompt=select_account`, `redirect_uri` from `APP_ORIGIN`.
- `GET /api/staff/auth/callback`: checks the cookie signature, expiry and `state` (constant time), then
  POSTs the code + `code_verifier` to Google's token endpoint and verifies the ID token: RS256 signature
  against Google's keys (by `kid`), `iss` is `https://accounts.google.com` or `accounts.google.com`,
  `aud` (and `azp` if present) = our client id, `exp` in the future (60 s skew), `nonce` matches,
  `email_verified === true`. Email is lowercased. Then: user row active + `google_sub` empty: bind `sub`
  (audited); `google_sub` set but different: deny. Success: new session, 302 to `/app` (full page load).
- `POST /api/staff/auth/logout`: CSRF-checked; revokes the session row, clears the cookie, 200.
- `GET /api/staff/me`: `{ name, role, permissions[] }` for the header and menu.
- Name comes from the staff list (the doctor types it), not from Google (scope stays `openid email`).

## 2. Sessions
- Token = 32 random bytes in cookie `__Host-staff_session` (`Secure; HttpOnly; SameSite=Lax; Path=/`,
  no Domain; fits `__Host-`). D1 stores only SHA-256 of it. New token on every login.
- Table `staff_sessions`: user_id, token_hash (unique), expires_at (= login + 12 h, absolute),
  last_seen_at, revoked_at, short user agent, plus the standard columns.
- Idle timeout proposal: 60 minutes (doctor may pick 30-120). `last_seen_at` is written at most once
  per 5 minutes per session, so normal requests stay read-only.
- Every request: one indexed read joining `users` (status must be active). Logout and deactivation set
  `revoked_at`; deactivating a user revokes all their sessions in the same `db.batch()`.
- CSRF (with plan 1.3.5): every non-GET `/api` call must send `Origin` equal to `APP_ORIGIN` and the
  header `X-Clinic-Request: 1` (forces a CORS preflight we never allow). GET never changes state.

## 3. Deny by default
- One middleware on `/api/*`: no valid staff session gives 401 `{ ok:false, error }`. Public list (one
  constant): `auth/start`, `auth/callback`, `health` (no DB), `auth/branding` (clinic name and logo
  only, for the public landing page; owner to confirm this fourth entry).
- `/api/portal/*` is closed by the same rule until Phase 8; `/hooks/*` uses signatures (Phase 7).
- Test: walk `app.routes` (Hono), fill path params with dummies, call every route without a cookie;
  fail if anything outside the public list answers other than 401.

## 4. Staff management (doctor confirms)
- a. First doctor: `pnpm staff:seed-doctor` (developer only). Asks for email and name in the terminal,
  runs one guarded INSERT through wrangler (`WHERE NOT EXISTS` active doctor) + audit row. Not a
  migration: real emails never go in the repo.
- b. Settings > Staff (doctor only; hidden and 403 for others): add (name, Gmail, role doctor or
  receptionist), deactivate, reactivate, change role, "reset Google link" (after a changed Gmail).
- c. Deactivate = status `disabled`; users are never deleted. Records keep `created_by` = the old user
  id, so their name still shows in history and audit.
- d. Access comes only from the role via the permission table (1.2.6/1.3.4); no per-person grants.
- e. Guards in the same batch as the change: never 0 active doctors (conditional UPDATE + `changes()`
  check, as in 1.2.7); nobody changes their own role or deactivates themselves; every change writes
  `audit_log` (before/after) and an `access_log` event.
- f. Permission table for 1.3.4 (from the plan's matrix + 3.2.7, 3.7.5, 4.2.6, 5.3.7/8, 6.3.8):

| Action | Doctor | Receptionist | Developer (support) |
| --- | --- | --- | --- |
| Patients: search, view basic details | yes | yes | no |
| Patients: add, edit basic details | yes | yes | no |
| Patients: delete (soft) | yes | no | no |
| Clinical: notes, chart, diagnosis, plans, alert details | yes | alert icon only | no |
| Prescription: write, finalise / print, reprint | yes / yes | no / yes | no |
| Appointments: view, book, move, cancel | yes | yes | no |
| Bills: create, take payment | yes | yes | no |
| Bills: discount, refund, cancel | yes | no | no |
| Files: X-rays and photos / scans and consent forms | yes / yes | no / upload and view | no |
| Reports, dashboard, export | yes | today's summary only | no |
| Settings and lists | yes | view timings only | config only, no patient data |
| Staff screen, audit log | yes | no | no (developer uses the commands below) |

- g. Recovery (doctor lost Gmail): developer checks identity in person, takes a Time Travel bookmark,
  then runs `pnpm staff:recover-doctor` (wrangler, token typed with `read -s`): sets the new email,
  clears `google_sub`, revokes sessions, writes audit. Never possible from inside the app.

## 5-6. Access not available, and logging
- Unknown, deactivated, unverified email or `sub` mismatch all end at the same page `/denied`, same
  wording and timing. `access_log` stores the reason and a masked email (`n***@gmail.com`).
- `access_log` actions to add: `login_failed`, `login_denied`, `logout`, `staff_change` (with `login`
  already there); a `detail` column for reason and masked email. No IPs in clear.

## 7. Development-only login stub
- Local `wrangler dev` uses its own entry `src/dev/dev-entry.ts` (app + `GET /api/staff/auth/dev-login
  ?role=doctor|receptionist`, fake users only). `env.staging` and `env.production` set `main` to
  `src/index.ts`, so the stub code is not in their bundles at all.
- Guards: a test builds the staging and production bundles (`--dry-run`) and fails if "dev-login"
  appears; the stub also refuses any host other than localhost; staging/production vars set
  `AUTH_MODE=google` and a test checks `wrangler.jsonc` keeps it that way.

## 8. Free-tier fit
- Login callback: 1 subrequest (token POST) + at most 1 (keys GET) of the 50 allowed. CPU: one RS256
  verify with WebCrypto, a few SHA-256/HMAC operations and JSON: well under 1 ms of the 10 ms (waiting
  on Google does not count as CPU). Normal requests: one D1 read, no subrequests.
- Google's keys (`https://www.googleapis.com/oauth2/v3/certs`) are kept in isolate memory until their
  `Cache-Control` max-age; an unknown `kid` forces one refetch (at most once per 5 minutes). The Cache
  API is not used because it does nothing on workers.dev.

## 9. Where the code lives, and tasks
- Worker: `src/routes/staff-auth.ts` (thin), `src/middleware/session.ts` (deny by default, builds `ctx`
  and repos), `src/middleware/csrf.ts`, `src/domain/auth.ts` (pure rules: claims, decisions, timeouts),
  `src/domain/jwt.ts` (RS256 + JWKS, reused for Access later), `src/adapters/google-oidc.ts` (token
  and keys fetch). DB: migration (users.google_sub unique, staff_sessions, access_log actions), repos
  `sessions` and `users` with the guards. Web: `src/features/auth/` (landing, denied, `useMe`, API
  functions), `src/features/staff/` (Settings > Staff).
- Order: 1.3.2 JWT verifier (generic; Access JWT check later as config) -> 1.3.8 Google sign-in,
  sessions, deny-by-default, stub, landing/denied -> 1.3.3 users and roles (sub binding, seed command,
  login events) -> 1.3.4 permission table + tests -> 1.3.5 headers -> 1.3.6 Staff screen (now needed
  before go-live) -> 1.3.7 header name and role, expiry message.

## 10-13. Landing page, header, scope, design
- `/` becomes a public landing page; the `/ -> /app` redirect and its test are removed. Cards: "Clinic
  staff" with "Sign in with Google" (full link to `auth/start`; one button for every role, the role comes
  only from the staff list) and "Patients" (disabled, "Coming soon"). If already signed in: "Continue to
  the app". `/app` without a session shows nothing and goes to `/` after `/me` returns 401.
- Header after login: "Dr. Nidhi Kushwaha · Doctor" (name · role) and "Sign out"; the menu shows only
  what the role may use.
- `/my` stays a static placeholder with no API. Patient portal = Phase 8 (8.1.2, 8.2), unchanged.
- Design: new S20 "Start" (landing) and S21 "Access not available", both built from S18 (centred card,
  logo tile) with DESIGN.md tokens. Changed: S01/S14 (user card shows name · role, Sign out) and S12
  (Staff section). Copy: "Sign in with Google" / "Patients: Coming soon" / "Access not available. This
  Google account can't open the clinic app. If you work at the clinic, ask the doctor to add your Gmail
  address, then try again." / "You were signed out after a period of inactivity. Sign in again."

## 14. Owner setup in Google Cloud (personal device, personal Gmail)
1. console.cloud.google.com: new project "align-dentistry-clinic".
2. Google Auth Platform > Branding: app name "Align Dentistry staff", support email; no logo (a logo
   triggers brand review). Audience: External; publish to production (openid + email need no
   verification; if Google asks for it, stay in Testing and add the staff Gmails as test users).
3. Data access: scopes `openid` and `.../auth/userinfo.email` only.
4. Clients > Create > Web application, one client for staging + local: redirect URIs
   `https://dental-clinic-staging.shubhamkks1005.workers.dev/api/staff/auth/callback` and
   `http://localhost:8787/api/staff/auth/callback`. A separate production client later with
   `https://<production domain>/api/staff/auth/callback` (8.1.3). No JavaScript origins needed.
5. Client ID is not secret: it goes in `wrangler.jsonc` vars (`GOOGLE_CLIENT_ID`, `APP_ORIGIN`). Secrets,
   typed or piped only in the owner's own terminal: `pnpm wr secret put GOOGLE_CLIENT_SECRET --env staging`
   (hidden prompt) and `openssl rand -base64 32 | pnpm wr secret put AUTH_COOKIE_SECRET --env staging`.
   Local real-Google testing only via `apps/worker/.dev.vars` (gitignored); the stub needs no secrets.

## 15. Why not password + TOTP first; fallback
Passwords mean storing hashes we cannot hash strongly inside 10 ms (decision T4), plus reset flows,
TOTP enrolment, recovery codes and lockouts: more code and more ways to get it wrong. Google gives
2-Step Verification, account recovery and suspicious-login detection for free. Password + TOTP stays
the fallback if Google sign-in becomes unusable. If Google rejects the workers.dev redirect URI, buy the
.in domain early (8.1.3, T10) and use a staging subdomain on it.

## 16. Risks
- Gmail takeover: staff must turn on Google 2-Step Verification (doctor: security key or passkey); we
  cannot read 2SV from the token, so it is an onboarding checklist item. `sub` binding stops a new
  account with the same address; deactivation revokes sessions at once; short sessions.
- Shared clinic PC left signed in: 60-minute idle and 12-hour absolute expiry, clear "Sign out",
  `prompt=select_account`. Each person uses their own Chrome profile on the reception PC; the doctor
  signs in on her own device. The Sign out page offers "Also sign out of Google on this computer".
- Lost phone or laptop: doctor deactivates the user (all sessions end now) or the person signs out the
  device in their Google account; sessions die within 12 hours anyway.
- Doctor loses Gmail: section 4g. Developer device lost: Cloudflare account has a security key.

## 17. With or without Cloudflare Access
The app login never depends on Access. Later, Access covers `/app` and `/api/staff` (with a Bypass rule
for `/api/staff/health`); the landing page stays public. Setting Access to use Google as its identity
provider with the same emails means one real Google sign-in: start -> Access (Google, remembered) ->
app Google step (instant) -> `/app`. The Access JWT check (1.3.2) switches on by config
(`ACCESS_AUD` set) with no code change.
