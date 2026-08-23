# sift v2.1.0

## Breaking change

`sift.toml` now uses `[rules]` instead of `[filters]`. A config still using
`[filters]` exits with code 3 and an error naming `rules` as the expected
key. There is no automatic migration — rename the table by hand.

## Performance

Pattern compilation is now cached once per run instead of recompiled for
every line. On a 2.1 GB test log, filtering time dropped from 41 s to 9 s.

## New flags

- `--since <duration>` (e.g. `15m`, `2h`, `3d`): skips lines whose timestamp
  is older than the given duration. Requires `--ts-format` to also be set.
- `--format json`: prints one JSON object per matching line with the keys
  `file`, `line`, `ts`, and `text`. Default output is unchanged.

## Fixes

`--follow` no longer drops lines when logrotate replaces the watched file.
sift detects the inode change and reopens the path.
