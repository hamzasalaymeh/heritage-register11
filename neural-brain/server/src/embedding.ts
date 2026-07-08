/**
 * Lightweight local text embeddings: hashed bag-of-features (word unigrams,
 * word bigrams, character trigrams) projected into a fixed-size vector and
 * L2-normalized. No external API or model download needed, deterministic,
 * and good enough for semantic-ish recall over short memory engrams.
 * Swap this file for a real embedding API (e.g. Voyage AI) without touching
 * the MemoryStore interface.
 */

export const EMBEDDING_DIM = 256;

/** FNV-1a 32-bit hash. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'for', 'with',
  'is', 'are', 'was', 'be', 'it', 'this', 'that', 'what', 'how', 'why', 'i',
  'you', 'my', 'me', 'we', 'do', 'does', 'can', 'could', 'should', 'would',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function features(text: string): string[] {
  const words = tokenize(text);
  const feats: string[] = [...words];
  for (let i = 0; i < words.length - 1; i++) feats.push(`${words[i]}_${words[i + 1]}`);
  for (const w of words) {
    for (let i = 0; i <= w.length - 3; i++) feats.push(`#${w.slice(i, i + 3)}`);
  }
  return feats;
}

/** Embed text into a normalized EMBEDDING_DIM-dimensional vector. */
export function embed(text: string): number[] {
  const v = new Float64Array(EMBEDDING_DIM);
  for (const f of features(text)) {
    const h = fnv1a(f);
    const idx = h % EMBEDDING_DIM;
    const sign = (h >>> 16) & 1 ? 1 : -1; // signed hashing reduces collisions bias
    const weight = f.startsWith('#') ? 0.35 : f.includes('_') ? 1.4 : 1;
    v[idx] += sign * weight;
  }
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  return Array.from(v, (x) => Math.round((x / norm) * 1e4) / 1e4);
}

/** Cosine similarity of two normalized vectors. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
}
