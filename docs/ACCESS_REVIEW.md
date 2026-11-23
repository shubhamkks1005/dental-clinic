# Access review (9.3.4)

Quarterly review of who has access to every system. Remove anyone who should not be there.

**Review every 3 months.** Record the date in the last column.

---

## Review checklist

| System | What to check | 2FA required? | Last reviewed |
|--------|--------------|--------------|--------------|
| Cloudflare account | Members list; remove old developer accounts; check API tokens list | Yes | ________ |
| GitHub repository | Collaborators list (Settings → Collaborators); remove anyone no longer on the project | Yes | ________ |
| Cloudflare Access (Zero Trust) | Allowed email list (if Access is active); no old emails | Yes | ________ |
| Backblaze B2 | Application keys list; remove unused keys; check bucket permissions | Yes | ________ |
| Domain registrar | Contact email; account access; check DNS changes log | Yes | ________ |
| Google (OIDC client) | Google Cloud Console → OAuth consent → credentials; check authorised redirect URIs | Yes (Google account) | ________ |
| Healthchecks.io | Account members; check ping URL list | — | ________ |
| UptimeRobot | Account contacts list | — | ________ |
| Staff in the app | Settings → Staff: check active staff list; deactivate anyone who has left | Via Google | ________ |

---

## 2FA and recovery codes

| System | 2FA set up? | Recovery codes stored? |
|--------|------------|----------------------|
| Cloudflare | Yes / No | Paper / password manager |
| GitHub | Yes / No | Paper / password manager |
| Google (developer) | Yes / No | Paper |
| Backblaze B2 | Yes / No | Paper / password manager |
| Domain registrar | Yes / No | Paper / password manager |

Fill in and keep current. Recovery codes must be on paper (not only in a phone or in the same account that is being recovered).

---

## Who to remove immediately

- Anyone who has left the clinic or the project.
- Any test account created during development.
- Any token that was created for a one-time task (e.g. staging setup token — see DECISIONS.md "Mac setup API token").

---

## Review history

| Date | Reviewer | Notes |
|------|---------|-------|
| ________ | developer | First review before go-live |
| | | |
| | | |
