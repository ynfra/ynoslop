# ynoslop

Measures what agent skills do to model output. Each eval asks one prompt twice
per model — **bare** (no skill) and **skilled** (the skill prepended) — then
deterministic metrics and LLM judges compare the pair.

## Steps

**Step 0 — author.** Hand-written, offline: the skill under test
(`skills/<slug>/SKILL.md`, written or vendored), the eval (`prompt.md` +
`context/` + `eval.json`), and the judge rubric (`judges/<name>.md`).

```bash
bin/run     [--eval <slug>] [--model <m>]              # step 1: generate
bin/judge   [--eval <slug>] [--judge <name>] [--force] # step 2: score
bin/collect [--eval <slug>]                            # step 3: assemble
```

Each `bin/<step>` is a two-line bun shebang delegating to `src/<step>.ts` —
the step names are the public interface, `src/` is implementation.

**`bin/results`** is the viewer — offline, writes nothing, derived live from
the recorded files so it can never show stale numbers. Bare it prints a
colored overview across every recorded run — every pair reads bare→skilled,
deltas colored green when skilled improves — plus a summary; `--eval <slug>`
shows full detail: every
metric, the slop terms hit, per-criterion judge scores, and verdicts.
Direction is not universal — a skill may mandate emoji markers — so read the
colors with the skill in mind.

Step 1 spends eval-model tokens, step 2 spends judge-model tokens. Step 3 is
offline and free: it derives every `result.json` from what steps 1–2 left on
disk and prints the comparison table, so it can rerun anytime. Re-judging never
re-runs; a new eval model never re-judges the old ones.

## Flow

```
STEP 0 — author                     hand-written, offline
───────────────────────────────────────────────────────────────────
skills/<slug>/SKILL.md              the skill under test
evals/<slug>/prompt.md + context/   the task
judges/<name>.md                    the rubric — what to score


STEP 1 — bin/run                    one pass per eval × eval model
───────────────────────────────────────────────────────────────────
skills/<slug>/SKILL.md  ─┐  (skilled variant only)
evals/<slug>/context/*  ─┼─►  composed prompt
evals/<slug>/prompt.md  ─┘         │
                                   ▼  spawn twice (bare / skilled)
                              eval model
                                   │
                     ┌─────────────┼──────────────┐
                     ▼             ▼              ▼
          output.bare.md  output.skilled.md   run.json
                                               (what produced the pair)


STEP 2 — bin/judge                  one pass per recorded pair × judge
───────────────────────────────────────────────────────────────────
output.bare.md + output.skilled.md
                     │  anonymized as A/B, order randomized
                     ▼
judges/<name>.md  ─►  judge model (config.json: model + effort)
   (rubric)                        │
                     ┌─────────────┴──────────────┐
                     ▼                            ▼
            judge.<name>.md              judge.<name>.json
            (raw verdict, audit)         (hash, order, parsed scores)


STEP 3 — bin/collect                offline, no tokens, rerun anytime
───────────────────────────────────────────────────────────────────
output.*.md ─► deterministic metrics ─┐
run.json ────────────────────────────►┼─►  result.json
judge.<name>.json (fresh only) ──────►┘    + comparison table
```

## Configuration

One `config.json` at the component root:

```json
{
  "models": [
    { "runner": "opencode", "model": "github-copilot/claude-haiku-4.5" },
    { "runner": "opencode", "model": "github-copilot/claude-sonnet-5", "effort": "high" }
  ],
  "judges": [
    {
      "name": "sol-max",
      "runner": "opencode",
      "model": "github-copilot/gpt-5.6-sol",
      "effort": "max",
      "prompt": "judges/slop.md"
    }
  ]
}
```

| Field | Type | Meaning |
|---|---|---|
| `models` | object[] | Eval models step 1 records against, one run dir each. Also the whitelist: model strings become CLI argv, and nothing unlisted is ever spawned. |
| `judges` | object[] | The judge panel for step 2. Several can coexist — each writes its own `judge.<name>.md` and its own entry in `result.json`. |

Each model entry:

| Field | Type | Meaning |
|---|---|---|
| `runner` | string | Which CLI spawns it — `opencode` today; the seam where `claude` / `codex` would return. |
| `model` | string | Model string, passed to the runner verbatim (`opencode run -m <model>`). |
| `effort` | string, optional | Reasoning effort: `low` / `medium` / `high` / `max`. Absent means the model's default. |

Each judge entry — the same shape plus identity and rubric:

| Field | Type | Meaning |
|---|---|---|
| `name` | string | Judge identity, `^[a-z0-9-]+$` — becomes the `judge.<name>.md` filename and the key in `result.json:judges`. |
| `runner` | string | Which CLI spawns the judge. |
| `model` | string | The model that scores, passed to the runner verbatim. |
| `effort` | string, optional | Reasoning effort, as above. |
| `prompt` | string | Rubric file the judge scores with, relative to the component root. |

