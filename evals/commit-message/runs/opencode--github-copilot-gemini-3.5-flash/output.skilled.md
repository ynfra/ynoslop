fix(paginate): prevent fetching empty page and clarify variable names

Fix `hasNext` calculation to use zero-based indexing correctly, avoiding an unnecessary extra page fetch at the end. Rename `size` to `perPage` and `total` to `pageCount` to prevent callers from misinterpreting `total` as total item count.
