**TL;DR:** S3 migration and auth fix are done; PDF and webhook work continue; reporting is blocked on prod credentials, and Node 18 support needs a decision.

✅ **S3 to R2 migration** — Script done and staged; 412k objects copied, all checksums match.

✅ **Auth cookie fix** — SameSite fix merged yesterday in PR 812.

🟡 **Invoice PDF renderer** — 7 of 14 templates ported; Czech VAT rounding rules are fiddly.

🟡 **Webhook retry queue** — Skeleton works end to end; no dead-letter handling yet.

🔴 **Reporting queries** — Blocked on prod read-replica credentials from infra; asked Tuesday and Thursday with no reply.

**Your move:**

🔴 **Infra** — Provide prod read-replica credentials.

⬜ **SDK owners** — Decide whether to keep Node 18 support; dropping it enables native fetch, but two customers are pinned to 18.
