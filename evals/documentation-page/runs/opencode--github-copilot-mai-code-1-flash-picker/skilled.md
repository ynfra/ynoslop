---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: skilled
recorded: 2026-08-22T10:12:05.196Z
ms: 10649
skills: [no-slop-writing]
---

# tarq

`tarq` archives a directory into a `.tar.zst` file.

## Installation

- macOS: `brew install tarq`
- Any platform with Cargo: `cargo install tarq`

## Usage

```bash
tarq <directory> [-o output.tar.zst]
```

Archive a directory and write the `.tar.zst` file. Use `-o` to set the output path.

## Options

- `--level <1-19>`: set the zstd compression level. Default: `3`.
- `--exclude <glob>`: skip paths that match the given glob. Repeat the flag to exclude multiple patterns.
- `--dry-run`: print the paths that would be archived without writing any archive file.

## Examples

```bash
tarq ./project
tarq ./project -o ./project.tar.zst
tarq ./project --level 19 --exclude "*.log" --exclude "tmp/*"
tarq ./project --dry-run
```
