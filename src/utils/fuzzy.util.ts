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
 * 2. Compare `needle` against each word in `haystack`
 * 3. Slide `needle`-length window over `haystack` for partial matches
 * 4. Return the best similarity found (0-1)
 *
 * All comparisons are case-insensitive.
 */
export function fuzzyScore(needle: string, haystack: string): number {
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();

  // exact substring → perfect match
  if (h.includes(n)) return 1;

  let best = 0;

  // word-level comparison
  const words = h.split(/\s+/).filter(Boolean);
  for (const word of words) {
    const sim = fuzzySimilarity(n, word);
    if (sim > best) best = sim;
  }

  // sliding window over haystack (catches partial / run-together words)
  if (n.length <= h.length) {
    for (let i = 0; i <= h.length - n.length; i++) {
      const window = h.slice(i, i + n.length);
      const sim = fuzzySimilarity(n, window);
      if (sim > best) best = sim;
    }
  }

  return best;
}

/**
 * Default minimum similarity to consider a result a "match".
 * 0.5 tolerates roughly half the characters being wrong,
 * which covers most real-world typos for short words.
 */
export const DEFAULT_FUZZY_THRESHOLD = 0.5;
