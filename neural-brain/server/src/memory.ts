import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { MemoryRecord, ModuleId } from './types.js';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'for', 'with',
  'is', 'are', 'was', 'be', 'it', 'this', 'that', 'what', 'how', 'why', 'i',
  'you', 'my', 'me', 'we', 'do', 'does', 'can', 'could', 'should', 'would',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Long-term memory persisted to disk as JSON. Retrieval scores memories by
 * keyword overlap with the query, weighted by reinforcement strength and
 * recency; every recall reinforces the memory (Hebbian-style).
 */
export class MemoryStore {
  private records: MemoryRecord[] = [];

  constructor(private file: string) {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.file)) {
        this.records = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      }
    } catch {
      this.records = [];
    }
  }

  private save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.records, null, 2));
  }

  all(): MemoryRecord[] {
    return [...this.records].sort((a, b) => b.createdAt - a.createdAt);
  }

  clear() {
    this.records = [];
    this.save();
  }

  recall(query: string, limit = 4): MemoryRecord[] {
    const q = new Set(tokenize(query));
    if (q.size === 0) return [];
    const now = Date.now();
    const scored = this.records
      .map((r) => {
        const words = tokenize(r.text + ' ' + r.tags.join(' '));
        const overlap = words.filter((w) => q.has(w)).length;
        const ageDays = (now - r.createdAt) / 86_400_000;
        const recency = Math.exp(-ageDays / 30);
        return { r, score: overlap * (1 + Math.log1p(r.strength)) * (0.5 + recency) };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Reinforce recalled memories.
    for (const { r } of scored) r.strength += 1;
    if (scored.length > 0) this.save();
    return scored.map((s) => s.r);
  }

  write(text: string, modules: ModuleId[]): MemoryRecord {
    const record: MemoryRecord = {
      id: randomUUID(),
      text: text.slice(0, 500),
      tags: tokenize(text).slice(0, 8),
      modules,
      createdAt: Date.now(),
      strength: 1,
    };
    this.records.push(record);
    if (this.records.length > 200) this.records.shift();
    this.save();
    return record;
  }
}
