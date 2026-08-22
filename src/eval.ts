#!/usr/bin/env bun
// Headless eval harness: regenerate recorded runs per eval × variant ×
// runner+model, optionally score baseline vs skilled with a claude judge.
//
// `--stats` skips running entirely and tabulates the deterministic metrics of
// the recordings already on disk (offline, no binaries needed).
//
//   bun src/eval.ts [--suite <name>] [--runner claude|opencode|codex]
//                   [--model <model>] [--eval <slug>]
//                   [--variant baseline|skilled]
//                   [--judge] [--dry-run] [--all-models] [--stats] [--compose]
//
// --suite names a run plan in suites.json and replaces target selection;
// --runner then filters it. Prefer `make eval:<name>` / `make plan:<name>`.

import { config } from "./config.ts";
import { log, setDebug } from "./log.ts";
import { computeMetrics } from "./metrics.ts";
import { defaultModel, isAllowedModel, modelsFor } from "./models.ts";
import { composePrompt, executeRun } from "./run.ts";
import { isAvailable, spawnRunner } from "./runners.ts";
import { listEvals, loadEval, runSetKey, writeScores } from "./store.ts";
import { runsProblem, suiteFor, suiteNames } from "./suites.ts";
import { RUNNERS, VARIANTS, isRunnerName, isVariant } from "./types.ts";
import type { Target } from "./suites.ts";
import type { EvalSummary, RunSet, RunnerName, Variant } from "./types.ts";

setDebug(config.debug);

// Judging is fixed to one runner+model so scores stay comparable across the
// matrix being judged. It follows models.json: pointing the judge at a runner
// with no models listed would spawn a CLI the whitelist has disabled.
const JUDGE_RUNNER: RunnerName = "opencode";
const JUDGE_MODEL = "github-copilot/claude-sonnet-5";

// With no defaultRunner on an eval any more, an invocation that names no
// targets at all runs this suite. Bare `make eval` therefore means `default`.
const DEFAULT_SUITE = "default";

interface Args {
  suite?: string;
  runner?: RunnerName;
  model?: string;
  eval?: string;
  variant?: Variant;
  judge: boolean;
  dryRun: boolean;
  allModels: boolean;
  stats: boolean;
  compose: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { judge: false, dryRun: false, allModels: false, stats: false, compose: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--suite": {
        const v = argv[++i] ?? fail("--suite needs a suite name");
        if (!suiteFor(v)) fail(`unknown suite: ${v} (suites.json has: ${suiteNames().join(", ")})`);
        args.suite = v;
        break;
      }
      case "--runner": {
        const v = argv[++i];
        if (!isRunnerName(v)) fail(`--runner must be one of: claude, opencode, codex (got ${v})`);
        args.runner = v;
        break;
      }
      case "--model":
        args.model = argv[++i] ?? fail("--model needs a model string");
        break;
      case "--eval":
        args.eval = argv[++i] ?? fail("--eval needs a slug");
        break;
      case "--variant": {
        const v = argv[++i];
        if (!isVariant(v)) fail(`--variant must be baseline or skilled (got ${v})`);
        args.variant = v;
        break;
      }
      case "--judge":
        args.judge = true;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--all-models":
        args.allModels = true;
        break;
      case "--stats":
        args.stats = true;
        break;
      case "--compose":
        args.compose = true;
        break;
      default:
        fail(`unknown argument: ${arg}`);
    }
  }
  return args;
}

function fail(msg: string): never {
  log.error(msg);
  process.exit(1);
}

const JUDGE_PROMPT_HEADER = `You are scoring two AI-written responses to the same prompt for "slop":
puffery, filler phrases, and lack of concreteness. Score each response 1-5 on:
- puffery: 5 = no empty superlatives or marketing tone, 1 = saturated with them
- filler: 5 = no filler ("it's important to note", hedging, restated conclusions), 1 = mostly filler
- concreteness: 5 = specific names/numbers/facts, 1 = vague generalities

Reply with ONLY this JSON, no other text:
{"baseline": {"puffery": n, "filler": n, "concreteness": n},
 "skilled": {"puffery": n, "filler": n, "concreteness": n},
 "verdict": "<one sentence comparing them>"}`;

