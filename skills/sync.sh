#!/usr/bin/env bash
#
# Fetch the third-party skills that ynoslop vendors, from their upstream repos.
#
#   ./skills/fetch-upstream.sh
#
# Needs the GitHub CLI, authenticated — check with `gh auth status`. Using gh
# rather than curl means the request carries your token: higher rate limits,
# and a real error message instead of an HTML 404 page.
#
# One `gh api` call per file, written to skills/<name>/SKILL.md. Upstream
# already ships YAML frontmatter (name, description), so this is a byte copy —
# nothing is rewritten or generated.
#
# Every ref below is PINNED, and that is the point. ynoslop compares recordings
# made months apart, so the skill text has to be a fixed thing; `?ref=main`
# would let upstream silently reword a skill and invalidate every recording
# made against the old wording, with nothing on disk to show it happened.
# Bumping a skill is a deliberate edit to this file — do it, re-run, read the
# diff, and expect to re-record that skill's evals.
#
#   attention-span   tag 0.7 = 8a0a776
#   humanizer        e2e92e7 (SKILL.md metadata.version 2.11.2; no tag exists)
#
# Each file lands as .tmp and is moved into place only on success, so a moved
# upstream path can never leave a zero-byte skill behind for composePrompt()
# to paste into a prompt as an empty <instructions> block.
#
# Two of these skills are AGPL-3.0, so each folder also gets the upstream
# LICENSE next to the text it covers.
#
# no-slop-writing is deliberately NOT here: it has no upstream, it is written
# in this repo. Running this never touches it.
#
# Verified 2026-08-22: both repos on branch main, all four paths resolve.

set -euo pipefail

# Resolve skills/ from this script's own location, so the cwd does not matter.
cd "$(dirname "$0")"

# Without this header the contents API returns base64 wrapped in JSON.
RAW='Accept: application/vnd.github.raw'


# --- attention-spartan --- alexgreensh/attention-span, AGPL-3.0 -------------

echo "==> attention-spartan"
mkdir -p attention-spartan

gh api -H "$RAW" 'repos/alexgreensh/attention-span/contents/output-styles/spartan.md?ref=0.7' \
  > attention-spartan/SKILL.md.tmp
mv attention-spartan/SKILL.md.tmp attention-spartan/SKILL.md

gh api -H "$RAW" 'repos/alexgreensh/attention-span/contents/LICENSE?ref=0.7' \
  > attention-spartan/LICENSE.tmp
mv attention-spartan/LICENSE.tmp attention-spartan/LICENSE


# --- attention-rundown --- alexgreensh/attention-span, AGPL-3.0 -------------

echo "==> attention-rundown"
mkdir -p attention-rundown

gh api -H "$RAW" 'repos/alexgreensh/attention-span/contents/output-styles/rundown.md?ref=0.7' \
  > attention-rundown/SKILL.md.tmp
mv attention-rundown/SKILL.md.tmp attention-rundown/SKILL.md

gh api -H "$RAW" 'repos/alexgreensh/attention-span/contents/LICENSE?ref=0.7' \
  > attention-rundown/LICENSE.tmp
mv attention-rundown/LICENSE.tmp attention-rundown/LICENSE


# --- humanizer --- blader/humanizer, MIT ------------------------------------

echo "==> humanizer"
mkdir -p humanizer

gh api -H "$RAW" 'repos/blader/humanizer/contents/SKILL.md?ref=e2e92e7b4b8229253ed5c8e81dc65463fdeddda5' \
  > humanizer/SKILL.md.tmp
mv humanizer/SKILL.md.tmp humanizer/SKILL.md

gh api -H "$RAW" 'repos/blader/humanizer/contents/LICENSE?ref=e2e92e7b4b8229253ed5c8e81dc65463fdeddda5' \
  > humanizer/LICENSE.tmp
mv humanizer/LICENSE.tmp humanizer/LICENSE


# --- what landed ------------------------------------------------------------

echo
echo "fetched:"
ls -l attention-spartan/SKILL.md attention-spartan/LICENSE \
      attention-rundown/SKILL.md attention-rundown/LICENSE \
      humanizer/SKILL.md         humanizer/LICENSE

echo
echo "no-slop-writing: local, not fetched."
echo "Upstream can change wording at any time — read the diff before committing:"
echo "  git diff -- ynoslop/skills/"
