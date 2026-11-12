Here's your standup update:

---

**S3 → R2 Migration**
Completed and ran on staging. 412k objects copied with all checksums matching.

**Auth Cookie SameSite Fix**
PR 812 merged yesterday.

**Invoice PDF Renderer**
7 of 14 templates ported. The Czech VAT template is blocked on rounding rules complexity.

**Webhook Retry Queue**
Skeleton implementation works end-to-end. Dead-letter handling still needed.

**Reporting Query Task** (BLOCKED)
Waiting on prod read-replica credentials from infra. Requested Tuesday and Thursday with no response yet.

**SDK Node 18 Support Decision Needed**
Need to decide if we continue supporting Node 18. Dropping it enables native fetch usage, but two customers are pinned to version 18.
