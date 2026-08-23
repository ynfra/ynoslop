# tarq

`tarq` archives a directory into a `.tar.zst` file.

## Installation

On macOS:

```bash
brew install tarq
```

Anywhere:

```bash
cargo install tarq
```

## Usage

```bash
tarq <directory> [-o output.tar.zst]
```

- `<directory>` is the directory to archive.
- `-o output.tar.zst` writes the archive to the specified output path.

## Options

- `--level <1-19>` sets the zstd compression level. The default is `3`.
- `--exclude <glob>` skips paths matching the given glob. This option can be repeated.
- `--dry-run` prints what would be archived without writing anything.

## Examples

```bash
tarq ./my-project
tarq ./my-project -o backup.tar.zst
tarq ./my-project --level 19 --exclude "*.tmp" --exclude "node_modules" -o backup.tar.zst
tarq ./my-project --dry-run
```
