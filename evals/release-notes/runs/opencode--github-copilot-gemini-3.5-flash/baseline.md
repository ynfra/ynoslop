---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: baseline
recorded: 2026-08-22T10:13:41.929Z
ms: 9272
skills: [no-slop-writing]
---

# Sift v2.1.0 Release Notes

`sift` is a command-line log filter that reads log files or stdin and prints matching lines. This release (v2.1.0) introduces significant performance improvements, new formatting and filtering options, log rotation robustness, and one breaking change.

## Breaking Changes

* **Configuration Table Rename (`[filters]` $\rightarrow$ `[rules]`)**
  In `sift.toml`, the `[filters]` table has been renamed to `[rules]`. There is no automatic migration. A configuration file that still uses `[filters]` will cause `sift` to exit with code 3 and print an error naming the new key.

## Performance Improvements

* **Cached Pattern Compilation**
  Pattern compilation is now cached per run instead of being recompiled per line. This optimization reduces the filtering time of a 2.1 GB test log from 41 seconds to 9 seconds.

## New Features

* **Time-Based Filtering (`--since <duration>`)**
  Added a new `--since <duration>` flag (e.g., `15m`, `2h`, `3d`) that skips lines whose timestamp is older than the given duration. This flag requires `--ts-format` to be configured.
* **JSON Output Formatting (`--format json`)**
  Added a new `--format json` flag that prints one JSON object per matching line containing the keys: `file`, `line`, `ts`, and `text`. The default output format remains unchanged.

## Bug Fixes

* **Log Rotation Robustness with `--follow`**
  Fixed an issue where lines were dropped when `logrotate` replaced the active log file. `sift` now detects inode changes and automatically reopens the file path.
