# sift v2.1.0

## Breaking Change

The `sift.toml` configuration table `[filters]` has been renamed to `[rules]`.

Configurations that still use `[filters]` exit with code `3`. The error names `[rules]` as the required replacement. sift does not migrate existing configurations.

## Changes

Pattern compilation is cached for each run instead of repeating for every input line. Filtering a 2.1 GB test log decreased from 41 seconds to 9 seconds.

`--since <duration>` filters out lines older than the specified duration. Supported examples include `15m`, `2h`, and `3d`. This flag requires `--ts-format`.

`--format json` emits one JSON object per matching line. Each object contains `file`, `line`, `ts`, and `text`. Default output is unchanged.

With `--follow`, sift now reopens a log file after logrotate replaces it by detecting inode changes.
