// Bake evals/, skills/ and runs/ into one static public/data.json.
//
// This is the only bridge between disk and the browser: there is no server.
// `make eval` writes recordings, `make assemble` publishes them, and the
// frontend fetches a single file. The output is deterministic — same inputs,
// byte-identical file — so `make check` can prove data.json matches the
// recordings on disk.

import { join } from "node:path";
import { config } from "./config.ts";
import { log } from "./log.ts";
import { listEvals, listScores, loadEval } from "./store.ts";
import type { Eval, EvalSummary, ScoreEntry } from "./types.ts";

/** What the frontend fetches. `details` is keyed by slug, in `evals` order. */
export interface SiteData {
  evals: EvalSummary[];
  details: Record<string, Eval>;
  scores: ScoreEntry[];
}

/**
 * No timestamp field on purpose: the file is committed, so anything that
 * changes on every run would churn the diff for nothing. Recordings already
 * carry their own `recorded:` header.
 */
export async function buildSiteData(): Promise<SiteData> {
  const evals = await listEvals();
  const details: Record<string, Eval> = {};
  for (const summary of evals) {
    const ev = await loadEval(summary.slug);
    if (ev) details[summary.slug] = ev;
  }
  return { evals, details, scores: await listScores() };
}

export function dataFilePath(): string {
  return join(config.publicDir, "data.json");
}

/** Pretty-printed: this file is committed, so its diff should be readable. */
export function serializeSiteData(data: SiteData): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

if (import.meta.main) {
  const data = await buildSiteData();
  const text = serializeSiteData(data);
  const path = dataFilePath();
  await Bun.write(path, text);
  const runSets = Object.values(data.details).reduce(
    (n, ex) => n + Object.keys(ex.runSets).length,
    0,
  );
  log.info(
    `wrote public/data.json — ${data.evals.length} evals, ${runSets} run sets, ` +
      `${data.scores.length} scored, ${(text.length / 1024).toFixed(1)} KB`,
  );
  if (data.evals.length === 0) log.warn(`no evals found in ${config.evalsDir}`);
}
