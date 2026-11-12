I'll create a comprehensive documentation page for `tarq`. Let me write this as a single markdown file.
I'll create a documentation page for `tarq` in the ynoslop directory:
Now I'll create a documentation page for `tarq`:
I'll create a new documentation file for `tarq`:

```markdown
# tarq — archive directories to tar.zst

`tarq` is a command-line tool that archives a directory into a compressed `.tar.zst` file using Zstandard (zstd) compression.

## Installation

### macOS
```bash
brew install tarq
```

### Anywhere (with Rust)
```bash
cargo install tarq
```

## Basic usage

```bash
tarq <directory>
tarq <directory> -o output.tar.zst
```

The first form archives `<directory>` into `<directory>.tar.zst` (default output filename). The second form archives `<directory>` into the specified output file.

## Flags

### `--level <1-19>`

Set the zstd compression level (default: 3).

- **1**: fastest compression, largest file
- **19**: slowest compression, smallest file

```bash
tarq mydir --level 10
tarq mydir --level 1 -o fast.tar.zst
```

### `--exclude <glob>`

Skip paths matching the glob pattern. Repeatable — specify multiple times to exclude multiple patterns.

```bash
tarq mydir --exclude "*.tmp" --exclude "node_modules" -o archive.tar.zst
```

### `--dry-run`

Print what would be archived without writing anything to disk. Useful for testing exclude patterns or previewing archive contents.

```bash
tarq mydir --dry-run
tarq mydir --exclude "*.log" --dry-run
```

## Examples

Archive a directory with default settings:
```bash
tarq /path/to/project
```

Archive with custom output filename:
```bash
tarq /path/to/project -o backup.tar.zst
```

Create a highly compressed archive:
```bash
tarq /path/to/project --level 19 -o archive.tar.zst
```

Archive while excluding build artifacts and dependencies:
```bash
tarq /path/to/project \
  --exclude "node_modules" \
  --exclude "dist" \
  --exclude "*.o" \
  -o source.tar.zst
```

Preview what will be archived before running:
```bash
tarq /path/to/project --exclude "*.log" --dry-run
```

Extract a tar.zst archive (using standard tools):
```bash
tar -I zstd -xf archive.tar.zst
```
```

Let me create this as a file:
I'll write the documentation file to the public directory:
I see this is a web application directory. Let me create the tarq documentation in the root directory as a standalone markdown file:

```bash
cat > ynoslop/TARQ.md << 'EOF'
# tarq — archive directories to tar.zst

`tarq` is a command-line tool that archives a directory into a compressed `.tar.zst` file using Zstandard (zstd) compression.

## Installation

### macOS
```bash
brew install tarq
```

### Anywhere (with Rust)
```bash
cargo install tarq
```

## Basic usage

```bash
tarq <directory>
tarq <directory> -o output.tar.zst
```

The first form archives `<directory>` into `<directory>.tar.zst` (default output filename). The second form archives `<directory>` into the specified output file.

## Flags

### `--level <1-19>`

Set the zstd compression level (default: 3).

- **1**: fastest compression, largest file
- **19**: slowest compression, smallest file

```bash
tarq mydir --level 10
tarq mydir --level 1 -o fast.tar.zst
```

### `--exclude <glob>`

Skip paths matching the glob pattern. Repeatable — specify multiple times to exclude multiple patterns.

```bash
tarq mydir --exclude "*.tmp" --exclude "node_modules" -o archive.tar.zst
```

### `--dry-run`

Print what would be archived without writing anything to disk. Useful for testing exclude patterns or previewing archive contents.

```bash
tarq mydir --dry-run
tarq mydir --exclude "*.log" --dry-run
```

## Examples

Archive a directory with default settings:
```bash
tarq /path/to/project
```

Archive with custom output filename:
```bash
tarq /path/to/project -o backup.tar.zst
```

Create a highly compressed archive:
```bash
tarq /path/to/project --level 19 -o archive.tar.zst
```

Archive while excluding build artifacts and dependencies:
```bash
tarq /path/to/project \
  --exclude "node_modules" \
  --exclude "dist" \
  --exclude "*.o" \
  -o source.tar.zst
```

Preview what will be archived before running:
```bash
tarq /path/to/project --exclude "*.log" --dry-run
```

Extract a tar.zst archive (using standard tools):
```bash
tar -I zstd -xf archive.tar.zst
```
EOF
```

Done. I've created a comprehensive documentation page for `tarq` as a single markdown file. The documentation includes:

- **Installation instructions** for macOS (Homebrew) and any platform (Cargo)
- **Basic usage** with default and custom output filenames
- **All three flags** documented with clear explanations and examples:
  - `--level` for compression level control (1-19)
  - `--exclude` for pattern-based filtering (repeatable)
  - `--dry-run` for preview mode
- **Practical examples** covering common use cases
- **Bonus note** on extracting tar.zst files using standard tools

The page is standalone, self-contained, and doesn't reference any features beyond what you specified.
