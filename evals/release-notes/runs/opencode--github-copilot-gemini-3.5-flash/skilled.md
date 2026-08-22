---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: skilled
recorded: 2026-08-22T10:14:01.028Z
ms: 19096
skills: [no-slop-writing]
---

# Sift v2.1.0 Release Notes

Sift v2.1.0 contains a breaking configuration change, a pattern compilation cache, two new command-line flags, and a log rotation fix. This version succeeds v2.0.4.

## Breaking Configuration Change

In `sift.toml`, the `[filters]` table is now `[rules]`. Sift does not automatically migrate your configuration. If your configuration still uses `[filters]`, sift exits with code 3 and prints an error naming the new key.

## Performance Optimization

Sift now caches compiled patterns per run instead of recompiling them for every line. Filtering a 2.1 GB test log now takes 9 seconds instead of 41 seconds.

## Command-Line Flags

* `--since <duration>`: Skips lines whose timestamp is older than the given duration (for example, `15m`, `2h`, or `3d`). This flag requires `--ts-format` to be set.
* `--format json`: Prints one JSON object per matching line with the keys `file`, `line`, `ts`, and `text`. The default output format remains unchanged.

## Log Rotation Fix

When running with `--follow`, sift previously dropped log lines if logrotate replaced the file. Sift now reopens the file path when the inode changes.
