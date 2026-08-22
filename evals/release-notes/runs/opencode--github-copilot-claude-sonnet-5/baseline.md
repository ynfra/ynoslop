---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: baseline
recorded: 2026-08-22T10:12:50.594Z
ms: 6523
skills: [no-slop-writing]
---

# sift v2.1.0

## Breaking changes

- The `[filters]` table in `sift.toml` has been renamed to `[rules]`. Configs still using `[filters]` will cause sift to exit with code 3 and an error naming the new key. **There is no automatic migration** — update your config files before upgrading.

## New features

- **`--since <duration>`**: skip lines whose timestamp is older than the given duration (e.g. `15m`, `2h`, `3d`). Requires `--ts-format` to also be set.
- **`--format json`**: print one JSON object per matching line, with keys `file`, `line`, `ts`, and `text`. The default output format is unchanged.

## Performance

- Pattern compilation is now cached per run instead of being recompiled for every line. Filtering a 2.1 GB test log dropped from 41s to 9s.

## Fixes

- `--follow` no longer drops lines when logrotate replaces the file. sift now detects inode changes and reopens the path automatically.

## Upgrading from v2.0.4

Rename `[filters]` to `[rules]` in your `sift.toml` before upgrading. No other config or CLI changes are required for existing usage.
