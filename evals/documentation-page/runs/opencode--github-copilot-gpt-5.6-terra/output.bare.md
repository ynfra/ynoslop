# tarq

Archive a directory into a `.tar.zst` file.

## Install

macOS:

```sh
brew install tarq
```

Anywhere with Rust installed:

```sh
cargo install tarq
```

## Usage

```sh
tarq <directory> [-o output.tar.zst]
```

If `-o` is omitted, tarq writes the archive using its default output name.

## Options

```text
--level <1-19>   Zstd compression level (default: 3)
--exclude <glob> Skip paths matching a glob; may be repeated
--dry-run        Print files that would be archived without writing an archive
```

## Examples

Archive a directory:

```sh
tarq ./project
```

Choose an output file:

```sh
tarq ./project -o project.tar.zst
```

Use stronger compression:

```sh
tarq ./project --level 19 -o project.tar.zst
```

Exclude paths:

```sh
tarq ./project --exclude 'node_modules/**' --exclude '*.log'
```

Preview the archive contents:

```sh
tarq ./project --dry-run
```
