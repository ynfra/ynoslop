---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: baseline
recorded: 2026-08-22T10:03:08.142Z
ms: 5889
skills: [no-slop-writing]
---

Case 1:
```
Error: authentication rejected (HTTP 401)

The token in ~/.stak/credentials was rejected by the API.
Run `stak login` to create a new one.
```
Exit code: 4

Case 2:
```
Error: timed out waiting for api.stak.dev after 30s

No response was received while pushing the deploy. The deploy was
not started, so it is safe to retry.

Use --timeout to configure how long stak waits before giving up.
```
Exit code: 7

Case 3:
```
Error: unknown flag --stage

Did you mean --env?

Run `stak deploy --help` for a list of valid flags.
```
Exit code: 2

Case 4:
```
Error: failed to parse stak.toml

stak.toml:12: table header "[build" is never closed

Check for a missing "]" near line 12.
```
Exit code: 3
