import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'node:crypto';
import { StreamParser, type ParserCallbacks } from './parser.js';
import { simulate } from './simulator.js';
import { MemoryStore } from './memory.js';
import { AgentBus } from './agents.js';
import { SYSTEM_PROMPT, buildUserMessage } from './prompt.js';
import type { BrainEvent, ConversationTurn, ModuleId } from './types.js';

export interface EngineOptions {
  apiKey?: string;
  model: string;
  memoryFile: string;
}

/**
 * The reasoning engine. Streams a Claude response (or the offline simulator),
 * parses it into cognitive-module steps in real time, routes agent-to-agent
 * messages, and persists lessons to long-term memory.
 */
export class BrainEngine {
  readonly mode: 'claude' | 'simulation';
  readonly memory: MemoryStore;
  readonly bus = new AgentBus();
  private client: Anthropic | null;

  constructor(private opts: EngineOptions) {
    this.mode = opts.apiKey ? 'claude' : 'simulation';
    this.client = opts.apiKey ? new Anthropic({ apiKey: opts.apiKey }) : null;
    this.memory = new MemoryStore(opts.memoryFile);
  }

  /**
   * Run one reasoning turn, emitting BrainEvents through `send`. `history`
   * carries prior turns of this conversation (multi-turn context); on success
   * this turn is appended to it. Resolves when the turn is complete.
   */
  async think(
    prompt: string,
    history: ConversationTurn[],
    send: (e: BrainEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const sessionId = randomUUID();
    send({ type: 'session_start', sessionId, prompt, mode: this.mode });

    // 1. Recall long-term memory relevant to the prompt.
    const recalled = this.memory.recall(prompt);
    send({ type: 'memory_recall', memories: recalled });

    const touchedModules = new Set<ModuleId>();
    let lesson: string | null = null;
    let finalAnswer = '';

    const callbacks: ParserCallbacks = {
      onStepStart: (stepId, module) => {
        touchedModules.add(module);
        send({ type: 'step_start', stepId, module });
      },
      onStepToken: (stepId, module, text) => {
        send({ type: 'step_token', stepId, module, text });
      },
      onStepEnd: (step) => {
        send({ type: 'step_end', stepId: step.id, module: step.module, text: step.text, confidence: step.confidence, targets: step.targets });
        // 2. Agent-to-agent hand-offs derived from the step's routing targets.
        for (const message of this.bus.dispatch(step)) {
          send({ type: 'agent_message', message });
        }
        const remember = step.text.match(/REMEMBER:\s*(.+)/s);
        if (remember) lesson = remember[1].trim();
      },
      onAnswerToken: (text) => send({ type: 'answer_token', text }),
      onAnswerEnd: (text, confidence) => {
        finalAnswer = text;
        send({ type: 'answer_end', text, confidence });
      },
    };

    try {
      const userContent = buildUserMessage(prompt, recalled);
      const raw = this.client
        ? await this.runClaude(userContent, history, callbacks, signal)
        : await simulate(prompt, callbacks, signal);

      if (!signal?.aborted) {
        // 3. Extend short-term conversational context (capped at 8 turns).
        history.push({ role: 'user', content: userContent }, { role: 'assistant', content: raw });
        if (history.length > 16) history.splice(0, history.length - 16);

        // 4. Persist what was learned to long-term memory.
        const toRemember = lesson ?? `Asked: "${prompt.slice(0, 160)}" → ${finalAnswer.slice(0, 200)}`;
        const memory = this.memory.write(toRemember, [...touchedModules]);
        send({ type: 'memory_write', memory });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      send({ type: 'error', message });
    } finally {
      send({ type: 'session_end', sessionId });
    }
  }

  private async runClaude(
    userContent: string,
    history: ConversationTurn[],
    callbacks: ParserCallbacks,
    signal?: AbortSignal,
  ): Promise<string> {
    const parser = new StreamParser(callbacks);
    const stream = this.client!.messages.stream(
      {
        model: this.opts.model,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [
          ...history.map((t) => ({ role: t.role, content: t.content })),
          { role: 'user' as const, content: userContent },
        ],
      },
      { signal },
    );
    stream.on('text', (delta) => parser.push(delta));
    const final = await stream.finalMessage();
    parser.finish();
    return final.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
  }
}
