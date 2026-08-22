// CLI adapters for the three agent binaries + a streaming spawn helper.
// Uniform non-interactive invocations: claude -p / opencode run / codex exec,
// each with an explicit model taken from the models.json whitelist.

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { config } from "./config.ts";
import { log } from "./log.ts";
import type { RunnerName } from "./types.ts";

interface RunnerAdapter {
  bin: string;
  buildArgs(model: string, prompt: string): string[];
  /**
   * Env that switches off ambient context the runner would otherwise load from
   * $HOME. The composed prompt must be the only instruction a run receives, and
   * a cwd sentinel cannot cover sources that live outside the directory tree.
   */
  env?: Record<string, string>;
}

const ADAPTERS: Record<RunnerName, RunnerAdapter> = {
  claude: { bin: "claude", buildArgs: (m, p) => ["claude", "-p", "--model", m, p] },
  opencode: {
    bin: "opencode",
    // Documented switches: opencode.ai/docs/rules. This kills ~/.claude/CLAUDE.md
    // and, more importantly, ~/.claude/skills — skills are advertised in the
    // skill tool's description and loaded on the model's initiative, so they
    // reach a run no matter what the working directory looks like.
    buildArgs: (m, p) => ["opencode", "run", "--pure", "-m", m, p],
    env: {
      OPENCODE_DISABLE_CLAUDE_CODE: "1",
      OPENCODE_DISABLE_CLAUDE_CODE_PROMPT: "1",
      OPENCODE_DISABLE_CLAUDE_CODE_SKILLS: "1",
    },
  },
  codex: { bin: "codex", buildArgs: (m, p) => ["codex", "exec", "-m", m, p] },
};

/**
 * Written into the spawn cwd so opencode treats it as the project root and
 * reads a config that strips the run down to a pure completion.
 *
 * Every tool is off, not just `skill`. These evals measure text a model writes
 * from a prompt it was handed: context arrives inline in the composed prompt,
 * so no eval needs the model to read a file, run a command or fetch a URL. A
 * run that can shell out can also go read this monorepo and answer from it,
 * which is how a recording ends up citing commit conventions that appear
 * nowhere in its prompt. Disabling `skill` alone leaves that door open.
 */
const ISOLATION_CONFIG = JSON.stringify(
  {
    $schema: "https://opencode.ai/config.json",
    instructions: [],
    tools: {
      skill: false,
      bash: false,
      edit: false,
      write: false,
      read: false,
      glob: false,
      grep: false,
      list: false,
      patch: false,
      task: false,
      todowrite: false,
      todoread: false,
      webfetch: false,
    },
  },
  null,
  2,
);

export function isAvailable(name: RunnerName): boolean {
  return Bun.which(ADAPTERS[name].bin) !== null;
}

/**
 * The cwd every runner is spawned in: a private directory, created here, that
 * declares itself free of project instructions.
 *
 * The runners find instruction files by walking UP from cwd until they hit one.
 * That makes the shared OS tmpdir the wrong spawn directory rather than a safe
 * one: a stray AGENTS.md anywhere above the spawn point silently joins every
 * composed prompt, and neither the recording nor the metrics would show it.
 * Not hypothetical — a copy of this component's own AGENTS.md sat in the OS
 * tmpdir and was loaded into every run, which is why recordings started
 * reasoning about monorepo commit conventions nobody asked about.
 *
 * Empty AGENTS.md and CLAUDE.md sentinels stop the walk here. They are empty on
 * purpose: any text in them would itself reach the model.
 *
 * Created once per process, and only when something actually spawns, so
 * `make assemble` never litters.
 */
let cachedCwd: string | undefined;

function spawnCwd(): string {
  if (config.workDir) return config.workDir;
  if (cachedCwd) return cachedCwd;
  const dir = mkdtempSync(join(tmpdir(), "ynoslop-work-"));
  for (const sentinel of ["AGENTS.md", "CLAUDE.md"]) {
    writeFileSync(join(dir, sentinel), "");
  }
  writeFileSync(join(dir, "opencode.json"), `${ISOLATION_CONFIG}\n`);
  log.info(`spawn cwd ${dir} — sentinels + skill tool disabled`);
  cachedCwd = dir;
  return dir;
}

export interface SpawnResult {
  code: number;
  text: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

/**
 * Spawn a runner and stream stdout/stderr through the callbacks as it arrives.
 * The process inherits the environment (CLI auth lives there / in $HOME) but
 * runs in config.workDir so agentic CLIs can't wander this repo.
 */
export async function spawnRunner(
  runner: RunnerName,
  model: string,
  prompt: string,
  onChunk: (text: string) => void = () => {},
  onStderr: (text: string) => void = () => {},
): Promise<SpawnResult> {
  const started = Date.now();
  const adapter = ADAPTERS[runner];
  const proc = Bun.spawn(adapter.buildArgs(model, prompt), {
    cwd: spawnCwd(),
    // Inherit so CLI auth in $HOME still works, then override the keys that
    // pull in ambient instructions and skills.
    env: { ...process.env, ...(adapter.env ?? {}) },
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill();
  }, config.runTimeoutMs);

  let text = "";
  let stderr = "";
  const outDecoder = new TextDecoder();
  const errDecoder = new TextDecoder();
  const readOut = (async () => {
    for await (const chunk of proc.stdout) {
      const s = outDecoder.decode(chunk, { stream: true });
      text += s;
      onChunk(s);
    }
  })();
  const readErr = (async () => {
    for await (const chunk of proc.stderr) {
      const s = errDecoder.decode(chunk, { stream: true });
      stderr += s;
      onStderr(s);
    }
  })();

  const code = await proc.exited;
  await Promise.all([readOut, readErr]);
  clearTimeout(timer);
  return { code, text, stderr, durationMs: Date.now() - started, timedOut };
}
