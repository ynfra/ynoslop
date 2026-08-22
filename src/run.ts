// Compose the prompt for a variant and execute it through a runner+model.
// src/eval.ts is the only caller: every run is a recording. There is no
// transient run path and no server — see AGENTS.md.

import { isAllowedModel } from "./models.ts";
import { isAvailable, spawnRunner } from "./runners.ts";
import type { SpawnResult } from "./runners.ts";
import { loadEval, writeRun } from "./store.ts";
import type { ContextBlock, RunnerName, Variant } from "./types.ts";

/**
 * None of the three CLIs share a skill mechanism, so the "skilled" variant
 * prepends the skill markdown to the prompt. Kept in one place so a per-runner
 * upgrade (e.g. `claude --append-system-prompt`) stays local.
 *
 * Block order is the skill (skilled only), then one <context> block per context
 * file in filename order, then the prompt. With no context files the output is
 * byte-identical to the plain skill+prompt form.
 *
 * The wrapper tag stays `<instructions>` on purpose: it is model-facing, and
 * `<instructions>` is a clearer signal to an LLM than `<skill>` would be.
 * Changing it would also break comparability with every existing recording.
 *
 * A named entry emits `<context path="NAME">`; a nameless one emits a plain
 * `<context>` open tag.
 */
export function composePrompt(
  variant: Variant,
  prompt: string,
  skill: string,
  context: readonly ContextBlock[] = [],
): string {
  const blocks: string[] = [];
  if (variant === "skilled" && skill) {
    blocks.push(`<instructions>\n${skill}\n</instructions>`);
  }
  for (const file of context) {
    const open = file.name ? `<context path="${file.name}">` : "<context>";
    blocks.push(`${open}\n${file.text}\n</context>`);
  }
  blocks.push(prompt);
  return blocks.join("\n\n");
}

/**
 * Run one recorded variant of an eval and overwrite its recording on
 * success. Only src/eval.ts calls this.
 */
export async function executeRun(
  slug: string,
  variant: Variant,
  runner: RunnerName,
  model: string,
): Promise<SpawnResult> {
  const ev = await loadEval(slug);
  if (!ev) throw new Error(`unknown eval: ${slug}`);
  if (!isAvailable(runner)) throw new Error(`runner not installed: ${runner}`);
  // The model lands in argv — never spawn one that models.json doesn't list.
  if (!isAllowedModel(runner, model)) throw new Error(`model not allowed for ${runner}: ${model}`);
  const prompt = composePrompt(variant, ev.prompt, ev.skill, ev.context);
  const result = await spawnRunner(runner, model, prompt);
  if (result.code === 0 && !result.timedOut && result.text.trim()) {
    // Stamp what produced this text, including which skills it saw — skill
    // wording drifts, so a recording that cannot say what it read cannot be
    // compared with a later one.
    await writeRun(
      slug,
      { runner, model, variant, ms: result.durationMs, skills: ev.config.skills ?? [] },
      result.text,
    );
  }
  return result;
}
