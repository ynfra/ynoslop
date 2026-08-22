---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: baseline
recorded: 2026-08-22T10:04:14.091Z
ms: 30839
skills: [no-slop-writing]
---

1.
```stderr
error: Authentication failed (HTTP 401 Unauthorized)
The token in ~/.stak/credentials was rejected by the API.

To generate a new token, run:
  stak login
```

2.
```stderr
error: Network timeout after 30 seconds
No response was received from api.stak.dev while pushing the deploy.

The deploy was not started on the server; it is safe to retry.
To increase the timeout, use the --timeout flag:
  stak deploy --timeout <seconds>
```

3.
```stderr
error: Unknown flag `--stage`

Did you mean `--env`?
To see all valid flags, run:
  stak deploy --help
```

4.
```stderr
error: Failed to parse configuration file stak.toml
Syntax error on line 12: table header `[build` is never closed.

  12 | [build
     |       ^ expected `]`
```
