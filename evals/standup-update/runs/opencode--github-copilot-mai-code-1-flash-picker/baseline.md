---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: baseline
recorded: 2026-08-22T10:19:40.550Z
ms: 6114
skills: [attention-rundown]
---

- S3 -> R2 migration script is done, ran it on staging, 412k objects copied, checksums all match.
- Auth cookie SameSite fix merged yesterday, PR 812.
- Invoice PDF renderer: 7 of 14 templates ported; the Czech VAT one is fiddly because of the rounding rules.
- Webhook retry queue: skeleton works end to end, no dead-letter handling yet.
- Still no prod read-replica credentials from infra. Asked Tuesday, asked Thursday, no reply. The whole reporting-query task is stuck until they land.
- Someone needs to decide if the SDK keeps supporting Node 18. Dropping it means we can use fetch natively, but two customers are pinned to 18.
