**TL;DR:** S3→R2 migration complete and validated, auth fix merged, invoice templates 50% done, webhook queue skeleton working—but reporting queries blocked on missing prod read-replica credentials from infra (asked Tue/Thu, no response).

✅ **S3→R2 migration** — 412k objects copied, checksums verified on staging

✅ **Auth cookie SameSite fix** — merged in PR 812

🟡 **Invoice PDF templates** — 7 of 14 ported; Czech VAT template pending (rounding rules)

🟡 **Webhook retry queue** — skeleton end-to-end, dead-letter handling pending

🔴 **Prod read-replica credentials** — requested Tue & Thu, still missing; reporting-query task fully blocked

⬜ **Node 18 support decision** — awaiting call on SDK: dropping it enables native fetch, but two customers pinned to v18

**Your move:**
🔴 Chase infra on read-replica credentials
📋 Decide Node 18 support policy
⏳ Clarify Czech VAT rounding rules for invoice template
