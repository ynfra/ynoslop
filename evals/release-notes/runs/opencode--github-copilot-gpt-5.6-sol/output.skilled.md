# sift v2.1.0

## Breaking change

The `[filters]` table in `sift.toml` is now `[rules]`. Configurations that still use `[filters]` exit with code 3 and name `[rules]` as the replacement. No automatic migration is provided.

## Changes

- Pattern compilation is cached per run instead of repeated for each line. Filtering a 2.1 GB test log now takes 9 seconds, down from 41 seconds.
- `--since <duration>` skips lines older than the specified duration. Supported examples include `15m`, `2h`, and `3d`. This flag requires `--ts-format`.
- `--format json` prints one JSON object per matching line with the keys `file`, `line`, `ts`, and `text`. The default output format is unchanged.
- `--follow` now reopens a log path when its inode changes, preventing dropped lines after log rotation.
