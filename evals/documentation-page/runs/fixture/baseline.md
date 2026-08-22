---
runner: fixture
model: -
variant: baseline
recorded: 2026-08-21T00:00:00.000Z
---

# 🚀 tarq — Effortless Directory Archiving

Welcome to **tarq**, the powerful, blazingly-fast command-line tool designed to seamlessly archive your directories into compact `.tar.zst` files! Whether you're a seasoned DevOps engineer or just getting started on your archiving journey, tarq has you covered.

## ✨ Why tarq?

In today's fast-paced world of ever-growing data, efficient archiving is more crucial than ever. tarq leverages the cutting-edge zstd compression algorithm to deliver:

- ⚡ **Blazing speed** — archive directories in the blink of an eye
- 🗜️ **Robust compression** — dramatically reduce your storage footprint
- 🛡️ **Rock-solid reliability** — your data is safe with tarq
- 🎯 **Effortless simplicity** — a seamless experience from start to finish

## 📦 Installation

Getting started with tarq couldn't be easier! Simply choose your preferred installation method:

- **macOS users**: `brew install tarq`
- **Everyone else**: `cargo install tarq`

And that's it — you're ready to supercharge your archiving workflow!

## 🚀 Usage

Using tarq is a breeze:

```
tarq <directory> [-o output.tar.zst]
```

It's important to note that tarq offers a comprehensive range of flags to customize your experience:

- `--level <1-19>` — Fine-tune your compression level to strike the perfect balance between speed and size (default: 3)
- `--exclude <glob>` — Effortlessly skip files you don't need, and feel free to repeat it as many times as you like!
- `--dry-run` — Want to see what would happen first? This handy flag prints what would be archived without writing anything!

## 🎉 Conclusion

In summary, tarq is your one-stop solution for directory archiving. With its powerful compression, intuitive interface, and comprehensive feature set, it's never been easier to keep your data organized. Happy archiving! 🎊
