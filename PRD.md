# ynoslop — product requirements (v1, historical)

> **Stale — describes v1.** The static site, `make eval`, `suites.json` and
> `models.json` were replaced by the `bin/run` → `bin/judge` → `bin/collect`
> pipeline; `README.md` is current. This file is kept for two things — the
> problem statement and the decision history. Read it for *why*, never for
> *how*. Companion of the same era: `DESIGN.md`.

## Problem

**Nobody could show what a skill does, or which model obeys one.** Skills —
reusable instruction files handed to a coding agent — are supposed to make
its output better. The evidence was anecdotal: someone remembered that a
prompt "felt better" with a skill attached. Not enough to decide which skills
to maintain, which to delete, or which model to route a writing task to.

Two questions to answer:

1. **Does this skill change the output**, and how?
2. **Does this model follow the skill**, or only appear to?

## Who this is for

- **Primary: the author**, evaluating skills and models. An evaluation bench
  first — density is acceptable, guesswork is not.
- **Secondary: colleagues** shown a comparison to settle whether skills
  matter. The difference must be legible in about ten seconds, without
  vocabulary training.

Not built for: end users of any product, external publication, or unattended
operation.

## The core model (survives in v2)

One prompt, answered twice by the same model — once without a skill, once
with the skill text prepended — and the two answers put next to each other
with measurements. An eval may name several skills (composed in declared
order) or none (a control pair). Everything else exists to serve that
comparison.

## What v1 was

A static site (`public/`: `index.html`, `app.js`, `style.css`, one generated
`data.json`) over recordings made by `make eval`, with `models.json` as the
model whitelist and `suites.json` naming run plans (`make eval:<suite>`,
priced beforehand by `make plan:<suite>`). Thirteen numbered requirements
pinned it down; the full spec lives in this file's git history. The ideas
that carried into v2:

- **Evals are files** — adding or editing one never requires a code change,
  and nothing in an eval directory may restate a measurement.
- **Models are whitelisted**, because model strings reach a command line.
- **Metrics are deterministic and computed on read** — never stored, so
  changing the lexicon re-scores history for free.
- **The judge is optional, separate, and pinned to one model** so its scores
  stay comparable across the models being judged.
- **Everything but recording is offline and free.** A run bills the user's
  own CLI credentials, so the spend/free boundary is drawn in the command
  names and re-running is a deliberate command, never a button.
- **Published data cannot silently drift** — one deterministic writer, plus a
  check that fails when the committed output no longer matches recordings.

## Decisions — removed on purpose, not lost to neglect

- **The server and the playground.** Recording became a CLI and publishing a
  static file: no HTTP API, no run control, no browser-side model call. What
  went with them was trying a skill on your own text in the browser; one
  shared prompt-composition function keeps a CLI equivalent possible.
- **`usage.md` (was F10).** Hand-written prose next to the recordings quoted
  exact character counts from runs that get overwritten, so it went stale
  with no signal that it had. The intent lives in the eval description; every
  number comes from the recordings.
- **The per-eval `skill.md` override.** A skill inside one eval folder cannot
  be compared across evals, which is what the shared skill library is for.
- **`eval.json:defaultRunner`.** Run plans choose runners; a per-eval default
  was one cell spread across eight files that could disagree with the plan
  actually being run.

## Designed, never built: samples

**Every recording is n=1** — one bare and one skilled run per model — so a
delta can be the skill or can be the draw. The designed fix is samples:
several pairs per model under `runs/<key>/<n>/`, with every written `runs`
count pinned to 1 by a single guard until built, so lifting the limit is one
edit. The gap still holds in v2.

## Known limitations (still true)

- **Trivial prompts show nothing.** A one-line answer has no slop to cut, so
  evals must leave the model room to be verbose.
- **Metric direction is not universal.** Fewer emoji is usually better, but
  `attention-rundown` mandates status emoji, so `standup-update` correctly
  goes 2 → 8. Deltas are colored lower-is-better and must be read with the
  skill in mind.
- **Judge scores are one model's opinion**, and drift with the judge model.
- **Runner output is raw stdout.** `opencode` and `codex` print progress
  noise that inflates character counts relative to `claude -p`.
- **Every recording is n=1** — see samples above.

## Open questions

- Should emoji be exempted from the delta coloring per skill? (Still applies
  to `bin/results`.)
- Site-only, moot with v1: whether the default landing view should serve the
  evaluator or the person being convinced, and whether the net-metric number
  should be weighted.
