---
runner: fixture
model: -
variant: skilled
recorded: 2026-08-21T00:00:00.000Z
---

# sift v2.1.0

## Breaking: `[filters]` is now `[rules]`

Rename the table in your `sift.toml`:

```diff
-[filters]
+[rules]
```

There is no automatic migration. A config that still uses `[filters]` exits
with code 3 and an error naming the new key, so the failure is loud rather
than silent — but every config has to be edited by hand before upgrading.

## Filtering is about 4x faster

Patterns are compiled once per run instead of once per line. A 2.1 GB test log
went from 41 s to 9 s. No flags or config changes are needed to get this.

## New flags

`--since <duration>` skips lines whose timestamp is older than the duration —
`15m`, `2h`, `3d`. It needs `--ts-format` to be set; without a timestamp
format sift has nothing to compare against.

`--format json` prints one JSON object per matching line with the keys `file`,
`line`, `ts`, and `text`. Default output is unchanged, so existing pipes keep
working.

## Fixed

With `--follow`, lines were dropped when logrotate replaced the file. sift now
reopens the path when the inode changes.
