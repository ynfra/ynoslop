---
runner: fixture
model: -
variant: baseline
recorded: 2026-08-21T00:00:00.000Z
---

# 🎉 sift v2.1.0 — Faster, Smarter, More Flexible Than Ever!

We're thrilled to announce the release of **sift v2.1.0**! 🚀 This release has
been a labor of love, and we couldn't be more excited to get it into your hands.
Packed with powerful performance improvements, exciting new capabilities, and
important reliability fixes, v2.1.0 represents a significant leap forward in our
journey to make log filtering as seamless and effortless as possible.

## ⚡ Blazingly Fast Performance

In today's world of ever-growing observability data, speed is more crucial than
ever. We've completely reimagined how sift handles pattern compilation:
previously, patterns were recompiled on a per-line basis, but sift now
intelligently caches compiled patterns for the duration of the run. The result?
A truly dramatic improvement — our 2.1 GB test log went from 41 s all the way
down to a mere 9 s. That's the kind of game-changing speedup that transforms
your workflow!

## ✨ Exciting New Features

We've added a wide range of new capabilities to help you get the most out of
your logs:

- **`--since <duration>`** — Whether you're chasing down a fresh incident or
  just want to skip the noise, this handy new flag lets you effortlessly filter
  out older lines. Simply pass a duration like `15m`, `2h`, or `3d` and sift
  will seamlessly skip anything older! It's important to note that
  `--ts-format` needs to be set for this to work its magic.
- **`--format json`** — Machine-readable output is here at last! sift can now
  emit one beautifully structured JSON object per matching line, complete with
  `file`, `line`, `ts`, and `text` keys. This unlocks a whole new realm of
  possibilities for downstream tooling and pipelines. Don't worry — the default
  output remains completely unchanged, so your existing scripts will keep
  humming along.

## 🐛 Robust Bug Fixes

- Fixed an issue where `--follow` could drop lines when logrotate replaced the
  underlying file. sift is now smart enough to detect inode changes and
  gracefully reopen the path, ensuring you never miss a line again!

## ⚠️ Breaking Changes

As part of our ongoing commitment to clarity and consistency, the `[filters]`
table in `sift.toml` has been renamed to `[rules]`. If your config still uses
the old key, sift will exit with code 3 and a helpful error message pointing you
to the new name. Please note that there is no automatic migration at this time —
you'll need to update your config manually. We appreciate your understanding!

## 🙏 Wrapping Up

In summary, sift v2.1.0 delivers a comprehensive package of performance,
flexibility, and reliability improvements that we believe will make your
day-to-day log wrangling dramatically more pleasant. As always, a huge thank you
to our incredible community for the bug reports, feature requests, and
encouragement that make releases like this possible.

Happy sifting! 🎊
