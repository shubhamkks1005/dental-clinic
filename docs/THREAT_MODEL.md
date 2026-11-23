# Threat model (9.3.1)

Three surfaces: (1) staff app + patient portal `/my`, (2) gateway + webhook, (3) backups + CI.

---

## Surface 1: Staff app and patient portal `/my`

### Risks

| # | Threat | Mitigation | Status / task |
|---|--------|-----------|--------------|
| T1 | Attacker signs in as staff (stolen Google account) | Google login; Google 2-Step Verification is the second factor; sessions 12 h absolute / 60 min idle | Accepted; 2-Step is Google's control — 1.3.8 |
| T2 | Receptionist accesses clinical data | Role permission table; receptionist denied clinical.view, prescriptions, restricted files, full reports | 1.3.4, 9.3.5 |
| T3 | Receptionist exports full patient list | Patient list capped at 25 results; full CSV export is doctor-only (reports.full) | 9.3.5 |
| T4 | XSS / script injection in patient data | Strict CSP (default-src 'none', no unsafe-inline); React escapes all output | 1.4.2 |
| T5 | CSRF — attacker tricks staff into a state-changing request | CSRF guard: Origin = APP_ORIGIN + header `x-clinic-request: 1` on every non-GET API call | 1.3.8 |
| T6 | Session token theft (network) | `__Host-` cookie, HttpOnly, Secure, SameSite=Lax; HSTS | 1.3.8 |
| T7 | Brute-force login | Cloudflare Access rate-limits Google callbacks; Google itself rate-limits | Accepted (Access adds outer throttle); 1.3.1 |
| T8 | Portal patient sees another patient's records | Portal endpoints `/api/portal/*` are separate; every query filters by the authenticated patient's ID | 8.1.2 (portal login) |
| T9 | Information leak in error messages | 500 returns a generic message + Error ID only; no stack trace, no SQL, no names | 1.4.7 |

---

## Surface 2: Gateway and webhook

| # | Threat | Mitigation | Status / task |
|---|--------|-----------|--------------|
| T10 | Forged ops-status webhook (fake backup success) | Webhook signed with HMAC-SHA256 (`secret\nbody`); Worker verifies before writing to `ops_status` | 9.1.10 |
| T11 | SMS gateway phone compromised | Phone is clinic-only Android; screen lock; clinic premises; no patient PHI in SMS text (name + date/time only) | 7.1.x; 7.9.4 Waiting |
| T12 | Replay of old webhook | Timestamp in body; Worker rejects payloads older than 5 minutes | 9.1.10 |
| T13 | Gateway credentials leaked | Gateway login stored as Worker secret only; never in repo or chat | 7.1.2 (Waiting on gateway setup) |

---

## Surface 3: Backups and CI

| # | Threat | Mitigation | Status / task |
|---|--------|-----------|--------------|
| T14 | Backup dump contains readable patient data if B2 is breached | Nightly dump is `age`-encrypted (recipient = developer public key) before upload; B2 key has bucket-read-write only | 1.6.3, 9.1.3 |
| T15 | CI secret leaks (GitHub Actions) | Secrets are GitHub repository secrets; not printed in logs; `gitleaks` runs in CI to scan for accidental commits | 9.3.2 |
| T16 | Supply chain attack via npm dependency | `pnpm-lock.yaml` committed and checked; `pnpm audit` in CI; Dependabot weekly PRs (minor/patch grouped, 7-day cooldown); Actions pinned by commit SHA | 9.3.2 |
| T17 | Developer laptop lost with decrypted data | Restore drill only on encrypted laptop; delete dump after drill; no real patient data in repo, tests, or screenshots | AGENTS.md data rules |

---

## Owner / reviewer checklist

- [ ] Every T# above has a task ref or "Accepted" with a reason.
- [ ] No task above is "Waiting" for more than one phase before go-live.
- [ ] Review this page every 6 months or after any security incident.
