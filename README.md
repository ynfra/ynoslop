# ynoslop

An inspector for what agent skills do to AI output quality. Each **eval** pairs
one prompt answered twice by the same model — **without** its skills
(`baseline`) and **with** them prepended (`skilled`) — and shows the exact
inputs, both responses, and deterministic metrics over them. Recordings are
kept per runner **and** model, so the same view answers the second question:
which model actually follows the skill.

Everything can be inspected offline — the prompt, the skill, the `context/`
files the model saw, the outputs, and the metrics (lines, chars, words,
slop-lexicon hits, emoji, bullets, headings).

There are two moving parts and no server:

- **`make eval`** spawns your AI CLIs and writes recordings. The only thing
  here that calls a model, and the only writer of `runs/`.
- **`make assemble`** walks the disk store and writes one `public/data.json`.
  The only bridge between disk and browser.

`public/` is then a static site — it fetches `data.json`, runs nothing, writes
nothing, and needs no binaries. Any file server hosts it.

> **Status.** The folder and file structure below is what is on disk and what
> `src/` reads. One thing named here is designed but **not built**: multiple
> samples per run set (`runs/<key>/<n>/`), marked where it appears. A run set
> holds exactly one baseline+skilled pair today, so `runs` must be 1
> everywhere and every number the site shows is a single draw.

## Run

```bash
bun install
make assemble      # evals/ + skills/ + runs/ → public/data.json
make serve         # http://127.0.0.1:4321
```

Pick an eval, read the inputs, compare the two panes and their metrics. Nothing
in the browser spawns a model — to refresh a recording, run `make eval`.

## Eval structure

An eval is a folder. It holds the inputs a model was given, and the outputs it
produced, and nothing else. Adding or editing one must never require a code
change.

### Folder structure

```
evals/<slug>/
├── eval.json                 # required — identity and which skills to apply
├── prompt.md                 # required — the ask, identical for both variants
├── context/                  # optional — flat files the model sees
│   ├── changes.diff
│   └── notes.md
└── runs/                     # optional — recordings, written by `make eval`
    ├── fixture/              #   hand-written seed pair, no model behind it
    │   ├── baseline.md
    │   └── skilled.md
    └── claude--haiku/        #   one directory per runner+model
        ├── baseline.md
        ├── skilled.md
        └── scores.json       #   optional, written by `--judge`
```

The smallest valid eval is two files:

```
evals/research-summary/
├── eval.json
└── prompt.md
```

It loads, it composes, it just has no recordings yet and no context.

**Naming rules.** `<slug>` must match `^[a-z0-9-]+$`; a directory that does not
is ignored by the store, silently. Run-set directory names must match
`^[a-z0-9.-]+(--[a-z0-9.-]+)?$` for the same reason — both become path
components. The slug is the eval's identity: it is the key in `data.json`, the
argument to `make eval ARGS="--eval <slug>"`, and it never appears in the
composed prompt.

**What is deliberately absent.** No per-eval prose file. An earlier `usage.md`
held a hand-written narrative quoting exact character counts from the
recordings — which `make eval` overwrites, leaving the prose describing a run
that no longer exists. The one-line `description` in `eval.json` carries the
intent; the numbers come from the recordings, live. Nothing in an eval folder
may restate a measurement.

**No generated files.** Metrics are computed on read and never stored in the
folder. Only `runs/` is machine-written. Everything above `runs/` is
hand-authored and hand-owned.

### `eval.json`

Four required fields and one optional, no others read:

```json
{
  "title": "Release notes",
  "category": "documentation",
  "description": "Write v2.1.0 release notes from raw changes",
  "skills": ["no-slop-writing"]
}
```

| Field | Type | Meaning |
|---|---|---|
| `title` | string | Display name in the explorer and workspace header. Sentence case. |
| `category` | string | Explorer grouping. In use: `code`, `documentation`, `research`, `writing`. A new value creates a new group — there is no registry. |
| `description` | string | One line, under ~60 chars, no trailing period. Says what the model is asked to do, not what the skill achieves. |
| `skills` | string[] | Slugs, each resolved against `skills/<slug>/SKILL.md` and nowhere else. Validated as slugs before they become path components. Multiple skills compose: the bodies are concatenated in declared array order, separated by a blank line, into the single `<instructions>` block. `[]` means no skill — both variants run bare and the eval is a control. |
| `runs` | number, optional | Samples to record per target **for this eval**, overriding the suite's per-target `runs`. Absent is the common case and means "however many the suite asked for". Pinned to 1 today, because samples are not built. |

