// Deterministic text metrics — no LLM, no network, no state: the same text
// always scores the same. Computed on read from recorded runs and never stored
// in the run files, so the numbers can never drift from the text they describe.

export interface SlopHit {
  term: string;
  count: number;
}

export interface Metrics {
  lines: number;
  chars: number;
  words: number;
  /** Total lexicon hits across all terms. */
  slopWords: number;
  emoji: number;
  bullets: number;
  headings: number;
  exclamations: number;
  emDashes: number;
  /** Terms that actually appear, most frequent first, capped at MAX_HITS. */
  hits: SlopHit[];
}

/** Size of an input (prompt, skill, context file) without the full metric set. */
export interface TextInfo {
  lines: number;
  chars: number;
}

/**
 * Curated slop markers taken from the rules in `skills/no-slop-writing.md`
 * and `skills/humanizer.md`. Single words match whole words only;
 * everything else (spaces, apostrophes, hyphens) matches as a substring, so
 * `game-chang` catches both "game-changing" and "game-changer".
 */
export const SLOP_LEXICON: readonly string[] = [
  // Puffery and filler single words.
  "delve",
  "crucial",
  "pivotal",
  "seamless",
  "robust",
  "vibrant",
  "tapestry",
  "landscape",
  "testament",
  "showcase",
  "underscore",
  "leverage",
  "utilize",
  "comprehensive",
  "effortless",
  "unleash",
  "supercharge",
  "groundbreaking",
  "breathtaking",
  "nestled",
  "elevate",
  // Filler phrases and stock openers/closers.
  "it's important to note",
  "it is worth noting",
  "in today's",
  "at the end of the day",
  "when it comes to",
  "a wide range of",
  "look no further",
  "in summary",
  "in conclusion",
  "let me know",
  "i hope this helps",
  "great question",
  "great catch",
  "feel free",
  "dive in",
  "let's explore",
  "rest assured",
  "best practices",
  "game-chang",
  "cutting-edge",
  "blazingly",
  "not just",
  "serves as",
  "stands as",
];

const MAX_HITS = 8;

// A lexicon entry of nothing but letters is a word; anything else is a phrase.
const SINGLE_WORD_RE = /^[a-z]+$/;

function escapeRe(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Terms are lowercase, so the haystack is lowercased once instead of using /i.
// Curly apostrophes are straightened so "it's important to note" still matches.
function normalize(text: string): string {
  return text.replace(/[‘’]/g, "'").toLowerCase();
}

const TERM_PATTERNS: { term: string; re: RegExp }[] = SLOP_LEXICON.map((term) => ({
  term,
  re: new RegExp(SINGLE_WORD_RE.test(term) ? `\\b${escapeRe(term)}\\b` : escapeRe(term), "g"),
}));

const BULLET_RE = /^\s*([-*•]|\d+\.)\s/;
const HEADING_RE = /^#{1,6}\s/;
const EMOJI_RE = /\p{Extended_Pictographic}/gu;
const EM_DASH_RE = /[—–]/g;

/** Newline-delimited lines, ignoring trailing blank lines; empty text is 0. */
function countLines(text: string): number {
  const body = text.replace(/\n+$/, "");
  return body === "" ? 0 : body.split("\n").length;
}

export function computeMetrics(text: string): Metrics {
  const haystack = normalize(text);
  const lines = text.split("\n");
  const hits: SlopHit[] = [];
  let slopWords = 0;
  for (const { term, re } of TERM_PATTERNS) {
    const count = haystack.match(re)?.length ?? 0;
    if (count === 0) continue;
    slopWords += count;
    hits.push({ term, count });
  }
  // Count desc, then term asc — plain comparison, not locale-dependent.
  hits.sort((a, b) => b.count - a.count || (a.term < b.term ? -1 : a.term > b.term ? 1 : 0));
  return {
    lines: countLines(text),
    chars: text.length,
    words: text.split(/\s+/).filter((w) => w !== "").length,
    slopWords,
    emoji: text.match(EMOJI_RE)?.length ?? 0,
    bullets: lines.filter((l) => BULLET_RE.test(l)).length,
    headings: lines.filter((l) => HEADING_RE.test(l)).length,
    exclamations: (text.match(/!/g) ?? []).length,
    emDashes: text.match(EM_DASH_RE)?.length ?? 0,
    hits: hits.slice(0, MAX_HITS),
  };
}

export function textInfo(text: string): TextInfo {
  return { lines: countLines(text), chars: text.length };
}
