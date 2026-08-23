// Step 3 — assemble. Offline and free: derive result.json in every run dir
// from run.json + metrics computed off the outputs + every fresh
// judge.<name>.json, then print the bare→skilled comparison table. Rerun
// anytime; nothing else writes result.json. For a richer, colored view use
// bin/results, which reads the same files without writing anything.
//
//   bin/collect [--eval <slug>]

import { join } from "node:path";
import { listEvalSlugs, listRunKeys, loadRun, printTable, runDir, sumScores } from "./common.ts";
import { config } from "./config.ts";
import { log, setDebug } from "./log.ts";

setDebug(config.debug);

function fail(msg: string): never {
  log.error(msg);
  process.exit(1);
}

interface Args {
  eval?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--eval":
        args.eval = argv[++i] ?? fail("--eval needs a slug");
        break;
      default:
        fail(`unknown argument: ${argv[i]} (bin/collect [--eval <slug>])`);
    }
  }
  return args;
}

/** `bare→skilled`. */
function pair(bare: number, skilled: number): string {
  return `${bare}→${skilled}`;
}

function delta(bare: number, skilled: number): string {
  const d = skilled - bare;
  return d > 0 ? `+${d}` : String(d);
}

const args = parseArgs(process.argv.slice(2));
const slugs = args.eval ? [args.eval] : await listEvalSlugs();

const HEADER = ["eval", "run", "lines", "chars", "words", "slop", "Δchars", "Δslop", "judge Σ (↑ better)"];
const rows: string[][] = [];
let written = 0;

for (const slug of slugs) {
  for (const key of await listRunKeys(slug)) {
    const run = await loadRun(slug, key);
    if (!run) continue;
    if (run.stale.length > 0) {
      log.warn(`${slug} [${key}]: stale verdicts from ${run.stale.join(", ")} left out — re-run bin/judge`);
    }
    const { meta, metrics, judges } = run;
    const result = {
      runner: meta.runner,
      model: meta.model,
      ...(meta.effort !== undefined ? { effort: meta.effort } : {}),
      skills: meta.skills,
      recorded: meta.recorded,
      ms: meta.ms,
      metrics,
      judges,
    };
    await Bun.write(join(runDir(slug, key), "result.json"), `${JSON.stringify(result, null, 2)}\n`);
    written++;

    const judgeCell = Object.entries(judges)
      .map(([name, r]) => `${name} ${sumScores(r.scores.bare)}→${sumScores(r.scores.skilled)}`)
      .join("; ");
    rows.push([
      slug,
      key,
      pair(metrics.bare.lines, metrics.skilled.lines),
      pair(metrics.bare.chars, metrics.skilled.chars),
      pair(metrics.bare.words, metrics.skilled.words),
      pair(metrics.bare.slopWords, metrics.skilled.slopWords),
      delta(metrics.bare.chars, metrics.skilled.chars),
      delta(metrics.bare.slopWords, metrics.skilled.slopWords),
      judgeCell || "-",
    ]);
  }
}

if (rows.length === 0) {
  log.warn("no recorded pairs on disk — run bin/run first");
  process.exit(0);
}

printTable(HEADER, rows);
log.info(`wrote ${written} result.json file(s)`);
