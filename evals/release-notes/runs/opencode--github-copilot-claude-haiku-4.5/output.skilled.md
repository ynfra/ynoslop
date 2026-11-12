# sift v2.1.0

## Breaking changes

The `[filters]` table in `sift.toml` is now `[rules]`. Configs using the old name will exit with code 3 and print an error. There is no automatic migration.

## Performance

Pattern compilation is now cached per run instead of recompiled for each line. Filtering a 2.1 GB test log improved from 41 seconds to 9 seconds.

## New features

**`--since <duration>`** skips lines whose timestamp is older than the given duration. Accepts values like `15m`, `2h`, or `3d`. Requires `--ts-format` to be set.

**`--format json`** prints one JSON object per matching line with keys `file`, `line`, `ts`, and `text`. Default output remains unchanged.

## Fixes

Fixed a bug where `--follow` dropped lines when logrotate replaced the file. sift now reopens the path when the inode changes.
