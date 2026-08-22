# ynoslop — product requirements

Status of this document: the agreed target. Where the code has not caught up
yet, the Status section at the bottom says so. Companion document:
`DESIGN.md` (visual and interaction spec). Component guide for contributors:
`AGENTS.md`.

## Problem

Skills — reusable instruction files handed to a coding agent — are supposed to
make its output better. Nobody on the team can currently show that, and nobody
can say which model actually obeys a skill and which ignores it. The evidence
today is anecdotal: someone remembers that a prompt "felt better" with a skill
attached. That is not enough to decide which skills to maintain, which to
delete, or which model to route a writing task to.

Two specific questions go unanswered:

1. Does this skill change the output, and how?
2. Does this model follow the skill, or only appear to?

## Who this is for

- **Primary: the author**, evaluating skills and models. This is an evaluation
  bench first. Density is acceptable; guesswork is not.
- **Secondary: colleagues** shown the comparison to settle an argument about
  whether skills matter. They need the difference to be legible in about ten
  seconds, without vocabulary training.

Not built for: end users of any product, external publication, or unattended
operation.

## The model

One prompt is answered twice by the same model — once **without** a skill
(`baseline`), once with the skill text prepended (`skilled`) — and the two
answers are put next to each other with measurements. An eval may name more
than one skill, in which case the skilled variant gets all of them, in order;
naming none makes the pair a control.

**Three inputs**, each one pane: `prompt` (the ask), `skill` (the instruction
text, every skill the eval names), `context` (project content the model needs —
code, a diff, notes).

**Two outputs**: baseline and skilled.

**Three ways to read them**: side by side, unified diff, statistics.

Everything else in the product exists to serve that comparison.

## Vocabulary

One word per thing, on disk and on screen:

