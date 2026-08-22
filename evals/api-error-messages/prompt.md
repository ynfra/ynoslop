Write the error message strings that `stak`, a deployment CLI, prints for the
four failure cases below. These are the strings the user sees on stderr — write
the text itself, not the code that emits it.

```
1. Bad auth token. The token in ~/.stak/credentials was rejected by the API
   with HTTP 401. A new one is created with `stak login`. Exit code 4.
2. Network timeout. No response from api.stak.dev within 30 s while pushing a
   deploy. The deploy was not started, so retrying is safe. Timeout is
   configurable with --timeout. Exit code 7.
3. Unknown flag. The user typed `stak deploy --stage prod`; the flag is
   `--env`. `stak deploy --help` lists valid flags. Exit code 2.
4. Config file not parseable. stak.toml has a syntax error: line 12 opens a
   table header `[build` that is never closed. Exit code 3.
```

For each case, give the exact stderr text. Keep the four blocks in the same
order and label them with the case number.
