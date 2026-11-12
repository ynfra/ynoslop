```
paginate: fix hasNext off-by-one and rename for clarity

→ **hasNext was one page too late**, reporting true while already on the last page, causing callers to fetch one empty page at the end of every list.

→ **Renamed `size` → `perPage` and `total` → `pageCount`** to prevent misreading `total` as item count instead of page count.

→ **Changed `page <= total` to `page < pageCount - 1`** because `page` is zero-based; the old logic counted the final empty page as valid.
```
