---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: skilled
recorded: 2026-08-22T10:10:54.647Z
ms: 14137
skills: [no-slop-writing]
---

# tarq

`tarq` is a command-line tool that archives a directory into a `.tar.zst` file.

## Installation

Install `tarq` on macOS using Homebrew:

```bash
brew install tarq
```

On other platforms, install `tarq` using Cargo:

```bash
cargo install tarq
```

## Usage

The basic command structure is:

```bash
tarq <directory> [-o output.tar.zst]
```

## Options

* `--level <1-19>`: Specifies the zstd compression level. The default level is 3.
* `--exclude <glob>`: Skips paths matching the specified glob pattern. This option can be repeated.
* `--dry-run`: Prints the paths that would be archived without creating the output file.
