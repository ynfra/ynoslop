Here are the four stderr messages:

**1.**
```
Error: authentication failed

The token in ~/.stak/credentials was rejected by the API (HTTP 401).
Run `stak login` to create a new one.
```
(exit 4)

**2.**
```
Error: request timed out

No response from api.stak.dev within 30s while pushing the deploy.
The deploy was not started, so it is safe to retry.
Adjust the limit with --timeout.
```
(exit 7)

**3.**
```
Error: unknown flag --stage

Did you mean --env?
Run `stak deploy --help` to see valid flags.
```
(exit 2)

**4.**
```
Error: failed to parse stak.toml

Line 12: table header `[build` is missing its closing `]`.
```
(exit 3)
