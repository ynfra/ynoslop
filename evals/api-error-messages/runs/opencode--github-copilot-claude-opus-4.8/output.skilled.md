**1**
```
Error: authentication token rejected (HTTP 401).
The token in ~/.stak/credentials is no longer valid. Run `stak login` to create a new one.
Exit code: 4
```

**2**
```
Error: no response from api.stak.dev within 30s while pushing the deploy.
The deploy was not started, so it is safe to retry. Raise the limit with --timeout.
Exit code: 7
```

**3**
```
Error: unknown flag --stage.
Did you mean --env? Run `stak deploy --help` for the list of valid flags.
Exit code: 2
```

**4**
```
Error: cannot parse stak.toml.
Line 12: table header `[build` is never closed; add the closing `]`.
Exit code: 3
```