Which runners and models an eval is recorded against is not an eval-level
question — suites answer it, see below. There is no per-eval default runner.

The file is read as plain JSON with no schema validation, so a typo in a field
name is a missing field, not an error. Unknown keys are ignored and are the
place to leave a note to yourself.

### `prompt.md`

The ask, verbatim, in markdown. It is the last block of the composed prompt and
identical in both variants — the two runs must differ **only** by the skill.

No frontmatter, no metadata header, no title heading. Leading and trailing
whitespace is trimmed on read. Fenced code blocks are fine and used by several
evals to carry structured input inline; anything longer than a screen belongs
in `context/` instead.

Write it as you would type it to an agent. If it refers to a file by name
(`retry.ts`, `changes.diff`), that file must exist in `context/` under exactly
that name, because the name is what the model sees in the context block.

### `context/`

Flat text files that are part of what the model saw — code, a diff, notes.
Optional; an eval without the directory composes to skill plus prompt.

- Read **non-recursively**. Subdirectories are skipped.
- Dotfiles are skipped.
- Files over **64 KB** are skipped with a `WARN`, never truncated.
- Sorted by filename, and that order is the order of the composed blocks.
  `composePrompt()` does not re-sort, so **renaming a context file changes the
  composed prompt** and invalidates comparability with every earlier recording.
- Context goes into **both** variants. It is input, not skill.

Each file becomes `{name, text, lines, chars}`; the filename is the `path`
attribute the model sees.

### `runs/<key>/`

One directory per **run set**: both variants as produced by the same
runner+model, plus the judge's scores. Written by `make eval` and by nothing
else; git history is the archive of previous runs.

The key is `` `${runner}--${modelSlug}` `` where
`modelSlug = model.toLowerCase().replace(/[^a-z0-9.-]+/g, "-")`. So
`anthropic/claude-opus-5` on opencode becomes
`opencode--anthropic-claude-opus-5`, and `haiku` on claude becomes
`claude--haiku`. Hand-written seed pairs use the literal key `fixture`, which
sorts first everywhere and marks content no model produced.

**`baseline.md` and `skilled.md`** are raw stdout under YAML frontmatter, the
same shape `skills/<slug>/SKILL.md` uses:

```
---
runner: opencode
model: github-copilot/claude-haiku-4.5
variant: skilled
recorded: 2026-08-22T08:50:50.123Z
ms: 4378
skills: [attention-spartan]
---

Fix off-by-one in pagination and clarify variable names
...
```

`runner`, `model`, `variant` and `recorded` are always written; `ms` is the
spawn's wall-clock time; `skills` records which skills were composed into the
prompt. That last one matters more than it looks: skill text drifts — upstream
reworded `attention-spartan` after it was vendored here — and a recording that
cannot say what it read cannot honestly be compared with a later one.

Parsing is flat `key: value` lines plus the one inline `[a, b]` list, done by
hand because the component has no runtime dependencies. Unknown keys are
ignored, so the writer can gain a field before the reader cares about it.

The header is parsed and stripped by `src/store.ts`; the rest is the response,
trimmed. When hand-writing a `fixture` pair, keep the header on line one and
write `runner: fixture | model: -`. Headers with no `model:` field still parse,
with an empty model. A file with no header at all parses as
`runner: unknown`.

Both variants are optional and independent — a run set with only `skilled.md`
is valid and shows one pane. Metrics are recomputed from the text on every
read, so they can never drift from it, and editing a recording by hand changes
the numbers with no further step.

**`scores.json`** is optional, LLM-produced, and stored rather than derived —
the opposite of metrics. Written by `make eval ARGS="--judge"`, only for run
sets that have both variants:

```json
{
  "baseline":  { "puffery": 5, "filler": 4, "concreteness": 5 },
  "skilled":   { "puffery": 5, "filler": 5, "concreteness": 5 },
  "verdict": "Both are concrete and free of puffery, but …"
}
```

