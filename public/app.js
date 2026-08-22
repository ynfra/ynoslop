// ynoslop frontend — plain ES module, no build step, no libraries.
// All dynamic text is rendered via textContent (never innerHTML with data),
// so prompts, responses and file contents need no escaping.
//
// Reads one static file, public/data.json, written by `make assemble`. There is
// no server and nothing here runs a model: this is an inspector over what
// `make eval` recorded.

const explorerEl = document.getElementById("explorer");
const workspaceEl = document.getElementById("workspace");

const VARIANTS = [
  { key: "baseline", label: "without skill" },
  { key: "skilled", label: "with skill" },
];
const SUBSCORES = ["puffery", "filler", "concreteness"];
const FIXTURE = "fixture";

// The three ways to read one pair of outputs.
const OUTPUT_VIEWS = [
  { key: "side", label: "side by side" },
  { key: "diff", label: "diff" },
  { key: "stats", label: "stats" },
];

// The metrics strip above each response. Lower is better for all of them.
const STRIP_METRICS = [
  { field: "lines", label: "lines" },
  { field: "chars", label: "chars" },
  { field: "words", label: "words" },
  { field: "slopWords", label: "slop" },
  { field: "emoji", label: "emoji" },
  { field: "bullets", label: "bullets" },
];

// The full table in the `stats` output view.
const TABLE_METRICS = [
  { field: "lines", label: "lines" },
  { field: "chars", label: "chars" },
  { field: "words", label: "words" },
  { field: "slopWords", label: "slop words" },
  { field: "emoji", label: "emoji" },
  { field: "bullets", label: "bullets" },
  { field: "headings", label: "headings" },
  { field: "exclamations", label: "exclamations" },
  { field: "emDashes", label: "em dashes" },
];

const CELL_MODES = [
  { key: "judge", label: "judge" },
  { key: "chars", label: "chars" },
  { key: "slop", label: "slop" },
];

// Above this the LCS table stops being worth building; we fall back to counts.
const DIFF_MAX_LINES = 2000;

// Everything the page shows, from data.json — loaded once at boot.
let evals = []; // summaries, explorer order
let details = {}; // slug -> full eval
let scores = []; // flattened run sets for the comparison table
// {kind:"eval", slug} | {kind:"scores"}
let view = { kind: "empty" };
let areaSeq = 0; // unique radio-group names, so two switchers never share state
// The splitter of the mounted eval view. setWorkspace tears it down; only the
// eval view sets it, and there is only ever one.
let activeSplit = null;

// ---------------------------------------------------------------- helpers

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
}

function setWorkspace(...children) {
  if (activeSplit) activeSplit.destroy(); // the old view is about to be detached
  activeSplit = null;
  workspaceEl.textContent = "";
  for (const child of children) {
    if (child) workspaceEl.append(child);
  }
}

function clear(node) {
  node.textContent = "";
  return node;
}

// A finite number, or null — every delta guards on this so no NaN ever prints.
function num(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fmtInt(value) {
  const n = num(value);
  return n === null ? "—" : n.toLocaleString("en-US");
}

function signed(value) {
  const n = num(value);
  if (n === null) return "";
  if (n === 0) return "±0";
  return `${n > 0 ? "+" : "−"}${Math.abs(n).toLocaleString("en-US")}`;
}

// Compare two metric values. `lowerBetter` flips the colour, not the maths.
// Returns null when either side is missing, so callers can skip rendering.
function delta(baseValue, instValue, lowerBetter = true) {
  const base = num(baseValue);
  const inst = num(instValue);
  if (base === null || inst === null) return null;
  const diff = inst - base;
  const tone = diff === 0 ? "flat" : (diff < 0) === lowerBetter ? "good" : "bad";
  const pct = base === 0 ? null : Math.round((diff / Math.abs(base)) * 100);
  return { diff, pct, tone };
}

function runSetLabel(key, runner, model) {
  if (key === FIXTURE) return FIXTURE;
  if (runner && model) return `${runner} · ${model}`;
  if (runner) return runner;
  return key;
}

// sum the three 1–5 subscores; null when nothing usable is present
function sumScore(block) {
  if (!block || typeof block !== "object") return null;
  let total = 0;
  let found = false;
  for (const name of SUBSCORES) {
    const value = num(block[name]);
    if (value !== null) {
      total += value;
      found = true;
    }
  }
  return found ? total : null;
}

function metricsOf(run) {
  return run && run.metrics && typeof run.metrics === "object" ? run.metrics : null;
}

function textInfo(text, info) {
  const source = typeof text === "string" ? text : "";
  const lines = num(info && info.lines);
  const chars = num(info && info.chars);
  return {
    lines: lines === null ? (source ? source.split("\n").length : 0) : lines,
    chars: chars === null ? source.length : chars,
  };
}

function countsLabel(text, info) {
  const { lines, chars } = textInfo(text, info);
  return `${fmtInt(lines)} lines · ${fmtInt(chars)} chars`;
}

// ---------------------------------------------------------------- line numbers
//
// Every read-only monospace surface renders as one row per logical line: a
// number cell plus a content cell that wraps inside itself. That is the whole
// trick — the number cannot drift away from its line the way a separate column
// of numbers next to a wrapping <pre> does.
//
// A line is a list of fragments `{cls, text}`; `cls` null is plain text (so
// stdout stays an unwrapped text node) and anything else becomes a span, which
// is what keeps `stderr`/`err` styling alive inside one line.

const LN_MIN_DIGITS = 2;

function lnDigits(count) {
  return Math.max(LN_MIN_DIGITS, String(Math.max(1, count)).length);
}

// Cut fragment runs into lines. Trailing blank lines are dropped, so a text
// ending in "\n" counts the way `lines` in the metrics strip counts it.
function toLines(fragments) {
  const lines = [[]];
  for (const frag of fragments) {
    if (!frag || typeof frag.text !== "string" || frag.text.length === 0) continue;
    const parts = frag.text.split("\n");
    for (let i = 0; i < parts.length; i += 1) {
      if (i > 0) lines.push([]);
      if (parts[i].length > 0) {
        lines[lines.length - 1].push({ cls: frag.cls || null, text: parts[i] });
      }
    }
  }
  while (lines.length > 0 && lines[lines.length - 1].length === 0) lines.pop();
  return lines;
}

function lineRow(number, fragments) {
  const content = el("span", { class: "ln-text" });
  for (const frag of fragments) {
    if (frag.cls) content.append(el("span", { class: frag.cls, text: frag.text }));
    else content.append(document.createTextNode(frag.text));
  }
  // A blank line has no text of its own, and a row with no text at all is
  // dropped when the selection is serialised — so copying would silently eat
  // every blank line. One <br> keeps the row exactly one line tall and keeps
  // the blank line in the clipboard.
  if (fragments.length === 0) content.append(document.createElement("br"));
  return el("div", { class: "ln-row" }, [
    el("span", { class: "ln-num", "data-ln": String(number), "aria-hidden": "true" }),
    content,
  ]);
}

// Repaint `container` as numbered rows, keeping the rows that did not change.
// Streaming appends to the last segment, so a chunk normally rebuilds one row.
function paintNumbered(container, lines, minDigits = 0) {
  container.style.setProperty("--ln-w", `${Math.max(minDigits, lnDigits(lines.length))}ch`);
  const sigs = lines.map((frags) => frags.map((f) => `${f.cls || ""}\u0000${f.text}`).join("\u0001"));
  const prev = Array.isArray(container.__lnSigs) ? container.__lnSigs : [];
  let same = 0;
  while (same < prev.length && same < sigs.length && prev[same] === sigs[same]) same += 1;
  while (container.childNodes.length > same) container.removeChild(container.lastChild);
  for (let i = same; i < sigs.length; i += 1) container.append(lineRow(i + 1, lines[i]));
  container.__lnSigs = sigs;
  container.classList.add("lined");
}

// An empty state ("nothing run yet") is not content, so it gets no gutter.
function paintUnnumbered(container, text) {
  container.__lnSigs = null;
  container.classList.remove("lined");
  container.textContent = text;
}

// One text blob as a numbered surface; empty text stays a bare placeholder.
function textSurface(node, text, placeholder = "(empty)") {
  if (typeof text === "string" && text.length > 0) {
    paintNumbered(node, toLines([{ cls: null, text }]));
  } else {
    paintUnnumbered(node, placeholder);
  }
  return node;
}

// ---------------------------------------------------------------- explorer

// The explorer browses content; the one destination that is not an eval —
// the comparison table — lives in the top-right navbar.
function renderTopNav() {
  const navEl = document.getElementById("topnav");
  if (!navEl) return;
  clear(navEl);
  navEl.append(el("button", {
    class: `nav-action${view.kind === "scores" ? " active" : ""}`,
    type: "button",
    title: "Every run set against every eval",
    onclick: () => showScores(),
  }, [
    svgIcon("M3 13 V8 M8 13 V4 M13 13 V6"),
    el("span", { text: "Model comparison" }),
  ]));
}

function svgIcon(path) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "13");
  svg.setAttribute("height", "13");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.6");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("d", path);
  svg.append(p);
  return svg;
}

