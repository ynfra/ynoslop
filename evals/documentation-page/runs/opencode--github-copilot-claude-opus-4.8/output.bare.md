# tarq

`tarq` archives a directory into a compressed `.tar.zst` file.

## Installation

```sh
brew install tarq      # macOS
cargo install tarq     # anywhere
```

## Usage

```sh
tarq <directory> [-o output.tar.zst]
```

Archive `<directory>` into a `.tar.zst` file. If `-o` is omitted, the output path is derived from the directory name.

```sh
tarq myproject                       # -> myproject.tar.zst
tarq myproject -o backup.tar.zst     # explicit output path
```

## Flags

| Flag | Description |
|---|---|
| `--level <1-19>` | zstd compression level. Default: `3`. |
| `--exclude <glob>` | Skip paths matching the glob. Repeatable. |
| `--dry-run` | Print what would be archived without writing anything. |

### `--level <1-19>`

Sets the zstd compression level, from `1` (fastest) to `19` (smallest). Defaults to `3`.

```sh
tarq myproject --level 19
```

### `--exclude <glob>`

Skips paths matching the given glob. Pass the flag multiple times to exclude multiple patterns.

```sh
tarq myproject --exclude '*.log' --exclude 'node_modules'
```

### `--dry-run`

Prints the paths that would be archived without writing any output file.

```sh
tarq myproject --dry-run
```

## Examples

```sh
# Maximum compression, excluding logs and build artifacts
tarq myproject -o release.tar.zst --level 19 --exclude '*.log' --exclude 'dist'

# Preview the archive contents without writing anything
tarq myproject --dry-run --exclude 'node_modules'
```
