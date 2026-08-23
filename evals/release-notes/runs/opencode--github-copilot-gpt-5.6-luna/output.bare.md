# sift v2.1.0

## Breaking Changes

- Renamed the `[filters]` table in `sift.toml` to `[rules]`.
- Configurations using `[filters]` now exit with code 3 and report the new key. No automatic migration is performed.

## Added

- Added `--since <duration>` to skip lines older than the specified duration, such as `15m`, `2h`, or `3d`. Requires `--ts-format`.
- Added `--format json` to output one JSON object per matching line with the keys `file`, `line`, `ts`, and `text`. The default output is unchanged.

## Performance

- Pattern compilation is now cached per run instead of repeated for every line. Filtering a 2.1 GB test log improved from 41 seconds to 9 seconds.

## Fixed

- With `--follow`, lines are no longer dropped when log rotation replaces the file. `sift` now reopens the path when its inode changes.
