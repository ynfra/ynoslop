TL;DR: S3-to-R2 migration is verified on staging; reporting queries are blocked on prod read-replica credentials.

✅ **S3 to R2 migration**, 412k staging objects copied and all checksums match  
✅ **Auth cookie SameSite fix**, merged yesterday in PR 812  
🟡 **Invoice PDF renderer**, 7 of 14 templates ported  
🟡 **Czech VAT template**, rounding rules are fiddly  
🟡 **Webhook retry queue**, skeleton works end to end; no dead-letter handling yet  
🔴 **Reporting queries blocked**, infra has not provided prod read-replica credentials despite Tuesday and Thursday requests  
⬜ **Node 18 SDK support**, decision needed; dropping it enables native `fetch`, but two customers are pinned to Node 18  

**Your move:**  
👉 **Infra:** provide prod read-replica credentials  
👉 **SDK:** decide whether to retain Node 18 support
