---
runner: fixture
model: -
variant: skilled
recorded: 2026-08-21T00:00:00.000Z
---

## 1. Bad auth token

```
error: the API rejected your token (HTTP 401)
  token read from: ~/.stak/credentials

Run `stak login` to get a new one.
(exit 4)
```

## 2. Network timeout

```
error: no response from api.stak.dev within 30s
  the deploy was not started, so nothing was changed

Retry the same command. If the connection is slow, raise the limit:
  stak deploy --timeout 90
(exit 7)
```

## 3. Unknown flag

```
error: unknown flag `--stage`
  did you mean `--env`?

  stak deploy --env prod

`stak deploy --help` lists every flag.
(exit 2)
```

## 4. Config file not parseable

```
error: stak.toml:12 — table header `[build` is missing its closing `]`

  12 | [build
     |       ^ expected `]`

Fix line 12 and run the command again. No deploy was started.
(exit 3)
```
