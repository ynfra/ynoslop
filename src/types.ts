import type { Metrics, TextInfo } from "./metrics.ts";

export const RUNNERS = ["claude", "opencode", "codex"] as const;
export type RunnerName = (typeof RUNNERS)[number];

export const VARIANTS = ["baseline", "skilled"] as const;
export type Variant = (typeof VARIANTS)[number];

/** Run-set key for hand-written fixture recordings (no runner/model behind them). */
export const FIXTURE_KEY = "fixture";

export function isRunnerName(v: unknown): v is RunnerName {
  return typeof v === "string" && (RUNNERS as readonly string[]).includes(v);
}

export function isVariant(v: unknown): v is Variant {
  return typeof v === "string" && (VARIANTS as readonly string[]).includes(v);
}

/** evals/<slug>/eval.json */
export interface EvalConfig {
  title: string;
  category: string;
  description: string;
  /**
   * Skill slugs, each resolving to skills/<slug>/SKILL.md. Bodies compose in
   * this order into the single <instructions> block. An empty array means no
   * skill, so both variants run bare — a deliberate control, not an error.
   */
  skills: string[];
  /**
   * Samples to record per target for this eval, overriding the suite's `runs`.
   * Absent means "however many the suite asked for" — the common case. Present
   * only when this eval needs a different number, e.g. an open-ended prompt
   * whose output varies enough that one draw says nothing.
   */
  runs?: number;
}

/**
 * What composePrompt() needs to emit one context block. A named entry becomes
 * `<context path="NAME">`; an entry with no name (or an empty one) becomes a
 * plain `<context>`.
 */
export interface ContextBlock {
  name?: string;
  text: string;
}

/** One evals/<slug>/context/ file, part of what the model sees. */
export interface ContextFile extends ContextBlock {
  /** Always present on disk-backed context — the filename. */
  name: string;
  lines: number;
  chars: number;
}

/** A recorded response from runs/<key>/<variant>.md, frontmatter stripped. */
export interface RecordedRun {
  text: string;
  runner: string;
  model: string;
  recorded: string;
  /** Wall-clock duration of the spawn, when the recording carries it. */
  ms?: number;
  /**
   * Skill slugs composed into this run's prompt. Stored because skill text
   * changes over time — upstream reworded `attention-spartan` after it was
   * vendored — and a recording that cannot say what it saw cannot be compared
   * to a later one.
   */
  skills?: string[];
  /** Deterministic, recomputed on every read — never stored in the run file. */
  metrics: Metrics;
}

/** What writeRun() stamps into a run file's frontmatter. */
export interface RunMeta {
  runner: string;
  model: string;
  variant: Variant;
  recorded: string;
  ms?: number;
  skills?: string[];
}

/** One runs/<key>/ directory: both variants as produced by the same runner+model. */
export interface RunSet {
  runner: string;
  model: string;
  baseline?: RecordedRun;
  skilled?: RecordedRun;
  /** Parsed runs/<key>/scores.json, shape owned by the judge. */
  scores?: unknown;
}

export interface Eval {
  slug: string;
  config: EvalConfig;
  prompt: string;
  /** Skill markdown injected for the "skilled" variant. */
  skill: string;
  /** evals/<slug>/context/ files, in load order; empty when the dir is absent. */
  context: ContextFile[];
  promptInfo: TextInfo;
  skillInfo: TextInfo;
  runSets: Record<string, RunSet>;
}

export interface EvalSummary {
  slug: string;
  title: string;
  category: string;
  description: string;
  skills: string[];
  /** eval.json:runs when set — overrides the suite's per-target count. */
  runs?: number;
  /** Run-set keys present on disk, "fixture" first then sorted. */
  runSets: string[];
}

/**
 * One run-set, flattened for the frontend's comparison table. Every run-set
 * with at least one recording is listed; `scores` is only present where the
 * judge has written a scores.json, while `metrics` is always computed.
 */
export interface ScoreEntry {
  eval: string;
  key: string;
  runner: string;
  model: string;
  scores?: unknown;
  metrics: { baseline?: Metrics; skilled?: Metrics };
}
