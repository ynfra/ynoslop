// Named run plans, read once from suites.json at startup.
//
// A *target* is one {runner, model, runs} cell to fill; a *suite* is a named
// list of targets plus plan-level options. `make eval:<name>` runs one,
// `make plan:<name>` prints it without spending anything.
//
// Model strings here reach CLI argv exactly as they do from --model, so every
// target is validated against models.json. suites.json is a convenience for
// naming a matrix, never a way around the whitelist.

import { config } from "./config.ts";
import { log } from "./log.ts";
import { isAllowedModel } from "./models.ts";
import { isRunnerName } from "./types.ts";
import type { RunnerName } from "./types.ts";

export interface Target {
  runner: RunnerName;
  model: string;
  /**
   * How many samples to record for this cell. Pinned to 1: a run set holds
   * exactly one baseline+skilled pair until runs/<key>/<n>/ is built, so any
   * higher number is rejected at load rather than silently overwriting itself.
   */
  runs: number;
}

export interface Suite {
  name: string;
  targets: Target[];
  /** Score every run set this suite fills, without needing --judge. */
  judge: boolean;
}

function bad(msg: string): never {
  throw new Error(`suites.json: ${msg}`);
}

/**
 * The one place that knows samples are unbuilt. Both `suites.json` targets and
 * `eval.json:runs` go through it, so the limit lifts in a single edit once
 * runs/<key>/<n>/ exists.
 */
export function runsProblem(runs: unknown, where: string): string | null {
  if (runs === undefined) return null;
  if (typeof runs !== "number" || !Number.isInteger(runs) || runs < 1) {
    return `${where} must be a positive integer (got ${JSON.stringify(runs)})`;
  }
  if (runs > 1) {
    return (
      `${where} asks for ${runs} runs, but samples are not built yet — a run ` +
      `set holds one pair, so only 1 works today`
    );
  }
  return null;
}

function parseTarget(suiteName: string, index: number, raw: unknown): Target {
  const where = `${suiteName}.targets[${index}]`;
  if (typeof raw !== "object" || raw === null) bad(`${where} is not an object`);
  const { runner, model, runs } = raw as Record<string, unknown>;

  if (!isRunnerName(runner)) {
    bad(`${where}.runner must be claude, opencode or codex (got ${JSON.stringify(runner)})`);
  }
  if (!isAllowedModel(runner, model)) {
    bad(`${where}.model ${JSON.stringify(model)} is not listed for ${runner} in models.json`);
  }

  const problem = runsProblem(runs, `${where}.runs`);
  if (problem) bad(problem);
  return { runner, model, runs: runs === undefined ? 1 : (runs as number) };
}

function parseSuite(name: string, raw: unknown): Suite {
  if (typeof raw !== "object" || raw === null) bad(`${name} is not an object`);
  const { targets, judge } = raw as Record<string, unknown>;
  if (!Array.isArray(targets) || targets.length === 0) {
    bad(`${name}.targets must be a non-empty array`);
  }
  if (judge !== undefined && typeof judge !== "boolean") {
    bad(`${name}.judge must be true or false (got ${JSON.stringify(judge)})`);
  }
  return {
    name,
    targets: targets.map((t, i) => parseTarget(name, i, t)),
    judge: judge === true,
  };
}

async function load(): Promise<Record<string, Suite>> {
  const file = Bun.file(config.suitesFile);
  if (!(await file.exists())) throw new Error(`suites file not found: ${config.suitesFile}`);
  const raw = (await file.json()) as Record<string, unknown>;
  const out: Record<string, Suite> = {};
  for (const [name, body] of Object.entries(raw)) {
    out[name] = parseSuite(name, body);
  }
  if (Object.keys(out).length === 0) bad("defines no suites");
  return out;
}

async function loadOrExit(): Promise<Record<string, Suite>> {
  try {
    return await load();
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

export const suites: Record<string, Suite> = await loadOrExit();

export function suiteNames(): string[] {
  return Object.keys(suites).sort();
}

/** Undefined for an unknown name — the caller reports it with the valid list. */
export function suiteFor(name: string): Suite | undefined {
  return suites[name];
}
