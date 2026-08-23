Standup update:

- ✅ S3 → R2 migration script complete; ran on staging, 412k objects copied, all checksums match
- ✅ Auth cookie SameSite fix merged (PR #812)
- 🔄 Invoice PDF renderer: 7/14 templates ported; Czech VAT template is tricky due to rounding rules
- 🔄 Webhook retry queue: skeleton works end-to-end, dead-letter handling still needed
- 🚧 Blocked: still no prod read-replica credentials from infra (asked Tue, followed up Thu, no reply) — reporting-query task is stuck until this lands
- ❓ Open decision needed: whether the SDK keeps supporting Node 18 — dropping it lets us use native fetch, but two customers are pinned to 18
