**Fix pagination: rename params to perPage/pageCount and correct hasNext so the last page is not treated as having a next page.**

→ **What.** Rename `size`→`perPage` and `total`→`pageCount`; compute `start`/`end` with `perPage` and slice accordingly; set `hasNext` to `page < pageCount - 1`.

→ **Why.** `page` is **zero-based** and the old `page <= total` returned true on the final page, causing callers to fetch one empty page at the end of lists.

→ **Risk.** Internal variable renames only — function signature unchanged; behavior fixed for callers.
