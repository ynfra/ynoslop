TL;DR: R2 migration and cookie fix done; invoice porting and webhook retries in progress; still blocked on infra for read-replica creds.

✅ **S3→R2 migration**: script ran on staging, 412k objects copied, checksums match
✅ **Auth cookie SameSite fix**: merged yesterday, PR 812
🟡 **Invoice PDF renderer**: 7 of 14 templates ported, Czech VAT template stuck on rounding rules
🟡 **Webhook retry queue**: skeleton works end to end, no dead-letter handling yet
🔴 **Blocked**: no prod read-replica credentials from infra, asked Tue and Thu, no reply — reporting-query task can't proceed

Your move:
📣 Ping infra again for read-replica creds
🤔 Decide on Node 18 support — dropping it enables native fetch, but two customers are still pinned to 18
