import { randomUUID } from 'node:crypto';
import type { AgentMessage, ModuleId, ReasoningStep } from './types.js';

/**
 * Agent-to-agent communication bus. Each cognitive module acts as an agent;
 * when a reasoning step names downstream targets, the bus emits directed
 * messages between the modules so the UI can animate the hand-off.
 */
export class AgentBus {
  private log: AgentMessage[] = [];

  dispatch(step: ReasoningStep): AgentMessage[] {
    const summary = step.text.replace(/\s+/g, ' ').trim().slice(0, 140);
    const messages = step.targets
      .filter((t) => t !== step.module)
      .map((to): AgentMessage => ({
        id: randomUUID(),
        from: step.module,
        to,
        content: summary,
        at: Date.now(),
      }));
    this.log.push(...messages);
    if (this.log.length > 500) this.log.splice(0, this.log.length - 500);
    return messages;
  }

  history(): AgentMessage[] {
    return [...this.log];
  }
}

export type { ModuleId };
