Write a documentation page for `tarq`, a command-line tool that archives a
directory into a `.tar.zst` file. It is installed with `brew install tarq`
(macOS) or `cargo install tarq` (anywhere). Basic usage:
`tarq <directory> [-o output.tar.zst]`. It has three flags:

- `--level <1-19>` — zstd compression level, default 3
- `--exclude <glob>` — skip matching paths, repeatable
- `--dry-run` — print what would be archived without writing anything

Output a single markdown page. Nothing else exists about this tool; do not
invent additional features.