function extractJson(raw: string): unknown | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const candidate = fenced?.[1] ?? (start >= 0 && end > start ? raw.slice(start, end + 1) : null);
  if (!candidate) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

/** Score one run-set; both variants must be recorded in it. */
async function judgeRunSet(slug: string, key: string, promptText: string, set: RunSet): Promise<boolean> {
  const { baseline, skilled } = set;
  if (!baseline || !skilled) {
    log.warn(`judge ${slug} [${key}]: skipped, needs both recorded runs`);
    return true;
  }
  const prompt = [
    JUDGE_PROMPT_HEADER,
    "",
    "## Original prompt",
    promptText,
    "",
    "## Response A (baseline)",
    baseline.text,
    "",
    "## Response B (skilled)",
    skilled.text,
  ].join("\n");
  const result = await spawnRunner(JUDGE_RUNNER, JUDGE_MODEL, prompt);
  const scores = result.code === 0 ? extractJson(result.text) : null;
  if (!scores) {
    log.warn(`judge ${slug} [${key}]: could not parse a verdict (exit ${result.code})`);
    return false;
  }
  await writeScores(slug, key, scores);
  log.info(`judge ${slug} [${key}]: scores written to runs/${key}/scores.json (${result.durationMs}ms)`);
  return true;
}

/**
 * Judge only the run sets this invocation targeted — not everything on disk.
 * Scoping matters twice: a `fixture` run set is hand-written seed prose that no
 * model produced, so scoring it spends money for a meaningless number; and at
 * dry-run time the targeted sets do not exist yet, so iterating the disk would
 * under-report the plan by exactly the cells about to be filled.
 */
async function judgeEval(slug: string, dryRun: boolean, keys: string[]): Promise<number> {
  const ev = await loadEval(slug);
  if (!ev) return 0;
  let failed = 0;
  for (const key of keys) {
    if (dryRun) {
      plannedJudges++;
      log.info(`would judge ${slug} [${key}] via ${JUDGE_RUNNER}:${JUDGE_MODEL}`);
      continue;
    }
    const set = ev.runSets[key];
    if (!set?.baseline || !set.skilled) {
      log.warn(`judge ${slug} [${key}]: skipped, needs both recorded runs`);
      continue;
    }
    if (!(await judgeRunSet(slug, key, ev.prompt, set))) failed++;
  }
  return failed;
}

// ---- --stats: offline metric comparison of what is already recorded --------

const STATS_HEADER = ["eval", "run set", "lines", "chars", "words", "slop", "emoji", "Δchars", "Δslop"];

/** `baseline→skilled`, with "-" for a variant that has no recording. */
function pair(baseline: number | undefined, skilled: number | undefined): string {
  const show = (v: number | undefined) => (v === undefined ? "-" : String(v));
  return `${show(baseline)}→${show(skilled)}`;
}

function delta(baseline: number | undefined, skilled: number | undefined): string {
  if (baseline === undefined || skilled === undefined) return "-";
  const d = skilled - baseline;
  return d > 0 ? `+${d}` : String(d);
}

