# sift v2.1.0 — Release notes

This release (v2.1.0) follows v2.0.4 and contains a small but important breaking change, performance improvements, two new flags, and a fix for a logrotate-related follow bug.

## Highlights
- Breaking: config key rename in sift.toml — [filters] → [rules]. No automatic migration.
- Much faster pattern matching: pattern compilation is cached per run instead of per line.
- New flags:
  - `--since <duration>` (e.g. `15m`, `2h`, `3d`) — skip lines older than the given duration (requires `--ts-format`).
  - `--format json` — outputs one JSON object per matching line (`file`, `line`, `ts`, `text`).
- Fix for `--follow`: sift now reopens a path when the file's inode changes (prevents dropped lines after logrotate).

## Breaking change
- sift.toml
  - The configuration table previously named `[filters]` has been renamed to `[rules]`.
  - If a config still uses `[filters]`, sift exits with code `3` and prints an error naming the new key (`[rules]`).
  - There is no automatic migration; update your config files before upgrading.

## Performance
- Pattern compilation is now cached for the lifetime of the run instead of being recompiled for every input line.
- Real-world example: filtering a 2.1 GB test log dropped from ~41 s to ~9 s — significant speedup on large inputs.

## New flags
- --since <duration>
  - Skips lines whose timestamps are older than the provided duration.
  - Duration examples: `15m`, `2h`, `3d`.
  - Requires `--ts-format` to be set so sift can parse timestamps.
- --format json
  - When set, sift prints one JSON object per matching line with the keys:
    - `file` — path of the file (or `-` for stdin)
    - `line` — line number
    - `ts` — parsed timestamp (as parsed by `--ts-format`)
    - `text` — the line text
  - Default (existing) line-oriented output remains unchanged unless `--format json` is specified.

## Bug fixes
- --follow + logrotate
  - Previously, when following a file and logrotate replaced the file (inode change), some lines could be dropped.
  - sift now notices inode changes and reopens the path, preventing those dropped lines.

## Upgrade notes
- Update any sift.toml files: rename `[filters]` to `[rules]`. After upgrading, configs using the old key will cause sift to exit with code `3` and an explanatory error.
- If you intend to use `--since`, make sure to pass a valid `--ts-format` so timestamps can be parsed.
- If you use `--follow` for long-running tails, you should see more robust behavior across logrotate events.

## Examples
- Skip lines older than 2 hours (timestamps parsed with given format):
  - sift --ts-format "2006-01-02T15:04:05Z07:00" --since 2h ...
- Output matches as JSON:
  - sift --format json ...

No other behavioral changes were introduced in this release beyond the items listed above.
