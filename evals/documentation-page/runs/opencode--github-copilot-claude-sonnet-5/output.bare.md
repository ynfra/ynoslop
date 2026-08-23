# tarq

`tarq` is a command-line tool that archives a directory into a `.tar.zst` file.

## Installation

**macOS (Homebrew):**

```sh
brew install tarq
```

**Any platform (Cargo):**

```sh
cargo install tarq
```

## Usage

```sh
tarq <directory> [-o output.tar.zst]
```

| Argument | Description |
|---|---|
| `<directory>` | Path to the directory to archive. |
| `-o <output.tar.zst>` | Path for the resulting archive. If omitted, `tarq` derives a default name from the directory. |

## Flags

### `--level <1-19>`

Sets the zstd compression level. Higher values produce smaller archives at the cost of longer compression time.

- Default: `3`
- Range: `1` (fastest, least compression) to `19` (slowest, most compression)

```sh
tarq ./project -o project.tar.zst --level 19
```

### `--exclude <glob>`

Skips paths matching the given glob pattern. Repeatable to exclude multiple patterns.

```sh
tarq ./project --exclude "*.log" --exclude "node_modules/**"
```

### `--dry-run`

Prints what would be archived without writing any output file. Useful for verifying `--exclude` patterns before running a real archive.

```sh
tarq ./project --exclude "*.log" --dry-run
```

## Examples

Archive a directory with default settings:

```sh
tarq ./my-folder
```

Archive to a specific output path:

```sh
tarq ./my-folder -o backup.tar.zst
```

Archive with maximum compression:

```sh
tarq ./my-folder -o backup.tar.zst --level 19
```

Exclude build artifacts and preview the result:

```sh
tarq ./my-folder --exclude "target/**" --exclude "*.o" --dry-run
```
