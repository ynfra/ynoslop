fix(paginate): correct hasNext logic and rename size/total parameters

Correct the zero-based page comparison in pageSlice. The previous comparison
reported hasNext: true on the last page, causing callers to fetch an empty page
at the end of lists.

Additionally, rename `size` to `perPage` and `total` to `pageCount` to prevent
callers from misinterpreting `total` as the total item count.
