# sift v2.1.0

## ⚠️ Breaking Changes

- The `[filters]` table in `sift.toml` has been renamed to `[rules]`. Configs still using `[filters]` will fail to load: sift exits with code 3 and prints an error naming the new key. There is no automatic migration — update your config files before upgrading.

## New Features

- **`--since <duration>`**: skip lines whose timestamp is older than the given duration (e.g. `15m`, `2h`, `3d`). Requires `--ts-format` to also be set.
- **`--format json`**: prints one JSON object per matching line with the keys `file`, `line`, `ts`, and `text`. Default text output is unchanged.

## Performance

- Pattern compilation is now cached per run instead of being recompiled for every line. On a 2.1 GB test log, filtering time dropped from 41 s to 9 s.

## Fixes

- `--follow` no longer drops lines when logrotate replaces the file. sift now detects inode changes and reopens the path.

## Upgrading from v2.0.4

Rename `[filters]` to `[rules]` in your `sift.toml` before upgrading, or sift will refuse to start (exit code 3).
