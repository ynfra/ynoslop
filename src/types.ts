export const RUNNERS = ["claude", "opencode", "codex"] as const;
export type RunnerName = (typeof RUNNERS)[number];

export type Variant = "bare" | "skilled";

export const EFFORTS = ["low", "medium", "high", "max"] as const;
export type Effort = (typeof EFFORTS)[number];

export function isRunnerName(v: unknown): v is RunnerName {
  return typeof v === "string" && (RUNNERS as readonly string[]).includes(v);
}

export function isEffort(v: unknown): v is Effort {
  return typeof v === "string" && (EFFORTS as readonly string[]).includes(v);
}

/** config.json: one eval model to record against. */
export interface ModelTarget {
  runner: RunnerName;
  model: string;
  effort?: Effort;
}

/** config.json: one judge — a model target plus identity and rubric. */
export interface JudgeSpec extends ModelTarget {
  name: string;
  /** Rubric file, relative to the component root. */
  prompt: string;
}

export interface AppConfig {
  models: ModelTarget[];
  judges: JudgeSpec[];
}

/** runs/<key>/run.json — step 1's receipt of what produced the pair. */
export interface RunMeta {
  runner: string;
  model: string;
  effort?: string;
  skills: string[];
  recorded: string;
  ms: { bare: number; skilled: number };
}

/** Which response the judge saw as A. */
export type JudgeOrder = "bare-first" | "skilled-first";

/** runs/<key>/judge.<name>.json — step 2's parsed, de-anonymized verdict. */
export interface JudgeRecord {
  hash: string;
  order: JudgeOrder;
  scores: { bare: Record<string, number>; skilled: Record<string, number> };
  verdict: string;
}

/** What composePrompt() needs to emit one <context> block. */
export interface ContextFile {
  name: string;
  text: string;
}
