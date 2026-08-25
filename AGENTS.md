# ynoslop — agents guide

Eval bench measuring what agent skills do to model output: one prompt, run
twice per model (bare / skilled), compared by deterministic metrics and blind
LLM judges. `README.md` is the current reference for the pipeline, file
formats, freshness and isolation — read it first.

## Working here

- **`bin/run` and `bin/judge` spend real money** on the local CLI
  credentials. Never invoke them casually. `bin/collect` and `bin/results`
  are offline and free.
- **Never hand-edit `evals/*/runs/`.** Machine-written recordings; treat
  overwriting one as destroying data that costs money to reproduce.
- **A pair must differ only by the skill.** Don't add instruction text
  anywhere a spawned CLI could pick it up — see "Isolation" in the README.
- **`bunx tsc --noEmit` (`make typecheck`) must pass.** There are no tests.
- **`PRD.md` and `DESIGN.md` describe the removed v1 static site**
  (`public/`). They are kept for the problem statement and decision history;
  never implement from them.

Part of the `ynfra` monorepo, split to `git@github.com:ynfra/ynoslop.git`
via Copybara. Commits use the `[ynoslop] message` convention from the root
`AGENTS.md`.