/** Per-eval baseline-vs-skilled metrics for every run set on disk. */
async function printStats(slugs: string[]): Promise<void> {
  const rows: string[][] = [];
  for (const slug of slugs) {
    const ev = await loadEval(slug);
    if (!ev) continue;
    for (const [key, set] of Object.entries(ev.runSets)) {
      const b = set.baseline?.metrics;
      const i = set.skilled?.metrics;
      if (!b && !i) continue;
      rows.push([
        slug,
        key,
        pair(b?.lines, i?.lines),
        pair(b?.chars, i?.chars),
        pair(b?.words, i?.words),
        pair(b?.slopWords, i?.slopWords),
        pair(b?.emoji, i?.emoji),
        delta(b?.chars, i?.chars),
        delta(b?.slopWords, i?.slopWords),
      ]);
    }
  }
  if (rows.length === 0) {
    log.warn("no recorded runs on disk");
    return;
  }
  // Every cell is single-width (→ and Δ included), so length is the print width.
  const widths = STATS_HEADER.map((head, col) =>
    Math.max(head.length, ...rows.map((row) => (row[col] ?? "").length)),
  );
  const line = (cells: string[]) =>
    cells.map((cell, col) => cell.padEnd(widths[col] ?? 0)).join("  ").trimEnd();
  console.log(line(STATS_HEADER));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of rows) console.log(line(row));
}

// ---- main -----------------------------------------------------------------

if (!isAllowedModel(JUDGE_RUNNER, JUDGE_MODEL)) {
  fail(`judge model ${JUDGE_MODEL} is not listed for ${JUDGE_RUNNER} in models.json`);
}

const args = parseArgs(process.argv.slice(2));
if (args.model !== undefined && args.runner && !isAllowedModel(args.runner, args.model)) {
  fail(`--model ${args.model} is not listed for ${args.runner} in models.json`);
}
if (args.suite && args.allModels) fail("--suite and --all-models both choose targets; use one");
if (args.suite && args.model) fail("--suite already fixes the models; drop --model");
if (args.model && !args.runner) fail("--model needs --runner: nothing else says which CLI to use");

/**
 * The suite in force. An explicit --suite wins; --runner or --all-models mean
 * ad-hoc targets and no suite; anything else falls back to `default`.
 */
const activeSuite = args.suite
  ? suiteFor(args.suite)
  : args.allModels || args.runner
    ? undefined
    : suiteFor(DEFAULT_SUITE);
if (!args.suite && !args.allModels && !args.runner && !activeSuite) {
  fail(`suites.json has no "${DEFAULT_SUITE}" suite, so a bare run has no targets`);
}
// Judging is part of a suite's plan, so `make eval:full` needs no extra flag.
if (activeSuite?.judge) args.judge = true;

/**
 * `eval.json:runs` overrides the suite's per-target count for this eval only.
 * Absent is the common case and means "however many the suite asked for", so
 * suites.json stays the one place a matrix is described.
 */
function applyEvalRuns(ev: EvalSummary, targets: Target[]): Target[] {
  if (ev.runs === undefined) return targets;
  const problem = runsProblem(ev.runs, `${ev.slug}/eval.json:runs`);
  if (problem) {
    log.error(problem);
    return [];
  }
  return targets.map((t) => ({ ...t, runs: ev.runs as number }));
}

/** Targets to fill for one eval. A suite replaces selection; --runner filters it. */
function targetsFor(ev: EvalSummary): Target[] {
  if (activeSuite) {
    const targets = args.runner
      ? activeSuite.targets.filter((t) => t.runner === args.runner)
      : activeSuite.targets;
    if (targets.length === 0) {
      log.error(`${ev.slug}: suite ${activeSuite.name} has no ${args.runner} targets`);
    }
    return applyEvalRuns(ev, targets);
  }
  if (args.allModels) {
    const runners = args.runner ? [args.runner] : RUNNERS;
    return applyEvalRuns(
      ev,
      runners.flatMap((runner) => modelsFor(runner).map((model) => ({ runner, model, runs: 1 }))),
    );
  }
  // Ad-hoc: --runner given, model defaulting to the first listed for it.
  const runner = args.runner as RunnerName;
  const model = args.model ?? defaultModel(runner);
  if (model === undefined) {
    log.error(`${ev.slug}: no models listed for ${runner} in models.json`);
    return [];
  }
  if (!isAllowedModel(runner, model)) {
    log.error(`${ev.slug}: model ${model} is not listed for ${runner} in models.json`);
    return [];
  }
  return applyEvalRuns(ev, [{ runner, model, runs: 1 }]);
}

