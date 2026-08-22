- s3 -> r2 migration script done, ran it on staging, 412k objects copied,
  checksums all match
- auth cookie SameSite fix merged yesterday, PR 812
- invoice PDF renderer: 7 of 14 templates ported, the czech VAT one is fiddly
  because of the rounding rules
- webhook retry queue: skeleton works end to end, no dead-letter handling yet
- STILL no prod read-replica credentials from infra. asked tue, asked thu,
  no reply. the whole reporting-query task is stuck until they land
- someone needs to decide if the sdk keeps supporting node 18. dropping it
  means we can use fetch natively, but two customers are pinned to 18
