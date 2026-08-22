---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: baseline
recorded: 2026-08-22T10:19:11.470Z
ms: 9527
skills: [attention-rundown]
---

**What I've done:**
- Finished the S3 -> R2 migration script and ran it on staging (412k objects copied, checksums match).
- Auth cookie SameSite fix merged yesterday (PR 812).
- Webhook retry queue skeleton works end-to-end (no dead-letter handling yet).
- Ported 7 of 14 templates for the invoice PDF renderer (the Czech VAT one is fiddly because of rounding rules).

**Blockers & Decisions:**
- **Blocked:** Reporting-query task is stuck. Still no prod read-replica credentials from infra (asked Tuesday and Thursday, with no reply).
- **Decision needed:** Need to decide if the SDK keeps supporting Node 18. Dropping it allows us to use fetch natively, but two customers are currently pinned to Node 18.
