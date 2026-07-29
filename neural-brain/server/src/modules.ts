import type { ModuleId } from './types.js';

export interface CognitiveModule {
  id: ModuleId;
  label: string;
  /** What this module contributes to a reasoning trace (also used in the Claude system prompt). */
  role: string;
}

export const MODULES: CognitiveModule[] = [
  { id: 'logic', label: 'Logic', role: 'deductive reasoning, consistency checks, step-by-step inference' },
  { id: 'planning', label: 'Planning', role: 'decomposing the problem into ordered sub-goals and strategies' },
  { id: 'memory', label: 'Memory', role: 'recalling relevant facts, prior interactions and stored knowledge' },
  { id: 'creativity', label: 'Creativity', role: 'lateral thinking, analogies, novel alternatives' },
  { id: 'goals', label: 'Goals', role: 'clarifying user intent and success criteria' },
  { id: 'risk', label: 'Risk Analysis', role: 'identifying failure modes, uncertainties and trade-offs' },
  { id: 'engineering', label: 'Engineering', role: 'technical/system design knowledge and implementation detail' },
  { id: 'finance', label: 'Finance', role: 'costs, budgets, economic reasoning and resource allocation' },
  { id: 'health', label: 'Health', role: 'wellbeing, safety and human-factors considerations' },
  { id: 'learning', label: 'Learning', role: 'extracting lessons and updating long-term memory' },
];

export const MODULE_IDS = MODULES.map((m) => m.id) as ModuleId[];

export function isModuleId(v: string): v is ModuleId {
  return (MODULE_IDS as string[]).includes(v);
}
