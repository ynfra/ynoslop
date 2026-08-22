---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: skilled
recorded: 2026-08-22T10:09:54.015Z
ms: 6694
skills: [no-slop-writing]
---

# tarq

Archives a directory into a `.tar.zst` file.

## Install

```
brew install tarq
```

or, on any platform with Rust installed:

```
cargo install tarq
```

## Usage

```
tarq <directory> [-o output.tar.zst]
```

By default, `tarq` writes the archive to `<directory>.tar.zst` in the current directory. Use `-o` to specify a different path.

## Flags

- `--level <1-19>` — zstd compression level. Default 3. Higher values produce smaller archives at the cost of longer compression time.
- `--exclude <glob>` — skip paths matching the glob. Repeatable; each occurrence adds one pattern.
- `--dry-run` — print the list of files that would be archived, without writing an output file.

## Examples

Archive `./project` into `project.tar.zst`:

```
tarq ./project
```

Archive with a custom output path and level 19 compression:

```
tarq ./project -o build/project.tar.zst --level 19
```

Exclude `.git` and any `node_modules` directory:

```
tarq ./project --exclude '.git' --exclude '**/node_modules'
```

Preview what would be included without writing anything:

```
tarq ./project --dry-run
```
