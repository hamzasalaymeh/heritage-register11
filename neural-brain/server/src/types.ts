/** Cognitive modules that make up the brain. */
export type ModuleId =
  | 'logic'
  | 'planning'
  | 'memory'
  | 'creativity'
  | 'goals'
  | 'risk'
  | 'engineering'
  | 'finance'
  | 'health'
  | 'learning';

export interface MemoryRecord {
  id: string;
  text: string;
  tags: string[];
  modules: ModuleId[];
  createdAt: number;
  /** Reinforcement strength — grows each time the memory is recalled. */
  strength: number;
}

export interface AgentMessage {
  id: string;
  from: ModuleId;
  to: ModuleId;
  content: string;
  at: number;
}

/** Events streamed to the client over WebSocket. */
export type BrainEvent =
  | { type: 'hello'; mode: 'claude' | 'simulation'; model: string }
  | { type: 'session_start'; sessionId: string; prompt: string; mode: 'claude' | 'simulation' }
  | { type: 'memory_recall'; memories: MemoryRecord[] }
  | { type: 'step_start'; stepId: string; module: ModuleId }
  | { type: 'step_token'; stepId: string; module: ModuleId; text: string }
  | {
      type: 'step_end';
      stepId: string;
      module: ModuleId;
      text: string;
      confidence: number;
      targets: ModuleId[];
    }
  | { type: 'agent_message'; message: AgentMessage }
  | { type: 'answer_token'; text: string }
  | { type: 'answer_end'; text: string; confidence: number }
  | { type: 'memory_write'; memory: MemoryRecord }
  | { type: 'session_end'; sessionId: string }
  | { type: 'error'; message: string };

/** Messages the client sends to the server. */
export type ClientMessage =
  | { type: 'think'; prompt: string }
  | { type: 'clear_memory' };

export interface ReasoningStep {
  id: string;
  module: ModuleId;
  text: string;
  confidence: number;
  targets: ModuleId[];
}
