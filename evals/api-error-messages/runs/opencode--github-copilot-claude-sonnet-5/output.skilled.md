1. auth token rejected: ~/.stak/credentials was refused by the API (HTTP 401). Run `stak login` to get a new one.
exit code 4

2. deploy timed out: no response from api.stak.dev after 30s. The deploy was not started; retrying is safe. Adjust the limit with --timeout.
exit code 7

3. unknown flag: --stage
did you mean --env?
run `stak deploy --help` for the full flag list.
exit code 2

4. stak.toml:12: syntax error: table header `[build` is never closed
exit code 3
