1.
```text
Bad auth token. The token in ~/.stak/credentials was rejected by the API with HTTP 401. A new one is created with `stak login`.
```

2.
```text
Network timeout. No response from api.stak.dev within 30 s while pushing a deploy. The deploy was not started, so retrying is safe. Timeout is configurable with --timeout.
```

3.
```text
Unknown flag. The user typed `stak deploy --stage prod`; the flag is `--env`. `stak deploy --help` lists valid flags.
```

4.
```text
Config file not parseable. stak.toml has a syntax error: line 12 opens a table header `[build` that is never closed.
```
