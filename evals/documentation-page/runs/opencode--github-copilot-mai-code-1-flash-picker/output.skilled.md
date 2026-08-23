# tarq

`tarq` archives a directory into a `.tar.zst` file.

## Install

On macOS, install it with:

```bash
brew install tarq
```

On any platform with Cargo, install it with:

```bash
cargo install tarq
```

## Usage

```bash
tarq <directory> [-o output.tar.zst]
```

Run `tarq` with the directory to archive. Use `-o` to set the output archive path.

## Options

- `--level <1-19>` sets the zstd compression level. The default is `3`.
- `--exclude <glob>` skips paths that match the given glob. Repeat the flag to exclude more patterns.
- `--dry-run` prints the paths that would be archived without writing an archive.

## Examples

```bash
tarq ./project -o project.tar.zst
tarq ./project --level 10 --exclude '*.log' --exclude 'tmp/*'
tarq ./project --dry-run
```
