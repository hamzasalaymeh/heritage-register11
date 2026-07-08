import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { cosine, embed, tokenize } from './embedding.js';
import type { MemoryRecord, ModuleId } from './types.js';

/** Stored form: the public record plus its embedding vector. */
interface StoredMemory extends MemoryRecord {
  vector: number[];
}

/**
 * Vector-based long-term memory persisted to disk as JSON. Retrieval ranks
 * memories by cosine similarity to the query embedding, weighted by
 * reinforcement strength and recency; every recall reinforces the memory
 * (Hebbian-style). Embeddings are local (see embedding.ts) — swap in a real
 * embedding API without changing this class's interface.
 */
export class MemoryStore {
  private records: StoredMemory[] = [];

  constructor(private file: string) {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.file)) {
        const raw: (MemoryRecord & { vector?: number[] })[] = JSON.parse(
          fs.readFileSync(this.file, 'utf8'),
        );
        // Backfill vectors for engrams written by older versions.
        this.records = raw.map((r) => ({ ...r, vector: r.vector ?? embed(r.text) }));
      }
    } catch {
      this.records = [];
    }
  }

  private save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.records, null, 2));
  }

  /** Strip the embedding before a record goes over the wire. */
  private toPublic({ vector: _vector, ...pub }: StoredMemory): MemoryRecord {
    return pub;
  }

  all(): MemoryRecord[] {
    return this.records.map((r) => this.toPublic(r)).sort((a, b) => b.createdAt - a.createdAt);
  }

  clear() {
    this.records = [];
    this.save();
  }

  recall(query: string, limit = 4): MemoryRecord[] {
    if (this.records.length === 0) return [];
    const qv = embed(query);
    const now = Date.now();
    const scored = this.records
      .map((r) => {
        const similarity = cosine(qv, r.vector);
        const ageDays = (now - r.createdAt) / 86_400_000;
        const recency = Math.exp(-ageDays / 30);
        return { r, similarity, score: similarity * (1 + Math.log1p(r.strength)) * (0.5 + recency) };
      })
      .filter((s) => s.similarity > 0.12)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Reinforce recalled memories.
    for (const { r } of scored) r.strength += 1;
    if (scored.length > 0) this.save();
    return scored.map((s) => this.toPublic(s.r));
  }

  write(text: string, modules: ModuleId[]): MemoryRecord {
    const record: StoredMemory = {
      id: randomUUID(),
      text: text.slice(0, 500),
      tags: tokenize(text).slice(0, 8),
      modules,
      createdAt: Date.now(),
      strength: 1,
      vector: embed(text),
    };
    this.records.push(record);
    if (this.records.length > 200) this.records.shift();
    this.save();
    return this.toPublic(record);
  }
}
