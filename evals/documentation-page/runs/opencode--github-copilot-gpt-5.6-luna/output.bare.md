# tarq

`tarq` archives a directory into a `.tar.zst` file.

## Installation

### macOS

```sh
brew install tarq
```

### Anywhere

```sh
cargo install tarq
```

## Usage

```sh
tarq <directory> [-o output.tar.zst]
```

## Options

- `--level <1-19>`: Set the zstd compression level. The default is `3`.
- `--exclude <glob>`: Skip paths matching the glob. This option can be repeated.
- `--dry-run`: Print what would be archived without writing anything.

## Examples

Archive a directory:

```sh
tarq ./project -o project.tar.zst
```

Use a different compression level:

```sh
tarq ./project -o project.tar.zst --level 10
```

Exclude matching paths:

```sh
tarq ./project -o project.tar.zst --exclude '*.log' --exclude 'tmp/**'
```

Preview the archive contents without creating a file:

```sh
tarq ./project --dry-run
```
