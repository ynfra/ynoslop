**Done/Progress:**
- S3 to R2 migration script is complete and ran on staging (412k objects copied, checksums match).
- Auth cookie SameSite fix merged yesterday (PR 812).
- Invoice PDF renderer: 7 of 14 templates ported (Czech VAT template is fiddly due to rounding rules).
- Webhook retry queue skeleton works end-to-end (no dead-letter handling yet).

**Blockers:**
- Reporting-query task is stuck. Still waiting on prod read-replica credentials from infra (requested Tuesday and Thursday, no reply).

**Decisions Needed:**
- Need a decision on whether the SDK keeps supporting Node 18. Dropping it allows native fetch, but two customers are pinned to 18.
