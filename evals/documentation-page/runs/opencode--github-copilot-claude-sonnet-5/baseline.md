---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: baseline
recorded: 2026-08-22T10:09:47.319Z
ms: 7869
skills: [no-slop-writing]
---

# tarq

`tarq` is a command-line tool that archives a directory into a `.tar.zst` file.

## Installation

**macOS (Homebrew):**

```sh
brew install tarq
```

**Anywhere (Cargo):**

```sh
cargo install tarq
```

## Usage

```sh
tarq <directory> [-o output.tar.zst]
```

- `<directory>` — the directory to archive.
- `-o output.tar.zst` — path for the output archive. If omitted, `tarq` derives a default output filename.

## Flags

### `--level <1-19>`

Sets the zstd compression level. Accepts an integer from `1` to `19`. Higher values produce smaller archives at the cost of slower compression.

Default: `3`

```sh
tarq ./project --level 19
```

### `--exclude <glob>`

Skips paths matching the given glob pattern. Can be specified multiple times to exclude multiple patterns.

```sh
tarq ./project --exclude "*.log" --exclude "node_modules"
```

### `--dry-run`

Prints what would be archived without writing anything to disk. Useful for previewing which files and directories will be included before running a real archive.

```sh
tarq ./project --dry-run
```

## Examples

Archive a directory with default settings:

```sh
tarq ./my-folder
```

Archive with a custom output path and higher compression:

```sh
tarq ./my-folder -o backup.tar.zst --level 19
```

Exclude build artifacts and preview the result first:

```sh
tarq ./my-folder --exclude "target" --exclude "*.tmp" --dry-run
```
