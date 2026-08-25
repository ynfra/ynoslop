#!/usr/bin/env bash
#
# Copies pinned third-party skills into skills/<name>/. Run this file.
#
# Needs signed-in `gh` (`gh auth status`). The token is why: higher rate
# limits, and a real error instead of an HTML 404.
#
# One `gh api` call per file, written byte-for-byte to SKILL.md. Upstream
# already ships YAML frontmatter (name, description).
#
# Pins are the whole point. ynoslop compares recordings months apart, so
# skill text has to stay fixed. `?ref=main` would let upstream reword a skill
# and invalidate every old recording, with nothing on disk to show it
# happened. To bump: edit the ref here, re-run, read the diff, re-record
# that skill's evals.
#
#   attention-span   tag 0.7 = 8a0a776
#   humanizer        e2e92e7 (SKILL.md metadata.version 2.11.2; no tag exists)
#
# Writes land as .tmp and move into place only on success. A moved upstream
# path must never leave a zero-byte skill for composePrompt() to paste as an
# empty <instructions> block.
#
# The three attention-* skills are AGPL-3.0, so each folder also gets the
# upstream LICENSE next to the text it covers.
#
# no-slop-writing is local and has no upstream. This script never touches it.
#
# Verified 2026-08-24: both repos on branch main, all five paths resolve.

set -euo pipefail

# skills/ is next to this script, so the cwd does not matter.
cd "$(dirname "$0")"

# Without this header the contents API returns base64 wrapped in JSON.
RAW='Accept: application/vnd.github.raw'

# $1 dest path, $2 gh contents API path. .tmp first: a failed fetch
# must not replace a good file with nothing.
pull() {
  local dest=$1 api=$2
  mkdir -p "$(dirname "$dest")"
  gh api -H "$RAW" "$api" > "$dest.tmp"
  mv "$dest.tmp" "$dest"
}


# --- attention-spartan --- alexgreensh/attention-span, AGPL-3.0 -------------

echo "==> attention-spartan"
pull attention-spartan/SKILL.md \
  'repos/alexgreensh/attention-span/contents/output-styles/spartan.md?ref=0.7'
pull attention-spartan/LICENSE \
  'repos/alexgreensh/attention-span/contents/LICENSE?ref=0.7'


# --- attention-rundown --- alexgreensh/attention-span, AGPL-3.0 -------------

echo "==> attention-rundown"
pull attention-rundown/SKILL.md \
  'repos/alexgreensh/attention-span/contents/output-styles/rundown.md?ref=0.7'
pull attention-rundown/LICENSE \
  'repos/alexgreensh/attention-span/contents/LICENSE?ref=0.7'


# --- attention-kind --- alexgreensh/attention-span, AGPL-3.0 ----------------

echo "==> attention-kind"
pull attention-kind/SKILL.md \
  'repos/alexgreensh/attention-span/contents/output-styles/attention-kind.md?ref=0.7'
pull attention-kind/LICENSE \
  'repos/alexgreensh/attention-span/contents/LICENSE?ref=0.7'


# --- humanizer --- blader/humanizer, MIT ------------------------------------

echo "==> humanizer"
pull humanizer/SKILL.md \
  'repos/blader/humanizer/contents/SKILL.md?ref=e2e92e7b4b8229253ed5c8e81dc65463fdeddda5'
pull humanizer/LICENSE \
  'repos/blader/humanizer/contents/LICENSE?ref=e2e92e7b4b8229253ed5c8e81dc65463fdeddda5'


# --- what landed ------------------------------------------------------------

echo
echo "fetched:"
ls -l attention-spartan/SKILL.md attention-spartan/LICENSE \
      attention-rundown/SKILL.md attention-rundown/LICENSE \
      attention-kind/SKILL.md    attention-kind/LICENSE \
      humanizer/SKILL.md         humanizer/LICENSE

echo
echo "no-slop-writing: local, not fetched."
echo "Upstream can change wording at any time. Read the diff before committing:"
echo "  git diff -- ynoslop/skills/"
