---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: skilled
recorded: 2026-08-22T10:19:34.432Z
ms: 22956
skills: [attention-rundown]
---

**TL;DR:** S3 to R2 staging migration and auth fix are done, reporting-query is blocked by missing infra credentials, and a Node 18 support decision is needed.

✅ **Auth cookie SameSite fix:** Merged yesterday in PR 812.
✅ **S3 to R2 migration:** Script completed, staging run copied 412k objects with matching checksums.
🟡 **Invoice PDF renderer:** Ported 7 of 14 templates, Czech VAT rounding rules are fiddly.
🟡 **Webhook retry queue:** Skeleton works end-to-end.
⬜ **Dead-letter handling:** Not started on the webhook retry queue.

🔴 **Blocker:** Missing prod read-replica credentials from infra (asked Tuesday and Thursday). Reporting-query task is stuck.

**Your move:**
❓ **Node 18 support:** Decide to drop for native fetch or keep for two pinned customers.
🔑 **Credentials chase:** Follow up with infra on prod read-replica access.

Pick one: Drop Node 18 support for native fetch, or keep supporting it for the two pinned customers?
