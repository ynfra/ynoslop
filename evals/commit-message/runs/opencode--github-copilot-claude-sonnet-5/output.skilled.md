fix(paginate): correct off-by-one in hasNext calculation

**→ Bug.** hasNext used `page <= total` where `total` is page count, so the last valid page (index `total - 1`) still reported `hasNext: true`, causing callers to fetch one extra empty page at the end of every list.

**→ Fix.** Changed condition to `page < pageCount - 1`, correctly zero-based.

**→ Rename.** `size` → `perPage`, `total` → `pageCount`; call sites were misreading `total` as item count, not page count.
