// Central configuration, resolved once from the environment at startup.

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
  evalsDir: env("YNOSLOP_EVALS_DIR", join(ROOT, "evals")),
  skillsDir: env("YNOSLOP_SKILLS_DIR", join(ROOT, "skills")),
  // Where `make assemble` writes data.json, and the static site's root.
  publicDir: join(ROOT, "public"),
  // Whitelist of model strings per runner; they end up in CLI argv.
  modelsFile: join(ROOT, "models.json"),
  // Named run plans (suites of targets). Validated against modelsFile.
  suitesFile: join(ROOT, "suites.json"),

  runTimeoutMs: num("YNOSLOP_RUN_TIMEOUT_MS", 300_000),

  // cwd for spawned CLIs. Empty means "make me a clean one" — see spawnCwd()
  // in runners.ts, the only consumer. Pointing this at a directory you do not
  // control re-opens the instruction-leak described there.
  workDir: env("YNOSLOP_WORK_DIR"),

  debug: env("YNOSLOP_DEBUG") !== "",
} as const;

export type Config = typeof config;
