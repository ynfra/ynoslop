---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: skilled
recorded: 2026-08-22T10:07:58.337Z
ms: 5029
skills: [attention-spartan]
---

fix(paginate): correct hasNext off-by-one and clarify param names

**→ Bug.** `hasNext` used `page <= total` against a zero-based `page`, so it stayed true on the last page and callers fetched one empty trailing page every list.

**→ Fix.** Compare against `pageCount - 1`: `hasNext: page < pageCount - 1`.

**→ Rename.** `size` → `perPage`, `total` → `pageCount`, since call sites misread `total` as item count.
