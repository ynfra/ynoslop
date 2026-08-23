// Step 1 — generate. For every eval × config.json model, spawn the runner
// twice (bare, then skilled) and write runs/<runner>--<model>/{output.bare.md,
// output.skilled.md, run.json}. The pair is the unit: if either variant fails,
// nothing is written.
//
//   bin/run [--eval <slug>] [--model <model>]

import { join } from "node:path";
import { composePrompt, listEvalSlugs, loadAppConfig, loadEvalInputs, runDir, runKey } from "./common.ts";
import { config } from "./config.ts";
import { log, setDebug } from "./log.ts";
import { computeMetrics } from "./metrics.ts";
import { isAvailable, spawnRunner } from "./runners.ts";
import type { RunMeta, RunnerName, Variant } from "./types.ts";

setDebug(config.debug);

function fail(msg: string): never {
  log.error(msg);
  process.exit(1);
}

interface Args {
  eval?: string;
  model?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--eval":
        args.eval = argv[++i] ?? fail("--eval needs a slug");
        break;
      case "--model":
        args.model = argv[++i] ?? fail("--model needs a model string");
        break;
      default:
        fail(`unknown argument: ${argv[i]} (bin/run [--eval <slug>] [--model <model>])`);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const cfg = await loadAppConfig().catch((err) => fail(String(err instanceof Error ? err.message : err)));

const targets = args.model ? cfg.models.filter((t) => t.model === args.model) : cfg.models;
if (targets.length === 0) {
  fail(`config.json lists no model ${JSON.stringify(args.model)} — it has: ${cfg.models.map((t) => t.model).join(", ")}`);
}

const slugs = args.eval ? [args.eval] : await listEvalSlugs();

let failed = 0;
// Warn once per missing binary — the matrix would repeat it for every model.
const warnedMissing = new Set<RunnerName>();

for (const slug of slugs) {
  const inputs = await loadEvalInputs(slug);
  if (!inputs) {
    failed++;
    log.error(`unknown eval: ${slug}`);
    continue;
  }
  for (const target of targets) {
    if (!isAvailable(target.runner)) {
      if (!warnedMissing.has(target.runner)) {
        warnedMissing.add(target.runner);
        log.warn(`skip all ${target.runner} runs: ${target.runner} not installed`);
      }
      continue;
    }
    const key = runKey(target.runner, target.model);
    const out: Partial<Record<Variant, string>> = {};
    const ms: Partial<Record<Variant, number>> = {};
    for (const variant of ["bare", "skilled"] as const) {
      log.info(`running ${slug}/${variant} [${key}] ...`);
      const prompt = composePrompt(variant, inputs.prompt, inputs.skill, inputs.context);
      try {
        const result = await spawnRunner(target.runner, target.model, prompt, target.effort);
        if (result.code !== 0 || result.timedOut || !result.text.trim()) {
          const reason = result.timedOut ? "timed out" : result.text.trim() ? `exit ${result.code}` : "empty output";
          log.error(`${slug}/${variant} [${key}]: ${reason}\n${result.stderr.trim()}`);
          break;
        }
        out[variant] = result.text.trim();
        ms[variant] = result.durationMs;
        const m = computeMetrics(out[variant]);
        log.info(
          `${slug}/${variant} [${key}]: ok (${result.durationMs}ms · ` +
            `${m.lines} lines · ${m.chars} chars · ${m.slopWords} slop)`,
        );
      } catch (err) {
        log.error(`${slug}/${variant} [${key}]: ${err}`);
        break;
      }
    }
    if (out.bare === undefined || out.skilled === undefined || ms.bare === undefined || ms.skilled === undefined) {
      failed++;
      continue;
    }
    const dir = runDir(slug, key);
    const meta: RunMeta = {
      runner: target.runner,
      model: target.model,
      ...(target.effort !== undefined ? { effort: target.effort } : {}),
      skills: inputs.skills,
      recorded: new Date().toISOString(),
      ms: { bare: ms.bare, skilled: ms.skilled },
    };
    await Bun.write(join(dir, "output.bare.md"), `${out.bare}\n`);
    await Bun.write(join(dir, "output.skilled.md"), `${out.skilled}\n`);
    await Bun.write(join(dir, "run.json"), `${JSON.stringify(meta, null, 2)}\n`);
    log.info(`wrote ${slug}/runs/${key}/ (output.bare.md, output.skilled.md, run.json)`);
  }
}

process.exit(failed > 0 ? 1 : 0);
