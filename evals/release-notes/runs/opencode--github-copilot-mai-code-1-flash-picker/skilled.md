---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: skilled
recorded: 2026-08-22T10:14:20.148Z
ms: 7103
skills: [no-slop-writing]
---

# sift v2.1.0

sift v2.1.0 follows v2.0.4 and adds new filtering and output options while fixing a follow-mode issue around log rotation.

## What’s new

- Added `--since <duration>` to skip lines whose timestamp is older than the given duration. This option requires `--ts-format` to be set.
- Added `--format json` to print one JSON object per matching line with the keys `file`, `line`, `ts`, and `text`.
- Improved pattern handling by caching compiled patterns per run instead of recompiling them for every line. In a 2.1 GB test log, filtering time dropped from 41 s to 9 s.
- Fixed a bug in `--follow` mode where lines could be dropped when `logrotate` replaced the file. sift now reopens the path when the inode changes.

## Breaking changes

- In `sift.toml`, the `[filters]` table has been renamed to `[rules]`.
- Configurations that still use `[filters]` now exit with code 3 and report an error naming the new key.
- There is no automatic migration.
