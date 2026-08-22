# ynoslop — design spec

What the interface must look like and behave like, and why. Product scope and
requirements live in `PRD.md`; contributor mechanics in `AGENTS.md`. This
document is the authority for anything visual: if the code disagrees with it,
one of the two is a bug.

## Goals

1. The difference between the two outputs registers before anything is read.
2. Numbers are visible next to the text they describe, not on another screen.
3. The inputs the model actually received are always inspectable, never hidden
   behind a modal.
4. Running a model is a deliberate act at the command line, never a click. The
   page cannot spawn one at all.

## Principles

- **The comparison is the hero.** Panes get the space; chrome gets the
  leftovers.
- **Numbers over adjectives.** Any claim the UI makes about output quality is a
  measurement with a definition, not a label.
- **Variants are not moral categories.** The run without a skill is not "bad".
  Identity is carried by hue, never by right/wrong coloring. Red and green are
  reserved for two things that genuinely are better/worse: metric deltas and
  diff rows.
- **Density is fine, decoration is not.** This is an instrument. Small type and
  tight rows are welcome; gradients, shadows, rounded cards inside rounded
  cards, and emoji in chrome are not.
- **One vocabulary.** The words on screen, in `data.json` and on disk match —
  there is no API to disagree with: eval, prompt, skill, context, baseline,
  skilled, run set. **Target** (one `{runner, model, runs}` cell) and **suite**
  (a named list of targets plus plan options, from the root `suites.json`) are
  now real, but they belong to the harness: the page shows what was recorded,
  never a plan, so neither needs to appear in the chrome yet. One word is
  settled and still unbuilt, and must not appear in the UI until it is real:
  **sample** (`runs/<key>/<n>/`, one baseline+skilled pair). The single
  exception to the shared vocabulary is documented below.

## Layout

Three regions, fixed:

```
┌─────────────────────────────────────────────────────────────┐
│ topbar   logo · wordmark · headline     [Model comparison]   │ 54px
├───────────────┬─────────────────────────────────────────────┤
│ explorer      │ workspace                                   │
│ 236px         │  ws-head: title · chip · run-set select ·   │
│               │           view switcher: side | diff | stats│
│ evals,        │  ├─ inputs: prompt / skill / context        │
│ grouped by    │  │           three rows, all open, weighted │
│ category      │  ├─ splitter ·············· drag to resize  │
│               │  ├─ summary band: one number · six metrics  │
│               │  └─ output area (the hero)                  │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

- **Topbar** carries identity and the one destination that is not a browse
  target: Model comparison, as a pill on the right. It is the only
  accent-filled control in the chrome when active.
- **Explorer** is evals only. Categories are quiet subheads; rows are one
  line with the description in `title`.
- **Workspace** never scrolls as a whole. The output panes and each input
  scroll inside themselves.

**The page reads top to bottom in causal order**: what the model was given,
what the numbers say about what came back, then the text itself. Inputs sit
above the outputs because they are the cause, and because the outputs are the
part worth the remaining height.

**Inputs are three rows at full workspace width**, in composition order, all
three always shown. Nothing collapses and nothing is behind a tab: the reader
came to compare a prompt, a skill and a context, so hiding any of them behind a
click is work with no payoff.

Two layouts were tried and cut. Tabs put the skill — the variable under test —
one click away from its own effect. Three side-by-side columns put every input
at 337px of a 1030px workspace, about 38 characters after the gutter, which
wrapped every prompt, skill and diff two or three times; full width reads at
about 125.

The skill row holds **every skill the eval names**, in the order they were
composed, because that is the text the model received — one pane, not one pane
per skill, for the same reason context is one blob. Its header names the paths;
an eval naming no skill says `none` and its two panes are a control, not a
broken recording.

Each row takes a **weighted share** of the region and scrolls inside it, so all
three labels stay on screen at any size. The weight is the line count over four,
clamped to 1–8: a 36-line skill earns more room than an empty context, and
nothing can squeeze another input out of view. A header never shrinks, so the
smallest share still shows its label, source and size in full.

**The split is the reader's to set.** A `separator` between the inputs and the
band drags with the pointer, takes arrows and shift-arrows from the keyboard,
`Home`/`End` for the extremes, and double-click to reset. Fixed percentages
cannot be right here — a 2-line prompt and a 100-line skill want different
splits — so the number is a preference, remembered across evals and reloads.

Two floors hold whatever is dragged: the inputs stop at 64px, still showing all
three labels, and the outputs never go below 180px. Both are enforced against
the rows that do not move, so a shrinking window re-clamps in one pass — and
because re-clamping never writes to storage, growing the window restores what
was chosen. A cramped window can never overwrite the preference with the only
number that fit.

## Color

Light only. No `prefers-color-scheme` overrides: this is a single deliberate
surface, and a half-maintained dark theme is worse than none.

| Token | Value | Role |
|---|---|---|
| `--surface` | `#ffffff` | panels, topbar, explorer |
| `--app-bg` | `#f7f8fa` | the ground behind panels |
| `--subtle` | `#fafbfc` | tab strips, sub-headers |
| `--border` | `#e3e7ec` | hairlines |
| `--border-strong` | `#d5dae1` | control outlines |
| `--fg` | `#1a2027` | body text |
| `--muted` | `#667180` | secondary text, labels |
| `--accent` | `#2f6bff` | interactive only — never a variant identity |
| `--accent-soft` | `#eef3ff` | active row, primary button ground |
| `--bad` / `--good` | `#c03329` / `#157a41` | deltas only (and the wordmark strike) |
| `--del-bg` / `--add-bg` | `#fdecea` / `#eaf6ee` | diff rows only |
| `--line-num` | `#9ba5b2` | gutter digits |
| `--pane-base-*` | sand: bg `#fdf7f1`, ink `#8f5a1c`, edge `#e0b483` | the run **without** a skill |
| `--pane-skill-*` | teal: bg `#f1f8f8`, ink `#0f6560`, edge `#9fd4d0` | the run **with** a skill |

