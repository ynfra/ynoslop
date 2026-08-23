# tarq

`tarq` archives a directory into a `.tar.zst` file.

## Installation

```sh
brew install tarq
```

On other platforms:

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

- `--level <1-19>` sets the zstd compression level. The default is `3`.
- `--exclude <glob>` skips paths matching the glob. Repeat the option for multiple patterns.
- `--dry-run` prints the paths that would be archived without writing an archive.

Example with exclusions:

```sh
tarq ./project \
  -o project.tar.zst \
  --exclude 'target/**' \
  --exclude '*.log'
```

Preview an archive operation:

```sh
tarq ./project --dry-run
```