| Word | Means |
|---|---|
| eval | `evals/<slug>/` — one prompt, its inputs, and its recordings |
| skill | `skills/<slug>/SKILL.md` — the instruction text under test |
| variant | `baseline` (no skill) or `skilled` (the eval's skills prepended) |
| target | one `{runner, model, runs}` — a cell to fill |
| run set | `runs/<key>/` — every sample for one target on one eval |
| sample | `runs/<key>/<n>/` — one baseline+skilled pair |
| suite | a named list of targets plus plan options, from the root `suites.json` |

**Samples are designed, not built.** Targets and suites now exist: `suites.json`
names run plans and `--suite` / `make eval:<name>` runs them. A run set still
holds exactly one pair, so a target's `runs` must be 1 and there is no
`runs/<key>/<n>/` layer. The word is fixed now so the requirements below and
`DESIGN.md` can use it without drifting; nothing in this document claims it
exists.

Samples are the gap worth naming: every number the product shows is n=1, so a
skill's effect currently cannot be told apart from a sampling accident.

## Surfaces

1. **Eval inspector** (read-only). A library of prepared comparisons, one
   folder per eval. Shows the three inputs, the recorded pair of outputs,
   their metrics with a single net-metric verdict, and — where a judge has run —
   its scores. Nothing runs here; recordings are produced by the eval harness.
2. **Model comparison**. One table: run sets down the side, evals across the
   top, cells showing judge score, characters, or slop-word count. This is the
   answer to "which model follows the skill".
3. **The eval harness** (`make eval`). The only surface that spawns a model, and
   it is a command line, not a page. Which cells it fills comes from a named
   suite; `make plan:<suite>` shows the same matrix and the number of billed
   calls without making any. `make assemble` then publishes what it recorded
   into the static site.

## Requirements

Functional, testable, numbered for reference in review.

**F1 Evals are files.** An eval is a directory: `eval.json`, `prompt.md`,
optional `context/` files, and recorded runs under `runs/<runner>--<model>/`.
`eval.json` carries `title`, `category`, `description` and a `skills` array,
plus an optional `runs` count; it never names a runner, because which runners
and models an eval is recorded against is a run plan, not a property of the
eval. Adding or editing an eval must never require a code change. Nothing in
the directory may restate a measurement.

**F2 Skills are folders.** `skills/<slug>/SKILL.md`, referenced by slug from an
eval's `eval.json:skills` array, following the Agent Skills convention.
Vendored skills also carry their upstream `LICENSE`. Upstream frontmatter
(`name`, `description`) is stripped before composition, so it never reaches the
model and never counts toward the reported skill size. Skills are always
shared: there is no per-eval override, because a skill inside one eval folder
cannot be compared across evals. An eval may name several, and they compose in
declared array order into the one instruction block; naming none makes both
variants identical, which is a control run rather than an error.

**F3 Recordings are per runner and model.** The run-set key is
`<runner>--<slugified-model>`; hand-written seed content uses the literal key
`fixture`. Each set holds `baseline.md`, `skilled.md`, and optionally
`scores.json`. Every run file carries a header naming the runner, the model and
the timestamp.

**F4 The composed prompt is identical in structure everywhere.** Skill block
(skilled variant only) → one context block per file → prompt. One composition
function, so every recording is comparable to every other.

**F5 Metrics are deterministic and computed on read.** Lines, characters,
words, slop-word hits, emoji, bullets, headings, exclamations, em dashes, and
the top matching slop terms. No model is involved. They are never stored in the
run files, so changing the lexicon re-scores history for free.

**F6 The judge is optional and separate.** An LLM scores puffery, filler and
concreteness 1–5 per variant and writes `scores.json`. It always runs on one
fixed model so scores stay comparable across the models being judged. Its
absence never blocks anything.

**F7 Recording uses the user's own CLIs.** `claude`, `opencode`, `codex`,
invoked non-interactively with an explicit model flag. A missing binary is
skipped with a warning rather than failing the run matrix.

**F8 Models are whitelisted.** `models.json` lists the permitted model strings
per runner. Model strings reach a command line, so anything not listed is
rejected — from a `suites.json` target exactly as from `--model`. Adding a model
is a file edit, not a code change.

**F9 The harness works offline.** `make stats` prints the baseline-vs-skilled
table for everything already recorded, and `make plan:<suite>` prints the run
matrix and its billed-call total, both with no binary installed, no network and
nothing spent.

**F11 The site is static.** The browser gets `public/`: `index.html`, `app.js`,
`style.css` and one generated `data.json`. No server, no API, no build step. It
must render every recording on disk with no binary installed and no network.

**F12 The published data cannot silently drift.** `make assemble` is the only
writer of `data.json`, its output is deterministic, and `make check`
re-assembles and fails if the committed file no longer matches the recordings.

**F13 Run plans are named and are files.** `suites.json` holds named suites: a
list of `{runner, model, runs}` targets plus plan-level options, today only
`judge: true`. `--suite <name>` replaces target selection and `--runner` filters
the chosen suite; naming a suite alongside `--model` or `--all-models` is an
error, since those also choose targets. Adding a suite is a file edit, not a
code change, and `make eval:<name>` works the moment it exists. Anything under
`eval:*` spends money; `plan:*` and `stats` never do.

## Data on disk

```
models.json                          {runner: [model, ...]} — the allowed model strings
suites.json                          named run plans: targets + plan options
skills/<slug>/SKILL.md               shared skill text (+ LICENSE where vendored)
evals/<slug>/
├── eval.json                        {title, category, description, skills[]} (+ optional runs)
├── prompt.md                        the ask, identical for both variants
├── context/                         optional — project files the model sees
└── runs/
    ├── fixture/                     hand-written seed pair, no model behind it
    │   ├── baseline.md
    │   └── skilled.md
    └── claude--haiku/
        ├── baseline.md
        ├── skilled.md
        └── scores.json              optional, from the judge
```

## Published data

One generated file, `public/data.json`, written by `make assemble` and read by
the page. No API exists.

| Key | Purpose |
|---|---|
| `evals` | the explorer list, with each eval's skill slugs and the run-set keys present on disk |
| `details` | per slug: config, prompt, skill, context, run sets with metrics and scores |
| `scores` | every run set with metrics and, where judged, scores — the comparison table |

## Constraints

- **Local, single user, no authentication** — and now nothing to authenticate:
  the browser talks to a static file, and the only privileged thing in the
  component is a CLI the user runs themselves.
- **A run costs real money on the user's account.** Every `make eval` run is a
  billed call through their own CLI credentials, which is why re-running is a
  deliberate command and not a button. The boundary is drawn in the command
  names: anything under `eval:*` spends, everything else — `plan:*`, `stats`,
  `assemble`, `check`, `serve` — does not.
- **Zero runtime dependencies**, no build step. Bun plus the standard library
  for the tooling, vanilla ES modules in the browser.
- **Not wired into Copybara.** Present in the ynfra monorepo, no split remote
  yet. Note before publishing: `skills/attention-spartan/` and
  `skills/attention-rundown/` are AGPL-3.0 (from `alexgreensh/attention-span`)
  and `skills/humanizer/` is MIT (from `blader/humanizer`); each folder ships
  the upstream `LICENSE`. Only `no-slop-writing` is ours.

## Non-goals

A server of any kind. Authentication or multi-user support. A hosted or shared
deployment. A database. Multi-turn chat. Running a model from the browser, or
editing recordings there. A public sandbox (JSFiddle/CodeSandbox-style
sharing). Automatic skill authoring. Any claim that the judge's score is ground
truth.

## Success criteria

1. A colleague looking at one eval for ten seconds can say what the skill
   changed, without being taught the vocabulary.
2. The author can answer "which model follows this skill" from one table,
   without reading any output.
3. Adding an eval, or a model, requires no code change.
4. `make stats` gives a comparable number for every recording with nothing
   installed, and `make plan:<suite>` prices a run before it happens.

## Known limitations

- **Trivial prompts show nothing.** A one-line answer has no slop to cut, so
  the metrics separate models only on tasks with room to be verbose. Evals
  must be chosen accordingly.
- **Metric direction is not universal.** Fewer emoji is usually better, but the
  `attention-rundown` skill mandates status emoji, so `standup-update` correctly
  goes 2 → 8. Deltas are colored lower-is-better and must be read with the
  skill in mind.
- **Judge scores are one model's opinion**, on a three-axis rubric, and drift
  with the judge model.
- **Runner output is raw stdout.** `opencode` and `codex` print progress noise
  that inflates character counts relative to `claude -p`.
- **Every recording is n=1.** One baseline and one skilled run per target, so a
  delta can be the skill or can be the draw. Samples (above) are the fix and
  are not built, which is why every `runs` a suite or an eval may state is
  pinned to 1.

## Status

Built and verified: evals with per-model run sets, deterministic metrics,
the judge, the model comparison table, the offline `make stats` table, named
suites of targets in `suites.json` with their `make eval:<suite>` /
`make plan:<suite>` entry points, skills as a composable array per eval, the
three output views including the unified diff, line numbers on read-only panes,
the non-judgmental pane tints, the full-width input stack above the outputs, and
the summary band with its net-metric number.

Removed on purpose, not lost to neglect:

- **The server and the playground.** `make eval` records, `make assemble`
  publishes `public/data.json`, and the page is static — no HTTP API, no run
  control, no browser-side model call. What went with them is trying a skill on
  your own text in the browser; `composePrompt()` still makes that comparable
  to a recording, so a CLI equivalent stays possible.
- **`usage.md`, and the idea behind it (was F10).** Hand-written prose next to
  the recordings quoted exact character counts from runs that `make eval`
  overwrites, so it went stale with no signal that it had. The intent lives in
  `eval.json:description`; every number comes from the recordings.
- **The per-eval `skill.md` override.** A skill in one eval folder cannot be
  compared across evals, which is what the skill library is for.
- **`eval.json:defaultRunner`.** Suites choose runners, and a per-eval default
  runner was a strictly weaker way of saying the same thing — one cell, spread
  across eight files, that could disagree with the plan actually being run.
  Bare `make eval` means the `default` suite.

Designed, not built: samples under a run set (`runs/<key>/<n>/`) — see
Vocabulary. `runs` therefore has to be 1 wherever it is written, in a
`suites.json` target or in `eval.json:runs`, and one guard in `src/suites.ts`
enforces it for both, so lifting the limit is a single edit.

Pending mechanical work: `src/` and the on-disk folder still carry the old
names (`example`, `config.json`, `skills/<slug>.md`, the `placeholder` key).
The vocabulary in this document is the target; renaming is a rename, not a
requirement change.

Open questions: whether the default landing view should serve the evaluator or
the person being convinced (see `DESIGN.md`), whether emoji should be exempted
from the delta coloring per skill, and whether the net-metric number should be
weighted.