function renderExplorer() {
  renderTopNav();
  clear(explorerEl);

  const evalsSection = el("div", { class: "ex-section" }, [
    el("div", { class: "ex-heading", text: "Evals" }),
  ]);

  const byCategory = new Map();
  for (const ev of evals) {
    const category = ev.category || "other";
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(ev);
  }

  for (const [category, items] of byCategory) {
    evalsSection.append(el("div", { class: "ex-group", text: category }));
    for (const item of items) {
      evalsSection.append(el("button", {
        class: `ex-row${view.kind === "eval" && item.slug === view.slug ? " active" : ""}`,
        title: item.description || item.title || item.slug,
        text: item.title || item.slug,
        onclick: () => selectEval(item.slug),
      }));
    }
  }

  explorerEl.append(evalsSection);
}

// ---------------------------------------------------------------- line diff
//
// A plain LCS line diff, no libraries. Common prefix and suffix are stripped
// first (two responses to the same prompt usually share long stretches), lines
// are interned to integers, and only the middle goes through the DP table.

function splitLines(text) {
  return typeof text === "string" && text.length > 0 ? text.split("\n") : [];
}

// Multiset difference — the honest count when the texts are too big to diff.
function lineCounts(a, b) {
  const tally = new Map();
  for (const line of a) tally.set(line, (tally.get(line) || 0) + 1);
  for (const line of b) tally.set(line, (tally.get(line) || 0) - 1);
  let removed = 0;
  let added = 0;
  for (const value of tally.values()) {
    if (value > 0) removed += value;
    else if (value < 0) added -= value;
  }
  return { removed, added };
}

