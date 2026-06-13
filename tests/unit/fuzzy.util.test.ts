import { DEFAULT_FUZZY_THRESHOLD, fuzzyScore } from '@/utils/fuzzy.util';

describe('fuzzyScore', () => {
  it('matches a product word with a small typo', () => {
    expect(fuzzyScore('earings', 'Silver Earrings')).toBeGreaterThanOrEqual(
      DEFAULT_FUZZY_THRESHOLD,
    );
  });

  it('does not match a different shorter word inside the query', () => {
    expect(fuzzyScore('earings', 'Gold Rings')).toBeLessThan(DEFAULT_FUZZY_THRESHOLD);
  });

  it('does not match unrelated product words with weak similarity', () => {
    expect(fuzzyScore('earings', 'Sterling Necklace')).toBeLessThan(DEFAULT_FUZZY_THRESHOLD);
  });

  it('requires every search term to match in multi-word queries', () => {
    expect(fuzzyScore('gold earings', 'Gold Earrings')).toBeGreaterThanOrEqual(
      DEFAULT_FUZZY_THRESHOLD,
    );
    expect(fuzzyScore('gold earings', 'Gold Rings')).toBeLessThan(DEFAULT_FUZZY_THRESHOLD);
  });
});
