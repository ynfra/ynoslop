# tarq

`tarq` is a command-line tool that archives a directory into a `.tar.zst` file.

## Installation

On macOS:

```bash
brew install tarq
```

On other platforms with Cargo:

```bash
cargo install tarq
```

## Usage

```bash
tarq <directory> [-o output.tar.zst]
```

The tool takes a directory path as its main argument. The output file path is specified with `-o`.

## Options

* `--level <1-19>`: Zstd compression level. The default value is 3.
* `--exclude <glob>`: Excludes matching paths from the archive. You can specify this flag multiple times.
* `--dry-run`: Prints the list of files to archive without writing the output file.

## Examples

Archive a directory named `src`:

```bash
tarq src -o src.tar.zst
```

Archive a directory with compression level 19:

```bash
tarq src -o src.tar.zst --level 19
```

Exclude temporary files and log files from the archive:

```bash
tarq src -o src.tar.zst --exclude "*.tmp" --exclude "*.log"
```

Preview which files will be archived:

```bash
tarq src --dry-run
```
