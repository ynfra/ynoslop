---
runner: fixture
model: -
variant: skilled
recorded: 2026-08-21T00:00:00.000Z
---

# tarq

Archives a directory into a `.tar.zst` file.

## Install

```
brew install tarq     # macOS
cargo install tarq    # anywhere with a Rust toolchain
```

## Usage

```
tarq <directory> [-o output.tar.zst]
```

Without `-o`, the archive is written next to the input directory as
`<directory>.tar.zst`.

| Flag | Meaning |
|---|---|
| `--level <1-19>` | zstd compression level. Default 3; higher is smaller but slower. |
| `--exclude <glob>` | Skip paths matching the glob. Repeat the flag for multiple patterns. |
| `--dry-run` | Print what would be archived; write nothing. |

## Examples

Archive a project, skipping dependencies and build output:

```
tarq ./myproject -o backup.tar.zst --exclude 'node_modules/**' --exclude 'dist/**'
```

Check what a run would include before committing to it:

```
tarq ./myproject --dry-run
```
