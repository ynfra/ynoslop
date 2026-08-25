// Results viewer — offline, reads the recorded files, writes nothing.
// Derived live from outputs + run.json + judge.<name>.json, so it never needs
// bin/collect to have run and can never show stale numbers.
//
//   bin/results                 overview table across every recorded run
//   bin/results --eval <slug>   full detail for one eval
//
// Overview coloring carries identity, not judgment: orange = bare, green =
// skilled. The detail view colors deltas by direction (metrics lower-better,
// judge scores higher-better); direction is not universal — a skill may
// mandate emoji markers — so read deltas with the skill in mind.

import { deAnonymizeVerdict, listEvalSlugs, listRunKeys, loadRun, parseArgs, printTable, sumScores } from "./common.ts";
import { log } from "./log.ts";
import type { LoadedRun } from "./common.ts";
import type { Metrics } from "./metrics.ts";

// ---- color ------------------------------------------------------------------

const useColor = process.stdout.isTTY === true && !process.env.NO_COLOR;
const paint = (code: string) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = paint("32");
const red = paint("31");
const yellow = paint("33");
const orange = paint("38;5;208");
const dim = paint("2");
const bold = paint("1");

/** Signed delta, colored by direction: negative is good when lower is better. */
function coloredDelta(bare: number, skilled: number, lowerBetter: boolean): string {
  const d = skilled - bare;
  if (d === 0) return dim("0");
  const text = d > 0 ? `+${d}` : String(d);
  const improved = lowerBetter ? d < 0 : d > 0;
  return improved ? green(text) : red(text);
}

// ---- overview ----------------------------------------------------------------

/** bare vs skilled — orange is bare, green is skilled. */
function vs(bare: number, skilled: number): string {
  return `${orange(String(bare))} ${dim("vs")} ${green(String(skilled))}`;
}

/** Judge Σ per judge; the name is only shown when more than one judge scored. */
function judgeCell(run: LoadedRun): string {
  const entries = Object.entries(run.judges);
  const parts = entries.map(([name, r]) => {
    const cell = vs(sumScores(r.scores.bare), sumScores(r.scores.skilled));
    return entries.length > 1 ? `${name} ${cell}` : cell;
  });
  for (const name of run.stale) parts.push(yellow(`${name}: stale`));
  return parts.join(dim("; ")) || dim("unjudged");
}

/** Evals as group rows, one line per run (runner · model · effort) below. */
function printOverview(runs: LoadedRun[]): void {
  const bySlug = new Map<string, LoadedRun[]>();
  for (const run of runs) bySlug.set(run.slug, [...(bySlug.get(run.slug) ?? []), run]);
  const rows: string[][] = [];
  for (const [slug, group] of bySlug) {
    const skills = group[0]?.meta.skills.join("+") || "no skill";
    rows.push([`${bold(slug)} ${dim(`· ${skills}`)}`, "", "", "", "", "", ""]);
    for (const r of group) {
      const effort = r.meta.effort !== undefined ? ` · ${r.meta.effort}` : "";
      rows.push([
        `  ${r.meta.runner} · ${r.meta.model}${effort}`,
        vs(r.metrics.bare.chars, r.metrics.skilled.chars),
        vs(r.metrics.bare.words, r.metrics.skilled.words),
        vs(r.metrics.bare.lines, r.metrics.skilled.lines),
        vs(r.metrics.bare.slopWords, r.metrics.skilled.slopWords),
        vs(r.metrics.bare.emoji, r.metrics.skilled.emoji),
        judgeCell(r),
      ]);
    }
  }
  console.log(`${orange("bare")} ${dim("vs")} ${green("skilled")}`);
  console.log();
  printTable(["eval / run", "chars", "words", "lines", "slop", "emoji", "judge Σ"], rows);
}

// ---- detail ------------------------------------------------------------------

const METRIC_ROWS: { key: keyof Metrics; label: string }[] = [
  { key: "lines", label: "lines" },
  { key: "chars", label: "chars" },
  { key: "words", label: "words" },
  { key: "slopWords", label: "slop words" },
  { key: "emoji", label: "emoji" },
  { key: "bullets", label: "bullets" },
  { key: "headings", label: "headings" },
  { key: "exclamations", label: "exclamations" },
  { key: "emDashes", label: "em dashes" },
];

function hitsLine(label: string, m: Metrics): string {
  const hits = m.hits.map((h) => (h.count > 1 ? `${h.term} ×${h.count}` : h.term)).join(", ");
  return `  ${label.padEnd(8)} ${hits || dim("none")}`;
}

function printDetail(run: LoadedRun): void {
  const { meta, metrics } = run;
  console.log(bold(`${run.slug} [${run.key}]`));
  const effort = meta.effort !== undefined ? ` · effort ${meta.effort}` : "";
  console.log(
    dim(
      `${meta.runner} · ${meta.model}${effort} · skills: ${meta.skills.join(" + ") || "(none)"} · ` +
        `${meta.recorded} · ${meta.ms.bare}ms/${meta.ms.skilled}ms`,
    ),
  );
  console.log();
  printTable(
    ["metric", "bare", "skilled", "Δ"],
    METRIC_ROWS.map(({ key, label }) => {
      const b = metrics.bare[key] as number;
      const s = metrics.skilled[key] as number;
      return [label, String(b), String(s), coloredDelta(b, s, true)];
    }),
  );
  console.log();
  console.log("slop terms hit:");
  console.log(hitsLine("bare", metrics.bare));
  console.log(hitsLine("skilled", metrics.skilled));
  for (const [name, record] of Object.entries(run.judges)) {
    console.log();
    console.log(`${bold(`judge ${name}`)} ${dim(`(saw ${record.order}, scores 1–5, ↑ better)`)}`);
    printTable(
      ["criterion", "bare", "skilled", "Δ"],
      [
        ...Object.keys(record.scores.bare).map((criterion) => {
          const b = record.scores.bare[criterion] ?? 0;
          const s = record.scores.skilled[criterion] ?? 0;
          return [criterion, String(b), String(s), coloredDelta(b, s, false)];
        }),
        (() => {
          const b = sumScores(record.scores.bare);
          const s = sumScores(record.scores.skilled);
          return ["Σ", String(b), String(s), coloredDelta(b, s, false)];
        })(),
      ],
    );
    console.log(`verdict: ${deAnonymizeVerdict(record.verdict, record.order)}`);
  }
  for (const name of run.stale) {
    console.log(yellow(`judge ${name}: stale verdict (pair changed since judging) — re-run bin/judge`));
  }
  if (Object.keys(run.judges).length === 0 && run.stale.length === 0) {
    console.log(dim("unjudged — run bin/judge"));
  }
}

// ---- main --------------------------------------------------------------------

const args = parseArgs(process.argv.slice(2), { strings: ["eval"], usage: "bin/results [--eval <slug>]" });
const evalArg = args.eval as string | undefined;
const slugs = evalArg ? [evalArg] : await listEvalSlugs();

const runs: LoadedRun[] = [];
for (const slug of slugs) {
  for (const key of await listRunKeys(slug)) {
    const run = await loadRun(slug, key);
    if (run) runs.push(run);
  }
}

if (runs.length === 0) {
  log.warn(evalArg ? `no recorded pairs for eval ${evalArg}` : "no recorded pairs on disk — run bin/run first");
  process.exit(0);
}

if (evalArg) {
  runs.forEach((run, i) => {
    if (i > 0) console.log(`\n${"=".repeat(72)}\n`);
    printDetail(run);
  });
} else {
  printOverview(runs);
}
