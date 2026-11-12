Here's your standup update:

---

**Standup update**

**Done / merged**
- S3 → R2 migration script finished. Ran on staging: 412k objects copied, all checksums match.
- Auth cookie SameSite fix merged yesterday (PR 812).

**In progress**
- Invoice PDF renderer: 7 of 14 templates ported. Czech VAT template is fiddly due to rounding rules.
- Webhook retry queue: skeleton works end to end; no dead-letter handling yet.

**Blocked**
- Reporting-query task is stuck — still no prod read-replica credentials from infra. Asked Tue and Thu, no reply yet.

**Needs a decision**
- Whether the SDK keeps supporting Node 18. Dropping it lets us use fetch natively, but two customers are pinned to 18.

---