Scores are 1–5, higher is better — the inverse of every metric, which is why
the stats view states the direction. A malformed `scores.json` is reported as
absent rather than failing the load.

### How the files compose

`composePrompt()` in `src/run.ts` is the single place the folder becomes a
prompt. Blocks in exactly this order, joined by blank lines:

```
<instructions>                       skilled variant only
…skills/<slug>/SKILL.md, frontmatter stripped…
…the next skill's body, blank line between…
</instructions>

<context path="changes.diff">        one block per context/ file,
…file text…                          in filename order
</context>

<context path="notes.md">
…file text…
</context>

…prompt.md…
```

Every slug in `eval.json:skills` contributes one body to that one block, in
array order, so reordering the array changes the composed prompt and
invalidates comparability with earlier recordings. An empty `skills` array
emits no block at all, which makes both variants byte-identical and the eval a
control.

The wrapper tag stays `<instructions>` on purpose. It is model-facing, it reads
as the clearer signal to an LLM than `<skill>` would, and renaming it would
break comparability with every existing recording. This is the one place the
product's vocabulary and the wire format disagree.

With no context files the composed prompt is byte-identical to the plain
skill-plus-prompt form, so evals that gain a `context/` directory later are the
only ones whose earlier recordings stop being comparable.

### Adding an eval

1. `mkdir evals/<slug>` — slug must match `^[a-z0-9-]+$`.
2. Write `eval.json` and `prompt.md`.
3. Add `context/` files if the prompt names any, using the exact filenames.
4. `make eval ARGS="--eval <slug>"`, or hand-write `runs/fixture/` to seed it.
   Which runner and model that records against comes from the suite, not the
   eval.
5. `make assemble` (implied by `make eval`) and reload the site.

Nothing in `src/` changes. If it does, the eval structure was the wrong shape
for what you were trying to show.

## Skills

A skill is a folder: `skills/<slug>/SKILL.md`, the Agent Skills convention, so
a folder here drops into an agent's skills directory unchanged. Skills are
shared across evals and referenced by slug from `eval.json:skills` — there is
no per-eval override, because a skill living inside one eval folder cannot be
compared across evals. An eval may name several, and they compose in array
order into one `<instructions>` block. Four are bundled:

| Slug | What it enforces |
|---|---|
| `no-slop-writing` | Bans puffery, filler phrases and vague claims; concrete claims only |
| `attention-spartan` | Line one is the whole answer; a deliverable ships bare |
| `attention-rundown` | One-line TL;DR, status as a marked checklist, blockers flagged |
| `humanizer` | The patterns catalogued in Wikipedia's "Signs of AI writing" |

Three are vendored from upstream and carry the upstream `LICENSE` in their
folder: `attention-spartan` and `attention-rundown` are AGPL-3.0 from
`alexgreensh/attention-span`, `humanizer` is MIT from `blader/humanizer`. Worth
knowing before publishing this component. `no-slop-writing` is written here and
has no upstream.

`./skills/fetch-upstream.sh` re-fetches the three vendored ones via `gh api`,
every ref **pinned** — `attention-span` at tag `0.7`, `humanizer` at `e2e92e7`.
That is deliberate: an unpinned fetch would let upstream reword a skill and
silently invalidate every recording made against the old wording. Bumping a
skill is an edit to that script, and it means re-recording that skill's evals.
It never touches `no-slop-writing`.

Upstream `SKILL.md` files open with YAML frontmatter (`name`, `description`,
sometimes `license` and loader keys like `keep-coding-instructions`). It is
stripped on read, so it never reaches the model inside `<instructions>` and
never counts toward `skillInfo`. The frontmatter `name` need not match the
folder — upstream ships `name: Spartan` in `skills/attention-spartan/` — because
resolution is by directory name only.

## Models

`models.json` at the component root lists the models each runner may be asked
for:

```json
{
  "claude": ["opus", "sonnet", "haiku"],
  "opencode": ["anthropic/claude-opus-5", "anthropic/claude-sonnet-5", "anthropic/claude-haiku-4-5", "openai/gpt-5.5"],
  "codex": ["gpt-5.5", "gpt-5.5-codex"]
}
```