**Semantics are strict.** Blue means "you can interact with this". Sand and
teal mean "this is variant A / variant B" and carry no judgment. Red and green
mean "this number moved in a direction you care about". A designer adding a new
color must say which of these four jobs it does, or not add it.

The pane tint covers the whole pane body, not just its header, so the two are
distinguishable while you are reading the text rather than only when you look at
the label.

## Typography

- Chrome: `system-ui` stack. 12.5–13px body, 10.5–11px labels, 17–18px titles.
- Content: `ui-monospace, SFMono-Regular, Menlo, monospace` at 11.5–12px for
  every prompt, skill, context, output, diff and table cell. All model input and
  output is monospaced — it is text under measurement, not prose to enjoy.
- Numbers in the summary band and tables use tabular figures so columns align.
- Labels are lowercase or small-caps with wide tracking; no title case.

## Components

- **Wordmark.** `ynoslop` with `slop` struck through in `--bad`. The name
  states the product's job; the strike shows it happening.
- **Logo.** Three stacked bars, 16 → 11 → 6 units wide, fading from muted red to
  green: a long sloppy answer becoming a short clean one. Also the favicon.
- **View switcher.** A segmented control in the workspace head:
  `side by side | diff | stats`. Three views, and only three — they are the
  three ways to read one pair of outputs. A fourth tab for per-eval prose was
  proposed and is not coming; see the decision log.
- **Output pane.** Colored top edge and dot, small-caps variant label, right-
  aligned `runner · model · recorded`, then its metric strip, then the text.
- **Metric strip.** Value over label inside each pane, six of them: lines,
  chars, words, slop, emoji, bullets. The skilled pane carries the delta against
  baseline as a colored suffix. It says what *this* side measured, next to the
  text it measured; the band above compares the two.
- **Splitter.** A hairline grip between the inputs and the band, thickening on
  hover and focus. `row-resize`, and a real `separator` with `aria-valuenow`.
- **Summary band.** One row between the inputs and the outputs, visible in
  every view: the verdict cell, then six boxes — lines, chars, words, slop,
  emoji, bullets — each reading `baseline → skilled` with the delta. Reading
  the numbers must never require switching view.
