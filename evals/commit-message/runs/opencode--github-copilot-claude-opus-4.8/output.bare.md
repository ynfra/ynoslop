fix(paginate): correct hasNext for zero-based pages

With zero-based `page` indexing, `page <= total` reported `hasNext: true`
while already on the last page, so callers fetched one empty page at the
end of every list. Compare against `pageCount - 1` instead.

Rename `size` to `perPage` and `total` to `pageCount`, since call sites kept
misreading `total` as a total item count.
