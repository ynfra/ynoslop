```
paginate: fix hasNext logic and clarify variable names

- Fix hasNext comparison: change from `page <= total` to `page < pageCount - 1`
  to prevent reporting true while already on the last page, which caused
  callers to fetch one empty page at the end of every list
- Rename `size` to `perPage` for clarity (was confusing with item count)
- Rename `total` to `pageCount` to better reflect that it's the page count,
  not a total item count
```
