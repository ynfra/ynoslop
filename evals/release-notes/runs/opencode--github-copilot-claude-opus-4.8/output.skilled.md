# sift v2.1.0

## Breaking change

The `[filters]` table in `sift.toml` is now `[rules]`. A config that still uses `[filters]` exits with code 3 and an error naming the new key. There is no automatic migration — rename the table by hand before upgrading from v2.0.4.

## Performance

Pattern compilation is now cached once per run instead of recompiled for every line. Filtering a 2.1 GB test log dropped from 41 s to 9 s.

## New flags

`--since <duration>` skips lines whose timestamp is older than the given duration. It accepts values like `15m`, `2h`, or `3d`, and requires `--ts-format` to be set.

`--format json` prints one JSON object per matching line, with the keys `file`, `line`, `ts`, and `text`. The default output format is unchanged.

## Fixes

With `--follow`, lines were dropped when logrotate replaced the file. sift now detects the inode change and reopens the path.
