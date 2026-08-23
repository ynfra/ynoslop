# Sift v2.1.0 Release Notes

`sift` is a command-line log filter that reads log files or stdin and prints matching lines. This release (v2.1.0) introduces new features, significant performance improvements, a bug fix, and one breaking change.

---

## ⚠️ Breaking Changes

### Configuration Table Rename (`[filters]` to `[rules]`)
In `sift.toml`, the `[filters]` table has been renamed to `[rules]`.
* **Migration:** There is no automatic migration. A configuration that still uses `[filters]` will exit with code `3` and an error naming the new key.

---

## ⚡ Performance Improvements

### Pattern Compilation Caching
Pattern compilation is now cached per run instead of being recompiled per line.
* **Impact:** Filtering a 2.1 GB test log went from 41 seconds to 9 seconds.

---

## ✨ New Features

### Time-Based Filtering (`--since`)
A new `--since <duration>` flag (e.g., `15m`, `2h`, `3d`) skips lines whose timestamp is older than the given duration.
* **Requirement:** Requires the `--ts-format` flag to be set.

### JSON Output Formatting (`--format json`)
A new `--format json` flag prints one JSON object per matching line with the keys `file`, `line`, `ts`, and `text`. 
* **Note:** The default output format remains unchanged.

---

## 🐛 Bug Fixes

### Log Rotation Recovery with `--follow`
* **Fix:** Previously with `--follow`, lines were dropped when logrotate replaced the file. `sift` now detects when the inode changes and reopens the file path.