- **The one number.** The verdict cell, on the left where reading starts:
  metrics improved minus metrics worsened, signed, at 26px, labelled *net
  metrics* over *lower is better*. Positive means the skill helped, negative
  means it hurt — which happens, and stating it is the point of a measurement
  tool. It counts exactly the six boxes beside it, so the arithmetic is
  checkable on screen, and its `title` spells out the tally.
- **Line numbers.** A muted right-aligned gutter on every monospace surface,
  one number per logical line so wrapped lines stay aligned. `user-select:
  none`, so copying a pane yields clean text. Every such surface is read-only —
  there is no editable field anywhere in the page.
- **Diff.** Unified, one row per line, two gutters (old, new), `-`/`+` signs,
  `--del-bg` / `--add-bg` rows, horizontal scroll rather than wrapping.
- **Stats.** Metric table (baseline | skilled | delta) headed *lower is better*,
  the top slop hits per side, then the judge block headed *higher is better* —
  the inversion is stated because two scales pointing opposite ways in one view
  is the single most confusing thing this UI can do.
- **Buttons.** There are none that do work. The page has no run control,
  because it has no way to run anything.

## Interaction

- Nothing in the page triggers a model call; there is no code path that could.
- Switching run set or view is instant — everything is already in memory from
  `data.json`.
- Empty states say what to do next in plain words and never get a line number.
  A missing `data.json` says to run `make assemble`.

## Accessibility

- Every control is a real `button` or `select`, reachable by keyboard, with a
  `title` where the label is abbreviated. The splitter is a focusable
  `separator` carrying `aria-valuenow`, adjustable entirely from the keyboard —
  a drag handle that only works with a pointer is not a control.
- Variant identity is never carried by color alone: each pane also states
  "without skill" / "with skill" in text.
- Label text meets 4.5:1 against its own pane tint.
- Dynamic text is set with `textContent`; no HTML is ever built from model
  output or user input.

## Deliberate exclusions

A server. Dark mode. Emoji or icon fonts in chrome (inline SVG only; emoji
inside eval content is demo material and renders as-is). A markdown renderer
— model output is shown as the text it is. Any CSS framework or JS library. A
build step. Animation beyond default focus states.

## Documented inconsistency

The composed prompt wraps the skill body in `<instructions>…</instructions>`,
not `<skill>`. That tag is model-facing, `<instructions>` is the clearer signal
to a model, and changing it would break comparability with every existing
recording. This is the one place the product's vocabulary and the wire format
disagree, on purpose.

## Decision log

- **White, not the dark console direction.** Three directions were drawn
  (dark mono console, warm editorial serif, light engineering instrument). The
  light instrument won: this is a measurement tool, and a paper-white surface
  keeps the attention on the text being measured.
- **Stats moved from an input tab to an output view.** Statistics describe the
  outputs; grouping them with the inputs implied they were something the model
  received.
- **The judge left the header.** It sat next to lower-is-better metrics while
  being higher-is-better. It now lives in the stats view with its direction
  spelled out.
- **Running left the product entirely.** Recordings come from `make eval` and
  nothing else; the page is a static file with no way to spawn a model. Cheap
  re-running invited spending money by reflex, and the playground that offered
  it cost a server, an HTTP attack surface and a third of the frontend to
  maintain.
- **Inputs moved above the outputs, and took three tries to lay out.** They
  were a tabbed drawer under the panes, which put the skill — the variable under
  test — below its own effect. Moving them up fixed the order. Three equal
  columns then fixed the wrong problem: 337px per column wrapped everything.
  Disclosures read better but made the reader click to see inputs they had come
  to compare. What survived is all three at full width, sharing the height by
  weight, with the split itself handed to the reader. An eval with no context
  says `none` rather than hiding anything.
- **The split is dragged, not decided here.** Every fixed percentage was wrong
  for some eval: a 2-line prompt wastes the space a 100-line skill needs. The
  design owns the floors — 64px of inputs, 180px of outputs — and the reader
  owns everything between them.
- **The band was added; the per-pane strips stayed.** The strips were cut first,
  as twelve numbers saying what six could — but they answer a different
  question. A strip says what one side measured, beside the text it measured; the
  band compares the two sides and survives a switch to diff or stats, which the
  strips do not. Both are kept deliberately, and the open question about the
  strip carrying too much is still open.
