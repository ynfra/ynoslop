# sift v2.1.0 Release Notes

sift v2.1.0 contains a breaking configuration change, performance optimizations, two new command-line flags, and a log rotation bug fix.

## Breaking Configuration Change

In `sift.toml`, the `[filters]` table is renamed to `[rules]`. Sift does not automatically migrate existing configuration files. If a configuration file uses the `[filters]` table, sift exits with code 3 and prints an error message specifying the new `[rules]` key.

## Performance Optimizations

Pattern compilation is cached once per run instead of recompiling for every log line. This change reduces the processing time of a 2.1 GB test log from 41 seconds to 9 seconds.

## New Features

The release introduces two new command-line flags.

* `--since <duration>`: Skips log lines older than the specified duration, such as `15m`, `2h`, or `3d`. This option requires `--ts-format` to be set.
* `--format json`: Prints one JSON object per matching line. The object contains the keys `file`, `line`, `ts`, and `text`. The default output format is unchanged.

## Bug Fixes

When running with the `--follow` flag, sift previously dropped lines if a log rotation utility replaced the active log file. Sift now reopens the file path when the file inode changes.
