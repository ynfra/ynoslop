// Allowed models per runner, read once from models.json at startup.
// This is the only source of model strings: they become CLI argv, so anything
// not listed here is rejected instead of passed through.

import { config } from "./config.ts";
import { RUNNERS } from "./types.ts";
import type { RunnerName } from "./types.ts";

async function load(): Promise<Record<RunnerName, string[]>> {
  const file = Bun.file(config.modelsFile);
  if (!(await file.exists())) throw new Error(`models file not found: ${config.modelsFile}`);
  const raw = (await file.json()) as Record<string, unknown>;
  const out = {} as Record<RunnerName, string[]>;
  for (const runner of RUNNERS) {
    const list = raw[runner];
    out[runner] = Array.isArray(list) ? list.filter((m): m is string => typeof m === "string") : [];
  }
  return out;
}

export const models: Record<RunnerName, string[]> = await load();

export function modelsFor(runner: RunnerName): string[] {
  return models[runner];
}

export function isAllowedModel(runner: RunnerName, model: unknown): model is string {
  return typeof model === "string" && models[runner].includes(model);
}

/** First entry of models.json[runner] — the eval default. */
export function defaultModel(runner: RunnerName): string | undefined {
  return models[runner][0];
}
