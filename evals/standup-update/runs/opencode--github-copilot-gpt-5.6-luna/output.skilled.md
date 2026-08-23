**TL;DR:** S3-to-R2 migration is complete; reporting queries are blocked on prod read-replica credentials.

✅ **S3 → R2 migration:** 412k staging objects copied; checksums match.  
✅ **Auth cookies:** SameSite fix merged yesterday in PR 812.  
🟡 **Invoice PDFs:** 7 of 14 templates ported; Czech VAT template needs rounding-rule work.  
🟡 **Webhook retries:** End-to-end skeleton works; dead-letter handling is still needed.  
⬜ **SDK Node support:** Decision needed on continuing Node 18 support; two customers are pinned to 18.  
🔴 **Reporting queries blocked:** Waiting for prod read-replica credentials from infra; asked Tuesday and Thursday, no reply.

**Your move:**  
📌 **Infra:** Provide the prod read-replica credentials.  
🗳️ **Team:** Decide whether the SDK keeps supporting Node 18.