## Eval

An eval is a folder under `evals/<slug>/` (slug: `^[a-z0-9-]+$`). It holds the
inputs a model was given and the outputs it produced, nothing else. Adding or
editing one never requires a code change.

### Structure

```
evals/<slug>/
├── eval.json                  # hand-written — which skills to apply
├── prompt.md                  # hand-written — the task, same for both variants
├── context/                   # optional, hand-written — inlined into the prompt
│   ├── changes.diff
│   └── notes.md
└── runs/<runner>--<model-slug>/  # machine-written — one dir per eval model
    ├── output.bare.md         # step 1 — response without the skill
    ├── output.skilled.md      # step 1 — response with the skill
    ├── run.json               # step 1 — what produced the pair
    ├── judge.<name>.md        # step 2 — raw verdict from judge <name>
    ├── judge.<name>.json      # step 2 — hash, order, parsed scores
    └── result.json            # step 3 — derived from everything above
```

### `eval.json`

```json
{ "skills": ["humanizer"] }
```

| Field | Type | Meaning |
|---|---|---|
| `skills` | string[] | Skill slugs, each resolving to `skills/<slug>/SKILL.md` and nowhere else, validated as slugs before becoming path components. Multiple skills compose in array order into one `<instructions>` block, so reordering the array changes the composed prompt. `[]` means both variants run bare — a control eval, not an error. |

Read as plain JSON, no schema validation. Unknown keys are ignored and are the
place to leave a note to yourself.

### `prompt.md`

The ask, verbatim, in markdown — the last block of the composed prompt and
identical in both variants. The two runs must differ **only** by the skill. If
it names a file (`retry.ts`, `changes.diff`), that file must exist in
`context/` under exactly that name.

### `context/`

Optional flat files the model sees — code, a diff, notes. Read non-recursively,
sorted by filename, inlined into **both** variants (context is input, not
skill). Renaming a context file changes the composed prompt, which breaks
comparability with earlier recordings.

### Composition

The composed prompt is these blocks, in this order, joined by blank lines:

```
<instructions>…skill bodies…</instructions>      skilled variant only
<context path="changes.diff">…</context>         one per context/ file,
<context path="notes.md">…</context>             in filename order
…prompt.md…
```

### `runs/<runner>--<model-slug>/`

One directory per eval model, machine-written by the two steps.
`<model-slug>` is the model string lowercased with anything outside
`[a-z0-9.-]` replaced by `-`, so `github-copilot/claude-haiku-4.5` on opencode
becomes `opencode--github-copilot-claude-haiku-4.5`.

`output.bare.md` and `output.skilled.md` are raw model text, nothing else — no
frontmatter. Everything about how they were produced lives in `run.json`:
`runner`, `model`, `effort`, `skills`, `recorded`, `ms` — exactly the top-level
fields collect copies into `result.json` (schema there).

## Judge

A judge is a config entry (see Configuration) plus a rubric file. Changing what
a judge looks for is a markdown edit, not a code change.

### Structure

```
config.json                    # judge entry: name, model, effort, rubric path
judges/<name>.md               # hand-written — the rubric, what to look for
evals/<slug>/runs/<runner>--<model-slug>/
├── judge.<name>.md            # step 2 — raw verdict, kept for auditing
├── judge.<name>.json          # step 2 — hash, order, parsed scores
└── result.json                # step 3 — fresh verdicts assembled under "judges"
```

### `judges/<name>.md`

The rubric — everything the judge model is told beyond the two responses:

```markdown
You are scoring two AI-written responses to the same prompt for "slop":
puffery, filler, and lack of concreteness. Score each response 1-5 on:

- puffery: 5 = no empty superlatives or marketing tone, 1 = saturated
- filler: 5 = no filler or hedging, 1 = mostly filler
- concreteness: 5 = specific names/numbers/facts, 1 = vague generalities

Reply with ONLY this JSON, no other text:
{"A": {"puffery": n, "filler": n, "concreteness": n},
 "B": {"puffery": n, "filler": n, "concreteness": n},
 "verdict": "<one sentence comparing them>"}
```

The judge is **blind**: it sees the original prompt and the two responses as
anonymous A/B in randomized order — never the words "bare"/"skilled". Step 2
records which was which (`order`) and de-anonymizes when writing scores.

### Judge reply

The reply shape is fixed; only the criteria keys belong to the rubric:

| Field | Type | Meaning |
|---|---|---|
| `A`, `B` | object | One integer 1–5 per criterion (higher is better). The keys are whatever the rubric defines — `puffery`, `filler`, … — but must be identical for A and B. |
| `verdict` | string | One sentence comparing the two responses. |

