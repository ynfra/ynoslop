Case 1:
```
Error: authentication failed (HTTP 401)

The token in ~/.stak/credentials was rejected by the API. It may be
expired or revoked.

Run `stak login` to generate a new one.
```
Exit code: 4

Case 2:
```
Error: request timed out after 30s

No response from api.stak.dev while pushing the deploy. The deploy was
not started, so it is safe to retry.

Use --timeout to configure how long stak waits before giving up.
```
Exit code: 7

Case 3:
```
Error: unknown flag --stage

'stak deploy' has no flag named --stage. Did you mean --env?

Run `stak deploy --help` for a list of valid flags.
```
Exit code: 2

Case 4:
```
Error: failed to parse stak.toml

  12 | [build
     | ^ unclosed table header, expected `]`

Fix the syntax error in stak.toml and try again.
```
Exit code: 3
