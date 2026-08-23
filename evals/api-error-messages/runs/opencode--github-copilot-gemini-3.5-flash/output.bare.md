1.
```
error: authentication failed (HTTP 401 Unauthorized)
The API rejected the credentials in ~/.stak/credentials.
Run `stak login` to authenticate again.
```

2.
```
error: network timeout
No response was received from api.stak.dev within 30 seconds while pushing the deploy.
The deploy was not started; retrying is safe.
Use --timeout to configure a different limit.
```

3.
```
error: unexpected argument '--stage' found
help: to specify the environment, use '--env' instead.
Run `stak deploy --help` to list valid flags.
```

4.
```
error: failed to parse config file 'stak.toml'
  --> stak.toml:12:1
   |
12 | [build
   |       ^ expected ']' to close the table header
```
