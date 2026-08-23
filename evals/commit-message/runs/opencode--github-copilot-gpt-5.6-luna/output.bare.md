fix: correct pagination next-page detection

Use zero-based page counts to avoid fetching an empty page after the last page, and rename pagination variables for clarity.
