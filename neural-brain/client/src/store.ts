import { create } from 'zustand';
import { MODULES, generateBrain, hubId, type BrainGraph } from './lib/brain';
import type { AgentMessage, BrainEvent, MemoryRecord, ModuleId, ThoughtStep } from './types';

export interface EdgePulse {
  id: string;
  from: ModuleId;
  to: ModuleId;
  bornAt: number;
}

export interface HeatSample {
  t: number;
  values: Record<ModuleId, number>;
}

interface BrainState {
  graph: BrainGraph;
  connected: boolean;
  mode: 'claude' | 'simulation' | null;
  model: string;
  thinking: boolean;
  prompt: string;
  steps: ThoughtStep[];
  answer: string;
  answerConfidence: number | null;
  agentMessages: AgentMessage[];
  recalled: MemoryRecord[];
  memories: MemoryRecord[];
  error: string | null;
  /** nodeId → activation level 0..1 (decays over time) */
  activations: Record<string, number>;
  /** module → aggregate activity 0..1 (drives edges + heatmap) */
  moduleActivity: Record<ModuleId, number>;
  heatHistory: HeatSample[];
  pulses: EdgePulse[];
  expanded: Record<ModuleId, boolean>;
  /** Number of turns in the current conversation thread. */
  turns: number;

  handleEvent(e: BrainEvent): void;
  setConnected(v: boolean): void;
  setMemories(m: MemoryRecord[]): void;
  toggleModule(m: ModuleId): void;
  /** Local reset when the user starts a new conversation thread. */
  resetConversation(): void;
  /** Called on an interval: decays activations and samples the heatmap. */
  tick(sample: boolean): void;
}

const zeroActivity = () =>
  Object.fromEntries(MODULES.map((m) => [m.id, 0])) as Record<ModuleId, number>;

const allExpanded = () =>
  Object.fromEntries(MODULES.map((m) => [m.id, true])) as Record<ModuleId, boolean>;

function fireModule(
  state: BrainState,
  module: ModuleId,
  intensity: number,
  neuronFraction: number,
): Record<string, number> {
  const next = { ...state.activations };
  next[hubId(module)] = Math.min(1, (next[hubId(module)] ?? 0) + intensity);
  const neurons = state.graph.neuronsByModule[module] ?? [];
  const count = Math.ceil(neurons.length * neuronFraction);
  for (let i = 0; i < count; i++) {
    const id = neurons[Math.floor(Math.random() * neurons.length)];
    next[id] = Math.min(1, (next[id] ?? 0) + intensity * (0.5 + Math.random() * 0.5));
  }
  return next;
}

export const useBrain = create<BrainState>((set, get) => ({
  graph: generateBrain(),
  connected: false,
  mode: null,
  model: '',
  thinking: false,
  prompt: '',
  steps: [],
  answer: '',
  answerConfidence: null,
  agentMessages: [],
  recalled: [],
  memories: [],
  error: null,
  activations: {},
  moduleActivity: zeroActivity(),
  heatHistory: [],
  pulses: [],
  expanded: allExpanded(),
  turns: 0,

  setConnected: (v) => set({ connected: v }),
  setMemories: (m) => set({ memories: m }),
  toggleModule: (m) =>
    set((s) => ({ expanded: { ...s.expanded, [m]: !s.expanded[m] } })),
  resetConversation: () =>
    set({ turns: 0, steps: [], answer: '', answerConfidence: null, recalled: [], error: null }),

  handleEvent: (e) => {
    const s = get();
    switch (e.type) {
      case 'hello':
        set({ mode: e.mode, model: e.model });
        break;
      case 'session_start':
        set({
          thinking: true,
          turns: s.turns + 1,
          prompt: e.prompt,
          steps: [],
          answer: '',
          answerConfidence: null,
          recalled: [],
          error: null,
          heatHistory: [],
        });
        break;
      case 'memory_recall':
        set({
          recalled: e.memories,
          activations: fireModule(s, 'memory', 0.9, 0.5),
          moduleActivity: { ...s.moduleActivity, memory: 1 },
        });
        break;
      case 'step_start':
        set({
          steps: [
            ...s.steps,
            { id: e.stepId, module: e.module, text: '', confidence: null, targets: [], done: false },
          ],
          activations: fireModule(s, e.module, 1, 0.45),
          moduleActivity: { ...s.moduleActivity, [e.module]: 1 },
        });
        break;
      case 'step_token':
        set({
          steps: s.steps.map((st) => (st.id === e.stepId ? { ...st, text: st.text + e.text } : st)),
          activations: fireModule(s, e.module, 0.25, 0.08),
          moduleActivity: {
            ...s.moduleActivity,
            [e.module]: Math.min(1, s.moduleActivity[e.module] + 0.15),
          },
        });
        break;
      case 'step_end':
        set({
          steps: s.steps.map((st) =>
            st.id === e.stepId
              ? { ...st, text: e.text, confidence: e.confidence, targets: e.targets, done: true }
              : st,
          ),
        });
        break;
      case 'agent_message': {
        const pulse: EdgePulse = {
          id: e.message.id,
          from: e.message.from,
          to: e.message.to,
          bornAt: Date.now(),
        };
        set({
          agentMessages: [e.message, ...s.agentMessages].slice(0, 40),
          pulses: [...s.pulses, pulse],
          activations: fireModule(s, e.message.to, 0.6, 0.2),
          moduleActivity: {
            ...s.moduleActivity,
            [e.message.to]: Math.min(1, s.moduleActivity[e.message.to] + 0.6),
          },
        });
        break;
      }
      case 'answer_token':
        set({ answer: s.answer + e.text });
        break;
      case 'answer_end':
        set({ answer: e.text, answerConfidence: e.confidence });
        break;
      case 'memory_write':
        set({
          memories: [e.memory, ...s.memories],
          activations: fireModule(s, 'learning', 0.9, 0.4),
          moduleActivity: { ...s.moduleActivity, learning: 1 },
        });
        break;
      case 'session_end':
        set({ thinking: false });
        break;
      case 'error':
        set({ error: e.message, thinking: false });
        break;
    }
  },

  tick: (sample) => {
    const s = get();
    // Decay node activations
    const activations: Record<string, number> = {};
    for (const [id, v] of Object.entries(s.activations)) {
      const nv = v * 0.9;
      if (nv > 0.02) activations[id] = nv;
    }
    // Decay module activity
    const moduleActivity = { ...s.moduleActivity };
    for (const m of MODULES) moduleActivity[m.id] = moduleActivity[m.id] * 0.93;
    // Expire pulses
    const now = Date.now();
    const pulses = s.pulses.filter((p) => now - p.bornAt < 1600);

    const heatHistory = sample
      ? [...s.heatHistory, { t: now, values: { ...moduleActivity } }].slice(-72)
      : s.heatHistory;

    set({ activations, moduleActivity, pulses, heatHistory });
  },
}));
