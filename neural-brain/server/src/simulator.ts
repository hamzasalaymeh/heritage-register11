import { randomUUID } from 'node:crypto';
import type { ModuleId, ReasoningStep } from './types.js';
import type { ParserCallbacks } from './parser.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const TEMPLATES: Record<ModuleId, string[]> = {
  goals: [
    'The user wants: "{p}". Success means a clear, actionable and trustworthy response.',
    'Interpreting intent behind "{p}" — the underlying goal is understanding plus a concrete next step.',
  ],
  memory: [
    'Scanning long-term memory for concepts related to "{p}"… retrieving the strongest associations.',
    'Prior context on "{p}" is sparse; anchoring on general knowledge and flagging this for learning.',
  ],
  logic: [
    'Decomposing the problem: identify the core question, the constraints, and what follows deductively.',
    'Checking consistency: the premises implied by "{p}" do not contradict each other, so inference can proceed.',
  ],
  planning: [
    'Plan: (1) clarify scope, (2) evaluate options, (3) select the strongest path, (4) express it simply.',
    'Sequencing sub-goals — resolve unknowns first, then commit to a recommendation.',
  ],
  creativity: [
    'Exploring lateral angles: an analogy from another domain reframes "{p}" in a useful way.',
    'Generating alternatives beyond the obvious answer, then pruning the weak ones.',
  ],
  risk: [
    'Main uncertainties: incomplete context and hidden assumptions. Mitigation: state assumptions explicitly.',
    'Failure mode: over-confident advice. Counter: attach confidence and note trade-offs.',
  ],
  engineering: [
    'From a systems view, the answer decomposes into components with clear interfaces and known behavior.',
    'Technical constraints considered: feasibility, maintainability, and the simplest design that works.',
  ],
  finance: [
    'Resource lens: weighing cost against value — the recommended path has the best effort-to-payoff ratio.',
    'Budget impact is modest; the dominant cost is time, which the plan minimizes.',
  ],
  health: [
    'Human-factors check: the recommendation is sustainable and does not create harmful pressure.',
    'No safety concerns detected; wellbeing constraints are satisfied.',
  ],
  learning: [
    'REMEMBER: the user asked about "{p}" — future answers should build on the reasoning path used here.',
    'REMEMBER: this topic ("{p}") matters to the user; deepen this knowledge next time.',
  ],
};

const PATHS: ModuleId[][] = [
  ['goals', 'memory', 'logic', 'planning', 'risk', 'engineering', 'learning'],
  ['memory', 'goals', 'creativity', 'logic', 'finance', 'risk', 'learning'],
  ['goals', 'memory', 'planning', 'engineering', 'health', 'logic', 'learning'],
  ['memory', 'goals', 'logic', 'creativity', 'risk', 'planning', 'learning'],
];

/**
 * Offline reasoning simulator — used when no ANTHROPIC_API_KEY is configured
 * so the brain still comes alive. Emits the same callback sequence as the
 * Claude-backed engine.
 */
export async function simulate(
  prompt: string,
  cb: ParserCallbacks,
  signal?: AbortSignal,
): Promise<string> {
  const p = prompt.slice(0, 60);
  const path = pick(PATHS);
  const steps: ReasoningStep[] = path.map((module, i) => ({
    id: randomUUID(),
    module,
    text: pick(TEMPLATES[module]).replaceAll('{p}', p),
    confidence: Math.round((0.6 + Math.random() * 0.38) * 100) / 100,
    targets: i < path.length - 1 ? [path[i + 1], ...(Math.random() < 0.4 ? [pick(path)] : [])] : [],
  }));

  for (const step of steps) {
    if (signal?.aborted) return '';
    cb.onStepStart(step.id, step.module);
    for (const word of step.text.split(/(?<=\s)/)) {
      if (signal?.aborted) return '';
      cb.onStepToken(step.id, step.module, word);
      await sleep(24 + Math.random() * 40);
    }
    cb.onStepEnd(step);
    await sleep(180);
  }

  const answer =
    `**Simulation mode** — no \`ANTHROPIC_API_KEY\` is configured, so this response was generated ` +
    `by the offline simulator rather than Claude.\n\nYour prompt was: “${prompt}”.\n\n` +
    `The neural pathways you just watched (${path.join(' → ')}) show exactly how the interface behaves ` +
    `when the live Claude reasoning engine is connected. Add your API key to \`server/.env\` and restart ` +
    `to see real reasoning stream through the brain.`;
  for (const word of answer.split(/(?<=\s)/)) {
    if (signal?.aborted) return '';
    cb.onAnswerToken(word);
    await sleep(14);
  }
  cb.onAnswerEnd(answer, 0.62);

  // Return the raw protocol text so multi-turn history stays format-consistent.
  return (
    steps
      .map(
        (s) =>
          `<step module="${s.module}" confidence="${s.confidence}"${
            s.targets.length ? ` to="${s.targets.join(',')}"` : ''
          }>\n${s.text}\n</step>`,
      )
      .join('\n') + `\n<answer confidence="0.62">\n${answer}\n</answer>`
  );
}
