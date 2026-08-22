---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: skilled
recorded: 2026-08-22T10:12:56.690Z
ms: 6094
skills: [no-slop-writing]
---

# sift v2.1.0

## Breaking change

`[filters]` in `sift.toml` is renamed to `[rules]`. A config still using
`[filters]` exits with code 3 and an error naming the new key. There is no
automatic migration — update your config before upgrading.

## New flags

- `--since <duration>` (e.g. `15m`, `2h`, `3d`): skips lines older than the
  given duration. Requires `--ts-format` to be set.
- `--format json`: prints one JSON object per matching line with the keys
  `file`, `line`, `ts`, and `text`. Default output is unchanged.

## Performance

Pattern compilation is now cached per run instead of recompiled per line.
Filtering a 2.1 GB test log dropped from 41 s to 9 s.

## Fixes

`--follow` no longer drops lines when logrotate replaces the file. `sift` now
reopens the path when the inode changes.

## Upgrading from v2.0.4

Rename `[filters]` to `[rules]` in every `sift.toml` you use. If
`--ts-format` isn't set, `--since` has no effect on filtering.
