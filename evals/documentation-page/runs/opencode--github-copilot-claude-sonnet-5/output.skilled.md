# tarq

Archives a directory into a `.tar.zst` file.

## Install

```
brew install tarq
```

or, on any platform with a Rust toolchain:

```
cargo install tarq
```

## Usage

```
tarq <directory> [-o output.tar.zst]
```

If `-o` is omitted, the archive is written to `<directory>.tar.zst` in the current directory.

## Flags

- `--level <1-19>` — zstd compression level. Default: 3. Higher values produce smaller output and take longer to run.
- `--exclude <glob>` — skip paths matching the glob. Repeatable; each occurrence adds another exclusion.
- `--dry-run` — print the list of files that would be archived, without writing an archive.

## Examples

Archive `src/` at the default level:

```
tarq src -o src.tar.zst
```

Archive `src/`, excluding `node_modules` and any `.log` files, at level 19:

```
tarq src -o src.tar.zst --level 19 --exclude 'node_modules/**' --exclude '*.log'
```

Check what a run would include before committing to it:

```
tarq src --dry-run
```
