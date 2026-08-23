# sift v2.1.0

`sift` v2.1.0 follows v2.0.4 and is a command-line log filter that reads log files or stdin and prints matching lines.

## Breaking changes

- In `sift.toml`, the `[filters]` table is now `[rules]`.
- Configurations that still use `[filters]` exit with code `3` and report an error naming `[rules]`.
- There is no automatic migration.

## Performance

- Pattern compilation is now cached per run instead of being recompiled for each line.
- Filtering a 2.1 GB test log improved from 41 s to 9 s.

## New features

- Added `--since <duration>` to skip lines whose timestamp is older than the given duration (for example `15m`, `2h`, or `3d`).
- `--since` requires `--ts-format` to be set.
- Added `--format json` to print one JSON object per matching line with the keys `file`, `line`, `ts`, and `text`.
- The default output format is unchanged.

## Bug fixes

- Fixed an issue with `--follow` where lines were dropped when logrotate replaced the file.
- `sift` now reopens the path when the inode changes.
