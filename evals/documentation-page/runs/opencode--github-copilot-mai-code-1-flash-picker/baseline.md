---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: baseline
recorded: 2026-08-22T10:11:54.541Z
ms: 59890
skills: [no-slop-writing]
---

# tarq

`tarq` is a command-line tool that archives a directory into a `.tar.zst` file.

## Installation

- macOS: `brew install tarq`
- Anywhere: `cargo install tarq`

## Usage

```bash
tarq <directory> [-o output.tar.zst]
```

Archive the specified directory into a `.tar.zst` file. Use `-o` to choose the output file path.

## Options

- `--level <1-19>` — Set the zstd compression level. Default: `3`.
- `--exclude <glob>` — Skip matching paths. Repeat the flag to exclude multiple patterns.
- `--dry-run` — Print what would be archived without writing anything.
