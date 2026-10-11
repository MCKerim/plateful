/** Lowercased, trimmed, diacritics folded so "apfel" finds "Äpfel". */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** Optimal string alignment distance: insert, delete, substitute, swap neighbours. */
export function editDistance(left: string, right: string): number {
  const a = Array.from(left);
  const b = Array.from(right);
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let previous2 = new Array<number>(b.length + 1).fill(0);
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  let current = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        current[j] = Math.min(current[j], previous2[j - 2] + 1);
      }
    }
    [previous2, previous, current] = [previous, current, previous2];
  }
  return previous[b.length];
}

/**
 * How well a normalized candidate matches a normalized query, higher is better,
 * null for no match: exact 100, prefix 90, word start 85, substring 70, then a
 * typo or two (1 from 4 letters, 2 from 6) on the whole name, its query-length
 * prefix or any word.
 */
export function fuzzyScore(query: string, candidate: string): number | null {
  if (candidate === query) return 100;
  if (candidate.startsWith(query)) return 90;
  const words = candidate.split(" ").filter(Boolean);
  if (words.some((word) => word.startsWith(query))) return 85;
  if (candidate.includes(query)) return 70;
  const queryLength = Array.from(query).length;
  const tolerance = queryLength >= 6 ? 2 : queryLength >= 4 ? 1 : 0;
  if (tolerance === 0) return null;
  let best: number | null = null;
  const consider = (other: string, base: number) => {
    if (Math.abs(Array.from(other).length - queryLength) > tolerance) return;
    const distance = editDistance(query, other);
    if (distance > tolerance) return;
    const score = base - distance * 5;
    if (best === null || score > best) best = score;
  };
  consider(candidate, 65);
  consider(Array.from(candidate).slice(0, queryLength).join(""), 60);
  for (const word of words) consider(word, 55);
  return best;
}
