// Central configuration, resolved once from the environment at startup.
// models/judges live in config.json at the component root — see common.ts.

import { join } from "node:path";

function env(key: string, fallback = ""): string {
  return process.env[key]?.trim() || fallback;
}

function num(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

// Component root — src/ lives one level below it.
const ROOT = join(import.meta.dir, "..");

export const config = {
  rootDir: ROOT,
  evalsDir: env("YNOSLOP_EVALS_DIR", join(ROOT, "evals")),
  skillsDir: env("YNOSLOP_SKILLS_DIR", join(ROOT, "skills")),
  // Eval models + judges; validated on load by loadAppConfig().
  configFile: join(ROOT, "config.json"),

  runTimeoutMs: num("YNOSLOP_RUN_TIMEOUT_MS", 300_000),

  // cwd for spawned CLIs. Empty means "make me a clean one" — see spawnCwd()
  // in runners.ts, the only consumer. Pointing this at a directory you do not
  // control re-opens the instruction-leak described there.
  workDir: env("YNOSLOP_WORK_DIR"),

  debug: env("YNOSLOP_DEBUG") !== "",
} as const;

export type Config = typeof config;
