---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: skilled
recorded: 2026-08-22T10:08:37.972Z
ms: 6834
skills: [attention-spartan]
---

fix(paginate): correct hasNext off-by-one check and clarify parameter names

- Fix `hasNext` to prevent fetching an extra empty page when page indexing is zero-based.
- Rename `size` to `perPage` and `total` to `pageCount` to prevent callers from misinterpreting `total` as total item count.
