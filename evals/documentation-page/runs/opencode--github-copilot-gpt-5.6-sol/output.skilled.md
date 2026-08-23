# tarq

`tarq` archives a directory into a `.tar.zst` file using zstd compression.

## Installation

macOS:

```sh
brew install tarq
```

Any platform with Rust and Cargo:

```sh
cargo install tarq
```

## Usage

```sh
tarq <directory> [-o output.tar.zst]
```

Specify the source directory as the first argument. Use `-o` to set the output path:

```sh
tarq ./photos -o photos.tar.zst
```

## Options

| Option | Description |
|---|---|
| `-o <path>` | Write the archive to the given `.tar.zst` path. |
| `--level <1-19>` | Set the zstd compression level. Defaults to `3`. |
| `--exclude <glob>` | Skip paths matching the glob. Repeat the option for multiple patterns. |
| `--dry-run` | Print the paths that would be archived without writing an archive. |

## Examples

Create an archive with the default compression level:

```sh
tarq ./project -o project.tar.zst
```

Use compression level 10:

```sh
tarq ./project -o project.tar.zst --level 10
```

Exclude build output and log files:

```sh
tarq ./project -o project.tar.zst \
  --exclude 'target/**' \
  --exclude '*.log'
```

Preview the archive contents without creating a file:

```sh
tarq ./project --exclude 'target/**' --dry-run
```

Compression levels are limited to integers from `1` through `19`. Excluded paths are omitted from the archive. `--dry-run` does not write an output file.
