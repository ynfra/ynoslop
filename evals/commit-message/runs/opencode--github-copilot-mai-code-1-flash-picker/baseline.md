---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: baseline
recorded: 2026-08-22T10:08:43.059Z
ms: 5084
skills: [attention-spartan]
---

fix: correct pagination end condition for last page

Ensure `pageSlice` only reports `hasNext` when another page exists, avoiding an extra empty fetch on the final page. Rename `size`/`total` to `perPage`/`pageCount` for clarity.
