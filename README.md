# ynfra / ynoslop

Eval bench measuring what agent skills do to model output. Each eval asks one
prompt twice per model — **bare** (no skill) and **skilled** (the skill
prepended) — then deterministic metrics and blind LLM judges compare the pair.
Not wired into Copybara: no remote, no split/import.

## Prerequisites

- [bun](https://bun.sh) (`bun install` once) and the runner CLIs named in
  `config.json` (`claude`, `opencode`, `codex`) signed in — **steps 1–2 spend
  tokens on those credentials**.
- Signed-in `gh`, only for re-fetching vendored skills via `./skills/sync.sh`.

## Usage

```bash
bin/run     [--eval <slug>] [--model <m>]              # step 1: generate (spends eval-model tokens)
bin/judge   [--eval <slug>] [--judge <name>] [--force] # step 2: score (spends judge-model tokens)
bin/collect [--eval <slug>]                            # step 3: assemble result.json — offline, free
bin/results [--eval <slug>]                            # colored viewer — offline, never stale
```

Step 0 is hand-written and offline: the skill under test
(`skills/<slug>/SKILL.md`), the eval (`prompt.md` + optional `context/` +
`eval.json`), and the judge rubric (`judges/<name>.md`; see `judges/slop.md`
for the shape). `make run|judge|collect|results ARGS="…"` wraps the same
binaries; `make typecheck` runs `bunx tsc --noEmit`.

## Evals

| Eval | Skill applied | Description |
|---|---|---|
| `api-error-messages` | `no-slop-writing` | Write CLI error strings for four failure cases |
| `code-comments` | `no-slop-writing` | Comment a TypeScript retry helper |
| `commit-message` | `attention-spartan` | Write a commit message for a small bugfix diff |
| `documentation-page` | `no-slop-writing` | Write a docs page for a small CLI tool |
| `release-notes` | `no-slop-writing` | Write v2.1.0 release notes from raw changes |
| `research-summary` | `no-slop-writing` | SSE vs WebSockets for a dashboard |
| `standup-update` | `attention-rundown` | Turn messy notes into a standup update |
| `wiki-article` | `humanizer` | Encyclopedia article from six dry facts |

An eval is a folder, `evals/<slug>/`. Adding or editing one never requires a
code change.

- **`eval.json` names the skills to apply** — slugs resolving to
  `skills/<slug>/SKILL.md` and nowhere else. Several compose in array order;
  `[]` runs both variants bare, a control. Unknown keys are ignored.
- **`prompt.md` is the task, identical in both variants** — the two runs must
  differ **only** by the skill.
- **`context/` files are inlined into both variants**, sorted by filename.

## How it works

- **`bin/run` records the pair.** It composes the prompt — `<instructions>`
  with the skill bodies (frontmatter stripped; skilled variant only) + one
  `<context>` block per `context/` file + `prompt.md` — spawns the model
  twice, and writes `output.bare.md`, `output.skilled.md` and `run.json`
  under `evals/<slug>/runs/<runner>--<model-slug>/` (model string lowercased,
  anything outside `[a-z0-9.-]` replaced by `-`).
- **`bin/judge` is blind.** The judge model sees each recorded pair as A/B in
  randomized order — never the words "bare"/"skilled". Its JSON reply
  (`{A: {criterion: 1..5, …}, B: {…}, verdict}`, higher is better) is
  de-anonymized into `judge.<name>.json`; the raw verdict stays in
  `judge.<name>.md` as the audit trail.
- **`bin/collect` derives, never generates.** Each `result.json` is the
  `run.json` fields + deterministic per-variant metrics (`lines`, `chars`,
  `words`, `slopWords` from the ~45-term lexicon in `src/metrics.ts`,
  `emoji`, `bullets`, `headings`, `exclamations`, `emDashes`, and `hits` —
  the terms that actually appear, most frequent first, max 8) + fresh judge
  verdicts. Deleting every `result.json` and re-running collect rebuilds
  them byte-identical.
- **`config.json` is the whitelist.** It lists eval models and judges
  (`{runner, model, effort?}`; judges add a `name`, which becomes the
  `judge.<name>.*` filenames, and a rubric `prompt` path — several can
  coexist). Model strings become CLI argv, so nothing unlisted is ever
  spawned.

## Notes

- **Freshness is automatic.** `judge.<name>.json` stores a `hash` of the pair
  as judged: step 2 skips fresh verdicts and re-judges stale ones (`--force`
  re-judges everything); step 3 assembles only fresh ones. Re-judging never
  re-runs; no cleanup step exists anywhere.
- **Never hand-edit `evals/*/runs/`.** Machine-written recordings —
  overwriting destroys data that costs tokens to reproduce.
- **Isolation is load-bearing.** Each spawn runs in a private empty directory
  with blank `AGENTS.md`/`CLAUDE.md` sentinels and every mutating tool
  disabled — a stray instruction file anywhere above the working directory
  silently contaminates every recording (not hypothetical; it happened).
- **Renaming a `context/` file breaks comparability** — it changes the
  composed prompt, so earlier recordings no longer compare.
- **Read delta colors with the skill in mind.** Green means skilled improved,
  but direction is not universal — a skill may mandate emoji. Lower metric
  values are usually better, the inverse of judge scores.
- **Licenses.** Vendored skills are pinned to upstream refs and carry their
  upstream `LICENSE` (`attention-spartan`, `attention-rundown`,
  `attention-kind`: AGPL-3.0; `humanizer`: MIT); `no-slop-writing` is written
  here.

See [AGENTS.md](AGENTS.md) for working conventions and day-2 rules.
