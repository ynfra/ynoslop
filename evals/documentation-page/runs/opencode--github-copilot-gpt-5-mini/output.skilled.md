# tarq

tarq creates a .tar.zst archive from a directory. Install with `brew install tarq` on macOS or `cargo install tarq` on any platform.

Usage
```
tarq <directory> [-o output.tar.zst]
```

Flags
- `--level <1-19>` — zstd compression level. Default: `3`. Valid range: `1` through `19`. Values outside the range produce an error and a non-zero exit status.
- `--exclude <glob>` — skip paths that match the glob. The glob is evaluated relative to the supplied directory. The flag is repeatable to add multiple exclude patterns.
- `--dry-run` — print the list of files and directories that would be archived and do not write any output file.

Examples
```
tarq myproject
```
Creates `myproject.tar.zst` in the current working directory.

```
tarq myproject -o /tmp/archive.tar.zst --level 9
```
Write archive to `/tmp/archive.tar.zst` using zstd level 9.

```
tarq myproject --exclude 'node_modules/**' --exclude '*.log' --dry-run
```
Print paths that would be archived while skipping `node_modules` and files ending in `.log`. No file is written.

Behavior, constraints, and failure modes
- The archive format is a POSIX tar stream compressed with zstd. The output file extension `.tar.zst` is conventional but not required by the program.
- If `-o` is omitted, tarq writes `<directory>.tar.zst` to the current working directory.
- Exclude globs are matched against repository-relative paths under the provided directory. An exclude pattern that matches a directory prevents all its contents from being archived.
- `--dry-run` only prints paths; it does not change timestamps or write temporary files.
- tarq exits with a non-zero status on error. Common errors include: the input directory does not exist, insufficient write permissions for the target path, disk full, and invalid flag values (for example, `--level 0` or `--level 20`).
- tarq does not preserve ACLs or extended attributes beyond what the tar format and the host system provide. If those metadata are required, verify them after extraction.

Exit codes
- Successful run: `0`.
- Failure: non-zero. Error messages are written to stderr with a short reason and the path involved when applicable.

If you need behavior not described here, state the exact requirement and I will document or implement it.