Add or remove models by editing this file — no code change. It is also the
security boundary: model strings become CLI argv, so `executeRun()` rejects any
model the file does not list for that runner. The first entry of a runner's
list is the eval default.

## Suites

`suites.json` at the component root holds named run plans — which runners and
models an eval is recorded against:

```json
{
  "default": {
    "targets": [
      { "runner": "claude", "model": "haiku", "runs": 1 }
    ]
  },

  "full": {
    "judge": true,
    "targets": [
      { "runner": "claude", "model": "opus", "runs": 1 },
      { "runner": "claude", "model": "sonnet", "runs": 1 },
      { "runner": "claude", "model": "haiku", "runs": 1 },
      { "runner": "opencode", "model": "openai/gpt-5.5", "runs": 1 },
      { "runner": "codex", "model": "gpt-5.5", "runs": 1 }
    ]
  }
}
```

A **target** is one `{runner, model, runs}` cell. A **suite** is a named list of
targets plus plan-level options — currently just `judge: true`, which turns the
judge on for that suite, so `make eval:full` needs no extra flag.

`src/suites.ts` loads and validates the file. Every target's model is checked
against `models.json` exactly as `--model` is, because these strings become CLI
argv: `suites.json` names a matrix, it is not a way around the whitelist.

`runs` must be 1 — samples are not built. `src/suites.ts` exports one
`runsProblem()` guard that both `suites.json` targets and `eval.json:runs` go
through, so the limit lifts in a single edit once `runs/<key>/<n>/` lands.

Adding a suite to the file makes `make eval:<name>` work with no Makefile edit:
the recipes are escaped-colon pattern rules (`eval\:%`, `plan\:%`), verified on
GNU Make 3.81, the macOS default.

## Recording

`make eval` is the only thing that writes recordings. The rule worth
memorising: **anything under `eval:*` spends tokens on your own CLI
credentials, and nothing else here does.**

```bash
make eval                # every eval × both variants, over the `default` suite
make eval:full           # a named suite from suites.json
make plan:full           # the same matrix, printed and not run — type it first
make stats               # metrics of the recordings on disk, offline
```

Flags reach `src/eval.ts` through `ARGS`:

```bash
make eval ARGS="--eval code-comments"                # one eval
make eval:full ARGS="--runner claude"                # filter the suite to one runner
make eval ARGS="--runner opencode --model openai/gpt-5.5 --variant skilled"
make eval ARGS="--all-models"                        # every runner × every model in models.json
make eval ARGS="--judge"                             # score baseline vs skilled via claude
make eval ARGS="--dry-run"                           # print the matrix and the total, run nothing
```

`--suite <name>` replaces target selection; `--runner` then filters the chosen
suite down to that runner. `--suite` together with `--all-models` or with
`--model` is an error, because both of those also choose targets. An unknown
suite name fails and lists the valid ones. Without a suite, `--all-models`
expands the matrix over every runner × model (restricted to `--runner` when
given) and skips runners whose binary is missing. Exit code is 1 if any run or
judge failed.

Eval overwrites `evals/<slug>/runs/<key>/{baseline,skilled}.md` in place.
`--judge` hard-requires the `claude` binary and always runs it with model
`sonnet` — hardcoded, cheap and consistent, so scores stay comparable across
the models being judged. It scores **the run sets this invocation targeted**,
not every run set on disk: the hand-written `fixture` set is seed prose no model
produced, so scoring it buys a meaningless number, and at dry-run time the
targeted sets do not exist yet, so walking the disk under-reported the plan by
exactly the cells about to be filled.

`--dry-run` ends with the bill it avoided:

```
plan: 80 runs + 40 judges = 120 billed calls across 8 evals — nothing was spent
```

`make stats` needs no binaries at all: it reads the recordings on disk and
prints a baseline→skilled comparison, so the effect of a skill is measurable
without another LLM call.

```
eval                run set        lines  chars      words    slop  emoji  Δchars  Δslop
------------------  -------------  -----  ---------  -------  ----  -----  ------  -----
code-comments       fixture        53→24  2174→764   358→129  5→0   1→0    -1410   -5
documentation-page  fixture        39→39  1831→839   282→131  14→0  10→0   -992    -14
```

