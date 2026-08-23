# tarq

`tarq` archives a directory into a `.tar.zst` file.

## Installation

### macOS

```sh
brew install tarq
```

### Any Platform

```sh
cargo install tarq
```

## Usage

```sh
tarq <directory> [-o output.tar.zst]
```

Example:

```sh
tarq ./project -o project.tar.zst
```

## Options

| Option | Description |
|---|---|
| `-o <file>` | Write the archive to the specified `.tar.zst` file. |
| `--level <1-19>` | Set the zstd compression level. Defaults to `3`. |
| `--exclude <glob>` | Skip paths matching the glob. May be repeated. |
| `--dry-run` | Print what would be archived without writing an archive. |

## Examples

Use a higher compression level:

```sh
tarq ./project -o project.tar.zst --level 10
```

Exclude matching paths:

```sh
tarq ./project -o project.tar.zst --exclude "*.log" --exclude "target/**"
```

Preview the archive contents without writing a file:

```sh
tarq ./project --dry-run
```
