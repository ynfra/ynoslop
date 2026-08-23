// CLI adapters for the three agent binaries + a spawn helper.
// Uniform non-interactive invocations: claude -p / opencode run / codex exec,
// each with an explicit model from config.json.

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { config } from "./config.ts";
import { log } from "./log.ts";
import type { RunnerName } from "./types.ts";

/** Tools denied to claude. Space- or comma-separated; one argv token. */
const CLAUDE_DENIED_TOOLS =
  "Bash,Edit,Write,Read,Glob,Grep,WebFetch,WebSearch,Task,NotebookEdit";

interface RunnerAdapter {
  bin: string;
  /** argv WITHOUT the prompt — see promptVia for how the prompt is delivered. */
  buildArgs(model: string, effort?: string): string[];
  /**
   * `argv` appends the prompt as the last argument. `stdin` writes it to the
   * process instead, which is required whenever a variadic flag would swallow
   * it — claude's `--disallowedTools <tools...>` consumes every argument that
   * follows, prompt included — and is safer regardless, since a composed
   * prompt can run to tens of kilobytes.
   */
  promptVia: "argv" | "stdin";
  /**
   * Env that switches off ambient context the runner would otherwise load from
   * $HOME. The composed prompt must be the only instruction a run receives, and
   * a cwd sentinel cannot cover sources that live outside the directory tree.
   */
  buildEnv?(model: string, effort?: string): Record<string, string>;
}

/**
 * opencode's isolation config. Delivered through OPENCODE_CONFIG_CONTENT
 * because a plain opencode.json in a bare working directory is NOT read — only
 * an env-delivered config reliably applies. Still written to the spawn cwd as
 * well, purely so the directory documents itself.
 *
 * Only the mutating and agentic tools are removed. `read`/`glob`/`grep` stay,
 * and that is deliberate: with every tool gone the model still attempts a write
 * and the blocked call leaks raw tool markup into the answer, which is worse
 * than the problem it fixes. With no write path to attempt it simply answers
 * in text, which is what an output-quality eval must measure. The survivors
 * are harmless here — the spawn cwd is empty.
 */
const DISABLED_TOOLS = [
  "write",
  "edit",
  "patch",
  "bash",
  "task",
  "skill",
  "webfetch",
  "todowrite",
  "todoread",
] as const;

function opencodeConfig(model?: string, effort?: string): string {
  const off: Record<string, boolean> = {};
  for (const tool of DISABLED_TOOLS) off[tool] = false;
  const cfg: Record<string, unknown> = {
    $schema: "https://opencode.ai/config.json",
    instructions: [],
    tools: off,
    // Top-level alone does not take effect; the agent-scoped copy is the one
    // that actually removes them from the build agent.
    agent: { build: { tools: off } },
  };
  // Reasoning effort rides in as a per-model option — there is no CLI flag.
  if (model && effort) {
    const slash = model.indexOf("/");
    if (slash > 0) {
      const provider = model.slice(0, slash);
      const id = model.slice(slash + 1);
      cfg.provider = { [provider]: { models: { [id]: { options: { reasoningEffort: effort } } } } };
    } else {
      log.warn(`effort ${effort} ignored: model ${model} has no provider/ prefix`);
    }
  }
  return JSON.stringify(cfg, null, 2);
}