- **Context is one blob, not a file tree.** Multiple files are supported on
  disk and shown with `── filename ──` dividers; there is no file management
  interface, because that was interface for its own sake.
- **"Skill", not "instruction".** The word people already use won.
  `<instructions>` in the wire format is the sole exception.
- **Pane identity by hue, not by red/green.** Calling the baseline run "bad"
  prejudged the comparison the tool exists to make.
- **The fourth view, for per-eval prose, was cancelled before it was built.**
  A `usage.md` per eval was loaded and published, and the plan was a `usage`
  tab beside the three output views. It never shipped in `public/app.js` and
  now never will: the prose quoted exact character counts from recordings that
  `make eval` overwrites, so it went stale silently while still looking
  authoritative — the one thing a measurement tool must not do. The file and
  the feature are both gone. Intent lives in one line of `eval.json`; numbers
  come from the recordings.
- **A skill is a folder, and the input label says so.** The skill pane names
  `skills/<slug>/SKILL.md` — every slug the eval declares, in composed order —
  and those paths are the whole answer to "which text was prepended": there is
  no per-eval override to disambiguate them any more, and the upstream
  frontmatter is stripped, so the size shown is body only.
- **"Target" and "suite" exist now; "sample" is still reserved.** All three
  words were fixed before any of them was built, so the eventual UI would not
  invent a second set. Two have landed — a suite in `suites.json` names the
  targets a recording run fills — and they stayed in the harness rather than
  arriving in the chrome, because the page shows what was recorded and a plan is
  not a recording. `sample` must still not appear anywhere in the UI: every
  number shown is n=1, so a skill's effect cannot yet be told apart from a
  sampling accident, and showing the word would promise a spread that does not
  exist.
- **Skills became a list, and the pane did not become a list of panes.**
  `eval.json:skill` was one slug; it is now `skills`, an array whose bodies
  concatenate in declared order into the single `<instructions>` block. The
  screen follows the wire: one skill pane holding the composed text, because
  what is under test is the instruction the model actually received, and
  splitting it into a pane per file would show a decomposition the model never
  saw. The order is load-bearing and therefore visible — reordering the array
  changes the prompt and invalidates earlier recordings. An empty array is a
  legitimate eval, not an error: both variants run bare, the pane reads `none`,
  and the comparison is a control against which a real skill's numbers can be
  read.
- **`defaultRunner` left `eval.json`, and nothing in the UI replaced it.** An
  eval used to name the CLI it would be recorded with. Suites name that now, and
  a per-eval default was a strictly weaker way of saying the same thing — a
  second place a runner could be written down, and disagree with the plan being
  run. The page never showed it, so nothing visual was lost; the reason it is
  logged here is the rule it settles, which is that the UI reports run sets that
  exist on disk and never advertises a run that would happen next. Advertising
  one is the first step toward a button that spends money, and there is no
  button.

## Open design questions

1. **Whose default is the landing view?** The evaluator wants density; the
   colleague being convinced wants one eval, one number pair and no
   vocabulary. Currently the evaluator wins everywhere. Options on the table: a
   demo-first landing screen, or a simple/advanced toggle.
2. **Should emoji be exempt from delta coloring per skill?** `attention-rundown`
   mandates status emoji, so its eval correctly gains emoji and is currently
   colored as a regression.
3. **Is the net-metric number too blunt?** It weighs `emoji` the same as
   `slopWords`, and treats fewer lines as better unconditionally. A weighted
   score would be more accurate and much harder to check by eye. Unresolved.
4. **How does a run set of many samples read on screen?** Nothing is built
   yet, and the summary band assumes one pair. A mean with a spread, or the
   samples listed, or one representative sample — undecided, and it decides
   whether the "one number" survives.
5. **Does the metric strip carry too much now the band exists?** Six numbers per
   pane is twelve on screen, beside six pairs in the band. Cutting the strips to
   chars and slop is drafted and not applied; the argument against is that a
   strip answers "what did this side measure", which the band does not.
