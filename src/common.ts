// Shared by the three steps: config.json loading, eval inputs, prompt
// composition, run-dir paths, and the pair hash.

import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { config } from "./config.ts";
import { log, setDebug } from "./log.ts";
import { computeMetrics } from "./metrics.ts";
import type { Metrics } from "./metrics.ts";
import { isEffort, isRunnerName } from "./types.ts";
import type {
  AppConfig,
  ContextFile,
  JudgeOrder,
  JudgeRecord,
  JudgeSpec,
  ModelTarget,
  RunMeta,
  Variant,
} from "./types.ts";

setDebug(config.debug);

// Slugs and run-set keys become path components; anything else is skipped.
const SLUG_RE = /^[a-z0-9-]+$/;
// v2 keys always carry the runner prefix; the old `fixture` dirs don't match.
const KEY_RE = /^[a-z0-9.-]+--[a-z0-9.-]+$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function fail(msg: string): never {
  log.error(msg);
  process.exit(1);
}

/**
 * Tiny flag parser shared by the four entry points. `strings` flags take a
 * value, `booleans` don't; anything else exits with the usage line.
 */
export function parseArgs(
  argv: string[],
  spec: { strings?: string[]; booleans?: string[]; usage: string },
): Record<string, string | boolean | undefined> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const name = (argv[i] ?? "").startsWith("--") ? (argv[i] as string).slice(2) : "";
    if (spec.booleans?.includes(name)) {
      out[name] = true;
    } else if (spec.strings?.includes(name)) {
      out[name] = argv[++i] ?? fail(`--${name} needs a value (${spec.usage})`);
    } else {
      fail(`unknown argument: ${argv[i]} (${spec.usage})`);
    }
  }
  return out;
}

function modelSlug(model: string): string {
  return model.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

export function runKey(runner: string, model: string): string {
  return `${runner}--${modelSlug(model)}`;
}

export function runDir(slug: string, key: string): string {
  return join(config.evalsDir, slug, "runs", key);
}

export async function readIfExists(path: string): Promise<string | null> {
  const f = Bun.file(path);
  return (await f.exists()) ? await f.text() : null;
}

// YAML frontmatter is loader metadata, never model input. Non-greedy, so a
// later horizontal rule in the body is left alone.
const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/;

export function stripFrontmatter(text: string): string {
  return text.replace(FRONTMATTER_RE, "");
}

/** First 16 hex chars of sha256 over both outputs — the judge-freshness key. */
export function pairHash(bare: string, skilled: string): string {
  return createHash("sha256").update(bare).update("\0").update(skilled).digest("hex").slice(0, 16);
}

/** evals/ dirs that hold an eval.json, sorted. */
export async function listEvalSlugs(): Promise<string[]> {
  const entries = await readdir(config.evalsDir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory() || !isValidSlug(e.name)) continue;
    if (await Bun.file(join(config.evalsDir, e.name, "eval.json")).exists()) out.push(e.name);
  }
  return out.sort();
}

