**sift v2.1.0 Release Notes**

Breaking change: the configuration key [filters] is renamed to [rules] in sift.toml.  
A configuration that still uses [filters] exits with code 3 and an error that names the new key.  
There is no automatic migration.

Changes
- Pattern compilation is cached per run instead of being recompiled for every line. On a 2.1 GB test log this reduces runtime from 41 s to 9 s.
- New flag `--since <duration>` (examples: `15m`, `2h`, `3d`) skips lines whose timestamp is older than the given duration. This flag requires `--ts-format` to be set.
- New flag `--format json` prints one JSON object per matching line with the keys `file`, `line`, `ts`, and `text`. The default (human-readable) output is unchanged.
- Fixed a bug where lines were dropped with `--follow` when logrotate replaced the file; sift now reopens the path when the file's inode changes.

Upgrade notes
- Update any sift.toml files that use `[filters]` to `[rules]` before upgrading; configs left unchanged will cause sift to exit with code 3.
