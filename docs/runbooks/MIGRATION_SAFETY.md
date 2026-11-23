# Migration safety (9.1.9)

1. **Bookmark** D1 Time Travel before migrate.
2. **Fresh backup** green (Healthchecks) or manual export.
3. **Dry run** SQL on local / throwaway D1.
4. **Expand–contract**: add nullable/new objects first; switch code; remove old in a later deploy.
5. **No destructive** drop/rename of patient or money columns in the same deploy that ships code which still needs them.
6. **Rollback plan** one paragraph in the PR / release note (usually: Time Travel bookmark + previous Worker version).
7. **Deploy window**: after clinic hours or Sunday.

Fake “bad migration” rollback drill: apply a throwaway migration on `dental-clinic-tt-drill`, restore bookmark, confirm schema. Note result in STATE.md.
