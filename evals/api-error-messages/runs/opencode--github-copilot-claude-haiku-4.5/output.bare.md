I'll write error messages for each of the four failure cases. These should be user-friendly, informative, and guide the user toward resolution.

```
1. Authentication failed: Invalid token in ~/.stak/credentials

The token was rejected by the API. Please log in again:

    stak login

Exit code: 4
```

```
2. Network timeout: No response from api.stak.dev within 30s

The deploy was not started. You can safely retry the operation.

To increase the timeout, use:

    stak deploy --timeout <seconds>

Exit code: 7
```

```
3. Unknown flag: --stage

Did you mean --env? See valid flags:

    stak deploy --help

Exit code: 2
```

```
4. Config error in stak.toml:12

Unclosed table header: [build

Check your stak.toml syntax and try again.

Exit code: 3
```
