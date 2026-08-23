**TL;DR:** S3-to-R2 staging migration and auth fix are done, but reporting queries are blocked by infra and we must decide on dropping Node 18 support.

✅ **S3-to-R2 migration:** Ran script on staging, 412k objects copied, checksums match.
✅ **Auth cookie SameSite fix:** Merged PR 812 yesterday.
🟡 **Invoice PDF renderer:** Ported 7 of 14 templates, Czech VAT rounding rules are fiddly.
🟡 **Webhook retry queue:** Skeleton works end-to-end, no dead-letter handling yet.
⬜ **Reporting-query task:** Stuck awaiting credentials.

🔴 **Blocker:** Missing prod read-replica credentials from infra since Tuesday and Thursday.

**Your move:**
🔑 Unblock reporting queries by getting prod read-replica credentials from infra.
🗳️ Decide whether to drop Node 18 support for native fetch or keep it for two pinned customers.
