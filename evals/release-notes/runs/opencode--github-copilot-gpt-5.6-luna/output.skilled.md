# sift v2.1.0

Released after v2.0.4.

## Breaking Change

The configuration table is now named `[rules]` instead of `[filters]`.

Configs using `[filters]` exit with code 3 and report the required key change. No automatic migration is performed.

## Added

- `--since <duration>` filters out lines older than the specified duration. Supported examples include `15m`, `2h`, and `3d`. This option requires `--ts-format`.
- `--format json` outputs one JSON object per matching line with the keys `file`, `line`, `ts`, and `text`. The default output remains unchanged.

## Changed

Pattern compilation is cached once per run instead of once per line. Filtering a 2.1 GB test log decreased from 41 seconds to 9 seconds.

## Fixed

With `--follow`, `sift` now reopens the log path when log rotation replaces the file, preventing lines from being dropped.
