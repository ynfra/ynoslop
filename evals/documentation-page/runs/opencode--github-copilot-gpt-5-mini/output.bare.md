**tarq**

tarq is a small command-line tool that archives a directory into a zstd-compressed tar file (.tar.zst).

Install
1. macOS (Homebrew):
```
brew install tarq
```
2. Anywhere with Rust/Cargo:
```
cargo install tarq
```

Synopsis
```
tarq <directory> [-o output.tar.zst] [--level <1-19>] [--exclude <glob>] [--dry-run]
```

What it does
- Creates a tar archive of the directory you specify and compresses it with zstd, producing a .tar.zst file.
- The produced file is a tarball compressed with zstd (.tar.zst).

Flags
- `--level <1-19>`  
  Set the zstd compression level. Range is 1–19. Default is 3.

- `--exclude <glob>`  
  Skip paths matching the given glob. This flag is repeatable to exclude multiple patterns. Quote globs so your shell does not expand them (for example, `--exclude '*.log'`).

- `--dry-run`  
  Print the list of paths that would be archived according to the current options, but do not write any archive file.

Basic examples
- Archive a directory to a file:
```
tarq mysite -o mysite.tar.zst
```

- Archive with a higher compression level:
```
tarq mysite --level 19 -o mysite.tar.zst
```

- Exclude multiple patterns:
```
tarq project --exclude '*.log' --exclude 'node_modules' -o project.tar.zst
```

- Check what would be archived without writing anything:
```
tarq project --dry-run --exclude '*.log'
```

Notes and tips
- Quote exclude globs so the shell passes them unchanged to tarq (for example, `--exclude '*.log'`).
- `--exclude` is repeatable; pass it once per pattern you want to skip.
- Default compression level is 3; use lower numbers for faster, larger archives and higher numbers for stronger compression.
- The output filename is specified with `-o`. It is conventional to use the `.tar.zst` extension for the produced file.
- To extract the produced .tar.zst you can use common tools that support zstd-compressed tar archives (for example, a tar build with zstd support or using zstd/unzstd together with tar), depending on what is available on your system.
