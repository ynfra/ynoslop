---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: baseline
recorded: 2026-08-22T10:04:37.171Z
ms: 11988
skills: [no-slop-writing]
---

1.
Error: bad auth token
The token in ~/.stak/credentials was rejected by the API with HTTP 401.
A new one is created with `stak login`.

2.
Error: network timeout
No response from api.stak.dev within 30 s while pushing a deploy.
The deploy was not started, so retrying is safe.
The timeout is configurable with `--timeout`.

3.
Error: unknown flag `--stage`
The flag is `--env`.
`stak deploy --help` lists valid flags.

4.
Error: could not parse stak.toml
Syntax error: line 12 opens a table header `[build` that is never closed.
