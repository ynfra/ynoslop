# sift v2.1.0 Release Notes

## Performance

Pattern compilation is now cached per run instead of being recompiled for each line. This results in significant performance improvements—filtering a 2.1 GB test log now takes 9 seconds instead of 41 seconds.

## New Features

### `--since` flag
Skip lines whose timestamp is older than a specified duration. Requires `--ts-format` to be set.

Example: `sift --since 15m --ts-format <format> <pattern> <file>`

Supported durations: `15m`, `2h`, `3d`, etc.

### `--format json` flag
Print one JSON object per matching line with the following keys:
- `file`
- `line`
- `ts`
- `text`

Default output format remains unchanged.

## Breaking Changes

### Configuration: `[filters]` → `[rules]`

The `[filters]` table in `sift.toml` has been renamed to `[rules]`.

Configs using the old `[filters]` table will exit with code 3 and display an error message naming the new key. **No automatic migration is provided.**

Update your configuration files accordingly:

```toml
# Before
[filters]
pattern = "error"

# After
[rules]
pattern = "error"
```

## Bug Fixes

Fixed an issue with `--follow` where lines were dropped when logrotate replaced the file. sift now properly reopens the path when the inode changes.

---

**Upgrade from v2.0.4:** Review the configuration breaking change above if you use a `sift.toml` file.
