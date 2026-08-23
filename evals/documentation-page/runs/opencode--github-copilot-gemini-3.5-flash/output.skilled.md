# tarq

`tarq` is a command-line tool that archives a directory into a `.tar.zst` compressed archive.

## Installation

On macOS, install `tarq` with Homebrew:

```bash
brew install tarq
```

On any platform with Rust installed, install it with Cargo:

```bash
cargo install tarq
```

## Usage

Run `tarq` by specifying the target directory:

```bash
tarq <directory> [-o output.tar.zst]
```

By default, the output file is named `<directory>.tar.zst` and written to the current working directory. The tool fails if the source directory is missing. It also fails if the destination path is unwritable.

## Options

- `--level <1-19>`: Sets the zstd compression level. The default level is 3.
- `--exclude <glob>`: Excludes paths that match the specified glob pattern. You can repeat this flag to exclude multiple patterns.
- `--dry-run`: Prints the file paths that would be archived to stdout without writing any files to disk.
