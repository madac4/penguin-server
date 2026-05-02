/**
 * Fuzzy search utilities based on Levenshtein edit-distance.
 *
 * Used to match user queries that contain typos, transpositions,
 * or partial input (e.g. "rign" → "rings").
 */

/**
 * Classic Levenshtein distance — minimum single-character edits
 * (insertions, deletions, substitutions) to turn `a` into `b`.
 */
export function levenshteinDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;

  // fast paths
  if (la === 0) return lb;
  if (lb === 0) return la;

  // single-row DP (O(min(la,lb)) space)
  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  let curr = new Array<number>(lb + 1);

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,       // insert
        prev[j] + 1,           // delete
        prev[j - 1] + cost,    // substitute
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[lb];
}

/**
 * Compute a 0-1 fuzzy similarity score.
 *
 * The score is `1 - (distance / maxLen)`, so identical strings → 1,
 * completely different strings → close to 0.
 */
export function fuzzySimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Score how well `needle` fuzzy-matches inside `haystack`.
 *
 * Strategy:
 * 1. If `haystack` contains `needle` as a substring → score 1 (perfect)
 * 2. Split both into words; for each needle word find the best-matching
 *    haystack word (substring or Levenshtein similarity)
 * 3. Average scores across needle words so multi-word queries require
 *    all terms to match, not just one
 *
 * Intentionally avoids a sliding character window — that approach produces
 * too many false positives (e.g. "ring" matching "sterling" via "ling").
 * All comparisons are case-insensitive.
 */
export function fuzzyScore(needle: string, haystack: string): number {
  const n = needle.toLowerCase().trim();
  const h = haystack.toLowerCase().trim();

  if (!n || !h) return 0;

  // Full phrase is a substring → perfect score
  if (h.includes(n)) return 1;

  const needleWords = n.split(/\s+/).filter(Boolean);
  const haystackWords = h.split(/\s+/).filter(Boolean);

  // Score each needle word against all haystack words; take the best per word
  let total = 0;
  for (const nw of needleWords) {
    let wordBest = 0;
    for (const hw of haystackWords) {
      // one is a substring of the other → treat as full match for this word
      if (hw.includes(nw) || nw.includes(hw)) {
        wordBest = 1;
        break;
      }
      const sim = fuzzySimilarity(nw, hw);
      if (sim > wordBest) wordBest = sim;
    }
    total += wordBest;
  }

  return total / needleWords.length;
}

/**
 * Default minimum similarity to consider a result a match.
 * 0.6 allows ~1 edit in a 3–4 char word and ~2 edits in a 6+ char word,
 * which covers realistic typos without producing false positives.
 */
export const DEFAULT_FUZZY_THRESHOLD = 0.6;
