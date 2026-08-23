# sift v2.1.0

`sift` v2.1.0 adds timestamp-based filtering and JSON output, improves filtering performance, and fixes log rotation handling in follow mode.

## Breaking Change

The `sift.toml` `[filters]` table has been renamed to `[rules]`.

Configurations still using `[filters]` now exit with code `3` and an error naming the new key. There is no automatic migration.

## Added

- `--since <duration>` filters out lines with timestamps older than the specified duration, such as `15m`, `2h`, or `3d`.
  - Requires `--ts-format`.
- `--format json` outputs one JSON object per matching line with `file`, `line`, `ts`, and `text` keys.
  - Default output is unchanged.

## Improved

- Pattern compilation is now cached for each run rather than repeated for every line.
  - Filtering a 2.1 GB test log improved from 41 seconds to 9 seconds.

## Fixed

- `--follow` now correctly reopens a file when log rotation replaces it, preventing dropped lines.
