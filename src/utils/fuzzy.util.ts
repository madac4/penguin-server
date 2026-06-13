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

function tokenize(value: string): string[] {
  return value.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let length = 0;

  while (length < max && a[length] === b[length]) {
    length += 1;
  }

  return length;
}

function maxTypoDistance(wordLength: number): number {
  if (wordLength <= 2) return 0;
  if (wordLength <= 5) return 1;
  return 2;
}

function hasRelatedPrefix(a: string, b: string): boolean {
  const shorterLength = Math.min(a.length, b.length);
  const requiredPrefix = shorterLength <= 4 ? 2 : 3;

  return commonPrefixLength(a, b) >= requiredPrefix;
}

function fuzzyWordScore(needleWord: string, haystackWord: string): number {
  if (needleWord === haystackWord) return 1;

  if (needleWord.length >= 2 && haystackWord.startsWith(needleWord)) {
    return 0.98;
  }

  if (!hasRelatedPrefix(needleWord, haystackWord)) {
    return 0;
  }

  const distance = levenshteinDistance(needleWord, haystackWord);
  const maxDistance = maxTypoDistance(Math.max(needleWord.length, haystackWord.length));

  if (distance > maxDistance) {
    return 0;
  }

  return fuzzySimilarity(needleWord, haystackWord);
}

/**
 * Score how well `needle` fuzzy-matches inside `haystack`.
 *
 * Strategy:
 * 1. Split both into words; for each needle word find the best-matching
 *    haystack word
 * 2. Exact word matches and haystack words starting with the query score high
 * 3. Typo matches must share a related prefix and stay within a small edit
 *    budget, so "earings" can match "earrings" but not "rings"
 * 4. Average scores across needle words so multi-word queries require
 *    all terms to match, not just one
 *
 * Intentionally avoids arbitrary substring matching and sliding character
 * windows — those approaches produce too many false positives.
 * All comparisons are case-insensitive.
 */
export function fuzzyScore(needle: string, haystack: string): number {
  const n = needle.toLowerCase().trim();
  const h = haystack.toLowerCase().trim();

  if (!n || !h) return 0;

  if (n === h) return 1;

  const needleWords = tokenize(n);
  const haystackWords = tokenize(h);

  if (needleWords.length === 0 || haystackWords.length === 0) return 0;

  // Score each needle word against all haystack words; take the best per word
  let total = 0;
  for (const nw of needleWords) {
    let wordBest = 0;
    for (const hw of haystackWords) {
      const score = fuzzyWordScore(nw, hw);
      if (score > wordBest) wordBest = score;
    }

    if (wordBest === 0) return 0;

    total += wordBest;
  }

  return total / needleWords.length;
}

/**
 * Default minimum similarity to consider a result a match.
 * Word-level scoring rejects unrelated terms before this threshold is applied.
 */
export const DEFAULT_FUZZY_THRESHOLD = 0.6;
