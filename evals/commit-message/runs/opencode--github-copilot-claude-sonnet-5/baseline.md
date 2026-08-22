---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: baseline
recorded: 2026-08-22T10:07:53.307Z
ms: 4936
skills: [attention-spartan]
---

Fix pageSlice off-by-one and rename misleading params

`hasNext` was computed as `page <= total`, where `total` is the page
count, not the total item count. Since `page` is zero-based, this
returned true even when already on the last page, causing callers to
fetch one extra empty page at the end of every list.

Compare against `pageCount - 1` instead, and rename `size`/`total` to
`perPage`/`pageCount` to avoid call sites misreading `total` as a total
item count.
