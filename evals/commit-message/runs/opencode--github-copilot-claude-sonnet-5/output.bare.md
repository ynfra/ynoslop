Fix off-by-one in pageSlice hasNext calculation

`page` is zero-based, but `hasNext` compared `page <= total` (total page
count), which stays true even on the last page — every list fetched one
extra empty trailing page. Changed to `page < pageCount - 1`.

Also renamed `size` -> `perPage` and `total` -> `pageCount` since call
sites were misreading `total` as a total item count rather than a page
count.
