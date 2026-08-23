# sift v2.1.0

sift v2.1.0 follows v2.0.4 with a breaking config change, two new options, and a fix for follow-mode log rotation handling.

## Changes

- Breaking: the config file table `[filters]` is now `[rules]`. Configs that still use `[filters]` exit with code 3 and print an error naming the new key. There is no automatic migration.
- Performance: pattern compilation is now cached per run instead of being recompiled for every line. In a 2.1 GB test log, filtering time dropped from 41 s to 9 s.
- New option: `--since <duration>` accepts values such as `15m`, `2h`, and `3d` and skips lines whose timestamp is older than the given duration. This requires `--ts-format` to be set.
- New option: `--format json` prints one JSON object per matching line with the keys `file`, `line`, `ts`, and `text`. The default output format is unchanged.
- Fixed: with `--follow`, lines could be dropped when logrotate replaced the file. sift now reopens the path when the inode changes.
