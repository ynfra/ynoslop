# tarq

`tarq` archives a directory into a `.tar.zst` file with zstd compression.

## Installation

macOS:
```
brew install tarq
```

Anywhere else:
```
cargo install tarq
```

## Usage

```
tarq <directory> [-o output.tar.zst]
```

Archives `<directory>` to `output.tar.zst`. If `-o` is omitted, the output file is named `<directory>.tar.zst`.

## Flags

`--level <1-19>`
Zstd compression level. Default is 3. Lower values compress faster but produce larger files; higher values compress slower but produce smaller files.

`--exclude <glob>`
Skip paths matching this glob pattern. Repeatable; use multiple times to exclude different patterns.

`--dry-run`
Print the paths that would be archived without writing the output file.

## Examples

Archive the current directory:
```
tarq .
```

Archive with a custom output path:
```
tarq /path/to/data -o backup.tar.zst
```

Archive with higher compression:
```
tarq project --level 19
```

Exclude build artifacts and cache:
```
tarq project --exclude "*/node_modules" --exclude "*/dist" --exclude ".cache"
```

Preview what would be archived:
```
tarq project --dry-run
```
