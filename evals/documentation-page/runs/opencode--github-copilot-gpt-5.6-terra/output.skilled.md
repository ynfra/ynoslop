# tarq

Archive a directory into a `.tar.zst` file.

Install with Homebrew on macOS:

```sh
brew install tarq
```

Install with Cargo on any platform supported by Cargo:

```sh
cargo install tarq
```

## Usage

```sh
tarq <directory> [-o output.tar.zst]
```

Archive `project/` using the default output path:

```sh
tarq project
```

Write the archive to a specific file:

```sh
tarq project -o project-backup.tar.zst
```

`tarq` supports these flags:

- `--level <1-19>` sets the zstd compression level. The default is `3`.
- `--exclude <glob>` skips paths matching a glob. Pass the flag more than once to exclude multiple patterns.
- `--dry-run` prints the paths that would be archived and does not write an archive.

For example, archive a directory at compression level 10 while excluding build output and Git metadata:

```sh
tarq project \
  --level 10 \
  --exclude 'target/**' \
  --exclude '.git/**' \
  -o project.tar.zst
```

Preview the same archive without creating `project.tar.zst`:

```sh
tarq project \
  --exclude 'target/**' \
  --exclude '.git/**' \
  --dry-run
```
