```
fix: correct hasNext off-by-one on last page

page is zero-based, so `page <= total` reported hasNext: true while already
on the last page, causing callers to fetch one empty trailing page on every
list. Compare against `pageCount - 1` instead.

Rename `size`→`perPage` and `total`→`pageCount`: call sites kept misreading
`total` as a total item count.
```
