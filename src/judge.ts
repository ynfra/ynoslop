// Step 2 — score. For every recorded pair × config.json judge, present the two
// outputs blind (anonymous A/B, order randomized) to the judge model and write
// judge.<name>.md (raw verdict) + judge.<name>.json (hash, order, parsed
// scores). A pair whose hash already matches the stored verdict is skipped.
//
//   bin/judge [--eval <slug>] [--judge <name>] [--force]

import { join } from "node:path";
import {
  composePrompt,
  deAnonymizeVerdict,
  extractJson,
  listEvalSlugs,
  listRunKeys,
  loadAppConfig,
  loadEvalInputs,
  pairHash,
  readIfExists,
  runDir,
} from "./common.ts";
import { config } from "./config.ts";
import { log, setDebug } from "./log.ts";
import { isAvailable, spawnRunner } from "./runners.ts";
import type { JudgeOrder, JudgeRecord, JudgeSpec, RunnerName } from "./types.ts";

setDebug(config.debug);

function fail(msg: string): never {
  log.error(msg);
  process.exit(1);
}

interface Args {
  eval?: string;
  judge?: string;
  force: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--eval":
        args.eval = argv[++i] ?? fail("--eval needs a slug");
        break;
      case "--judge":
        args.judge = argv[++i] ?? fail("--judge needs a judge name");
        break;
      case "--force":
        args.force = true;
        break;
      default:
        fail(`unknown argument: ${argv[i]} (bin/judge [--eval <slug>] [--judge <name>] [--force])`);
    }
  }
  return args;
}

/** {criterion: 1..5} — the per-response half of a judge reply. */
function isScoreMap(v: unknown): v is Record<string, number> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const values = Object.values(v);
  return values.length > 0 && values.every((n) => typeof n === "number" && Number.isFinite(n));
}

const args = parseArgs(process.argv.slice(2));
const cfg = await loadAppConfig().catch((err) => fail(String(err instanceof Error ? err.message : err)));

const judges = args.judge ? cfg.judges.filter((j) => j.name === args.judge) : cfg.judges;
if (judges.length === 0) {
  fail(
    args.judge
      ? `config.json lists no judge ${JSON.stringify(args.judge)} — it has: ${cfg.judges.map((j) => j.name).join(", ") || "(none)"}`
      : "config.json lists no judges",
  );
}

// Rubrics load once, up front — a missing rubric is a config error, not a
// per-pair condition to rediscover a hundred times.
const rubrics = new Map<string, string>();
for (const judge of judges) {
  const text = await readIfExists(join(config.rootDir, judge.prompt));
  if (text === null) fail(`judge ${judge.name}: rubric ${judge.prompt} not found`);
  rubrics.set(judge.name, text.trim());
}

const slugs = args.eval ? [args.eval] : await listEvalSlugs();

let failed = 0;
const warnedMissing = new Set<RunnerName>();

async function judgePair(
  slug: string,
  key: string,
  judge: JudgeSpec,
  original: string,
  bare: string,
  skilled: string,
  hash: string,
): Promise<void> {
  const order: JudgeOrder = Math.random() < 0.5 ? "bare-first" : "skilled-first";
  const [a, b] = order === "bare-first" ? [bare, skilled] : [skilled, bare];
  const prompt = [
    rubrics.get(judge.name) ?? "",
    "",
    "## Original prompt",
    original,
    "",
    "## Response A",
    a.trim(),
    "",
    "## Response B",
    b.trim(),
  ].join("\n");
  const result = await spawnRunner(judge.runner, judge.model, prompt, judge.effort);
  const raw = result.text.trim();
  const dir = runDir(slug, key);
  // The raw reply is written even when parsing fails — it is the audit trail
  // and the only way to see what the judge actually said.
  if (raw) await Bun.write(join(dir, `judge.${judge.name}.md`), `${raw}\n`);
  const parsed = result.code === 0 && !result.timedOut ? extractJson(raw) : null;
  const reply = parsed as { A?: unknown; B?: unknown; verdict?: unknown } | null;
  if (!reply || !isScoreMap(reply.A) || !isScoreMap(reply.B) || typeof reply.verdict !== "string") {
    failed++;
    const reason = result.timedOut ? "timed out" : result.code !== 0 ? `exit ${result.code}` : "unparseable reply";
    log.error(`judge ${slug} [${key}] by ${judge.name}: ${reason}\n${result.stderr.trim()}`);
    return;
  }
  const record: JudgeRecord = {
    hash,
    order,
    scores:
      order === "bare-first"
        ? { bare: reply.A, skilled: reply.B }
        : { bare: reply.B, skilled: reply.A },
    verdict: deAnonymizeVerdict(reply.verdict, order),
  };
  await Bun.write(join(dir, `judge.${judge.name}.json`), `${JSON.stringify(record, null, 2)}\n`);
  log.info(`judge ${slug} [${key}] by ${judge.name}: ok (${result.durationMs}ms)`);
}

for (const slug of slugs) {
  const inputs = await loadEvalInputs(slug);
  if (!inputs) {
    failed++;
    log.error(`unknown eval: ${slug}`);
    continue;
  }
  // What the judge sees as the task: context + prompt, exactly the bare
  // composition — never the skill, which would unblind the comparison.
  const original = composePrompt("bare", inputs.prompt, inputs.skill, inputs.context);
  for (const key of await listRunKeys(slug)) {
    const dir = runDir(slug, key);
    const bare = await readIfExists(join(dir, "output.bare.md"));
    const skilled = await readIfExists(join(dir, "output.skilled.md"));
    if (bare === null || skilled === null) continue;
    const hash = pairHash(bare, skilled);
    for (const judge of judges) {
      if (!isAvailable(judge.runner)) {
        if (!warnedMissing.has(judge.runner)) {
          warnedMissing.add(judge.runner);
          log.warn(`skip all ${judge.runner} judges: ${judge.runner} not installed`);
        }
        continue;
      }
      if (!args.force) {
        const existing = await readIfExists(join(dir, `judge.${judge.name}.json`));
        if (existing !== null) {
          try {
            if ((JSON.parse(existing) as JudgeRecord).hash === hash) {
              log.info(`judge ${slug} [${key}] by ${judge.name}: fresh, skipped`);
              continue;
            }
          } catch {
            // Malformed verdict file — re-judge it.
          }
        }
      }
      await judgePair(slug, key, judge, original, bare, skilled, hash);
    }
  }
}

process.exit(failed > 0 ? 1 : 0);