const ADAPTERS: Record<RunnerName, RunnerAdapter> = {
  // `--bare` looks made for this (it disables CLAUDE.md auto-discovery, hooks,
  // plugins and auto-memory) but it also states that OAuth and the keychain are
  // never read, so it needs an ANTHROPIC_API_KEY. On a subscription login that
  // is not an option — the same trade a container forces — so the equivalent is
  // assembled from composable flags instead.
  claude: {
    bin: "claude",
    buildArgs: (m, effort) => {
      if (effort) log.warn("claude runner has no reasoning-effort switch; effort ignored");
      return [
        "claude",
        "-p",
        "--model",
        m,
        // Load no user, project or local settings.
        "--setting-sources",
        "",
        // "Disable all skills" — the ~/.claude/skills pathway.
        "--disable-slash-commands",
        // Ignore every MCP config; none is supplied, so no servers load.
        "--strict-mcp-config",
        // Keep cwd, env info, memory paths and git status out of the system prompt.
        "--exclude-dynamic-system-prompt-sections",
        "--disallowedTools",
        CLAUDE_DENIED_TOOLS,
      ];
    },
    promptVia: "stdin",
  },
  opencode: {
    bin: "opencode",
    // Documented switches: opencode.ai/docs/rules. This kills ~/.claude/CLAUDE.md
    // and, more importantly, ~/.claude/skills — skills are advertised in the
    // skill tool's description and loaded on the model's initiative, so they
    // reach a run no matter what the working directory looks like.
    buildArgs: (m) => ["opencode", "run", "--pure", "-m", m],
    promptVia: "argv",
    buildEnv: (m, effort) => ({
      OPENCODE_DISABLE_CLAUDE_CODE: "1",
      OPENCODE_DISABLE_CLAUDE_CODE_PROMPT: "1",
      OPENCODE_DISABLE_CLAUDE_CODE_SKILLS: "1",
      OPENCODE_CONFIG_CONTENT: opencodeConfig(m, effort),
    }),
  },
  // codex is the best-behaved of the three: --ignore-user-config drops
  // $CODEX_HOME/config.toml while explicitly keeping auth, so isolation costs
  // nothing here. --skip-git-repo-check is required, not optional: the spawn
  // cwd is a bare temp directory, and codex refuses to run outside a repo.
  codex: {
    bin: "codex",
    buildArgs: (m, effort) => [
      "codex",
      "exec",
      "-m",
      m,
      ...(effort ? ["-c", `model_reasoning_effort="${effort}"`] : []),
      "--ignore-user-config",
      "--ignore-rules",
      "--ephemeral",
      "--skip-git-repo-check",
      "-s",
      "read-only",
    ],
    promptVia: "stdin",
  },
};

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
 */
let cachedCwd: string | undefined;

function spawnCwd(): string {
  if (config.workDir) return config.workDir;
  if (cachedCwd) return cachedCwd;
  const dir = mkdtempSync(join(tmpdir(), "ynoslop-work-"));
  for (const sentinel of ["AGENTS.md", "CLAUDE.md"]) {
    writeFileSync(join(dir, sentinel), "");
  }
  writeFileSync(join(dir, "opencode.json"), `${opencodeConfig()}\n`);
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
 * Spawn a runner and collect stdout/stderr. The process inherits the
 * environment (CLI auth lives there / in $HOME) but runs in a clean cwd so
 * agentic CLIs can't wander this repo.
 */
export async function spawnRunner(
  runner: RunnerName,
  model: string,
  prompt: string,
  effort?: string,
): Promise<SpawnResult> {
  const started = Date.now();
  const adapter = ADAPTERS[runner];
  const args = adapter.buildArgs(model, effort);
  if (adapter.promptVia === "argv") args.push(prompt);
  const proc = Bun.spawn(args, {
    cwd: spawnCwd(),
    // Inherit so CLI auth in $HOME still works, then override the keys that
    // pull in ambient instructions and skills.
    env: { ...process.env, ...(adapter.buildEnv?.(model, effort) ?? {}) },
    stdin: adapter.promptVia === "stdin" ? "pipe" : "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  // Typed optional because it is only a stream when stdin was piped above.
  if (adapter.promptVia === "stdin" && proc.stdin) {
    proc.stdin.write(prompt);
    await proc.stdin.end();
  }

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
      text += outDecoder.decode(chunk, { stream: true });
    }
  })();
  const readErr = (async () => {
    for await (const chunk of proc.stderr) {
      stderr += errDecoder.decode(chunk, { stream: true });
    }
  })();

  const code = await proc.exited;
  await Promise.all([readOut, readErr]);
  clearTimeout(timer);
  return { code, text, stderr, durationMs: Date.now() - started, timedOut };
}
