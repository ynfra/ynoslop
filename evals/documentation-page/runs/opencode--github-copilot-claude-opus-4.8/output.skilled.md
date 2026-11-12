# tarq

`tarq` archives a directory into a single `.tar.zst` file — a tar stream compressed with zstd.

## Install

On macOS:

```
brew install tarq
```

Anywhere with a Rust toolchain:

```
cargo install tarq
```

## Usage

```
tarq <directory> [-o output.tar.zst]
```

`tarq ./project` writes `project.tar.zst` in the current directory. Pass `-o` to choose a different path:

```
tarq ./project -o /backups/project-2026-08-22.tar.zst
```

## Flags

- `--level <1-19>` — zstd compression level. Default is 3. Higher levels shrink the output further but take longer and use more memory; 19 is the maximum.
- `--exclude <glob>` — skip paths matching the glob. Repeat the flag to exclude several patterns:

  ```
  tarq ./project --exclude '*.log' --exclude 'node_modules/**'
  ```

- `--dry-run` — list the paths that would be archived and exit without writing a file. Combine it with `--exclude` to check that your patterns match what you expect before committing to a full run.
