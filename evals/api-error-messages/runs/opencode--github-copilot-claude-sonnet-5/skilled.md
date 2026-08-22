---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: skilled
recorded: 2026-08-22T10:03:13.437Z
ms: 5287
skills: [no-slop-writing]
---

1. Error: authentication rejected (HTTP 401)
Token in ~/.stak/credentials was rejected by the API.
Run `stak login` to create a new one.
Exit code: 4

2. Error: no response from api.stak.dev after 30s
Deploy push timed out. The deploy was not started; retrying is safe.
Adjust the timeout with --timeout.
Exit code: 7

3. Error: unknown flag --stage
Did you mean --env?
Run `stak deploy --help` for the list of valid flags.
Exit code: 2

4. Error: stak.toml:12: unclosed table header `[build`
Expected a closing `]` before end of line.
Exit code: 3
