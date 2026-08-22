---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: skilled
recorded: 2026-08-22T10:18:34.737Z
ms: 6451
skills: [attention-rundown]
---

TL;DR: R2 migration and cookie fix done, invoice/webhook work in progress, but reporting is blocked on infra creds and Node 18 support needs a decision.

✅ **S3→R2 migration**: staging run copied 412k objects, checksums all match
✅ **Auth cookie SameSite fix**: PR 812 merged yesterday
🟡 **Invoice PDF renderer**: 7 of 14 templates ported, Czech VAT one fiddly due to rounding rules
🟡 **Webhook retry queue**: skeleton works end to end, no dead-letter handling yet
⬜ **Reporting-query task**: stuck, no progress possible without creds

🔴 No prod read-replica credentials from infra — asked Tue, asked Thu, no reply. Reporting-query task fully blocked until these land.

Your move:
🔴 escalate infra for read-replica creds
❓ decide: drop Node 18 support (enables native fetch) vs keep it (2 customers pinned to 18)