`judge.<name>.md` is the judge's raw response, kept verbatim so a verdict can
be audited. The parsed scores and verdict, de-anonymized back to bare/skilled
(A/B mean nothing to a reader), land in `judge.<name>.json` together with the
`hash` of the pair as judged and the A/B `order` — exactly the judge-entry
fields collect copies into `result.json` (schema there).

## `result.json`

Written by step 3 only, and fully derived: `run.json` + metrics computed from
the outputs + every fresh `judge.<name>.json`, assembled into the one jq-able
file per run dir. Deleting every `result.json` and re-running collect rebuilds
them byte-identical; nothing else writes it, nobody hand-edits it.

```json
{
  "runner": "opencode",
  "model": "github-copilot/claude-haiku-4.5",
  "skills": ["humanizer"],
  "recorded": "2026-08-22T09:14:03Z",
  "ms": { "bare": 5210, "skilled": 6480 },
  "metrics": {
    "bare":    { "lines": 53, "chars": 2174, "words": 358, "slopWords": 5,
                 "hits": [{ "term": "seamless", "count": 3 }] },
    "skilled": { "lines": 24, "chars": 764,  "words": 129, "slopWords": 0,
                 "hits": [] }
  },
  "judges": {
    "sol-max": {
      "hash": "ab12cd34…",
      "order": "skilled-first",
      "scores": {
        "bare":    { "puffery": 3, "filler": 2, "concreteness": 4 },
        "skilled": { "puffery": 5, "filler": 5, "concreteness": 5 }
      },
      "verdict": "one sentence comparing the two"
    }
  }
}
```

(Metrics abridged above — the full field list is below.)

| Field | Type | Meaning |
|---|---|---|
| `runner` | string | CLI that produced the pair. |
| `model` | string | Eval model that produced the pair. |
| `effort` | string, optional | Reasoning effort the run was spawned with, when set. |
| `skills` | string[] | Skills composed into the skilled prompt, copied from `eval.json` at run time. Stored because skill wording drifts — a recording that cannot say what it saw cannot be compared with a later one. |
| `recorded` | string | ISO-8601 timestamp of step 1. |
| `ms` | object | Wall-clock spawn time per variant: `{ bare, skilled }`. |
| `metrics` | object | Deterministic metrics per variant — same text, same numbers, no LLM. |
| `judges` | object | One entry per judge `name`, written by step 2. `{}` until judged. |

Each metrics entry:

| Field | Type | Meaning |
|---|---|---|
| `lines` | number | Newline-delimited lines, trailing blank lines ignored. |
| `chars` | number | Character count. |
| `words` | number | Whitespace-separated words. |
| `slopWords` | number | Total hits from the curated slop lexicon (~45 terms). |
| `emoji` | number | Pictographic codepoints. |
| `bullets` | number | Bullet or numbered list lines. |
| `headings` | number | Markdown heading lines. |
| `exclamations` | number | `!` count. |
| `emDashes` | number | `—` / `–` count. |
| `hits` | object[] | Lexicon terms that actually appear: `{ term, count }`, most frequent first, max 8. |

Each judge entry (scores are 1–5, higher is better — the inverse of every
metric, where lower is usually better):

| Field | Type | Meaning |
|---|---|---|
| `hash` | string | Hash of the two output files as this judge saw them. |
| `order` | string | `bare-first` or `skilled-first` — which response the judge saw as A. |
| `scores` | object | The judge's A/B reply de-anonymized to `bare`/`skilled`; criteria keys come from the rubric. |
| `verdict` | string | The judge's one-sentence comparison, de-anonymized (A/B → bare/skilled). |

`hash` is the hash of the two output files **as this judge saw them**, stamped
into `judge.<name>.json` at judge time. Later steps compare it against a hash
recomputed from the files on disk: step 2 skips a fresh verdict and re-judges a
stale one (`--force` re-judges everything); step 3 assembles only fresh
verdicts into `result.json` and warns about the rest. A stale verdict cannot
survive an overwritten recording, with no cleanup step anywhere. Being plain
JSON, results are one `jq` away from any table.

## Isolation

Each spawn runs in a private empty directory with blank `AGENTS.md`/`CLAUDE.md`
sentinels and every mutating tool disabled, invoked with `--pure` and the
`OPENCODE_DISABLE_CLAUDE_CODE*` env set. The composed prompt (skill + context +
prompt) must be the **only** instruction a run receives — a stray instruction
file anywhere above the working directory silently contaminates every
recording. Not hypothetical; it happened.

## Skills

`skills/<slug>/SKILL.md`, the Agent Skills convention. Three are vendored with
pinned upstream refs and carry their upstream `LICENSE` (`attention-spartan`,
`attention-rundown`: AGPL-3.0; `humanizer`: MIT) — re-fetch via
`./skills/fetch-upstream.sh`. `no-slop-writing` is written here.

---

Part of the `ynfra` monorepo; not yet wired into Copybara — see the root
`AGENTS.md`.
