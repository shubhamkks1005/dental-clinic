# Quota monitor (9.2.1)

Cloudflare free plan: **100,000 Worker requests per day** (resets 05:30 IST).

## Daily request budget estimate (per feature)

| Feature | Rough daily requests | Notes |
|---------|---------------------|-------|
| Today screen (staff) | ~40 | auto-refresh every 60 s × ~2 staff |
| Appointment day view | ~20 | manual load + status clicks |
| Quick-book | ~10 | per booking × reloads |
| Patient search / open | ~30 | desktop use through the day |
| Visit open / draft patch | ~40 | autosave ~every 5 s × open visits |
| Visit finalise | ~5 | per finalised visit |
| Dashboard (reports) | ~10 | manual opens; cached 60 s |
| Billing (issue, pay, print) | ~20 | per patient billing action |
| Messaging tick (cron) | ~288 | every 5 min = 288/day |
| Stats cron (every 5 min) | ~288 | shares the same cron trigger branch |
| Settings reads | ~5 | low; cached client-side |
| Health check (UptimeRobot) | ~288 | every 5 min |
| Backup ops-status webhook | ~1 | once per night |
| Miscellaneous / portal | ~50 | future portal load |
| **Estimated total** | **~1,100/day** | well under 50k; budget for growth |

> These are estimates for a small clinic (~15 patients/day). Run `9.4.1` load test to fill real numbers.

## Thresholds and actions

| Threshold | % of limit | Action |
|-----------|-----------|--------|
| 50,000 | 50% | Log and email developer (Healthchecks fail ping or GraphQL alert). No action yet. |
| 80,000 | 80% | Developer reviews what is driving load; consider rate-limit or caching improvements. |
| 95,000 | 95% | Developer warns the clinic. Prepare for paper mode. Consider upgrading to Workers Paid ($5/month — ask the doctor first). |

## GraphQL analytics token

**Waiting on owner.** The quota monitor (cron hourly branch) needs a Cloudflare API token with **Account Analytics read** permission only. Store in GitHub secret `CLOUDFLARE_ANALYTICS_TOKEN`. Do not use the deploy or backup token for this.

## Error 1027

When the daily limit is reached, Cloudflare returns **HTTP 1027** to every API request. The static SPA files and fonts are served free and are unaffected, so the browser still loads the app. The Worker API (all `/api/*` and `/hooks/*` paths) is blocked.

The staff app shows a "Server busy" banner with a link to paper mode when any API call returns 1027.

**Reset time: 05:30 IST** (midnight UTC). No action needed; the app recovers on its own.

## How to monitor manually

1. Cloudflare dashboard → Workers & Pages → your Worker → Metrics → Requests.
2. Check weekly; keep the budget table above updated after `9.4.1` load test.
3. When 9.2.5 error_log and 9.4.1 cron alerting are live, monitoring is automatic.
