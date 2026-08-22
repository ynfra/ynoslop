---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: baseline
recorded: 2026-08-22T10:10:40.507Z
ms: 8706
skills: [no-slop-writing]
---

# tarq

`tarq` is a command-line tool that archives a directory into a `.tar.zst` file.

## Installation

### macOS
Install via Homebrew:
```bash
brew install tarq
```

### Other Platforms
Install via Cargo (requires Rust toolchain):
```bash
cargo install tarq
```

## Usage

```bash
tarq <directory> [-o output.tar.zst]
```

### Options

* `--level <1-19>`
  Set the zstd compression level. (Default: `3`)

* `--exclude <glob>`
  Skip matching paths. This flag can be repeated to exclude multiple patterns.

* `--dry-run`
  Print the list of files and directories that would be archived without writing the output file.