**Runs are isolated, and the isolation is the load-bearing part.** Each spawn
gets a private empty directory holding blank `AGENTS.md`/`CLAUDE.md` sentinels
and an `opencode.json` that disables every tool, and opencode is invoked with
`--pure` plus `OPENCODE_DISABLE_CLAUDE_CODE*` set. All of it exists to make the
composed prompt the *only* instruction a run receives.

That is not defensive over-engineering. The runners discover instructions by
walking up from the working directory, and they advertise every skill in
`~/.claude/skills` and `~/.agents/skills` for the model to load on its own
initiative. With the plain OS tmpdir as the working directory, a stray
`AGENTS.md` that landed there was read into every run, and recordings came back
citing this monorepo's commit convention — which appears nowhere in any composed
prompt. A contaminated recording looks completely normal: same shape, same
metrics, silently answering a different question.

Because context arrives inline in the composed prompt, no eval needs the model
to read a file, run a command or fetch a URL, so a run is reduced to a pure
completion. `YNOSLOP_WORK_DIR` overrides the directory; setting it to somewhere
you do not control re-opens the hole. A run sends a prompt to your own
CLI under your own credentials and costs tokens. Configuration via `YNOSLOP_*`
env vars, see `.env.example`.

`opencode run` and `codex exec` print progress and tool noise to stdout along
with the answer; `claude -p` prints only the final text. Recorded runs are raw
stdout — pick the runner accordingly.

## Metrics

`src/metrics.ts` scores any text with no LLM involved — same text, same
numbers, every time. Metrics are recomputed whenever a run is read and are
never written into the eval folder, so they cannot drift from the text.

| Field | Meaning |
|---|---|
| `lines` | newline-delimited lines, trailing blank lines ignored |
| `chars` | character count |
| `words` | whitespace-separated words |
| `slopWords` | total hits from the curated slop lexicon (~45 terms) |
| `emoji` | pictographic codepoints |
| `bullets` | bullet or numbered list lines |
| `headings` | markdown heading lines |
| `exclamations` | `!` count |
| `emDashes` | `—` / `–` count |
| `hits` | the lexicon terms that actually appear, most frequent first (max 8) |

The lexicon is exported as `SLOP_LEXICON` and drawn from the rules in
`skills/no-slop-writing/SKILL.md` and `skills/humanizer/SKILL.md` — single words ("delve",
"seamless", "tapestry") match whole words, phrases ("it's important to note",
"at the end of the day", "cutting-edge") match as case-insensitive substrings.

Direction is not universal. Fewer emoji is usually better, but
`attention-rundown` mandates status markers, so `standup-update` correctly goes
2 → 8. Deltas are colored lower-is-better and must be read with the skill in
mind.

## Layout

```
src/config.ts    YNOSLOP_* env → config (dirs, run timeout, work dir)
src/models.ts    models.json → per-runner model whitelist
src/suites.ts    suites.json → named run plans + the runs=1 guard (runsProblem)
src/types.ts     RunnerName/Variant unions + eval and run-set shapes + guards
src/metrics.ts   deterministic text metrics + the slop lexicon (no LLM)
src/store.ts     disk store: list/load evals + context + run sets, write runs/scores
src/runners.ts   CLI adapters (claude -p / opencode run / codex exec) + streaming spawn
src/run.ts       composePrompt (skill + context + prompt) + executeRun
src/eval.ts      headless harness: suite/run matrix + optional claude judge + --stats
src/assemble.ts  disk store → public/data.json (the only disk→browser bridge)
public/          index.html + app.js + style.css + data.json — the static site
models.json      {runner: [model, ...]} — edit to add models, no code change
suites.json      {suite: {judge?, targets: [{runner, model, runs}]}} — named run plans
skills/          <slug>/SKILL.md (+ LICENSE where vendored) + fetch-upstream.sh
evals/           one folder per eval — see Eval structure above
```

`src/eval.ts` and `src/assemble.ts` are the only entry points; everything else
is a library. Nothing in `src/` is reachable from the browser.

`make check` re-assembles and fails if the committed `public/data.json` is out
of date with the recordings — a stale `data.json` is the one way this repo can
lie, since run text and metrics are baked into it.

Part of the `ynfra` monorepo; not yet wired into Copybara — see the root
`AGENTS.md`.
