---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: baseline
recorded: 2026-08-22T10:14:13.041Z
ms: 12008
skills: [no-slop-writing]
---

# sift v2.1.0

`Sift` v2.1.0 is the next release after v2.0.4 and brings a configuration change, significant performance improvements, new filtering and output options, and a fix for follow-mode log rotation handling.

## Breaking changes

- The `[filters]` table in `sift.toml` is now `[rules]`.
- Configurations that still use `[filters]` will exit with code 3 and print an error naming the new key.
- There is no automatic migration; existing configs must be updated manually.

## Performance

- Pattern compilation is now cached for the duration of a run instead of being recompiled for each line.
- This improves filtering performance significantly; a 2.1 GB test log completed in 9 seconds instead of 41 seconds.

## New features

- Added `--since <duration>` to skip lines whose timestamp is older than the given duration, such as `15m`, `2h`, or `3d`.
- `--since` requires `--ts-format` to be set.
- Added `--format json` to print one JSON object per matching line with the keys `file`, `line`, `ts`, and `text`.
- The default output format remains unchanged.

## Bug fixes

- Fixed an issue with `--follow` where lines could be dropped when `logrotate` replaced the monitored file.
- `sift` now reopens the path when the inode changes.