function lcsRows(a, b) {
  const n = a.length;
  const m = b.length;
  if (n === 0 && m === 0) return [];
  if (n === 0) return b.map((text) => ({ kind: "add", text }));
  if (m === 0) return a.map((text) => ({ kind: "del", text }));

  const ids = new Map();
  const idOf = (line) => {
    let id = ids.get(line);
    if (id === undefined) {
      id = ids.size;
      ids.set(line, id);
    }
    return id;
  };
  const ax = new Int32Array(n);
  const bx = new Int32Array(m);
  for (let i = 0; i < n; i += 1) ax[i] = idOf(a[i]);
  for (let j = 0; j < m; j += 1) bx[j] = idOf(b[j]);

  // table[i][j] = LCS length of a[i..] and b[j..]; capped well under 65535
  // by DIFF_MAX_LINES, so 16 bits per cell is enough.
  const w = m + 1;
  const table = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i -= 1) {
    const row = i * w;
    const next = row + w;
    for (let j = m - 1; j >= 0; j -= 1) {
      if (ax[i] === bx[j]) table[row + j] = table[next + j + 1] + 1;
      else {
        const down = table[next + j];
        const right = table[row + j + 1];
        table[row + j] = down >= right ? down : right;
      }
    }
  }

  const rows = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ax[i] === bx[j]) {
      rows.push({ kind: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (table[(i + 1) * w + j] >= table[i * w + j + 1]) {
      // deletions first inside a hunk, so a replacement reads as -/+
      rows.push({ kind: "del", text: a[i] });
      i += 1;
    } else {
      rows.push({ kind: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < n) {
    rows.push({ kind: "del", text: a[i] });
    i += 1;
  }
  while (j < m) {
    rows.push({ kind: "add", text: b[j] });
    j += 1;
  }
  return rows;
}

function lineDiff(baseText, instText) {
  const a = splitLines(baseText);
  const b = splitLines(instText);
  if (a.length > DIFF_MAX_LINES || b.length > DIFF_MAX_LINES) {
    const { removed, added } = lineCounts(a, b);
    return { tooLarge: true, rows: [], removed, added, baseLines: a.length, instLines: b.length };
  }

  const rows = [];
  let start = 0;
  const shortest = Math.min(a.length, b.length);
  while (start < shortest && a[start] === b[start]) start += 1;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA -= 1;
    endB -= 1;
  }

  for (let i = 0; i < start; i += 1) rows.push({ kind: "same", text: a[i] });
  for (const row of lcsRows(a.slice(start, endA), b.slice(start, endB))) rows.push(row);
  for (let i = endA; i < a.length; i += 1) rows.push({ kind: "same", text: a[i] });

  let removed = 0;
  let added = 0;
  for (const row of rows) {
    if (row.kind === "del") removed += 1;
    else if (row.kind === "add") added += 1;
  }
  return { tooLarge: false, rows, removed, added, baseLines: a.length, instLines: b.length };
}

// The six headline metrics inside one pane. The summary band above the view
// compares the two sides; this says what each side actually measured, next to
// the text it measured, and the skilled pane carries the delta.
function renderStrip(node, metrics, baseMetrics) {
  clear(node);
  if (!metrics) {
    node.append(el("span", { class: "strip-empty", text: "no metrics" }));
    return;
  }
  for (const metric of STRIP_METRICS) {
    const value = num(metrics[metric.field]);
    const cell = el("span", { class: "metric", title: metric.label }, [
      el("span", { class: "metric-label", text: metric.label }),
      el("span", { class: "metric-value", text: value === null ? "—" : fmtInt(value) }),
    ]);
    if (baseMetrics) {
      const d = delta(baseMetrics[metric.field], metrics[metric.field]);
      if (d) {
        cell.append(el("span", {
          class: `metric-delta ${d.tone}`,
          text: d.pct === null ? signed(d.diff) : `${signed(d.pct)}%`,
        }));
      }
    }
    node.append(cell);
  }
}

// ---------------------------------------------------------------- output area
//
// One component. It owns the three-view switcher and repaints from a plain
// model, so the caller only has to hand it text + metrics + scores:
//
//   { baseline: Pane|null, skilled: Pane|null, scores, emptyMeta }
//   Pane = { segments:[{kind,text}], meta, metrics, streaming }

function paneText(pane) {
  if (!pane || !Array.isArray(pane.segments)) return null;
  let text = "";
  for (const seg of pane.segments) {
    if (seg && seg.kind === "out" && typeof seg.text === "string") text += seg.text;
  }
  return text;
}

function diffView(model, emptyText) {
  const panel = el("div", { class: "out-panel" });
  const body = el("div", { class: "out-panel-body" });
  const base = paneText(model.baseline);
  const inst = paneText(model.skilled);

  const head = el("div", { class: "out-panel-head" }, [
    el("span", { class: "diff-legend" }, [
      el("span", { class: "diff-sign bad", text: "-" }),
      el("span", { text: "without skill" }),
    ]),
    el("span", { class: "diff-legend" }, [
      el("span", { class: "diff-sign good", text: "+" }),
      el("span", { text: "with skill" }),
    ]),
    el("span", { class: "grow" }),
  ]);
  panel.append(head, body);

  const missing = base === null || base.length === 0 || inst === null || inst.length === 0;
  if (missing) {
    const both = (base === null || base.length === 0) && (inst === null || inst.length === 0);
    body.append(el("p", {
      class: "placeholder-note",
      text: both ? emptyText : `${emptyText} — both sides are needed to diff`,
    }));
    return panel;
  }

  const result = lineDiff(base, inst);
  head.append(el("span", {
    class: "n",
    text: `${fmtInt(result.removed)} removed · ${fmtInt(result.added)} added`,
  }));

  if (result.tooLarge) {
    body.append(el("p", {
      class: "placeholder-note",
      text: `${fmtInt(result.baseLines)} lines against ${fmtInt(result.instLines)} — over the `
        + `${fmtInt(DIFF_MAX_LINES)}-line limit, so the lines are counted rather than aligned.`,
    }));
    return panel;
  }

  const list = el("div", { class: "diff" });
  // two gutters, sized from each side's own line count
  list.style.setProperty("--ln-w", `${lnDigits(result.baseLines)}ch`);
  list.style.setProperty("--ln-w-b", `${lnDigits(result.instLines)}ch`);
  let baseNo = 0;
  let instNo = 0;
  for (const row of result.rows) {
    const del = row.kind === "del";
    const add = row.kind === "add";
    const kind = del ? " del" : add ? " add" : "";
    const sign = del ? "-" : add ? "+" : " ";
    // a removed line has no number on the skilled side, and vice versa
    if (!add) baseNo += 1;
    if (!del) instNo += 1;
    list.append(el("div", { class: `diff-row${kind}` }, [
      el("span", { class: "ln-num", "data-ln": add ? "" : String(baseNo), "aria-hidden": "true" }),
      el("span", { class: "ln-num", "data-ln": del ? "" : String(instNo), "aria-hidden": "true" }),
      el("span", { class: "diff-sign", text: sign }),
      el("span", { class: "diff-text", text: row.text }),
    ]));
  }
  if (result.rows.length === 0) {
    body.append(el("p", { class: "placeholder-note", text: "both sides are empty" }));
  } else {
    body.append(list);
  }
  return panel;
}

function statsView(model, emptyText) {
  const panel = el("div", { class: "out-panel" });
  const body = el("div", { class: "out-panel-body" });
  panel.append(
    el("div", { class: "out-panel-head" }, [
      el("span", { text: "metric · without vs with skill" }),
      el("span", { class: "grow" }),
      el("span", { text: "lower is better" }),
    ]),
    body,
  );

  const base = model.baseline ? model.baseline.metrics : null;
  const inst = model.skilled ? model.skilled.metrics : null;
  const scores = model.scores && typeof model.scores === "object" ? model.scores : null;

  if (!base && !inst && !scores) {
    body.append(el("p", { class: "placeholder-note", text: emptyText }));
    return panel;
  }

  if (base || inst) {
    const head = el("tr", {}, [
      el("th", { text: "metric" }),
      el("th", { text: "baseline" }),
      el("th", { text: "skilled" }),
      el("th", { text: "delta" }),
    ]);
    const rows = el("tbody");
    for (const metric of TABLE_METRICS) {
      const b = num(base && base[metric.field]);
      const i = num(inst && inst[metric.field]);
      const d = delta(b, i);
      const deltaText = !d ? "" : d.pct === null ? signed(d.diff) : `${signed(d.diff)} (${signed(d.pct)}%)`;
      rows.append(el("tr", {}, [
        el("th", { text: metric.label }),
        el("td", { class: "n", text: b === null ? "—" : fmtInt(b) }),
        el("td", { class: "n", text: i === null ? "—" : fmtInt(i) }),
        el("td", { class: `n ${d ? d.tone : ""}`, text: deltaText }),
      ]));
    }
    body.append(el("div", { class: "table-wrap" }, [
      el("table", { class: "stats-table" }, [el("thead", {}, [head]), rows]),
    ]));
  } else {
    body.append(el("p", { class: "placeholder-note", text: "no metrics for these runs" }));
  }

  // top slop hits per side
  const hitLines = [];
  for (const variant of VARIANTS) {
    const metrics = model[variant.key] ? model[variant.key].metrics : null;
    const hits = Array.isArray(metrics && metrics.hits) ? metrics.hits : [];
    const parts = [];
    for (const hit of hits.slice(0, 8)) {
      if (!hit || typeof hit.term !== "string") continue;
      const count = num(hit.count);
      parts.push(count === null ? hit.term : `${hit.term} ×${count}`);
    }
    if (parts.length === 0) continue;
    hitLines.push(el("div", { class: `hits ${variant.key}` }, [
      el("span", { class: "hits-label", text: `${variant.key} slop` }),
      el("span", { class: "hits-list", text: parts.join(", ") }),
    ]));
  }
  if (hitLines.length > 0) body.append(el("div", { class: "hits-block" }, hitLines));

  // judge, moved out of the header — and the direction spelled out, because it
  // is the opposite of every metric in the table above.
  const judgeLines = [];
  for (const axis of SUBSCORES) {
    const b = num(scores && scores.baseline && scores.baseline[axis]);
    const i = num(scores && scores.skilled && scores.skilled[axis]);
    if (b === null && i === null) continue;
    const d = delta(b, i, false);
    judgeLines.push(el("div", { class: "judge-line" }, [
      el("span", { class: "judge-axis", text: axis }),
      el("span", { class: "n bad", text: b === null ? "–" : String(b) }),
      el("span", { class: "arrow", text: "→" }),
      el("span", { class: `n ${d ? d.tone : "flat"}`, text: i === null ? "–" : String(i) }),
    ]));
  }
  if (judgeLines.length > 0) {
    body.append(el("div", { class: "stats-heading" }, [
      el("span", { class: "stats-heading-title", text: "judge score — higher is better" }),
      el("span", {
        class: "stats-heading-note",
        text: "each axis is 1–5, baseline → skilled; the metrics above are lower is better",
      }),
    ]));
    body.append(el("div", { class: "judge-block" }, judgeLines));
    if (typeof scores.verdict === "string" && scores.verdict) {
      body.append(el("p", { class: "verdict", text: scores.verdict }));
    }
  }

  return panel;
}

function createOutputArea({ emptyText = "nothing to show" } = {}) {
  let mode = "side";
  let model = { baseline: null, skilled: null, scores: null, emptyMeta: "" };
  let heavyTimer = 0;
  let lastHeavy = 0;

  const panes = {};
  const paneGrid = el("div", { class: "panes" });
  for (const variant of VARIANTS) {
    const meta = el("span", { class: "pane-meta" });
    const strip = el("div", { class: "strip" });
    const output = el("pre", { class: "code output" });
    panes[variant.key] = { meta, strip, output, digits: 0 };
    paneGrid.append(el("section", { class: `pane ${variant.key}` }, [
      el("header", { class: "pane-head" }, [
        el("span", { class: "dot" }),
        el("span", { class: "pane-title", text: variant.label }),
        el("span", { class: "grow" }),
        meta,
      ]),
      strip,
      output,
    ]));
  }

  const host = el("div", { class: "out-view" });
  const group = `out-view-${(areaSeq += 1)}`;
  const switcher = el("div", { class: "segmented", role: "radiogroup", "aria-label": "Output view" });
  for (const item of OUTPUT_VIEWS) {
    const input = el("input", {
      type: "radio",
      name: group,
      value: item.key,
      ...(item.key === mode ? { checked: "" } : {}),
      onchange: () => {
        mode = item.key;
        paint();
      },
    });
    switcher.append(el("label", { class: "seg", title: `read the two outputs as ${item.label}` }, [
      input,
      el("span", { text: item.label }),
    ]));
  }

  function paintSide() {
    if (host.firstChild !== paneGrid) {
      clear(host);
      host.append(paneGrid);
    }
    const baseMetrics = model.baseline ? model.baseline.metrics : null;
    for (const variant of VARIANTS) {
      const pane = panes[variant.key];
      const data = model[variant.key];
      if (!data) {
        pane.output.classList.add("empty");
        pane.digits = 0;
        paintUnnumbered(pane.output, emptyText);
        pane.meta.textContent = model.emptyMeta || "";
      } else {
        pane.output.classList.remove("empty");
        const fragments = [];
        for (const seg of Array.isArray(data.segments) ? data.segments : []) {
          if (!seg || typeof seg.text !== "string") continue;
          const cls = seg.kind === "stderr" ? "stderr" : seg.kind === "err" ? "err" : null;
          fragments.push({ cls, text: seg.text });
        }
        const lines = toLines(fragments);
        // While a run streams the gutter only ever grows, so passing 9 → 10
        // lines never shifts the text that is already on screen.
        pane.digits = data.streaming
          ? Math.max(pane.digits || 0, lnDigits(lines.length))
          : 0;
        paintNumbered(pane.output, lines, pane.digits);
        pane.meta.textContent = data.meta || "";
        if (data.streaming) pane.output.scrollTop = pane.output.scrollHeight;
      }
      renderStrip(
        pane.strip,
        data ? data.metrics : null,
        variant.key === "skilled" ? baseMetrics : null,
      );
    }
  }

  function paintHeavy() {
    clear(host);
    host.append(mode === "diff" ? diffView(model, emptyText) : statsView(model, emptyText));
  }

  function streaming() {
    return VARIANTS.some((variant) => model[variant.key] && model[variant.key].streaming);
  }

  // A diff (or a metrics table) of a half-arrived stream is churn, so while a
  // run is in flight the heavy views repaint on a timer instead of per chunk.
  function paint() {
    if (heavyTimer) {
      window.clearTimeout(heavyTimer);
      heavyTimer = 0;
    }
    if (mode === "side") {
      paintSide();
      return;
    }
    if (streaming() && Date.now() - lastHeavy < 400) {
      heavyTimer = window.setTimeout(() => {
        heavyTimer = 0;
        lastHeavy = Date.now();
        paintHeavy();
      }, 400);
      return;
    }
    lastHeavy = Date.now();
    paintHeavy();
  }

  // The switcher has no row of its own: the caller drops it into a header it
  // already has, so the output gets that vertical space back.
  const node = el("div", { class: "out-area" }, [host]);
  paint();

  return {
    node,
    switcher,
    update(next) {
      model = next && typeof next === "object"
        ? next
        : { baseline: null, skilled: null, scores: null, emptyMeta: "" };
      paint();
    },
  };
}

// ---------------------------------------------------------------- eval view

function selectEval(slug) {
  view = { kind: "eval", slug };
  renderExplorer();
  const data = details[slug];
  if (!data || typeof data !== "object") {
    setWorkspace(el("p", { class: "placeholder-note", text: `No data for ${slug} — run \`make assemble\`.` }));
    return;
  }
  renderEval(data);
}

// The recorded run sets, fixture first. Nothing is runnable from here any
// more — the select only picks which recording you are reading.
function runSetOptions(ev) {
  const sets = ev.runSets && typeof ev.runSets === "object" ? ev.runSets : {};
  const options = [];
  for (const [key, set] of Object.entries(sets)) {
    if (!set || (!set.baseline && !set.skilled)) continue;
    options.push({
      key,
      label: runSetLabel(key, set.runner, set.model),
      runner: set.runner || null,
      model: set.model || null,
    });
  }
  options.sort((a, b) => {
    if (a.key === FIXTURE) return -1;
    if (b.key === FIXTURE) return 1;
    return a.label.localeCompare(b.label);
  });
  return options;
}

function contextFiles(ev) {
  const list = Array.isArray(ev && ev.context) ? ev.context : [];
  return list.filter((file) => file && typeof file === "object" && typeof file.text === "string");
}

function contextDivider(name) {
  return `── ${typeof name === "string" && name ? name : "context"} ──`;
}

function renderEval(ev) {
  const config = ev.config && typeof ev.config === "object" ? ev.config : {};
  const options = runSetOptions(ev);
  const sets = () => (ev.runSets && typeof ev.runSets === "object" ? ev.runSets : {});
  const files = contextFiles(ev);
  const skillText = typeof ev.skill === "string" ? ev.skill : "";

  // ---- output area: side by side | diff | stats. Built before the header
  // because its switcher sits in that header.
  const area = createOutputArea({ emptyText: "no recording in this run set" });

  // ---- header chrome. The run-set picker only earns its place when there is
  // something to pick: with one recording (or none) the pane meta already says
  // which one you are reading.
  const defaultOption = options[0] || null;
  let select = null;
  if (options.length > 1) {
    select = el("select", { class: "runset", "aria-label": "Run set" });
    for (const option of options) {
      select.append(el("option", { value: option.key, text: option.label }));
    }
    select.value = defaultOption.key;
    select.addEventListener("change", () => {
      apply(options.find((o) => o.key === select.value) || null);
    });
  }

  const header = el("div", { class: "ws-head" }, [
    el("h1", { class: "ws-title", text: config.title || ev.slug || "eval" }),
    skillSlugs(config).length > 0
      ? el("span", { class: "chip", title: "skills prepended in the skilled variant, in order" }, [
        el("span", { class: "chip-key", text: skillSlugs(config).length > 1 ? "skills" : "skill" }),
        el("span", { class: "chip-val", text: skillSlugs(config).join(" + ") }),
      ])
      : null,
    el("span", { class: "grow" }),
    select,
    area.switcher,
  ]);

  // ---- the inputs, read-only, above everything they explain
  const inputs = inputsRow(ev, config, skillText, files);
  const summary = createSummaryBand();
  let bodyNode = null;
  const splitter = createSplitter(() => bodyNode, () => inputs, () => summary.node);

  function apply(option) {
    const set = option ? sets()[option.key] || null : null;
    const model = {
      baseline: null,
      skilled: null,
      scores: set && set.scores && typeof set.scores === "object" ? set.scores : null,
      emptyMeta: option ? option.label : "—",
    };
    for (const variant of VARIANTS) {
      const run = set ? set[variant.key] : null;
      if (!run || typeof run.text !== "string" || run.text.length === 0) continue;
      model[variant.key] = {
        segments: [{ kind: "out", text: run.text }],
        meta: describeRun(run, option),
        metrics: metricsOf(run),
        streaming: false,
      };
    }
    area.update(model);
    summary.update(model, "no recording in this run set");
  }

  bodyNode = el("div", { class: "ws-body" }, [inputs, splitter.node, summary.node, area.node]);
  setWorkspace(header, bodyNode);
  activeSplit = splitter; // after setWorkspace, which clears the previous view's
  splitter.apply(); // needs to be in the document to clamp against its height
  apply(defaultOption);
}

function describeRun(run, option) {
  const parts = [];
  const runner = run.runner || (option && option.runner);
  const model = run.model || (option && option.model);
  if (runner) parts.push(model ? `${runner} · ${model}` : runner);
  else if (option) parts.push(option.label);
  if (typeof run.recorded === "string" && run.recorded) parts.push(run.recorded);
  return parts.join(" · ");
}

// ---------------------------------------------------------------- inputs

// The three inputs, always all three, in composition order, stacked at full
// workspace width. Three columns put every input at ~38 characters, which
// wrapped all of them; full width reads at ~125.
//
// Every input is always shown — no disclosure, nothing to click. The three
// share the region's height and each scrolls inside its own share, so all three
// labels are on screen whatever the split is. Share is weighted by line count,
// clamped: a 40-line skill earns more room than an empty context, but nothing
// can squeeze another input out.
function inputWeight(lines) {
  const n = num(lines);
  if (n === null || n <= 0) return 1;
  return Math.min(Math.max(Math.round(n / 4), 1), 8);
}

function inputSection(label, title, counts, extra, body, weight) {
  const section = el("section", { class: "input-sec" }, [
    el("div", { class: "input-head", title }, [
      el("span", { class: "input-label", text: label }),
      extra ? el("span", { class: "input-src", text: extra }) : null,
      el("span", { class: "grow" }),
      el("span", { class: "input-counts", text: counts }),
    ]),
    body,
  ]);
  section.style.flexGrow = String(weight);
  return section;
}

// eval.json:skills is an array — several skills compose into one <instructions>
// block, in declared order. Empty means both variants run bare.
function skillSlugs(config) {
  return Array.isArray(config.skills) ? config.skills : [];
}

function skillPaths(config) {
  return skillSlugs(config).map((slug) => `skills/${slug}/SKILL.md`).join(" + ");
}

function inputsRow(ev, config, skillText, files) {
  const slugs = skillSlugs(config);
  const skillTitle = slugs.length > 0
    ? `${skillPaths(config)} — prepended only in the skilled variant`
    : "prepended only in the skilled variant";
  const contextTitle = files.length === 0
    ? "no project context — the prompt stands alone"
    : files.length === 1
      ? `project context — ${files[0].name || "1 file"}`
      : `project context — ${files.length} files, in load order`;

  let contextLines = 0;
  let contextChars = 0;
  for (const file of files) {
    const info = textInfo(file.text, file);
    contextLines += info.lines;
    contextChars += info.chars;
  }
  const contextCounts = files.length === 0
    ? "none"
    : files.length > 1
      ? `${fmtInt(contextLines)} lines · ${fmtInt(contextChars)} chars · ${fmtInt(files.length)} files`
      : `${fmtInt(contextLines)} lines · ${fmtInt(contextChars)} chars`;

  const promptInfo = textInfo(ev.prompt, ev.promptInfo);
  const skillInfo = textInfo(skillText, ev.skillInfo);

  return el("div", { class: "inputs" }, [
    inputSection("prompt", "the prompt, identical for both variants",
      countsLabel(ev.prompt, ev.promptInfo), null,
      inputBody(ev.prompt, "(empty)"), inputWeight(promptInfo.lines)),
    inputSection("skill", skillTitle,
      skillText.length > 0 ? countsLabel(skillText, ev.skillInfo) : "none",
      slugs.length > 0 ? skillPaths(config) : null,
      inputBody(skillText, "no skill — both variants run bare"), inputWeight(skillInfo.lines)),
    inputSection("context", contextTitle, contextCounts, null,
      files.length > 0 ? contextBody(files) : inputBody("", "this eval needs no project context"),
      inputWeight(contextLines)),
  ]);
}

// The inputs/outputs split is the user's call, not a fixed percentage: prompts,
// skills and context differ wildly in length. The chosen height is remembered
// across evals and reloads so switching eval never resets it.
const SPLIT_KEY = "ynoslop.inputsHeight";
const SPLIT_MIN = 64;
const SPLIT_OUTPUT_MIN = 180;
const SPLIT_DEFAULT = 232;
let inputsHeight = loadSplit();

function loadSplit() {
  try {
    const raw = Number(localStorage.getItem(SPLIT_KEY));
    return Number.isFinite(raw) && raw >= SPLIT_MIN ? raw : SPLIT_DEFAULT;
  } catch {
    return SPLIT_DEFAULT; // storage blocked; the default is not worth failing over
  }
}

function saveSplit(px) {
  inputsHeight = px;
  try {
    localStorage.setItem(SPLIT_KEY, String(Math.round(px)));
  } catch {
    // ignore — the session still honours the drag
  }
}

// A real `separator`, so the split is draggable with a pointer and adjustable
// from the keyboard: arrows nudge, shift-arrows jump, Home collapses the inputs
// to their labels, double-click restores the default.
function createSplitter(getHost, getInputs, getBand) {
  const handle = el("div", {
    class: "splitter",
    role: "separator",
    tabindex: "0",
    "aria-orientation": "horizontal",
    "aria-label": "Resize the inputs",
    title: "drag to resize · double-click to reset",
  });

  // The ceiling has to leave the output panes SPLIT_OUTPUT_MIN. It is computed
  // from the rows that do not move — the band, this handle, the gaps and the
  // host's padding — never from the current height of the two rows that do,
  // because those are exactly what is being changed: measuring them makes the
  // clamp lag a viewport resize by one pass.
  function maxHeight(host) {
    const style = getComputedStyle(host);
    const pad = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const gap = parseFloat(style.rowGap) || 0;
    const band = getBand();
    const fixed = pad + gap * 3
      + handle.getBoundingClientRect().height
      + (band ? band.getBoundingClientRect().height : 0);
    return host.clientHeight - fixed - SPLIT_OUTPUT_MIN;
  }

  // `persist` separates a deliberate resize from re-asserting the stored value.
  // Only a gesture is remembered, so re-clamping for a smaller viewport never
  // overwrites what the user chose.
  //
  // A host with no height has not been laid out (or is detached): every number
  // derived from it would be garbage, and persisting one would corrupt the
  // stored preference. Do nothing at all until there is a box to measure.
  function apply(px, persist) {
    const host = getHost();
    if (!host || host.clientHeight <= 0) return;
    const max = maxHeight(host);
    const next = Math.round(Math.min(Math.max(px, SPLIT_MIN), Math.max(max, SPLIT_MIN)));
    host.style.setProperty("--inputs-h", `${next}px`);
    handle.setAttribute("aria-valuenow", String(next));
    // With no room between the floor and the ceiling there is no split to
    // choose: the layout is dictating the number, not the reader, and storing it
    // would silently replace their preference with whatever a cramped window
    // allowed. Show it, never remember it.
    if (persist && max > SPLIT_MIN) saveSplit(next);
  }

  function current() {
    const node = getInputs();
    return node ? node.getBoundingClientRect().height : inputsHeight;
  }

  handle.addEventListener("pointerdown", (event) => {
    const startY = event.clientY;
    const startHeight = current();
    handle.classList.add("dragging");
    handle.setPointerCapture(event.pointerId);
    const move = (moveEvent) => apply(startHeight + (moveEvent.clientY - startY), true);
    const stop = () => {
      handle.classList.remove("dragging");
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
      handle.removeEventListener("pointercancel", stop);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
    event.preventDefault();
  });

  handle.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 64 : 16;
    if (event.key === "ArrowUp") apply(current() - step, true);
    else if (event.key === "ArrowDown") apply(current() + step, true);
    else if (event.key === "Home") apply(SPLIT_MIN, true);
    else if (event.key === "End") apply(SPLIT_DEFAULT, true);
    else return;
    event.preventDefault();
  });

  handle.addEventListener("dblclick", () => apply(SPLIT_DEFAULT, true));

  // A shrinking viewport must not leave the outputs below their floor, and a
  // growing one should give the stored preference back — which it does, because
  // re-clamping never persists, so `inputsHeight` still holds what was dragged.
  //
  // Both signals are wired: ResizeObserver catches any change to the workspace
  // box, window resize covers hosts where the observer does not fire. Both call
  // the same idempotent apply, so acting on both is free. Re-clamping rewrites
  // the host's rows and never its own box, so this cannot feed itself.
  const reclamp = () => apply(inputsHeight, false);
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(reclamp) : null;
  window.addEventListener("resize", reclamp);

  return {
    node: handle,
    apply() {
      const host = getHost();
      reclamp();
      if (observer && host) observer.observe(host);
    },
    destroy() {
      if (observer) observer.disconnect();
      window.removeEventListener("resize", reclamp);
    },
  };
}

function inputBody(text, placeholder) {
  return textSurface(el("pre", { class: "code input-body" }), text, placeholder);
}

// Every context file in one surface, each behind a dim divider naming it.
function contextBody(files) {
  const fragments = [];
  files.forEach((file, index) => {
    if (index > 0) fragments.push({ cls: null, text: "\n" });
    fragments.push({ cls: "ctx-divider", text: `${contextDivider(file.name)}\n` });
    fragments.push({ cls: null, text: `${file.text}\n` });
  });
  const pre = el("pre", { class: "code input-body" });
  paintNumbered(pre, toLines(fragments));
  return pre;
}

// Which side the numbers favour, counted over exactly the metrics shown as
// boxes so the arithmetic is checkable on screen. Every one of them is
// lower-is-better, ties are not counted for either side, and the skill losing
// is a real outcome this must be able to report.
function judgeMetrics(base, inst) {
  let baseWins = 0;
  let instWins = 0;
  let compared = 0;
  for (const metric of STRIP_METRICS) {
    const b = num(base && base[metric.field]);
    const i = num(inst && inst[metric.field]);
    if (b === null || i === null) continue;
    compared += 1;
    if (i < b) instWins += 1;
    else if (b < i) baseWins += 1;
  }
  return { baseWins, instWins, compared };
}

// One number: metrics the skill improved minus metrics it made worse. Positive
// means the skill won, negative means the baseline did — which happens, and is
// the whole reason this is shown rather than assumed.
function verdictOf(base, inst) {
  const { baseWins, instWins, compared } = judgeMetrics(base, inst);
  if (compared === 0) return null;
  const net = instWins - baseWins;
  return {
    tone: net === 0 ? "flat" : net > 0 ? "good" : "bad",
    text: signed(net),
    title: `${instWins} of ${compared} metrics better with the skill, ${baseWins} worse`
      + " — every metric below is lower-is-better, ties count for neither side",
  };
}

// The headline numbers, above the output view and independent of it: switching
// to diff or stats must not be the only way to see whether the skill moved
// anything. The stats view still carries the full table, hits and judge.
function createSummaryBand() {
  const boxes = el("div", { class: "sum-boxes" });
  const verdict = el("span", { class: "sum-verdict" });
  const node = el("div", { class: "summary" }, [
    el("div", { class: "sum-call" }, [
      el("span", { class: "sum-title", text: "net metrics" }),
      verdict,
      el("span", { class: "sum-note", text: "lower is better" }),
    ]),
    boxes,
  ]);

  function update(model, emptyText) {
    clear(boxes);
    const base = model.baseline ? model.baseline.metrics : null;
    const inst = model.skilled ? model.skilled.metrics : null;
    const call = base && inst ? verdictOf(base, inst) : null;
    verdict.textContent = call ? call.text : "";
    verdict.className = `sum-verdict ${call ? call.tone : "flat"}`;
    if (call) verdict.title = call.title;
    else verdict.removeAttribute("title");
    if (!base && !inst) {
      boxes.append(el("p", { class: "placeholder-note", text: emptyText || "nothing to measure" }));
      return;
    }
    for (const metric of STRIP_METRICS) {
      const b = num(base && base[metric.field]);
      const i = num(inst && inst[metric.field]);
      const d = delta(b, i);
      boxes.append(el("div", { class: "sbox" }, [
        el("span", { class: "sbox-label", text: metric.label }),
        el("span", { class: "sbox-pair" }, [
          el("span", { class: "sbox-n", text: b === null ? "—" : fmtInt(b) }),
          el("span", { class: "sbox-arrow", text: "→" }),
          el("span", { class: "sbox-n strong", text: i === null ? "—" : fmtInt(i) }),
        ]),
        el("span", {
          class: `sbox-delta ${d ? d.tone : "flat"}`,
          text: !d ? "" : d.pct === null ? signed(d.diff) : `${signed(d.pct)}%`,
        }),
      ]));
    }
  }

  return { node, update };
}

// ---------------------------------------------------------------- comparison

function showScores() {
  view = { kind: "scores" };
  renderExplorer();
  renderScores(scores);
}

function renderScores(rows) {
  // rows -> run set (row) × eval (column)
  const bySet = new Map(); // key -> {label, byEval: Map}
  const columns = [];
  const seenColumns = new Set();

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const key = typeof row.key === "string" ? row.key : "";
    const slug = typeof row.eval === "string" ? row.eval : "";
    if (!key || !slug) continue;
    if (!bySet.has(key)) {
      bySet.set(key, { label: runSetLabel(key, row.runner, row.model), byEval: new Map() });
    }
    bySet.get(key).byEval.set(slug, row);
    if (!seenColumns.has(slug)) {
      seenColumns.add(slug);
      columns.push(slug);
    }
  }

  // Column order follows the explorer; unknown slugs go last.
  const order = new Map(evals.map((ev, index) => [ev.slug, index]));
  columns.sort((a, b) => (order.has(a) ? order.get(a) : 1e9) - (order.has(b) ? order.get(b) : 1e9));

  const setKeys = [...bySet.keys()].sort((a, b) => {
    if (a === FIXTURE) return -1;
    if (b === FIXTURE) return 1;
    return a.localeCompare(b);
  });

  const titleFor = (slug) => {
    const ev = evals.find((e) => e.slug === slug);
    return (ev && ev.title) || slug;
  };

  const header = el("div", { class: "ws-head" }, [
    el("h1", { class: "ws-title", text: "Model comparison" }),
    el("span", { class: "chip" }, [
      el("span", { class: "chip-key", text: "run sets" }),
      el("span", { class: "chip-val", text: String(setKeys.length) }),
    ]),
  ]);

  const tableHost = el("div", { class: "table-wrap compare-wrap" });

  let mode = "judge";
  const modeBar = el("div", { class: "segmented", role: "radiogroup", "aria-label": "Cell contents" });
  for (const item of CELL_MODES) {
    const input = el("input", {
      type: "radio",
      name: "cell-mode",
      value: item.key,
      ...(item.key === mode ? { checked: "" } : {}),
      onchange: () => {
        mode = item.key;
        paint();
      },
    });
    modeBar.append(el("label", { class: "seg" }, [input, el("span", { text: item.label })]));
  }

  function paint() {
    clear(tableHost);
    if (setKeys.length === 0 || columns.length === 0) {
      tableHost.append(el("p", { class: "placeholder-note", text: "No recorded run sets yet." }));
      return;
    }
    const head = el("tr", {}, [el("th", { class: "corner", text: "run set" })]);
    for (const slug of columns) {
      const full = titleFor(slug);
      head.append(el("th", { title: full, text: shortTitle(full) }));
    }
    const body = el("tbody");
    for (const key of setKeys) {
      const entry = bySet.get(key);
      const tr = el("tr", {}, [el("th", { class: "row-head", title: key, text: entry.label })]);
      for (const slug of columns) {
        tr.append(compareCell(entry.byEval.get(slug), mode));
      }
      body.append(tr);
    }
    tableHost.append(el("table", { class: "compare-table" }, [el("thead", {}, [head]), body]));
  }

  setWorkspace(
    header,
    el("div", { class: "ws-body single" }, [
      el("div", { class: "compare-panel" }, [
        el("div", { class: "compare-controls" }, [
          modeBar,
          el("span", {
            class: "hint",
            text: 'run `make eval ARGS="--judge"` for judge scores, `--stats` for a terminal table',
          }),
        ]),
        tableHost,
      ]),
    ]),
  );
  paint();
}

function compareCell(row, mode) {
  const td = el("td", { class: "n" });
  if (!row) return td;

  if (mode === "judge") {
    const scores = row.scores && typeof row.scores === "object" ? row.scores : null;
    const base = sumScore(scores && scores.baseline);
    const inst = sumScore(scores && scores.skilled);
    if (base === null && inst === null) return td;
    const d = delta(base, inst, false);
    td.title = typeof (scores && scores.verdict) === "string" ? scores.verdict : "";
    td.append(pair(base, inst, d, null));
    return td;
  }

  const field = mode === "chars" ? "chars" : "slopWords";
  const metrics = row.metrics && typeof row.metrics === "object" ? row.metrics : null;
  const base = num(metrics && metrics.baseline && metrics.baseline[field]);
  const inst = num(metrics && metrics.skilled && metrics.skilled[field]);
  if (base === null && inst === null) return td;
  const d = delta(base, inst);
  const pct = mode === "chars" && d && d.pct !== null ? `${signed(d.pct)}%` : null;
  td.append(pair(base, inst, d, pct));
  return td;
}

function pair(base, inst, d, suffix) {
  const wrap = el("span", { class: "cell-pair" }, [
    el("span", { class: "n bad", text: base === null ? "–" : fmtInt(base) }),
    el("span", { class: "arrow", text: "→" }),
    el("span", { class: `n ${d ? d.tone : "flat"}`, text: inst === null ? "–" : fmtInt(inst) }),
  ]);
  if (suffix) wrap.append(el("span", { class: `cell-pct ${d ? d.tone : "flat"}`, text: suffix }));
  return wrap;
}

function shortTitle(title) {
  const text = String(title);
  return text.length > 18 ? `${text.slice(0, 17)}…` : text;
}

// ---------------------------------------------------------------- boot

// data.json is a sibling of this file, so any static file server works; a
// missing or malformed one is reported in the page rather than the console.
async function loadData() {
  const res = await fetch("data.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data || typeof data !== "object") throw new Error("not an object");
  return data;
}

try {
  const data = await loadData();
  evals = Array.isArray(data.evals) ? data.evals : [];
  details = data.details && typeof data.details === "object" ? data.details : {};
  scores = Array.isArray(data.scores) ? data.scores : [];
} catch (err) {
  renderExplorer();
  setWorkspace(el("p", { class: "placeholder-note", text: `Could not read data.json (${err}). Run \`make assemble\`.` }));
  throw err;
}

renderExplorer();
if (evals.length > 0) selectEval(evals[0].slug);
else setWorkspace(el("p", { class: "placeholder-note", text: "No evals in data.json — run `make assemble`." }));