const evals = await listEvals();
const selected = args.eval ? evals.filter((e) => e.slug === args.eval) : evals;
if (args.eval && selected.length === 0) fail(`unknown eval: ${args.eval}`);
const variants: readonly Variant[] = args.variant ? [args.variant] : VARIANTS;

// Reporting only — nothing is run or judged, so no runner needs to exist.
if (args.stats) {
  await printStats(selected.map((e) => e.slug));
  process.exit(0);
}

/**
 * Print the exact string a runner would be handed, for review before spending
 * anything. Composition is the one place an eval can be silently wrong — a
 * context file the prompt never names, a skill that failed to load, blocks in
 * an order nobody intended — and none of that shows up in `--stats`, which
 * only sees recordings that already exist.
 */
if (args.compose) {
  for (const summary of selected) {
    const ev = await loadEval(summary.slug);
    if (!ev) continue;
    for (const variant of variants) {
      const composed = composePrompt(variant, ev.prompt, ev.skill, ev.context);
      const m = computeMetrics(composed);
      console.log(`${"=".repeat(72)}`);
      console.log(`${summary.slug} / ${variant} — ${m.lines} lines, ${m.chars} chars`);
      console.log(`skills: ${summary.skills.join(" + ") || "(none)"}`);
      console.log(`${"=".repeat(72)}`);
      console.log(composed);
      console.log();
    }
  }
  process.exit(0);
}

let failed = 0;
// --dry-run tallies instead of spending, so the plan can end with a total.
let plannedRuns = 0;
let plannedJudges = 0;
// Warn once per missing binary — the matrix would repeat it for every model.
const warnedMissing = new Set<RunnerName>();
for (const ev of selected) {
  const targets = targetsFor(ev);
  if (targets.length === 0) failed++;
  for (const { runner, model } of targets) {
    const key = runSetKey(runner, model);
    if (!args.dryRun && !isAvailable(runner)) {
      if (!warnedMissing.has(runner)) {
        warnedMissing.add(runner);
        log.warn(`skip all ${runner} run-sets: ${runner} not installed`);
      }
      continue;
    }
    for (const variant of variants) {
      if (args.dryRun) {
        plannedRuns++;
        log.info(`would run ${ev.slug}/${variant} [${key}]`);
        continue;
      }
      log.info(`running ${ev.slug}/${variant} [${key}] ...`);
      try {
        const result = await executeRun(ev.slug, variant, runner, model);
        if (result.code !== 0 || result.timedOut) {
          failed++;
          const reason = result.timedOut ? "timed out" : `exit ${result.code}`;
          log.error(`${ev.slug}/${variant} [${key}]: ${reason}\n${result.stderr.trim()}`);
        } else {
          const m = computeMetrics(result.text.trim());
          log.info(
            `${ev.slug}/${variant} [${key}]: ok (${result.durationMs}ms · ` +
              `${m.lines} lines · ${m.chars} chars · ${m.slopWords} slop)`,
          );
        }
      } catch (err) {
        failed++;
        log.error(`${ev.slug}/${variant} [${key}]: ${err}`);
      }
    }
  }
  if (args.judge) {
    if (!args.dryRun && !isAvailable(JUDGE_RUNNER)) {
      log.warn(`judge ${ev.slug}: skipped, ${JUDGE_RUNNER} not installed`);
    } else {
      failed += await judgeEval(ev.slug, args.dryRun, targets.map((t) => runSetKey(t.runner, t.model)));
    }
  }
}

if (args.dryRun) {
  const total = plannedRuns + plannedJudges;
  log.info(
    `plan: ${plannedRuns} runs + ${plannedJudges} judges = ${total} billed calls ` +
      `across ${selected.length} evals — nothing was spent`,
  );
}

process.exit(failed > 0 ? 1 : 0);
