# sift v2.1.0

`sift` v2.1.0 improves filtering performance, adds time-based filtering and JSON output, and fixes file rotation handling.

## Breaking Change

The `[filters]` table in `sift.toml` has been renamed to `[rules]`.

Configurations that still use `[filters]` will exit with code `3` and report the new key name. There is no automatic migration.

```toml
[rules]
```

## Performance

Patterns are now compiled once per run instead of once per line. Filtering a 2.1 GB test log improved from 41 seconds to 9 seconds.

## New Features

### Time-Based Filtering

Use `--since <duration>` to skip lines with timestamps older than the specified duration:

```text
--since 15m
--since 2h
--since 3d
```

`--since` requires `--ts-format` to be set.

### JSON Output

Use `--format json` to print one JSON object per matching line. Each object contains:

- `file`
- `line`
- `ts`
- `text`

The default output format is unchanged.

## Fixes

- Fixed dropped lines under `--follow` when log rotation replaced the file. `sift` now reopens the path when its inode changes.
