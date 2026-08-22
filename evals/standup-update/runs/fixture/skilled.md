---
runner: fixture
model: -
variant: skilled
recorded: 2026-08-21T00:00:00.000Z
---

**TL;DR:** R2 migration and the SameSite fix are done; reporting queries are
fully blocked on prod read-replica creds from infra (asked Tue and Thu, no
reply), and someone needs to decide on Node 18 in the SDK.

✅ **S3 → R2 migration script** — ran on staging, 412k objects copied, all
checksums match.

✅ **Auth cookie SameSite fix** — merged yesterday, PR 812.

🟡 **Invoice PDF renderer** — 7 of 14 templates ported. Czech VAT template is
slow going, rounding rules.

🟡 **Webhook retry queue** — skeleton works end to end. No dead-letter
handling yet.

⬜ **Reporting queries** — not started, blocked.

🔴 No prod read-replica credentials from infra. Asked Tuesday and Thursday, no
reply. Reporting-query task is stuck until they land.

**Your move:**

🔑 Infra: send the read-replica creds, or tell me who owns them now.

🔢 Node 18 in the SDK — pick one: keep it, or drop it and use fetch natively.
Two customers are pinned to 18.
