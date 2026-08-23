Yesterday:
- Merged the auth cookie `SameSite` fix in PR 812.
- Completed the S3-to-R2 migration script and ran it on staging: 412k objects copied, with all checksums matching.

In progress:
- Ported 7 of 14 invoice PDF templates. The Czech VAT template is proving fiddly due to rounding rules.
- Webhook retry queue skeleton works end to end; dead-letter handling is still outstanding.

Blocked:
- Reporting-query work is blocked on production read-replica credentials from infra. I followed up Tuesday and Thursday but haven’t received a reply.

Needs a decision:
- Whether the SDK should continue supporting Node 18. Dropping it would allow native `fetch`, but two customers are pinned to Node 18.
