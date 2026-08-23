TL;DR: Migration and auth work are moving; reporting-query is blocked by missing prod read-replica credentials, and the Node 18 support decision is still pending.

- ✅ S3 -> R2 migration script is done; ran it on staging; 412k objects copied; checksums all match.
- ✅ Auth cookie SameSite fix merged yesterday; PR 812.
- 🟡 Invoice PDF renderer: 7 of 14 templates ported; the Czech VAT one is fiddly because of the rounding rules.
- 🟡 Webhook retry queue: skeleton works end to end; no dead-letter handling yet.
- 🔴 No prod read-replica credentials from infra; asked Tue, asked Thu, no reply; the whole reporting-query task is stuck until they land.
- 🟡 Someone needs to decide whether the SDK keeps supporting Node 18; dropping it means we can use fetch natively, but two customers are pinned to 18.

Your move:
- ⚪ Decide whether the SDK keeps supporting Node 18.
- ⚪ Land prod read-replica credentials from infra.
