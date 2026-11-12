# sift v2.1.0

Released following v2.0.4.

## Breaking changes

- **`[filters]` renamed to `[rules]` in `sift.toml`.** Update your config to use the `[rules]` table. There is no automatic migration — a config that still uses `[filters]` will exit with code 3 and an error naming the new key.

## New features

- **`--since <duration>`** — skip lines whose timestamp is older than the given duration (e.g. `15m`, `2h`, `3d`). Requires `--ts-format` to be set.
- **`--format json`** — print one JSON object per matching line, with the keys `file`, `line`, `ts`, and `text`. The default output format is unchanged.

## Fixes

- **`--follow` with logrotate.** Lines were dropped when logrotate replaced the file. sift now reopens the path when the inode changes.

## Performance

- Patterns are now compiled once per run and cached, instead of recompiled per line. Filtering a 2.1 GB test log dropped from 41 s to 9 s.
