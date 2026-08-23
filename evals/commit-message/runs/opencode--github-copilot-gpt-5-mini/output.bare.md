Fix pagination hasNext bug and rename params for clarity

- Correct hasNext logic to avoid returning an extra empty page: previously used `page <= total` which (with zero-based pages) could be true on the last page and caused callers to fetch one empty page. Now uses `page < pageCount - 1`.
- Rename `size` -> `perPage` and `total` -> `pageCount` to make intent clear and avoid callers misreading `total` as total item count.
- Keep page zero-based; start/end calculation unchanged.

Reason: callers were fetching an extra empty page at the end of lists due to the off-by-one in the previous comparison. See notes.md for details.
