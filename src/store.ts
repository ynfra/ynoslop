// Disk-backed store: evals/<slug>/{eval.json,prompt.md,context/*,runs/<key>/*}
// + skills/<slug>/SKILL.md. A run-set key is `<runner>--<modelSlug>`, or the literal
// "fixture" for hand-written fixture recordings.
//
// Read-only apart from writeRun/writeScores, which only src/eval.ts calls.

import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { config } from "./config.ts";
import { log } from "./log.ts";
import { computeMetrics, textInfo } from "./metrics.ts";
import { FIXTURE_KEY, VARIANTS } from "./types.ts";
import type {
  ContextFile,
  RunMeta,
  Eval,
  EvalConfig,
  EvalSummary,
  RecordedRun,
  RunSet,
  ScoreEntry,
  Variant,
} from "./types.ts";

// Slugs and run-set keys come from directory names; anything else is skipped.
const SLUG_RE = /^[a-z0-9-]+$/;
// Run-set dirs additionally allow dots and the `--` separator (openai/gpt-5.5).
const RUN_SET_RE = /^[a-z0-9.-]+(--[a-z0-9.-]+)?$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

function isValidRunSetKey(key: string): boolean {
  return RUN_SET_RE.test(key);
}

function modelSlug(model: string): string {
  return model.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

export function runSetKey(runner: string, model: string): string {
  return `${runner}--${modelSlug(model)}`;
}

async function readIfExists(path: string): Promise<string | null> {
  const f = Bun.file(path);
  return (await f.exists()) ? await f.text() : null;
}

// Upstream SKILL.md files open with a YAML block (name, description, license,
// and loader-specific keys like keep-coding-instructions). That is metadata for
// a skill loader, not instruction for a model, so it is stripped here: it never
// reaches composePrompt() and never counts toward skillInfo. Non-greedy, so the
// match ends at the first closing `---` and a later horizontal rule in the body
// is left alone.
const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/;

function stripFrontmatter(text: string): string {
  return text.replace(FRONTMATTER_RE, "");
}

// A run file opens with YAML frontmatter, same shape as skills/<slug>/SKILL.md:
//
//   ---
//   runner: opencode
//   model: github-copilot/claude-haiku-4.5
//   variant: skilled
//   recorded: 2026-08-22T00:53:50.439Z
//   ms: 10274
//   skills: [attention-spartan]
//   ---
//
// Flat `key: value` lines only, plus the one inline `[a, b]` list — parsed by
// hand because this repo has no runtime dependencies and a real YAML parser
// would be the only one. Anything unrecognised is ignored, so a field can be
// added to the writer before the reader learns to care about it.
const RUN_FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/;

function parseMetaBlock(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const at = line.indexOf(":");
    if (at < 0) continue;
    out[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return out;
}

/** `[a, b]` or a bare `a` → ["a", "b"]. */
function parseInlineList(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  const items = value
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function parseRun(raw: string): RecordedRun {
  const m = raw.match(RUN_FRONTMATTER_RE);
  // Metrics are derived here, on every read — the run files only hold text.
  if (!m) {
    const text = raw.trim();
    return { text, runner: "unknown", model: "", recorded: "", metrics: computeMetrics(text) };
  }
  const meta = parseMetaBlock(m[1] ?? "");
  const text = raw.slice(m[0].length).trim();
  const run: RecordedRun = {
    text,
    runner: meta.runner || "unknown",
    // A fixture has no model, and "-" reads better on disk than an empty value.
    model: meta.model === "-" ? "" : (meta.model ?? ""),
    recorded: meta.recorded ?? "",
    metrics: computeMetrics(text),
  };
  const ms = Number(meta.ms);
  if (meta.ms !== undefined && Number.isFinite(ms)) run.ms = ms;
  const skills = parseInlineList(meta.skills);
  if (skills) run.skills = skills;
  return run;
}

function runFrontmatter(meta: RunMeta): string {
  const lines = [
    `runner: ${meta.runner}`,
    `model: ${meta.model || "-"}`,
    `variant: ${meta.variant}`,
    `recorded: ${meta.recorded}`,
  ];
  if (meta.ms !== undefined) lines.push(`ms: ${meta.ms}`);
  if (meta.skills && meta.skills.length > 0) lines.push(`skills: [${meta.skills.join(", ")}]`);
  return `---\n${lines.join("\n")}\n---`;
}

/** Fixture recordings first, then keys alphabetically. */
function sortKeys(keys: string[]): string[] {
  const rest = keys.filter((k) => k !== FIXTURE_KEY).sort();
  return keys.includes(FIXTURE_KEY) ? [FIXTURE_KEY, ...rest] : rest;
}

async function listRunSetKeys(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(join(dir, "runs"), { withFileTypes: true });
  } catch {
    return [];
  }
  return sortKeys(entries.filter((e) => e.isDirectory() && isValidRunSetKey(e.name)).map((e) => e.name));
}

// Context files land in the prompt verbatim, so a stray large file would blow
// up every request; oversized ones are skipped rather than truncated.
const MAX_CONTEXT_BYTES = 64 * 1024;

/** evals/<slug>/context/*, flat and sorted by filename; missing dir → []. */
async function loadContext(dir: string): Promise<ContextFile[]> {
  const contextDir = join(dir, "context");
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
    out.push({ name, text, ...textInfo(text) });
  }
  return out;
}

async function loadRunSet(dir: string, key: string): Promise<RunSet> {
  // Runner/model come from the recorded header; the key is the fallback.
  const parts = key.split("--");
  const set: RunSet = { runner: parts[0] ?? key, model: parts[1] ?? "" };
  for (const variant of VARIANTS) {
    const raw = await readIfExists(join(dir, "runs", key, `${variant}.md`));
    if (raw !== null) set[variant] = parseRun(raw);
  }
  const head = set.baseline ?? set.skilled;
  if (head?.runner && head.runner !== "unknown") set.runner = head.runner;
  if (head?.model) set.model = head.model;
  const scores = await readIfExists(join(dir, "runs", key, "scores.json"));
  if (scores !== null) {
    try {
      set.scores = JSON.parse(scores);
    } catch {
      // A malformed scores.json is reported as absent rather than failing the load.
    }
  }
  return set;
}

export async function loadEval(slug: string): Promise<Eval | null> {
  if (!isValidSlug(slug)) return null;
  const dir = join(config.evalsDir, slug);
  const cfgFile = Bun.file(join(dir, "eval.json"));
  if (!(await cfgFile.exists())) return null;
  const cfg = (await cfgFile.json()) as EvalConfig;
  const prompt = ((await readIfExists(join(dir, "prompt.md"))) ?? "").trim();
  // Skills compose: every slug resolves to skills/<slug>/SKILL.md and the
  // bodies are joined in declared order into the one <instructions> block.
  // Resolution is by directory name only — there is no per-eval override,
  // because a skill inside one eval folder cannot be compared across evals —
  // and the frontmatter `name` need not match the slug (upstream ships
  // `name: Spartan` in skills/attention-spartan/). Each slug becomes a path
  // component, so each is validated like every other one.
  const wanted = Array.isArray(cfg.skills) ? cfg.skills : [];
  const bodies: string[] = [];
  for (const want of wanted) {
    if (!isValidSlug(want)) {
      log.warn(`${slug}: skill "${want}" is not a valid slug, skipped`);
      continue;
    }
    const raw = await readIfExists(join(config.skillsDir, want, "SKILL.md"));
    // Warn rather than silently drop it: a missing skill makes the skilled
    // variant identical to the baseline, which reads as "the skill did nothing"
    // instead of "the skill was not found".
    if (raw === null) {
      log.warn(`${slug}: skills/${want}/SKILL.md not found, skipped`);
      continue;
    }
    const body = stripFrontmatter(raw).trim();
    if (body) bodies.push(body);
  }
  const skill = bodies.join("\n\n");
  const context = await loadContext(dir);
  const runSets: Record<string, RunSet> = {};
  for (const key of await listRunSetKeys(dir)) {
    runSets[key] = await loadRunSet(dir, key);
  }
  return {
    slug,
    config: cfg,
    prompt,
    skill,
    context,
    promptInfo: textInfo(prompt),
    skillInfo: textInfo(skill),
    runSets,
  };
}

export async function listEvals(): Promise<EvalSummary[]> {
  const entries = await readdir(config.evalsDir, { withFileTypes: true });
  const slugs = entries
    .filter((e) => e.isDirectory() && isValidSlug(e.name))
    .map((e) => e.name)
    .sort();
  const out: EvalSummary[] = [];
  for (const slug of slugs) {
    const ex = await loadEval(slug);
    if (!ex) continue;
    const summary: EvalSummary = {
      slug,
      title: ex.config.title,
      category: ex.config.category,
      description: ex.config.description,
      skills: ex.config.skills ?? [],
      runSets: sortKeys(Object.keys(ex.runSets)),
    };
    // Absent stays absent, so data.json does not grow a null for every eval.
    if (ex.config.runs !== undefined) summary.runs = ex.config.runs;
    out.push(summary);
  }
  return out;
}

/**
 * Every run-set with at least one recording, flattened for the comparison
 * table. Deterministic metrics are always present; judge scores only where a
 * scores.json exists, so a metrics-only comparison needs no judge run.
 */
export async function listScores(): Promise<ScoreEntry[]> {
  const out: ScoreEntry[] = [];
  for (const summary of await listEvals()) {
    const ex = await loadEval(summary.slug);
    if (!ex) continue;
    for (const key of sortKeys(Object.keys(ex.runSets))) {
      const set = ex.runSets[key];
      if (!set) continue;
      if (!set.baseline && !set.skilled && set.scores === undefined) continue;
      const entry: ScoreEntry = {
        eval: ex.slug,
        key,
        runner: set.runner,
        model: set.model,
        metrics: { baseline: set.baseline?.metrics, skilled: set.skilled?.metrics },
      };
      if (set.scores !== undefined) entry.scores = set.scores;
      out.push(entry);
    }
  }
  return out;
}

/** Overwrite runs/<key>/<variant>.md — git history is the archive of previous runs. */
export async function writeRun(
  slug: string,
  meta: Omit<RunMeta, "recorded">,
  text: string,
): Promise<void> {
  const dir = join(config.evalsDir, slug, "runs", runSetKey(meta.runner, meta.model));
  const front = runFrontmatter({ ...meta, recorded: new Date().toISOString() });
  await Bun.write(join(dir, `${meta.variant}.md`), `${front}\n\n${text.trim()}\n`);
  // A judge score describes one specific pair of texts. Overwriting a
  // recording makes it a claim about text that no longer exists — and unlike
  // metrics, scores.json is stored rather than recomputed, so nothing would
  // ever correct it. Drop it here; --judge rewrites it later in the same
  // invocation when the suite or the flag asks for judging.
  await unlink(join(dir, "scores.json")).catch(() => {});
}

export async function writeScores(slug: string, key: string, scores: unknown): Promise<void> {
  const path = join(config.evalsDir, slug, "runs", key, "scores.json");
  await Bun.write(path, `${JSON.stringify(scores, null, 2)}\n`);
}
