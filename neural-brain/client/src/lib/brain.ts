import type { Edge, Node } from 'reactflow';
import type { ModuleId } from '../types';

export interface ModuleMeta {
  id: ModuleId;
  label: string;
  color: string;
}

/**
 * Categorical module palette (identity colors). Ring order alternates hue
 * families so adjacent modules stay distinguishable under CVD — validated
 * with the dataviz palette validator against the dark surface (#060913).
 * Identity is never color-alone: every hub renders its module label.
 */
export const MODULES: ModuleMeta[] = [
  { id: 'goals', label: 'Goals', color: '#fbbf24' },
  { id: 'logic', label: 'Logic', color: '#60a5fa' },
  { id: 'finance', label: 'Finance', color: '#a3e635' },
  { id: 'creativity', label: 'Creativity', color: '#e879f9' },
  { id: 'learning', label: 'Learning', color: '#2dd4bf' },
  { id: 'risk', label: 'Risk', color: '#fb7185' },
  { id: 'planning', label: 'Planning', color: '#22d3ee' },
  { id: 'health', label: 'Health', color: '#fb923c' },
  { id: 'engineering', label: 'Engineering', color: '#a78bfa' },
  { id: 'memory', label: 'Memory', color: '#34d399' },
];

export const MODULE_MAP = new Map(MODULES.map((m) => [m.id, m]));
export const moduleColor = (id: ModuleId) => MODULE_MAP.get(id)?.color ?? '#22d3ee';
export const hubId = (m: ModuleId) => `hub-${m}`;

export const NEURONS_PER_MODULE = 26;

/** Deterministic PRNG so the brain has a stable anatomy across reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface NeuronData {
  module: ModuleId;
  color: string;
}
export interface HubData extends NeuronData {
  label: string;
}

const CENTER = { x: 640, y: 470 };
const RING_RADIUS = 360;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export interface BrainGraph {
  nodes: Node<NeuronData | HubData>[];
  edges: Edge[];
  /** neuron node ids per module (excluding the hub) */
  neuronsByModule: Record<ModuleId, string[]>;
}

/** Builds the full brain anatomy: 10 module hubs + hundreds of neurons + synapses. */
export function generateBrain(): BrainGraph {
  const rand = mulberry32(1337);
  const nodes: Node<NeuronData | HubData>[] = [];
  const edges: Edge[] = [];
  const neuronsByModule = {} as Record<ModuleId, string[]>;

  MODULES.forEach((mod, mi) => {
    const angle = (mi / MODULES.length) * Math.PI * 2 - Math.PI / 2;
    const hx = CENTER.x + Math.cos(angle) * RING_RADIUS;
    const hy = CENTER.y + Math.sin(angle) * RING_RADIUS * 0.82;

    nodes.push({
      id: hubId(mod.id),
      type: 'hub',
      position: { x: hx, y: hy },
      data: { module: mod.id, color: mod.color, label: mod.label },
      draggable: false,
      selectable: true,
    });

    const ids: string[] = [];
    for (let i = 0; i < NEURONS_PER_MODULE; i++) {
      const r = 46 + Math.sqrt(i / NEURONS_PER_MODULE) * 96 * (0.75 + rand() * 0.5);
      const a = i * GOLDEN + angle;
      const id = `n-${mod.id}-${i}`;
      ids.push(id);
      nodes.push({
        id,
        type: 'neuron',
        position: { x: hx + Math.cos(a) * r, y: hy + Math.sin(a) * r * 0.9 },
        data: { module: mod.id, color: mod.color },
        draggable: false,
        selectable: false,
      });
      // Spoke: hub → neuron (a sample, to keep edge count sane)
      if (i % 2 === 0) {
        edges.push({
          id: `spoke-${mod.id}-${i}`,
          source: hubId(mod.id),
          target: id,
          type: 'signal',
          data: { module: mod.id, kind: 'spoke' },
        });
      }
      // Intra-module synapse to a random earlier neuron
      if (i > 1 && rand() < 0.55) {
        const j = Math.floor(rand() * i);
        edges.push({
          id: `syn-${mod.id}-${i}-${j}`,
          source: id,
          target: `n-${mod.id}-${j}`,
          type: 'signal',
          data: { module: mod.id, kind: 'synapse' },
        });
      }
    }
    neuronsByModule[mod.id] = ids;
  });

  // Cortical ring: hub → next hub
  for (let i = 0; i < MODULES.length; i++) {
    const a = MODULES[i].id;
    const b = MODULES[(i + 1) % MODULES.length].id;
    edges.push({
      id: `ring-${a}-${b}`,
      source: hubId(a),
      target: hubId(b),
      type: 'signal',
      data: { module: a, kind: 'ring' },
    });
  }
  // Long-range association fibers (chords across the ring)
  for (let i = 0; i < MODULES.length; i += 2) {
    const a = MODULES[i].id;
    const b = MODULES[(i + 3) % MODULES.length].id;
    edges.push({
      id: `chord-${a}-${b}`,
      source: hubId(a),
      target: hubId(b),
      type: 'signal',
      data: { module: a, kind: 'chord' },
    });
  }

  return { nodes, edges, neuronsByModule };
}
