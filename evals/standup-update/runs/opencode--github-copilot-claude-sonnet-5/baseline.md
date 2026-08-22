---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: baseline
recorded: 2026-08-22T10:18:28.285Z
ms: 5698
skills: [attention-rundown]
---

Standup update:

- ✅ S3 → R2 migration script complete; ran on staging, 412k objects copied, checksums all match
- ✅ Auth cookie SameSite fix merged (PR #812)
- 🔄 Invoice PDF renderer: 7/14 templates ported; Czech VAT template is fiddly due to rounding rules
- 🔄 Webhook retry queue: skeleton works end to end, dead-letter handling still to do
- 🚧 Blocked: still no prod read-replica credentials from infra (asked Tue, asked Thu, no reply) — reporting-query task is stuck until this lands
- ❓ Decision needed: whether SDK keeps supporting Node 18 — dropping it lets us use fetch natively, but two customers are pinned to 18
