**Standup update**

TL;DR: S3→R2 migration verified on staging and auth fix merged; blocked on prod read-replica creds from infra (reporting stuck), and need a node 18 decision.

✅ **S3→R2 migration** — script done, ran on staging, 412k objects copied, checksums all match
✅ **Auth cookie SameSite fix** — merged yesterday, PR 812
🟡 **Invoice PDF renderer** — 7 of 14 templates ported; czech VAT one fiddly on rounding rules
🟡 **Webhook retry queue** — skeleton works end to end; no dead-letter handling yet
⬜ **Reporting-query task** — stuck, waiting on prod read-replica creds

🔴 Blocked: no prod read-replica creds from infra, asked Tue and Thu, no reply — whole reporting-query task stuck until they land

Your move:
🗣️ Infra: need those read-replica creds to unblock reporting
❓ Decision needed: keep SDK support for node 18? Dropping it lets us use native fetch, but two customers are pinned to 18
