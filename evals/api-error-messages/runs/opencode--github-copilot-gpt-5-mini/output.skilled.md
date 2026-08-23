1. stak: authentication failed — token in ~/.stak/credentials was rejected by the API (HTTP 401). Create a new token with stak login. Exit code 4.

2. stak: network timeout while pushing deploy to api.stak.dev (30 s). No response was received; the deploy was not started, so retrying is safe. Adjust the timeout with --timeout. Exit code 7.

3. stak: unknown flag '--stage'. The valid flag is '--env'. Run stak deploy --help to list valid flags. Exit code 2.

4. stak: failed to parse stak.toml: syntax error on line 12 — table header '[build' is not closed. Fix the syntax in stak.toml and retry. Exit code 3.
