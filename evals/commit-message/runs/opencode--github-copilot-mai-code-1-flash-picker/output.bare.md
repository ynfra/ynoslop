fix: correct pagination next-page detection

Use zero-based page indexing to compute `hasNext` without requesting an extra empty page at the end of a list, and rename the pagination locals to reflect their purpose.
