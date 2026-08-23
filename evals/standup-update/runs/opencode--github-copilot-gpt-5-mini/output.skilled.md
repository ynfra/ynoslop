TL;DR: s3→r2 migration to staging completed (412k objects, checksums match); reporting-query is blocked waiting for prod read-replica credentials from infra.

✅ **S3→R2 migration** — script done; ran on staging; 412k objects copied; checksums all match.  
✅ **Auth cookie SameSite fix** — merged (PR 812).  
🟡 **Invoice PDF renderer** — 7 of 14 templates ported; Czech VAT template is fiddly due to rounding rules.  
🟡 **Webhook retry queue** — skeleton works end-to-end; no dead-letter handling yet.  
⬜ **Prod read-replica credentials** — not received from infra; asked Tue and Thu.  
⬜ **SDK Node 18 decision** — someone needs to decide if we keep Node 18 support; dropping it enables native fetch, but two customers are pinned to 18.

🔴 **Blocking risk** — reporting-query task is stuck until prod read-replica credentials arrive from infra.

Your move:  
📡 Remind infra to provide prod read-replica credentials  
🧾 Assign owner to finish Czech VAT rounding for the invoice renderer  
🛠️ Implement dead-letter handling for the webhook retry queue  
🎯 Decide whether the SDK keeps Node 18 support

Next action: pick one of the options above.
