`page` is zero-based. The old comparison reported `hasNext: true` while
already on the last page, so callers fetched one empty page at the end of
every list. `size` and `total` were renamed because call sites kept reading
`total` as a total item count.
