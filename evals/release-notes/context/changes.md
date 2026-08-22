- BREAKING: in sift.toml the [filters] table is now [rules]. A config that
  still uses [filters] exits with code 3 and an error naming the new key.
  No automatic migration.
- pattern compilation is cached per run instead of recompiled per line.
  Filtering a 2.1 GB test log went from 41 s to 9 s.
- new flag --since <duration> (e.g. 15m, 2h, 3d): skips lines whose timestamp
  is older than the given duration. Requires --ts-format to be set.
- new flag --format json: prints one JSON object per matching line with the
  keys file, line, ts, text. Default output is unchanged.
- fixed: with --follow, lines were dropped when logrotate replaced the file.
  sift now reopens the path when the inode changes.
