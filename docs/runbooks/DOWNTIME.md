# Downtime runbook (9.2.4) — DRAFT

**Decision tree for common problems. Owner / developer fills phone numbers before go-live.**

---

## Who to call

| Person | Role | Phone | WhatsApp |
|--------|------|-------|----------|
| Developer (owner) | First responder | _FILL IN_ | _FILL IN_ |
| Clinic (doctor / sister) | Decision maker | _FILL IN_ | _FILL IN_ |
| Receptionist | Runs paper mode | _FILL IN_ | _FILL IN_ |

---

## 1. App does not open (browser shows an error page or nothing)

1. **Check [cloudflarestatus.com](https://www.cloudflarestatus.com)** — is Cloudflare having an incident?
   - Yes → wait; tweet the link to the clinic; switch to paper mode (see §6).
   - No → go to step 2.
2. Open the Worker dashboard: Cloudflare → Workers & Pages → dental-clinic → Metrics.
   - Is the Worker returning 503 or not running? → check recent deploy (§4).
   - Requests spiking? → check quota (§2).
3. Check UptimeRobot / ops-status panel (dashboard Attention section).
4. If still unclear, call the developer.

**Target:** identify cause in under 5 minutes.

---

## 2. Error 1027 (quota exceeded)

Symptom: staff app shows "Server busy" banner. API calls fail with 1027.

1. Check Cloudflare dashboard → Worker Metrics → today's request count.
2. If near 100k: quota is exhausted; wait for reset at **05:30 IST**.
3. If far below 100k: something else is wrong — call the developer.
4. Switch to paper mode (§6) for the rest of the day.
5. Developer: consider upgrading to Workers Paid ($5/month) if this recurs — ask the doctor first.

---

## 3. D1 database error

Symptom: app opens but all data reads fail; API returns 500 or "database unavailable".

1. Cloudflare dashboard → D1 → dental-clinic → check for errors or incidents.
2. Developer: check if a bad migration was recently applied.
   - Bad migration? → §4 rollback AND use Time Travel (see `docs/runbooks/RESTORE_TIME_TRAVEL.md`).
3. If Cloudflare D1 is having an incident: wait; switch to paper mode (§6).
4. If data is corrupt or accidentally deleted: Time Travel restore (see `RESTORE_TIME_TRAVEL.md`).

---

## 4. Bad deploy — rollback

Symptom: deploy happened, app broke, previous version worked.

1. Cloudflare dashboard → Workers & Pages → dental-clinic → Deployments.
2. Find the last good deployment (one before the broken one).
3. Click "Rollback to this version" (or use `wrangler rollback`).
   ```
   npx wrangler rollback --env production
   ```
4. Confirm the app works again (open `/api/staff/health`).
5. Tell the clinic (WhatsApp message: "App is back — was briefly broken, now fixed").
6. File a bug. Fix and re-deploy only outside clinic hours or on Sunday.

**Target: rollback in under 5 minutes.**

---

## 5. Cloudflare or internet is down

Symptom: Cloudflare status shows an incident, or the clinic's internet is down.

1. Switch to paper mode immediately (§6).
2. Developer checks: is it the clinic's internet only?
   - Try phone hotspot at the clinic — if the app opens on hotspot, the clinic broadband/router is the problem.
   - Contact ISP or use the backup hotspot (see `docs/PILOT_PREP.md` §hardware).
3. If Cloudflare-wide: nothing to do except wait and use paper mode.

---

## 6. Paper mode

Use the printed day list prepared every evening (see `docs/PAPER_KIT.md`).

**While paper mode:**
- Use the pre-printed appointment list (name, time, mobile, alert labels).
- Write new patients on blank registration forms.
- Use the paper receipt book (manual series, different from software).
- Note every action on a notepad with the patient code and time.

**When the app comes back:**
- Enter every paper record within **24 hours**.
- Mark each entry "Late entry — service date: DD/MM/YYYY, entered: DD/MM/YYYY" (the app shows a "Late entry" label on day-close entries).
- Match the paper receipt book totals against the software day close for that date.

---

## 7. Domain / DNS problem

Symptom: the domain does not load; `nslookup clinic.example.in` returns nothing or the wrong IP.

1. Log in to the domain registrar (see `docs/ACCOUNTS.md`).
2. Check DNS records → the A/CNAME pointing to Cloudflare should be there.
3. Check Cloudflare DNS tab — is the record proxied (orange cloud)?
4. If the domain expired: renew immediately; propagation ~5–10 minutes through Cloudflare.
5. If DNS was accidentally changed: restore to the last known-good settings.
6. While fixing: use the direct `*.workers.dev` URL as a temporary workaround (note it in ACCOUNTS.md).

---

## Timing targets

| Situation | Target resolution |
|-----------|------------------|
| Identify cause | < 5 minutes |
| Rollback bad deploy | < 5 minutes |
| Paper mode decision | < 2 minutes |
| Developer response (clinic hours) | < 30 minutes (call if no reply in 10 min) |
