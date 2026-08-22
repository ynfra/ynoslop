---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: skilled
recorded: 2026-08-22T10:19:49.101Z
ms: 8548
skills: [attention-rundown]
---

TL;DR: S3→R2 migration is done in staging, the auth cookie SameSite fix is merged, and reporting-query is blocked by missing prod read-replica credentials.

- ✅ S3→R2 migration script is done; I ran it on staging; 412k objects copied; checksums all match.
- ✅ Auth cookie SameSite fix merged yesterday; PR 812.
- 🟡 Invoice PDF renderer: 7 of 14 templates ported; the Czech VAT one is fiddly because of the rounding rules.
- 🟡 Webhook retry queue: skeleton works end to end; no dead-letter handling yet.
- 🔴 Still no prod read-replica credentials from infra; I asked on Tue and Thu, and there’s been no reply, so the reporting-query task is stuck until they land.
- 🟡 Someone needs to decide whether the SDK keeps supporting Node 18; dropping it would let us use fetch natively, but two customers are pinned to 18.

Your move:
- ⚠️ Land prod read-replica credentials from infra.
- ⚠️ Decide whether the SDK keeps supporting Node 18.