/** runs/ dirs of one eval that look like v2 run-set keys, sorted. */
export async function listRunKeys(slug: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(join(config.evalsDir, slug, "runs"), { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && KEY_RE.test(e.name))
    .map((e) => e.name)
    .sort();
}

// Context files land in the prompt verbatim, so a stray large file would blow
// up every request; oversized ones are skipped rather than truncated.
const MAX_CONTEXT_BYTES = 64 * 1024;

/** evals/<slug>/context/*, flat and sorted by filename; missing dir → []. */
async function loadContext(slug: string): Promise<ContextFile[]> {
  const contextDir = join(config.evalsDir, slug, "context");
  let entries;
  try {
    entries = await readdir(contextDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const names = entries
    .filter((e) => e.isFile() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
  const out: ContextFile[] = [];
  for (const name of names) {
    const file = Bun.file(join(contextDir, name));
    if (file.size > MAX_CONTEXT_BYTES) {
      log.warn(`context ${name}: ${file.size} bytes over the ${MAX_CONTEXT_BYTES} byte limit, skipped`);
      continue;
    }
    const text = (await file.text()).replace(/\s+$/, "");
    out.push({ name, text });
  }
  return out;
}

/** Everything step 1 and step 2 need to compose prompts for one eval. */
export interface EvalInputs {
  slug: string;
  /** eval.json:skills, as declared — recorded into run.json. */
  skills: string[];
  prompt: string;
  /** Skill bodies joined in declared order; "" when skills is empty. */
  skill: string;
  context: ContextFile[];
}

export async function loadEvalInputs(slug: string): Promise<EvalInputs | null> {
  if (!isValidSlug(slug)) return null;
  const dir = join(config.evalsDir, slug);
  const cfgFile = Bun.file(join(dir, "eval.json"));
  if (!(await cfgFile.exists())) return null;
  const cfg = (await cfgFile.json()) as { skills?: unknown };
  const prompt = ((await readIfExists(join(dir, "prompt.md"))) ?? "").trim();
  const wanted = Array.isArray(cfg.skills) ? cfg.skills.filter((s): s is string => typeof s === "string") : [];
  const skills: string[] = [];
  const bodies: string[] = [];
  for (const want of wanted) {
    if (!isValidSlug(want)) {
      log.warn(`${slug}: skill "${want}" is not a valid slug, skipped`);
      continue;
    }
    const raw = await readIfExists(join(config.skillsDir, want, "SKILL.md"));
    // Warn rather than silently drop: a missing skill makes the skilled
    // variant identical to bare, which reads as "the skill did nothing".
    if (raw === null) {
      log.warn(`${slug}: skills/${want}/SKILL.md not found, skipped`);
      continue;
    }
    skills.push(want);
    const body = stripFrontmatter(raw).trim();
    if (body) bodies.push(body);
  }
  return { slug, skills, prompt, skill: bodies.join("\n\n"), context: await loadContext(slug) };
}

/**
 * The single place the eval folder becomes a prompt: <instructions> (skilled
 * only), <context> blocks in filename order, then the prompt. Changing the
 * wrapper tags breaks comparability with every existing recording.
 */
export function composePrompt(
  variant: Variant,
  prompt: string,
  skill: string,
  context: readonly ContextFile[] = [],
): string {
  const blocks: string[] = [];
  if (variant === "skilled" && skill) {
    blocks.push(`<instructions>\n${skill}\n</instructions>`);
  }
  for (const file of context) {
    blocks.push(`<context path="${file.name}">\n${file.text}\n</context>`);
  }
  blocks.push(prompt);
  return blocks.join("\n\n");
}

/** First JSON object in a judge reply — fenced, or brace-to-brace. */
export function extractJson(raw: string): unknown | null {
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

const JUDGE_FILE_RE = /^judge\.([a-z0-9-]+)\.json$/;

/** One recorded pair, derived live from the files — what collect/results read. */
export interface LoadedRun {
  slug: string;
  key: string;
  meta: RunMeta;
  metrics: { bare: Metrics; skilled: Metrics };
  /** Verdicts whose hash matches the pair on disk. */
  judges: Record<string, JudgeRecord>;
  /** Judge names whose verdict describes an older pair — re-run bin/judge. */
  stale: string[];
}

/** Null when the dir holds no complete v2 pair (v1 dirs, partial writes). */
export async function loadRun(slug: string, key: string): Promise<LoadedRun | null> {
  const dir = runDir(slug, key);
  const bare = await readIfExists(join(dir, "output.bare.md"));
  const skilled = await readIfExists(join(dir, "output.skilled.md"));
  if (bare === null || skilled === null) return null;
  const metaRaw = await readIfExists(join(dir, "run.json"));
  if (metaRaw === null) {
    log.warn(`${slug} [${key}]: outputs without run.json, skipped — re-run bin/run`);
    return null;
  }
  const meta = JSON.parse(metaRaw) as RunMeta;
  const hash = pairHash(bare, skilled);
  const judges: Record<string, JudgeRecord> = {};
  const stale: string[] = [];
  for (const entry of await readdir(dir)) {
    const m = entry.match(JUDGE_FILE_RE);
    if (!m || m[1] === undefined) continue;
    const raw = await readIfExists(join(dir, entry));
    if (raw === null) continue;
    try {
      const record = JSON.parse(raw) as JudgeRecord;
      if (record.hash === hash) judges[m[1]] = record;
      else stale.push(m[1]);
    } catch {
      stale.push(m[1]);
    }
  }
  return {
    slug,
    key,
    meta,
    metrics: { bare: computeMetrics(bare.trim()), skilled: computeMetrics(skilled.trim()) },
    judges,
    stale,
  };
}

export function sumScores(scores: Record<string, number>): number {
  return Object.values(scores).reduce((n, v) => n + v, 0);
}

/**
 * Rewrite a verdict's anonymous "A"/"B" into bare/skilled per the recorded
 * order — the judge must not know which is which, but the reader must.
 * Idempotent on already-clean text: bare word-boundary capitals only.
 */
export function deAnonymizeVerdict(verdict: string, order: JudgeOrder): string {
  const [a, b] = order === "bare-first" ? ["bare", "skilled"] : ["skilled", "bare"];
  return verdict.replace(/\bA\b/g, a).replace(/\bB\b/g, b);
}

const ANSI_RE = /\x1b\[[0-9;]*m/g;

function visibleWidth(s: string): number {
  return s.replace(ANSI_RE, "").length;
}

/** Pad-aligned table that ignores ANSI color codes when measuring cells. */
export function printTable(header: string[], rows: string[][]): void {
  const widths = header.map((h, col) => Math.max(h.length, ...rows.map((r) => visibleWidth(r[col] ?? ""))));
  const pad = (cell: string, w: number) => cell + " ".repeat(Math.max(0, w - visibleWidth(cell)));
  const line = (cells: string[]) => cells.map((c, i) => pad(c, widths[i] ?? 0)).join("  ").trimEnd();
  console.log(line(header));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of rows) console.log(line(row));
}

function bad(msg: string): never {
  throw new Error(`config.json: ${msg}`);
}

function parseTarget(where: string, raw: unknown): ModelTarget {
  if (typeof raw !== "object" || raw === null) bad(`${where} is not an object`);
  const { runner, model, effort } = raw as Record<string, unknown>;
  if (!isRunnerName(runner)) bad(`${where}.runner must be claude, opencode or codex (got ${JSON.stringify(runner)})`);
  if (typeof model !== "string" || !model) bad(`${where}.model must be a non-empty string`);
  if (effort !== undefined && !isEffort(effort)) {
    bad(`${where}.effort must be low, medium, high or max (got ${JSON.stringify(effort)})`);
  }
  const target: ModelTarget = { runner, model };
  if (effort !== undefined && isEffort(effort)) target.effort = effort;
  return target;
}

/** Read and validate config.json. Model strings become CLI argv, so nothing
 * outside this file is ever spawned. Throws with a precise message. */
export async function loadAppConfig(): Promise<AppConfig> {
  const file = Bun.file(config.configFile);
  if (!(await file.exists())) bad(`not found at ${config.configFile}`);
  const raw = (await file.json()) as Record<string, unknown>;

  const models = raw.models;
  if (!Array.isArray(models) || models.length === 0) bad("models must be a non-empty array");
  const parsedModels = models.map((m, i) => parseTarget(`models[${i}]`, m));

  const judges = raw.judges ?? [];
  if (!Array.isArray(judges)) bad("judges must be an array");
  const parsedJudges: JudgeSpec[] = judges.map((j, i) => {
    const where = `judges[${i}]`;
    const target = parseTarget(where, j);
    const { name, prompt } = j as Record<string, unknown>;
    if (typeof name !== "string" || !isValidSlug(name)) {
      bad(`${where}.name must match ^[a-z0-9-]+$ (got ${JSON.stringify(name)})`);
    }
    if (typeof prompt !== "string" || !prompt) bad(`${where}.prompt must be a rubric file path`);
    return { ...target, name, prompt };
  });
  const names = new Set(parsedJudges.map((j) => j.name));
  if (names.size !== parsedJudges.length) bad("judge names must be unique");

  return { models: parsedModels, judges: parsedJudges };
}
