# Restore drill 2: D1 Time Travel (9.1.8)

Limit: free plan ~7 days, 10 restores / 10 minutes / database.

## Practice on throwaway D1 (owner + agent notes)

1. Create throwaway D1 `dental-clinic-tt-drill` (delete after).
2. Apply migrations; insert a few FAKE rows.
3. Note bookmark: `wrangler d1 time-travel info DB`.
4. Simulate mistake: delete a FAKE row (or bad migration on this throwaway only).
5. Restore to bookmark: `wrangler d1 time-travel restore DB --bookmark=…` (confirm Cloudflare docs flags).
6. Check invariants + last audit rows.
7. Delete the throwaway database.

## Before every production migration (9.1.9)

1. Write Time Travel bookmark in the release note.
2. Fresh encrypted export (or confirm last night’s backup ping is green).
3. Dry-run migration on a copy / local.
4. Expand-contract: add column → deploy code → later drop old (never destructive in one deploy).
5. Deploy only after clinic hours.

## Waiting on owner

- One throwaway Time Travel restore completed; date + “under 10 minutes?” in STATE.md.
